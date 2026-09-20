from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Body
from backend.services.storage import storage

router = APIRouter(tags=["rules"])

@router.get("/rules", response_model=List[dict])
@router.get("/rules/", response_model=List[dict])
async def list_rules():
    return storage.get_rules()

@router.get("/cameras/{camera_id}/rules", response_model=List[dict])
async def list_rules_by_camera(camera_id: str):
    all_rules = storage.get_rules()
    return [r for r in all_rules if r.get("cameraId") == camera_id or r.get("cameraId") is None]

@router.post("/rules", response_model=dict)
@router.post("/rules/", response_model=dict)
async def create_rule(rule: dict = Body(...)):
    saved = storage.save_rule(rule)
    return saved

@router.put("/rules/{rule_id}", response_model=dict)
@router.patch("/rules/{rule_id}", response_model=dict)
async def update_rule(rule_id: str, rule_update: dict = Body(...)):
    rules = storage.get_rules()
    target = None
    for r in rules:
        if r.get("id") == rule_id:
            target = r
            break
    if not target:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    target.update(rule_update)
    saved = storage.save_rule(target)
    return saved

@router.delete("/rules/{rule_id}")
async def delete_rule(rule_id: str):
    deleted = storage.delete_rule(rule_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Rule not found")
    return {"success": True, "message": f"Rule {rule_id} deleted"}

@router.post("/rules/{rule_id}/toggle", response_model=dict)
async def toggle_rule(rule_id: str):
    rules = storage.get_rules()
    target = None
    for r in rules:
        if r.get("id") == rule_id:
            target = r
            break
    if not target:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    target["enabled"] = not target.get("enabled", True)
    storage.save_rule(target)
    return target
