import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
UPLOADS_DIR = DATA_DIR / "uploads"
DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Server Configuration
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))

# CORS Origins
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "*",
]

# AI Detection Configuration
YOLO_MODEL_NAME = os.getenv("YOLO_MODEL", "yolov8n.pt")
DETECTION_CONFIDENCE = float(os.getenv("DETECTION_CONFIDENCE", 0.45))
DETECTION_FPS_LIMIT = int(os.getenv("DETECTION_FPS_LIMIT", 25))

# Camera storage paths
CAMERAS_FILE = DATA_DIR / "cameras.json"
RULES_FILE = DATA_DIR / "rules.json"
USERS_FILE = DATA_DIR / "users.json"
NOTIFICATIONS_FILE = DATA_DIR / "notifications.json"
