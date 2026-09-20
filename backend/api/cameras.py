import json
import uuid
from typing import List, Optional, Any
from fastapi import APIRouter, HTTPException, Form, Body, Request
from backend.models import Camera, CameraCreate, CameraFilter
from backend.services.storage import storage
from backend.services.camera_manager import camera_manager

router = APIRouter(tags=["cameras"])

@router.get("/cameras", response_model=List[dict])
@router.get("/contextual/cameras", response_model=List[dict])
async def list_cameras():
    """Lists all configured cameras with live streaming and status metrics."""
    cameras = storage.get_cameras()
    active_streams = {s["camera_id"]: s for s in camera_manager.get_active_streams()}
    
    # Enrich with live status
    for cam in cameras:
        cam_id = cam.get("id")
        is_active = cam_id in active_streams
        cam["is_streaming"] = is_active
        cam["status"] = "online" if is_active else cam.get("status", "offline")
        # Ensure live streaming URLs point to backend
        cam["stream_url"] = f"http://localhost:8000/api/v1/streaming/live/{cam_id}"
        cam["hls_url"] = f"http://localhost:8000/api/v1/streaming/live/{cam_id}"
        cam["thumbnail_url"] = f"http://localhost:8000/api/v1/streaming/snapshot/{cam_id}"
        
    return cameras

@router.get("/cameras/{camera_id}", response_model=dict)
async def get_camera(camera_id: str):
    cam = storage.get_camera_by_id(camera_id)
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    return cam

@router.get("/cameras/by-name/{name}", response_model=dict)
async def get_camera_by_name(name: str):
    cam = storage.get_camera_by_name(name)
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    return cam

@router.post("/cameras/", response_model=dict)
async def add_camera(
    request: Request,
    name: Optional[str] = Form(None),
    rtsp_url: Optional[str] = Form(None),
):
    """
    Adds a new camera. Supports both multipart/form-data and application/json.
    """
    if name is None or rtsp_url is None:
        try:
            body = await request.json()
            name = body.get("name")
            rtsp_url = body.get("rtsp_url")
        except Exception:
            pass

    if not name or not rtsp_url:
        raise HTTPException(status_code=400, detail="name and rtsp_url are required")

    cam_id = f"cam-{uuid.uuid4().hex[:8]}"
    camera_data = {
        "id": cam_id,
        "name": name,
        "rtsp_url": rtsp_url,
        "location": "Custom Location",
        "status": "online",
        "stream_url": f"http://localhost:8000/api/v1/streaming/live/{cam_id}",
        "hls_url": f"http://localhost:8000/api/v1/streaming/live/{cam_id}",
        "thumbnail_url": f"http://localhost:8000/api/v1/streaming/snapshot/{cam_id}",
        "model": "Network / USB Camera",
        "is_streaming": True,
        "filters": [
            {"filter_id": "filter-1", "filter_name": "Attendance", "enabled": True},
            {"filter_id": "filter-2", "filter_name": "VehicleDetection", "enabled": True}
        ]
    }
    
    saved = storage.save_camera(camera_data)
    camera_manager.add_or_update_camera(cam_id, rtsp_url, name, start=True)
    return saved

@router.post("/cameras/with-filters", response_model=dict)
async def add_camera_with_filters(
    request: Request,
    name: Optional[str] = Form(None),
    rtsp_url: Optional[str] = Form(None),
    filters: Optional[str] = Form(None),
    validate_stream: Optional[bool] = Form(True, alias="validate"),
):
    """
    Adds a camera with custom AI filters configured.
    """
    if name is None or rtsp_url is None:
        try:
            body = await request.json()
            name = body.get("name")
            rtsp_url = body.get("rtsp_url")
            filters_raw = body.get("filters")
            if isinstance(filters_raw, list):
                parsed_filters = filters_raw
            else:
                parsed_filters = []
        except Exception:
            parsed_filters = []
    else:
        parsed_filters = []
        if filters:
            try:
                parsed_filters = json.loads(filters)
            except Exception:
                pass

    if not name or not rtsp_url:
        raise HTTPException(status_code=400, detail="name and rtsp_url are required")

    cam_id = f"cam-{uuid.uuid4().hex[:8]}"
    camera_data = {
        "id": cam_id,
        "name": name,
        "rtsp_url": rtsp_url,
        "location": "Facility Perimeter",
        "status": "online",
        "stream_url": f"http://localhost:8000/api/v1/streaming/live/{cam_id}",
        "hls_url": f"http://localhost:8000/api/v1/streaming/live/{cam_id}",
        "thumbnail_url": f"http://localhost:8000/api/v1/streaming/snapshot/{cam_id}",
        "model": "AI Multi-Filter Camera",
        "is_streaming": True,
        "filters": parsed_filters
    }
    
    saved = storage.save_camera(camera_data)
    camera_manager.add_or_update_camera(cam_id, rtsp_url, name, start=True)
    return saved

@router.put("/cameras/{camera_id}", response_model=dict)
async def update_camera(camera_id: str, camera_update: dict = Body(...)):
    cam = storage.get_camera_by_id(camera_id)
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    cam.update(camera_update)
    saved = storage.save_camera(cam)
    if "rtsp_url" in camera_update or "name" in camera_update:
        camera_manager.add_or_update_camera(
            camera_id,
            cam.get("rtsp_url", "0"),
            cam.get("name", camera_id),
            start=cam.get("is_streaming", True)
        )
    return saved

@router.delete("/cameras/{camera_id}")
async def delete_camera_by_id(camera_id: str):
    camera_manager.remove_camera(camera_id)
    deleted = storage.delete_camera(camera_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Camera not found")
    return {"success": True, "message": f"Camera {camera_id} deleted"}

@router.delete("/cameras/by-name/{name}")
async def delete_camera_by_name(name: str):
    cam = storage.get_camera_by_name(name)
    if cam:
        camera_manager.remove_camera(cam.get("id"))
    deleted = storage.delete_camera_by_name(name)
    if not deleted:
        raise HTTPException(status_code=404, detail="Camera not found")
    return {"success": True, "message": f"Camera {name} deleted"}

@router.get("/cameras/{camera_id}/filters")
async def get_camera_filters(camera_id: str):
    cam = storage.get_camera_by_id(camera_id)
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    return cam.get("filters", [])

@router.put("/cameras/{camera_id}/filters")
async def update_camera_filters(camera_id: str, filters: List[dict] = Body(...)):
    cam = storage.get_camera_by_id(camera_id)
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    cam["filters"] = filters
    storage.save_camera(cam)
    return filters
