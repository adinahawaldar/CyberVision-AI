from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Body
from backend.services.storage import storage

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("", response_model=List[dict])
@router.get("/", response_model=List[dict])
async def list_notifications():
    """Returns all security alerts and notifications, latest first."""
    return storage.get_notifications()

@router.post("", response_model=dict)
@router.post("/", response_model=dict)
async def create_notification(payload: dict = Body(...)):
    """Creates a new security alert/notification."""
    if not payload.get("title") or not payload.get("message"):
        raise HTTPException(status_code=400, detail="title and message are required")
    saved = storage.save_notification(payload)
    return saved

@router.patch("/{notif_id}/read", response_model=dict)
@router.put("/{notif_id}/read", response_model=dict)
async def mark_read(notif_id: str):
    """Marks a notification as read."""
    updated = storage.mark_notification_read(notif_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Notification not found")
    return updated

@router.post("/read-all", response_model=dict)
async def mark_all_read():
    """Marks all notifications as read."""
    count = storage.mark_all_notifications_read()
    return {"success": True, "marked_count": count}

@router.delete("/{notif_id}")
async def delete_notification(notif_id: str):
    """Deletes a specific notification."""
    deleted = storage.delete_notification(notif_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"success": True, "message": f"Notification {notif_id} deleted"}

@router.delete("")
@router.delete("/")
async def clear_notifications():
    """Clears all notifications."""
    storage.clear_all_notifications()
    return {"success": True, "message": "All notifications cleared"}
