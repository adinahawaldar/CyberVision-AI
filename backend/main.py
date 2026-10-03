import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager

# Add parent directory and backend directory to sys.path for universal import resolution
_backend_dir = Path(__file__).resolve().parent
_parent_dir = _backend_dir.parent
for _d in (str(_parent_dir), str(_backend_dir)):
    if _d not in sys.path:
        sys.path.insert(0, _d)

if "backend" not in sys.modules:
    import types
    try:
        import backend
    except ImportError:
        backend_pkg = types.ModuleType("backend")
        backend_pkg.__path__ = [str(_backend_dir)]
        backend_pkg.__file__ = str(_backend_dir / "__init__.py")
        sys.modules["backend"] = backend_pkg

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.config import CORS_ORIGINS, UPLOADS_DIR
from backend.services.camera_manager import camera_manager
from backend.api.cameras import router as cameras_router
from backend.api.streaming import router as streaming_router
from backend.api.rules import router as rules_router
from backend.api.users import router as users_router
from backend.api.ai_assistant import router as ai_assistant_router
from backend.api.health import router as health_router
from backend.api.notifications import router as notifications_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("=" * 60)
    print("[*] CyberVision-AI Vision Backend Initializing...")
    print("[*] Detecting connected cameras & starting streaming engine...")
    camera_manager.initialize_stored_cameras()
    print("[+] CyberVision-AI Backend ready on http://localhost:8000")
    print("=" * 60)
    yield
    print("[-] Shutting down camera streaming feeds...")
    for cam_id in list(camera_manager.captures.keys()):
        camera_manager.stop_stream(cam_id)
    print("[+] Clean shutdown complete.")

app = FastAPI(
    title="CyberVision-AI Video Surveillance & AI Engine",
    description="Multi-camera RTSP/Webcam live streaming with YOLOv8 object detection, rules engine, and security analytics.",
    version="2.0.0",
    lifespan=lifespan
)

# Enable CORS for Next.js dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploaded profile photos
app.mount("/api/v1/users/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# Include all API v1 Routers
app.include_router(cameras_router, prefix="/api/v1")
app.include_router(streaming_router, prefix="/api/v1")
app.include_router(rules_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(ai_assistant_router, prefix="/api/v1")
app.include_router(health_router, prefix="/api/v1")
app.include_router(notifications_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "name": "CyberVision-AI Backend",
        "status": "online",
        "version": "2.0.0",
        "docs": "/docs",
        "cameras_endpoint": "/api/v1/cameras",
        "streaming_endpoint": "/api/v1/streaming/",
        "notifications_endpoint": "/api/v1/notifications",
        "health_endpoint": "/api/v1/health",
        "roles_endpoint": "/api/v1/users/roles"
    }
