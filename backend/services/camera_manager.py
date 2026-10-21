import cv2
import time
import uuid
import base64
import threading
import numpy as np
from typing import Dict, Optional, Tuple, Generator, List, Any

from backend.services.detector import detector
from backend.services.storage import storage


class SharedSourceCapture:
    """
    Manages a single hardware or network video capture source (e.g. webcam "0", RTSP URL).
    Ensures that only one cv2.VideoCapture is open per physical device index or stream,
    preventing hardware lockouts, DirectShow driver conflicts, and black frame loops.
    """
    def __init__(self, source: str):
        self.source = str(source).strip()
        self.lock = threading.RLock()
        self.running = False
        self.thread: Optional[threading.Thread] = None
        self.latest_frame: Optional[np.ndarray] = None
        self.is_connected = False
        self.subscribers = 0
        self.last_frame_time = 0.0

    def start(self):
        with self.lock:
            self.subscribers += 1
            if not self.running:
                self.running = True
                self.thread = threading.Thread(target=self._capture_worker, daemon=True)
                self.thread.start()
                print(f"[SharedSourceCapture] Started capture thread for source: {self.source}")

    def stop(self):
        with self.lock:
            self.subscribers = max(0, self.subscribers - 1)
            if self.subscribers == 0 and self.running:
                self.running = False
                print(f"[SharedSourceCapture] Stopping capture thread for source: {self.source}")

    def get_latest_frame(self) -> Optional[np.ndarray]:
        with self.lock:
            if self.latest_frame is not None:
                return self.latest_frame.copy()
            return None

    def _open_video_capture(self) -> Optional[cv2.VideoCapture]:
        source_clean = self.source
        if source_clean.isdigit():
            idx = int(source_clean)
            # Try DirectShow on Windows, then fallback to MSMF/default
            cap = cv2.VideoCapture(idx, cv2.CAP_DSHOW)
            if not cap.isOpened():
                cap = cv2.VideoCapture(idx)
            if cap.isOpened():
                # Allow camera to configure resolution
                cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
                cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
                # Drain black warm-up frames so auto-exposure settles
                for _ in range(8):
                    ret, f = cap.read()
                    if ret and f is not None and f.mean() > 5.0:
                        with self.lock:
                            self.latest_frame = f
                            self.is_connected = True
                        break
                    time.sleep(0.04)
                return cap
            return None

        if source_clean.startswith("synth:"):
            return None

        cap = cv2.VideoCapture(source_clean)
        if cap.isOpened():
            return cap
        return None

    def _capture_worker(self):
        cap = self._open_video_capture()
        self.is_connected = (cap is not None and cap.isOpened())
        consecutive_drops = 0

        while self.running:
            if cap and cap.isOpened():
                ret, frame = cap.read()
                if ret and frame is not None:
                    consecutive_drops = 0
                    self.is_connected = True
                    self.last_frame_time = time.time()
                    with self.lock:
                        self.latest_frame = frame
                    time.sleep(0.02)  # Cap hardware polling to ~50 fps
                else:
                    consecutive_drops += 1
                    time.sleep(0.05)
                    if consecutive_drops >= 20:
                        print(f"[SharedSourceCapture] Re-opening source {self.source} after repeated drops...")
                        cap.release()
                        time.sleep(0.5)
                        cap = self._open_video_capture()
                        self.is_connected = (cap is not None and cap.isOpened())
                        consecutive_drops = 0
            else:
                # Source not open, retry after pause
                time.sleep(1.0)
                if self.running:
                    cap = self._open_video_capture()
                    self.is_connected = (cap is not None and cap.isOpened())

        if cap and cap.isOpened():
            cap.release()
        print(f"[SharedSourceCapture] Stopped capture thread for source: {self.source}")


class CameraCapture:
    """
    Manages frame acquisition, YOLO inference, and rule evaluation for a logical camera.
    Subscribes to a shared hardware source reader when using physical webcam or RTSP.
    """
    def __init__(
        self,
        camera_id: str,
        source: str,
        name: str = "",
        user_id: Optional[str] = None,
        source_capture: Optional[SharedSourceCapture] = None,
    ):
        self.camera_id = camera_id
        self.source = source
        self.name = name or camera_id
        self.user_id = user_id
        self.source_capture = source_capture

        self.running = False
        self.thread: Optional[threading.Thread] = None
        self.lock = threading.RLock()

        self.latest_raw_frame: Optional[np.ndarray] = None
        self.latest_processed_frame: Optional[np.ndarray] = None
        self.latest_detections: List[Dict[str, Any]] = []
        self.latest_timestamp = time.time()
        self.last_alert_times: Dict[str, float] = {}
        self.last_incident_snapshot: Optional[str] = None
        self.last_incident_detections: List[str] = []
        self.last_incident_time: Optional[str] = None
        self.fps = 0.0
        self.is_connected = False
        self.with_detection = True
        self.frame_counter = 0

    def start(self, with_detection: bool = True):
        self.with_detection = with_detection
        if self.running:
            return
        self.running = True
        if self.source_capture:
            self.source_capture.start()
        self.thread = threading.Thread(
            target=self._capture_loop,
            daemon=True
        )
        self.thread.start()
        print(f"[CameraCapture] Started stream thread for {self.camera_id} ({self.source})")

    def stop(self):
        self.running = False
        if self.source_capture:
            self.source_capture.stop()
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=1.5)
        self.thread = None
        self.is_connected = False
        print(f"[CameraCapture] Stopped stream thread for {self.camera_id}")

    def _generate_synthetic_frame(self) -> np.ndarray:
        """Generates a sleek high-tech CyberVision synthetic test feed with moving elements."""
        w, h = 1280, 720
        frame = np.zeros((h, w, 3), dtype=np.uint8)

        # Grid lines
        for y in range(0, h, 60):
            cv2.line(frame, (0, y), (w, y), (20, 26, 34), 1)
        for x in range(0, w, 60):
            cv2.line(frame, (x, 0), (x, h), (20, 26, 34), 1)

        # Center surveillance reticle
        cx, cy = w // 2, h // 2
        angle = (time.time() * 90) % 360
        cv2.circle(frame, (cx, cy), 140, (0, 180, 255), 1)
        cv2.circle(frame, (cx, cy), 80, (0, 100, 200), 1)

        # Sweeping radar line
        rad = np.radians(angle)
        rx = int(cx + 140 * np.cos(rad))
        ry = int(cy + 140 * np.sin(rad))
        cv2.line(frame, (cx, cy), (rx, ry), (0, 255, 200), 2)

        # Moving simulated object for detector test
        obj_x = int(cx + 260 * np.cos(time.time() * 0.5))
        obj_y = int(cy + 120 * np.sin(time.time() * 0.7))
        cv2.rectangle(frame, (obj_x - 30, obj_y - 60), (obj_x + 30, obj_y + 60), (0, 120, 255), 2)
        cv2.putText(frame, "SIMULATED PATROL TARGET", (obj_x - 70, obj_y - 70), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 180, 255), 1)

        # HUD Text
        now_str = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
        cv2.putText(frame, f"FEED: {self.name.upper()}", (40, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
        cv2.putText(frame, f"TIME: {now_str}", (40, 85), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (200, 200, 200), 1)
        cv2.putText(frame, "STATUS: PATROL MONITORING ACTIVE", (40, 115), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 128), 1)
        cv2.putText(frame, "CYBERVISION-AI SECURE NODE // CHANNEL ACTIVE", (40, h - 30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (100, 100, 100), 1)

        return frame

    def _capture_loop(self):
        last_frame_time = time.time()
        fps_smoothing = 0.9

        while self.running:
            raw_frame = None
            if self.source_capture:
                raw_frame = self.source_capture.get_latest_frame()
                self.is_connected = self.source_capture.is_connected

            if raw_frame is None:
                # If synthetic or camera not accessible, generate synthetic frame
                raw_frame = self._generate_synthetic_frame()
                self.is_connected = True
                time.sleep(0.04)  # ~25 FPS
            else:
                time.sleep(0.03)  # ~33 FPS target for inference

            if raw_frame is not None:
                self.frame_counter += 1
                curr_time = time.time()
                dt = curr_time - last_frame_time
                last_frame_time = curr_time
                if dt > 0:
                    current_fps = 1.0 / dt
                    self.fps = (self.fps * fps_smoothing) + (current_fps * (1.0 - fps_smoothing))

                # YOLO detection
                if self.with_detection:
                    annotated, detections = detector.detect(raw_frame)
                else:
                    annotated = raw_frame.copy()
                    detections = []

                # Watermark live timestamp and camera name
                now_str = time.strftime("%Y-%m-%d %H:%M:%S")
                cv2.putText(
                    annotated,
                    f"CAM: {self.name} | {now_str} | FPS: {round(self.fps, 1)}",
                    (14, annotated.shape[0] - 14),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (0, 255, 255),
                    1,
                    cv2.LINE_AA
                )

                with self.lock:
                    self.latest_raw_frame = raw_frame
                    self.latest_processed_frame = annotated
                    self.latest_detections = detections
                    self.latest_timestamp = curr_time

                # Evaluate active security rules against detections (debounced)
                if detections:
                    self._evaluate_rules(detections)

    def _evaluate_rules(self, detections: List[Dict[str, Any]]):
        try:
            curr_time = time.time()
            rules = storage.get_rules()
            detected_classes = {d.get("class") for d in detections if d.get("class")}

            for rule in rules:
                if not rule.get("enabled", True):
                    continue
                rule_cam_id = rule.get("cameraId")
                if rule_cam_id and rule_cam_id != self.camera_id:
                    continue

                rule_id = rule.get("id", "default_rule")
                last_triggered = self.last_alert_times.get(rule_id, 0)
                if curr_time - last_triggered < 45.0:  # 45s cooldown
                    continue

                event = rule.get("event")
                title = rule.get("name", "Security Surveillance Event")
                action = rule.get("action", "notify")

                triggered = False
                message = ""
                notif_type = "info"

                if event == "weapon_detection" and any(c in detected_classes for c in ["knife", "weapon", "scissors"]):
                    triggered = True
                    matched_weapons = [c.upper() for c in detected_classes if c in ["knife", "weapon", "scissors"]]
                    message = f"CRITICAL WEAPON ALERT: Detected {', '.join(matched_weapons)} at {self.name}!"
                    notif_type = "alert"
                elif event == "authorized_entry" and "person" in detected_classes:
                    triggered = True
                    message = f"Personnel verified at {self.name} under rule '{title}'."
                    notif_type = "info"
                elif event == "attendance" and "person" in detected_classes:
                    triggered = True
                    message = f"Attendance tracking logged subject at {self.name}."
                    notif_type = "success"
                elif event == "vehicle_recognized" and any(c in detected_classes for c in ["car", "truck", "motorcycle", "bus"]):
                    triggered = True
                    message = f"Vehicle identified in zone monitored by {self.name}."
                    notif_type = "warning" if action == "trigger_alarm" else "alert"

                # Direct auto-detection fallback for high-risk weapons even without explicit user rule
                if not triggered and any(c in detected_classes for c in ["knife", "weapon", "scissors"]):
                    weapon_cooldown_key = "auto_weapon_alert"
                    if curr_time - self.last_alert_times.get(weapon_cooldown_key, 0) >= 30.0:
                        self.last_alert_times[weapon_cooldown_key] = curr_time
                        triggered = True
                        matched_weapons = [c.upper() for c in detected_classes if c in ["knife", "weapon", "scissors"]]
                        title = f"SECURITY ALERT: Weapon Detected ({', '.join(matched_weapons)})"
                        message = f"Tactical optical threat detected: {', '.join(matched_weapons)} identified at {self.name} with real-time YOLOv8 bounding box."
                        notif_type = "alert"

                if triggered:
                    self.last_alert_times[rule_id] = curr_time
                    # Encode latest frame snapshot as base64 for document evidence
                    snapshot_b64 = None
                    try:
                        jpeg_data = self.get_latest_jpeg(processed=True, quality=85)
                        if jpeg_data:
                            snapshot_b64 = "data:image/jpeg;base64," + base64.b64encode(jpeg_data).decode("utf-8")
                            with self.lock:
                                self.last_incident_snapshot = snapshot_b64
                                self.last_incident_detections = list(detected_classes)
                                self.last_incident_time = time.strftime("%Y-%m-%dT%H:%M:%S")
                    except Exception:
                        pass

                    notification = {
                        "id": f"alert-{uuid.uuid4().hex[:8]}",
                        "user_id": self.user_id,
                        "camera_id": self.camera_id,
                        "camera_name": self.name,
                        "type": notif_type,
                        "title": title,
                        "message": message,
                        "read": False,
                        "link": f"/dashboard/cameras/live?camera={self.camera_id}",
                        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
                        "detected_classes": list(detected_classes),
                        "snapshot": snapshot_b64
                    }
                    try:
                        saved = storage.save_notification(notification, user_id=self.user_id)
                        print(f"[Notifications] Saved alert for user {self.user_id}: {title} (ID: {saved.get('id')})")
                    except Exception as e:
                        print(f"[Notifications] Failed to save alert: {e}")
                    print(f"[RulesEngine] Triggered alert for {self.camera_id}: {title} - {message}")
        except Exception as e:
            print(f"[RulesEngine] Error evaluating rules for {self.camera_id}: {e}")

    def get_latest_jpeg(self, processed: bool = True, quality: int = 80) -> Optional[bytes]:
        with self.lock:
            frame = self.latest_processed_frame if processed else self.latest_raw_frame
            if frame is None:
                return None
            target = frame.copy()

        encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), quality]
        ret, jpeg = cv2.imencode(".jpg", target, encode_param)
        if ret:
            return jpeg.tobytes()
        return None


class CameraManager:
    def __init__(self):
        self.captures: Dict[str, CameraCapture] = {}
        self.source_pools: Dict[str, SharedSourceCapture] = {}
        self.lock = threading.RLock()

    def get_or_create_source_capture(self, source: str) -> Optional[SharedSourceCapture]:
        source_clean = str(source).strip()
        if source_clean.startswith("synth:"):
            return None
        with self.lock:
            if source_clean not in self.source_pools:
                self.source_pools[source_clean] = SharedSourceCapture(source_clean)
            return self.source_pools[source_clean]

    def initialize_stored_cameras(self):
        """Initializes and starts streaming captures for all cameras in storage."""
        cameras = storage.get_cameras()
        print(f"[CameraManager] Initializing {len(cameras)} cameras from storage...")
        for cam in cameras:
            cam_id = cam.get("id")
            source = cam.get("rtsp_url", "0")
            name = cam.get("name", cam_id)
            user_id = cam.get("user_id")
            self.add_or_update_camera(
                camera_id=cam_id,
                source=source,
                name=name,
                user_id=user_id,
                start=True
            )

    def add_or_update_camera(
        self,
        camera_id: str,
        source: str,
        name: str = "",
        user_id: Optional[str] = None,
        start: bool = True
    ):
        with self.lock:
            source_capture = self.get_or_create_source_capture(source)
            if camera_id in self.captures:
                old_cap = self.captures[camera_id]
                if old_cap.source != source:
                    old_cap.stop()
                    self.captures[camera_id] = CameraCapture(
                        camera_id,
                        source,
                        name,
                        user_id,
                        source_capture=source_capture
                    )
                    if start:
                        self.captures[camera_id].start()
                else:
                    old_cap.user_id = user_id
            else:
                cap = CameraCapture(
                    camera_id,
                    source,
                    name,
                    user_id,
                    source_capture=source_capture
                )
                self.captures[camera_id] = cap
                if start:
                    cap.start()

    def remove_camera(self, camera_id: str):
        with self.lock:
            if camera_id in self.captures:
                self.captures[camera_id].stop()
                del self.captures[camera_id]

    def start_stream(self, camera_id: str, with_detection: bool = True) -> bool:
        with self.lock:
            if camera_id in self.captures:
                self.captures[camera_id].start(with_detection=with_detection)
                return True
            cam_data = storage.get_camera_by_id(camera_id)
            if cam_data:
                self.add_or_update_camera(
                    camera_id=camera_id,
                    source=cam_data.get("rtsp_url", "0"),
                    name=cam_data.get("name", camera_id),
                    user_id=cam_data.get("user_id"),
                    start=True
                )
                self.captures[camera_id].with_detection = with_detection
                return True
            return False

    def stop_stream(self, camera_id: str) -> bool:
        with self.lock:
            if camera_id in self.captures:
                self.captures[camera_id].stop()
                return True
            return False

    def get_capture(self, camera_id: str) -> Optional[CameraCapture]:
        with self.lock:
            return self.captures.get(camera_id)

    def get_active_streams(self) -> List[Dict[str, Any]]:
        with self.lock:
            active = []
            for cam_id, cap in self.captures.items():
                if cap.running:
                    active.append({
                        "camera_id": cam_id,
                        "hls_url": f"http://localhost:8000/api/v1/streaming/live/{cam_id}",
                        "status": "active",
                        "with_detection": cap.with_detection,
                        "fps": round(cap.fps, 1)
                    })
            return active

    def generate_mjpeg_stream(
        self,
        camera_id: str,
        processed: bool = True
    ) -> Generator[bytes, None, None]:
        """Yields multipart MJPEG frames for real-time browser streaming."""
        cap = self.get_capture(camera_id)
        if not cap:
            self.start_stream(camera_id)
            cap = self.get_capture(camera_id)

        if not cap:
            return

        while cap.running:
            jpeg_bytes = cap.get_latest_jpeg(processed=processed, quality=75)
            if jpeg_bytes is not None:
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n"
                    b"Content-Length: "
                    + str(len(jpeg_bytes)).encode()
                    + b"\r\n\r\n"
                    + jpeg_bytes
                    + b"\r\n"
                )
            time.sleep(0.035)


camera_manager = CameraManager()
