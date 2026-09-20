import asyncio
import base64
import time
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, Body, Response, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from backend.services.camera_manager import camera_manager
from backend.services.storage import storage

router = APIRouter(prefix="/streaming", tags=["streaming"])

@router.get("/")
async def get_stream_status():
    """Returns list of all active streams."""
    return {"active_streams": camera_manager.get_active_streams()}

@router.get("/stream-urls")
async def get_stream_urls():
    """Returns active streams and their stream URLs."""
    return camera_manager.get_active_streams()

@router.post("/start/{camera_id}")
async def start_camera_stream_by_id(
    camera_id: str,
    with_detection: bool = Query(True)
):
    """Starts streaming for a specific camera with optional AI detection."""
    success = camera_manager.start_stream(camera_id, with_detection=with_detection)
    if not success:
        raise HTTPException(status_code=404, detail="Camera not found or could not start stream")
    
    return {
        "camera_id": camera_id,
        "hls_url": f"http://localhost:8000/api/v1/streaming/live/{camera_id}",
        "status": "active",
        "with_detection": with_detection
    }

@router.post("/start")
async def start_camera_stream_generic(payload: Dict[str, Any] = Body(...)):
    """Starts streaming with JSON body { camera_id: ... }"""
    camera_id = payload.get("camera_id")
    if not camera_id:
        raise HTTPException(status_code=400, detail="camera_id is required")
    
    with_detection = payload.get("with_detection", True)
    success = camera_manager.start_stream(camera_id, with_detection=with_detection)
    if not success:
        raise HTTPException(status_code=404, detail="Camera not found")
        
    return {
        "camera_id": camera_id,
        "url": f"http://localhost:8000/api/v1/streaming/live/{camera_id}",
        "webrtc_url": f"ws://localhost:8000/api/v1/streaming/{camera_id}/webrtc",
        "hls_url": f"http://localhost:8000/api/v1/streaming/live/{camera_id}",
        "status": "active"
    }

@router.post("/stop/{camera_id}")
async def stop_camera_stream(camera_id: str):
    """Stops streaming for a specific camera."""
    camera_manager.stop_stream(camera_id)
    return {"camera_id": camera_id, "status": "stopped"}

@router.get("/live/{camera_id}")
@router.get("/video-feed/{camera_id}")
async def live_video_feed(camera_id: str, raw: bool = Query(False)):
    """
    High-speed, zero-latency MJPEG live stream.
    Directly viewable in browsers via <img src="..." /> or standard media players.
    """
    cap = camera_manager.get_capture(camera_id)
    if not cap:
        # Auto-start if exists in storage
        started = camera_manager.start_stream(camera_id)
        if not started:
            raise HTTPException(status_code=404, detail="Camera not found")

    return StreamingResponse(
        camera_manager.generate_mjpeg_stream(camera_id, processed=not raw),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@router.get("/snapshot/{camera_id}")
async def get_camera_snapshot(camera_id: str, raw: bool = Query(False)):
    """Returns a single JPEG snapshot of the camera feed."""
    cap = camera_manager.get_capture(camera_id)
    if not cap:
        camera_manager.start_stream(camera_id)
        cap = camera_manager.get_capture(camera_id)

    if not cap:
        raise HTTPException(status_code=404, detail="Camera not found")

    jpeg_bytes = cap.get_latest_jpeg(processed=not raw, quality=85)
    if not jpeg_bytes:
        raise HTTPException(status_code=503, detail="Camera frame not ready yet")

    return Response(content=jpeg_bytes, media_type="image/jpeg")

@router.websocket("/{camera_id}/webrtc")
@router.websocket("/{camera_id}/ws")
async def websocket_camera_stream(websocket: WebSocket, camera_id: str):
    """
    High-performance WebSocket live stream delivering base64 JPEG frames,
    FPS telemetry, and real-time YOLOv8 detections.
    """
    await websocket.accept()
    cap = camera_manager.get_capture(camera_id)
    if not cap:
        camera_manager.start_stream(camera_id)
        cap = camera_manager.get_capture(camera_id)

    try:
        while True:
            if cap and cap.running:
                jpeg_bytes = cap.get_latest_jpeg(processed=cap.with_detection, quality=65)
                if jpeg_bytes:
                    b64_img = base64.b64encode(jpeg_bytes).decode('utf-8')
                    await websocket.send_json({
                        "camera_id": camera_id,
                        "fps": round(cap.fps, 1),
                        "timestamp": time.time(),
                        "detections": cap.latest_detections,
                        "image": f"data:image/jpeg;base64,{b64_img}"
                    })
            await asyncio.sleep(0.04)  # ~25 FPS limit
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
