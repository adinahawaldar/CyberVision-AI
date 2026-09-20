import uuid
import shutil
from typing import List, Optional
from pathlib import Path
from fastapi import APIRouter, HTTPException, Form, UploadFile, File
from backend.services.storage import storage
from backend.config import UPLOADS_DIR

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/roles", response_model=List[str])
async def get_user_roles():
    """Returns available user authorization roles for surveillance and automation rules."""
    return [
        "Employee",
        "Manager",
        "Visitor",
        "Contractor",
        "Security",
        "Admin",
        "Worker"
    ]

@router.get("/profiles", response_model=List[dict])
async def list_profiles():
    return storage.get_users()

@router.get("/profile/{username}", response_model=dict)
async def get_profile(username: str):
    users = storage.get_users()
    for u in users:
        if u.get("username") == username:
            return u
    raise HTTPException(status_code=404, detail="User not found")

@router.post("/profile", response_model=dict)
async def add_profile(
    username: str = Form(...),
    full_name: str = Form(...),
    age: int = Form(...),
    role: str = Form("worker"),
    photo: Optional[UploadFile] = File(None)
):
    photo_url = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop"
    photo_path = None

    if photo:
        file_ext = Path(photo.filename).suffix or ".jpg"
        save_name = f"{username}_{uuid.uuid4().hex[:6]}{file_ext}"
        dest_path = UPLOADS_DIR / save_name
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
        photo_url = f"/api/v1/users/uploads/{save_name}"
        photo_path = str(dest_path)

    user_data = {
        "id": f"user-{uuid.uuid4().hex[:8]}",
        "username": username,
        "full_name": full_name,
        "age": age,
        "role": role,
        "photo_url": photo_url,
        "photoPath": photo_path,
        "lastDetection": "Just registered",
        "message": f"Registered user {full_name}"
    }

    saved = storage.save_user(user_data)
    return saved

@router.put("/profile/{username}", response_model=dict)
async def update_profile(
    username: str,
    full_name: Optional[str] = Form(None),
    age: Optional[int] = Form(None),
    role: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None)
):
    users = storage.get_users()
    target = None
    for u in users:
        if u.get("username") == username:
            target = u
            break
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    if full_name is not None:
        target["full_name"] = full_name
    if age is not None:
        target["age"] = age
    if role is not None:
        target["role"] = role

    if photo:
        file_ext = Path(photo.filename).suffix or ".jpg"
        save_name = f"{username}_{uuid.uuid4().hex[:6]}{file_ext}"
        dest_path = UPLOADS_DIR / save_name
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
        target["photo_url"] = f"/api/v1/users/uploads/{save_name}"
        target["photoPath"] = str(dest_path)

    saved = storage.save_user(target)
    return saved

@router.delete("/profile/{username}")
async def delete_profile(username: str):
    deleted = storage.delete_user(username)
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True, "message": f"User {username} deleted"}
