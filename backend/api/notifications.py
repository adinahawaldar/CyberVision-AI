from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Body, Request
from backend.services.storage import storage

router = APIRouter(prefix="/notifications", tags=["notifications"])

def get_user_id_from_request(request: Request) -> Optional[str]:
    user_id = request.headers.get("X-User-Id") or request.query_params.get("user_id")
    if user_id and user_id.strip():
        return user_id.strip()
    cookie_user_id = request.cookies.get("cv_user_id")
    if cookie_user_id and cookie_user_id.strip():
        return cookie_user_id.strip()
    return None

@router.get("", response_model=List[dict])
@router.get("/", response_model=List[dict])
async def list_notifications(request: Request):
    """Returns security alerts and notifications for the authenticated user, latest first."""
    user_id = get_user_id_from_request(request)
    return storage.get_notifications(user_id=user_id)

@router.post("", response_model=dict)
@router.post("/", response_model=dict)
async def create_notification(request: Request, payload: dict = Body(...)):
    """Creates a new security alert/notification scoped to user."""
    if not payload.get("title") or not payload.get("message"):
        raise HTTPException(status_code=400, detail="title and message are required")
    user_id = get_user_id_from_request(request)
    if user_id and not payload.get("user_id"):
        payload["user_id"] = user_id
    saved = storage.save_notification(payload, user_id=user_id)
    return saved

@router.patch("/{notif_id}/read", response_model=dict)
@router.put("/{notif_id}/read", response_model=dict)
async def mark_read(notif_id: str, request: Request):
    """Marks a notification as read."""
    user_id = get_user_id_from_request(request)
    updated = storage.mark_notification_read(notif_id, user_id=user_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Notification not found")
    return updated

@router.post("/read-all", response_model=dict)
async def mark_all_read(request: Request):
    """Marks all user notifications as read."""
    user_id = get_user_id_from_request(request)
    count = storage.mark_all_notifications_read(user_id=user_id)
    return {"success": True, "marked_count": count}

@router.delete("/{notif_id}")
async def delete_notification(notif_id: str, request: Request):
    """Deletes a specific user notification."""
    user_id = get_user_id_from_request(request)
    deleted = storage.delete_notification(notif_id, user_id=user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"success": True, "message": f"Notification {notif_id} deleted"}

@router.delete("")
@router.delete("/")
async def clear_notifications(request: Request):
    """Clears all notifications for this user."""
    user_id = get_user_id_from_request(request)
    storage.clear_all_notifications(user_id=user_id)
    return {"success": True, "message": "All notifications cleared"}
