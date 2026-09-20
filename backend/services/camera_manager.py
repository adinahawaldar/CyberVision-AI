import cv2
import time
import uuid
import threading
import numpy as np
from typing import Dict, Optional, Tuple, Generator, List, Any
from backend.services.detector import detector
from backend.services.storage import storage

class CameraCapture:
    """
    Manages frame acquisition from a single camera source (webcam device 0, rtsp, or synthetic).
    Runs in a background thread to prevent blocking client requests.
    """
    def __init__(self, camera_id: str, source: str, name: str = ""):
        self.camera_id = camera_id
        self.source = source
        self.name = name or camera_id
        self.running = False
        self.thread: Optional[threading.Thread] = None
        self.lock = threading.Lock()
        
        self.latest_raw_frame: Optional[np.ndarray] = None
        self.latest_processed_frame: Optional[np.ndarray] = None
        self.latest_detections: List[Dict[str, Any]] = []
        self.latest_timestamp = time.time()
        self.last_alert_times: Dict[str, float] = {}
        
        self.fps = 0.0
        self.is_connected = False
        self.with_detection = True
        self.frame_counter = 0

    def start(self, with_detection: bool = True):
        self.with_detection = with_detection
        if self.running:
            return
        self.running = True
        self.thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.thread.start()
        print(f"[CameraCapture] Started stream thread for {self.camera_id} ({self.source})")

    def stop(self):
        self.running = False
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=1.5)
        self.thread = None
        self.is_connected = False
        print(f"[CameraCapture] Stopped stream thread for {self.camera_id}")

    def _open_capture(self) -> Optional[cv2.VideoCapture]:
        # Check if source is an integer (e.g. "0", "1") for webcams
        source_clean = str(self.source).strip()
        if source_clean.isdigit():
            cap_idx = int(source_clean)
            # Use DirectShow on Windows for fast webcam init
            cap = cv2.VideoCapture(cap_idx, cv2.CAP_DSHOW)
            if not cap.isOpened():
                cap = cv2.VideoCapture(cap_idx)
            if cap.isOpened():
                cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
                cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
                return cap
            return None

        # Check if synthetic source
        if source_clean.startswith("synth:"):
            return None  # Will use synthetic generator

        # RTSP or HTTP or local file
        cap = cv2.VideoCapture(source_clean)
        if cap.isOpened():
            return cap
        return None

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
        cap = self._open_capture()
        self.is_connected = (cap is not None and cap.isOpened())
        
        last_frame_time = time.time()
        fps_smoothing = 0.9

        while self.running:
            raw_frame = None
            if cap and cap.isOpened():
                ret, frame = cap.read()
                if ret and frame is not None:
                    raw_frame = frame
                    self.is_connected = True
                else:
                    # Retry opening stream if dropped
                    time.sleep(0.5)
                    cap.release()
                    cap = self._open_capture()
                    self.is_connected = (cap is not None and cap.isOpened())
            else:
                # If synthetic or camera not accessible, generate synthetic frame
                raw_frame = self._generate_synthetic_frame()
                self.is_connected = True
                time.sleep(0.04)  # ~25 FPS

            if raw_frame is not None:
                self.frame_counter += 1
                curr_time = time.time()
                dt = curr_time - last_frame_time
                last_frame_time = curr_time
                if dt > 0:
                    current_fps = 1.0 / dt
                    self.fps = (self.fps * fps_smoothing) + (current_fps * (1.0 - fps_smoothing))

                # Apply YOLO detection if enabled
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

        if cap and cap.isOpened():
            cap.release()

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

                if event == "authorized_entry" and "person" in detected_classes:
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

                if triggered:
                    self.last_alert_times[rule_id] = curr_time
                    storage.save_notification({
                        "id": f"alert-{uuid.uuid4().hex[:8]}",
                        "title": title,
                        "message": message,
                        "type": notif_type,
                        "read": False,
                        "link": f"/dashboard/cameras/live?camera={self.camera_id}"
                    })
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
        ret, jpeg = cv2.imencode('.jpg', target, encode_param)
        if ret:
            return jpeg.tobytes()
        return None

class CameraManager:
    def __init__(self):
        self.captures: Dict[str, CameraCapture] = {}
        self.lock = threading.Lock()

    def initialize_stored_cameras(self):
        """Initializes and starts streaming captures for all cameras in storage."""
        cameras = storage.get_cameras()
        print(f"[CameraManager] Initializing {len(cameras)} cameras from storage...")
        for cam in cameras:
            cam_id = cam.get("id")
            source = cam.get("rtsp_url", "0")
            name = cam.get("name", cam_id)
            self.add_or_update_camera(cam_id, source, name, start=True)

    def add_or_update_camera(self, camera_id: str, source: str, name: str = "", start: bool = True):
        with self.lock:
            if camera_id in self.captures:
                # Update existing
                old_cap = self.captures[camera_id]
                if old_cap.source != source:
                    old_cap.stop()
                    self.captures[camera_id] = CameraCapture(camera_id, source, name)
                    if start:
                        self.captures[camera_id].start()
            else:
                cap = CameraCapture(camera_id, source, name)
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
            # Check if camera exists in storage
            cam_data = storage.get_camera_by_id(camera_id)
            if cam_data:
                self.add_or_update_camera(
                    camera_id,
                    cam_data.get("rtsp_url", "0"),
                    cam_data.get("name", camera_id),
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

    def generate_mjpeg_stream(self, camera_id: str, processed: bool = True) -> Generator[bytes, None, None]:
        """Yields multipart MJPEG frames for real-time browser streaming."""
        cap = self.get_capture(camera_id)
        if not cap:
            # Try to start it
            self.start_stream(camera_id)
            cap = self.get_capture(camera_id)

        if not cap:
            return

        while cap.running:
            jpeg_bytes = cap.get_latest_jpeg(processed=processed, quality=75)
            if jpeg_bytes is not None:
                yield (
                    b'--frame\r\n'
                    b'Content-Type: image/jpeg\r\n'
                    b'Content-Length: ' + str(len(jpeg_bytes)).encode() + b'\r\n\r\n' +
                    jpeg_bytes + b'\r\n'
                )
            time.sleep(0.035)  # ~28 FPS limit for smooth bandwidth

camera_manager = CameraManager()
