import cv2
import numpy as np
import time
from typing import List, Dict, Any, Tuple
from ultralytics import YOLO
from backend.config import YOLO_MODEL_NAME, DETECTION_CONFIDENCE

# Color palette for classes (Cyber / Futuristic aesthetic)
CLASS_COLORS = {
    "person": (0, 255, 128),      # Neon Green
    "car": (255, 180, 0),         # Amber Cyan
    "motorcycle": (255, 150, 0),
    "bus": (255, 200, 50),
    "truck": (255, 220, 100),
    "bicycle": (0, 200, 255),
    "backpack": (255, 0, 128),    # Neon Pink
    "handbag": (255, 0, 128),
    "suitcase": (255, 50, 150),
    "cell phone": (0, 255, 255),  # Yellow
    "laptop": (200, 255, 0),
    "dog": (180, 100, 255),       # Purple
    "cat": (180, 100, 255),
}
DEFAULT_COLOR = (0, 220, 255)

import threading

class YOLODetector:
    def __init__(self):
        self.model = None
        self.lock = threading.Lock()
        self._load_model()

    def _load_model(self):
        try:
            print(f"[YOLODetector] Loading {YOLO_MODEL_NAME}...")
            self.model = YOLO(YOLO_MODEL_NAME)
            # Warm up model once to prevent race conditions during layer fusion
            dummy = np.zeros((320, 320, 3), dtype=np.uint8)
            with self.lock:
                self.model(dummy, verbose=False)
            print(f"[YOLODetector] {YOLO_MODEL_NAME} loaded and warmed up successfully!")
        except Exception as e:
            print(f"[YOLODetector] Error loading YOLO model: {e}")
            self.model = None

    def detect(self, frame: np.ndarray, confidence: float = DETECTION_CONFIDENCE) -> Tuple[np.ndarray, List[Dict[str, Any]]]:
        """
        Runs YOLO object detection on the frame.
        Returns:
            annotated_frame (np.ndarray): Frame with bounding boxes & HUD stats
            detections (list): Structured list of detected objects
        """
        if self.model is None or frame is None:
            return frame, []

        h, w = frame.shape[:2]
        detections = []
        annotated = frame.copy()

        try:
            # Downscale frame for inference if large to ensure real-time FPS
            infer_w = 640
            scale = 1.0
            if w > infer_w:
                scale = infer_w / w
                infer_h = int(h * scale)
                infer_frame = cv2.resize(frame, (infer_w, infer_h))
            else:
                infer_frame = frame

            # Thread-safe inference
            with self.lock:
                results = self.model(infer_frame, conf=confidence, verbose=False)
            
            # Draw HUD bar at top
            cv2.rectangle(annotated, (0, 0), (w, 36), (15, 18, 24), -1)
            cv2.putText(
                annotated,
                "CYBERVISION-AI // REAL-TIME YOLOv8 INFERENCE",
                (14, 24),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 230, 255),
                2,
                cv2.LINE_AA
            )

            detected_counts = {}

            for result in results:
                boxes = result.boxes
                if boxes is None:
                    continue

                for box in boxes:
                    cls_id = int(box.cls[0].item())
                    cls_name = self.model.names.get(cls_id, f"class_{cls_id}")
                    conf = float(box.conf[0].item())
                    xyxy = box.xyxy[0].cpu().numpy()
                    x1, y1, x2, y2 = (xyxy / scale).astype(int)

                    detected_counts[cls_name] = detected_counts.get(cls_name, 0) + 1

                    detection_item = {
                        "class": cls_name,
                        "confidence": round(conf, 3),
                        "box": [int(x1), int(y1), int(x2), int(y2)]
                    }
                    detections.append(detection_item)

                    # Determine color
                    color = CLASS_COLORS.get(cls_name, DEFAULT_COLOR)

                    # Draw stylish corner bounding box
                    box_len = min(24, (x2 - x1) // 3, (y2 - y1) // 3)
                    # Semi-transparent box border
                    cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 1)

                    # Highlighted corners
                    thickness = 3
                    cv2.line(annotated, (x1, y1), (x1 + box_len, y1), color, thickness)
                    cv2.line(annotated, (x1, y1), (x1, y1 + box_len), color, thickness)
                    cv2.line(annotated, (x2, y1), (x2 - box_len, y1), color, thickness)
                    cv2.line(annotated, (x2, y1), (x2, y1 + box_len), color, thickness)
                    cv2.line(annotated, (x1, y2), (x1 + box_len, y2), color, thickness)
                    cv2.line(annotated, (x1, y2), (x1, y2 - box_len), color, thickness)
                    cv2.line(annotated, (x2, y2), (x2 - box_len, y2), color, thickness)
                    cv2.line(annotated, (x2, y2), (x2, y2 - box_len), color, thickness)

                    # Label badge
                    label_text = f"{cls_name.upper()} {int(conf * 100)}%"
                    (tw, th), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
                    badge_y1 = max(38, y1 - th - 8)
                    cv2.rectangle(annotated, (x1, badge_y1), (x1 + tw + 10, badge_y1 + th + 8), color, -1)
                    cv2.putText(
                        annotated,
                        label_text,
                        (x1 + 5, badge_y1 + th + 4),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.45,
                        (10, 10, 10),
                        1,
                        cv2.LINE_AA
                    )

            # Draw detection summary pills on top-right
            summary_str = " | ".join([f"{k.upper()}: {v}" for k, v in detected_counts.items()])
            if summary_str:
                (stw, sth), _ = cv2.getTextSize(summary_str, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
                cv2.putText(
                    annotated,
                    summary_str,
                    (w - stw - 14, 24),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (0, 255, 128),
                    1,
                    cv2.LINE_AA
                )

        except Exception as e:
            print(f"[YOLODetector] Detection error: {e}")

        return annotated, detections

detector = YOLODetector()
