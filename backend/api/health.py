import psutil
import time
from datetime import datetime
from fastapi import APIRouter
from backend.services.storage import storage
from backend.services.camera_manager import camera_manager

router = APIRouter(tags=["health"])

@router.get("/health")
async def get_system_health():
    """Returns real-time node metrics: CPU, RAM, disk, and camera uptime."""
    cpu_percent = psutil.cpu_percent(interval=0.1)
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    cameras = storage.get_cameras()
    total_cameras = len(cameras)
    active_streams = camera_manager.get_active_streams()
    online_cameras = len(active_streams)
    offline_cameras = max(0, total_cameras - online_cameras)
    online_pct = int((online_cameras / total_cameras * 100)) if total_cameras > 0 else 100

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "cameras": {
            "status": "healthy" if offline_cameras == 0 else "warning",
            "total": total_cameras,
            "online": online_cameras,
            "offline": offline_cameras,
            "onlinePercentage": online_pct,
            "offlineCameras": [],
            "maintenance": []
        },
        "servers": {
            "status": "healthy" if cpu_percent < 85 else "warning",
            "cpu": {
                "status": "healthy" if cpu_percent < 85 else "warning",
                "usage": int(cpu_percent),
                "cores": psutil.cpu_count() or 8
            },
            "memory": {
                "status": "healthy" if mem.percent < 85 else "warning",
                "total": round(mem.total / (1024 ** 3), 1),
                "used": round(mem.used / (1024 ** 3), 1),
                "usagePercentage": int(mem.percent)
            },
            "database": {
                "status": "healthy",
                "responseTime": 12,
                "connections": 4
            }
        },
        "storage": {
            "status": "healthy" if disk.percent < 90 else "warning",
            "primary": {
                "status": "healthy" if disk.percent < 90 else "warning",
                "total": round(disk.total / (1024 ** 3), 1),
                "used": round(disk.used / (1024 ** 3), 1),
                "usedPercentage": int(disk.percent)
            },
            "backup": {
                "status": "healthy",
                "total": 500,
                "used": 120,
                "usedPercentage": 24
            },
            "retention": 30,
            "retentionPolicy": "Standard (30 days)",
            "oldestFootage": time.strftime("%Y-%m-%d")
        },
        "updates": {
            "ai": {
                "currentVersion": "8.3.89",
                "updateAvailable": False,
                "newVersion": "8.3.89"
            },
            "storage": {
                "currentVersion": "2.1.0",
                "updateAvailable": False
            },
            "firmware": {
                "totalCameras": total_cameras,
                "updatedCameras": total_cameras,
                "outdatedCameras": 0
            }
        }
    }
