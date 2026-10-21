import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
UPLOADS_DIR = DATA_DIR / "uploads"
DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Auto-load environment variables from backend/.env or frontend/.env.local
for ep in [BASE_DIR / ".env", BASE_DIR.parent / "frontend" / ".env.local"]:
    if ep.exists():
        try:
            with open(ep, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        k, v = k.strip(), v.strip()
                        if k and k not in os.environ:
                            os.environ[k] = v
        except Exception:
            pass

# Server Configuration
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# CORS Origins
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "*",
]

# AI Detection Configuration
_default_model = "yolov8s.pt" if (BASE_DIR / "yolov8s.pt").exists() or (BASE_DIR.parent / "yolov8s.pt").exists() else "yolov8n.pt"
YOLO_MODEL_NAME = os.getenv("YOLO_MODEL", _default_model)
DETECTION_CONFIDENCE = float(os.getenv("DETECTION_CONFIDENCE", 0.40))
DETECTION_FPS_LIMIT = int(os.getenv("DETECTION_FPS_LIMIT", 25))

# Camera storage paths
CAMERAS_FILE = DATA_DIR / "cameras.json"
RULES_FILE = DATA_DIR / "rules.json"
USERS_FILE = DATA_DIR / "users.json"
NOTIFICATIONS_FILE = DATA_DIR / "notifications.json"
