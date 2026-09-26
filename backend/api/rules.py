from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Body, Request
from backend.services.storage import storage

router = APIRouter(tags=["rules"])

def get_user_id_from_request(request: Request) -> Optional[str]:
    user_id = request.headers.get("X-User-Id") or request.query_params.get("user_id")
    if user_id and user_id.strip():
        return user_id.strip()
    cookie_user_id = request.cookies.get("cv_user_id")
    if cookie_user_id and cookie_user_id.strip():
        return cookie_user_id.strip()
    return None

@router.get("/rules", response_model=List[dict])
@router.get("/rules/", response_model=List[dict])
async def list_rules(request: Request):
    user_id = get_user_id_from_request(request)
    return storage.get_rules(user_id=user_id)

@router.get("/cameras/{camera_id}/rules", response_model=List[dict])
async def list_rules_by_camera(camera_id: str, request: Request):
    user_id = get_user_id_from_request(request)
    all_rules = storage.get_rules(user_id=user_id)
    return [r for r in all_rules if r.get("cameraId") == camera_id or r.get("cameraId") is None]

@router.post("/rules", response_model=dict)
@router.post("/rules/", response_model=dict)
async def create_rule(request: Request, rule: dict = Body(...)):
    user_id = get_user_id_from_request(request)
    if user_id and not rule.get("user_id"):
        rule["user_id"] = user_id
    saved = storage.save_rule(rule, user_id=user_id)
    return saved

@router.put("/rules/{rule_id}", response_model=dict)
@router.patch("/rules/{rule_id}", response_model=dict)
async def update_rule(rule_id: str, request: Request, rule_update: dict = Body(...)):
    user_id = get_user_id_from_request(request)
    rules = storage.get_rules(user_id=user_id)
    target = None
    for r in rules:
        if r.get("id") == rule_id:
            target = r
            break
    if not target:
        raise HTTPException(status_code=404, detail="Rule not found or unauthorized")
    
    target.update(rule_update)
    saved = storage.save_rule(target, user_id=user_id)
    return saved

@router.delete("/rules/{rule_id}")
async def delete_rule(rule_id: str, request: Request):
    user_id = get_user_id_from_request(request)
    deleted = storage.delete_rule(rule_id, user_id=user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Rule not found or unauthorized")
    return {"success": True, "message": f"Rule {rule_id} deleted"}

@router.post("/rules/{rule_id}/toggle", response_model=dict)
async def toggle_rule(rule_id: str, request: Request):
    user_id = get_user_id_from_request(request)
    rules = storage.get_rules(user_id=user_id)
    target = None
    for r in rules:
        if r.get("id") == rule_id:
            target = r
            break
    if not target:
        raise HTTPException(status_code=404, detail="Rule not found or unauthorized")
    
    target["enabled"] = not target.get("enabled", True)
    storage.save_rule(target, user_id=user_id)
    return target
