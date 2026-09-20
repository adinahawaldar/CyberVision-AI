import json
import uuid
from typing import List, Optional, Dict, Any
from pathlib import Path
from backend.config import CAMERAS_FILE, RULES_FILE, USERS_FILE, NOTIFICATIONS_FILE
from backend.models import Camera, Rule, UserProfile, CameraFilter

def load_json(path: Path, default: Any) -> Any:
    if not path.exists():
        save_json(path, default)
        return default
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        save_json(path, default)
        return default

def save_json(path: Path, data: Any):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

class StorageManager:
    def __init__(self):
        self._init_defaults()

    def _init_defaults(self):
        # Default cameras if not present
        if not CAMERAS_FILE.exists() or len(load_json(CAMERAS_FILE, [])) == 0:
            default_cameras = [
                {
                    "id": "cam-webcam-0",
                    "name": "Camera 01 - Main Entrance (Webcam)",
                    "rtsp_url": "0",  # Device index 0 (Integrated Webcam)
                    "location": "Main Entrance",
                    "status": "online",
                    "stream_url": "http://localhost:8000/api/v1/streaming/live/cam-webcam-0",
                    "hls_url": "http://localhost:8000/api/v1/streaming/live/cam-webcam-0",
                    "thumbnail_url": "/api/v1/streaming/snapshot/cam-webcam-0",
                    "model": "HD Integrated Webcam",
                    "is_streaming": True,
                    "filters": [
                        {"filter_id": "yolo-person-1", "filter_name": "Attendance", "enabled": True},
                        {"filter_id": "yolo-vehicle-2", "filter_name": "VehicleDetection", "enabled": True},
                        {"filter_id": "yolo-auth-3", "filter_name": "authorized_entry", "enabled": True},
                        {"filter_id": "yolo-vision-4", "filter_name": "OllamaVision", "enabled": True}
                    ]
                },
                {
                    "id": "cam-synthetic-2",
                    "name": "Camera 02 - Perimeter Patrol",
                    "rtsp_url": "synth:perimeter",
                    "location": "Perimeter North",
                    "status": "online",
                    "stream_url": "http://localhost:8000/api/v1/streaming/live/cam-synthetic-2",
                    "hls_url": "http://localhost:8000/api/v1/streaming/live/cam-synthetic-2",
                    "thumbnail_url": "/api/v1/streaming/snapshot/cam-synthetic-2",
                    "model": "CyberVision 4K PTZ",
                    "is_streaming": True,
                    "filters": [
                        {"filter_id": "filter-animal-1", "filter_name": "AnimalDetection", "enabled": True},
                        {"filter_id": "filter-vehicle-2", "filter_name": "VehicleDetection", "enabled": True}
                    ]
                },
                {
                    "id": "cam-synthetic-3",
                    "name": "Camera 03 - Server Vault",
                    "rtsp_url": "synth:vault",
                    "location": "Secure Server Room",
                    "status": "online",
                    "stream_url": "http://localhost:8000/api/v1/streaming/live/cam-synthetic-3",
                    "hls_url": "http://localhost:8000/api/v1/streaming/live/cam-synthetic-3",
                    "thumbnail_url": "/api/v1/streaming/snapshot/cam-synthetic-3",
                    "model": "Infrared Secure Dome",
                    "is_streaming": True,
                    "filters": [
                        {"filter_id": "filter-auth-4", "filter_name": "authorized_entry", "enabled": True}
                    ]
                }
            ]
            save_json(CAMERAS_FILE, default_cameras)

        # Default rules if not present
        if not RULES_FILE.exists() or len(load_json(RULES_FILE, [])) == 0:
            default_rules = [
                {
                    "id": "rule-auth-entry-01",
                    "name": "Authorized Personnel Verification",
                    "cameraId": "cam-webcam-0",
                    "cameraName": "Camera 01 - Main Entrance (Webcam)",
                    "event": "authorized_entry",
                    "condition": {
                        "type": "attendance",
                        "data": {
                            "role": "employee",
                            "entryTimeStart": "08:00",
                            "entryTimeEnd": "19:00",
                            "intervalCheck": True
                        }
                    },
                    "action": "notify",
                    "enabled": True,
                    "schedule": "08:00 - 19:00",
                    "days": ["Mon", "Tue", "Wed", "Thu", "Fri"]
                },
                {
                    "id": "rule-vehicle-02",
                    "name": "Restricted Vehicle Detection",
                    "cameraId": None,
                    "cameraName": "All Cameras",
                    "event": "vehicle_recognized",
                    "condition": {
                        "type": "vehicle",
                        "data": {
                            "role": "restricted",
                            "licensePlatePattern": "*"
                        }
                    },
                    "action": "trigger_alarm",
                    "enabled": True,
                    "schedule": "24/7",
                    "days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
                }
            ]
            save_json(RULES_FILE, default_rules)

        # Default users if not present
        if not USERS_FILE.exists() or len(load_json(USERS_FILE, [])) == 0:
            default_users = [
                {
                    "id": "user-admin-1",
                    "full_name": "Chief Security Officer",
                    "username": "admin",
                    "age": 34,
                    "role": "admin",
                    "photo_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces",
                    "lastDetection": "Just now",
                    "message": "System Administrator"
                },
                {
                    "id": "user-worker-2",
                    "full_name": "Adina Hawaldar",
                    "username": "adina",
                    "age": 22,
                    "role": "worker",
                    "photo_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces",
                    "lastDetection": "10 minutes ago",
                    "message": "Surveillance Operator"
                }
            ]
            save_json(USERS_FILE, default_users)

        # Default notifications if not present
        if not NOTIFICATIONS_FILE.exists() or len(load_json(NOTIFICATIONS_FILE, [])) == 0:
            default_notifications = [
                {
                    "id": "notif-breach-01",
                    "title": "Perimeter Patrol Alert",
                    "message": "Unscheduled movement detected at Perimeter North by YOLOv8 tracking.",
                    "timestamp": "2026-09-20T14:45:00Z",
                    "type": "warning",
                    "read": False,
                    "link": "/dashboard/cameras/live?camera=cam-synthetic-2"
                },
                {
                    "id": "notif-auth-02",
                    "title": "Authorized Staff Entry",
                    "message": "Chief Security Officer verified at Main Entrance camera.",
                    "timestamp": "2026-09-20T15:00:00Z",
                    "type": "info",
                    "read": True,
                    "link": "/dashboard/cameras/live?camera=cam-webcam-0"
                },
                {
                    "id": "notif-system-03",
                    "title": "Vision Engine Online",
                    "message": "All 3 surveillance streams connected. Real-time inference active.",
                    "timestamp": "2026-09-20T15:15:00Z",
                    "type": "success",
                    "read": True,
                    "link": "/dashboard/health"
                }
            ]
            save_json(NOTIFICATIONS_FILE, default_notifications)

    # Camera operations
    def get_cameras(self) -> List[Dict[str, Any]]:
        return load_json(CAMERAS_FILE, [])

    def get_camera_by_id(self, camera_id: str) -> Optional[Dict[str, Any]]:
        cameras = self.get_cameras()
        for cam in cameras:
            if cam.get("id") == camera_id:
                return cam
        return None

    def get_camera_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        cameras = self.get_cameras()
        for cam in cameras:
            if cam.get("name", "").lower() == name.lower():
                return cam
        return None

    def save_camera(self, camera_data: Dict[str, Any]) -> Dict[str, Any]:
        cameras = self.get_cameras()
        if not camera_data.get("id"):
            camera_data["id"] = f"cam-{uuid.uuid4().hex[:8]}"
        
        # Check if already exists to update
        updated = False
        for i, cam in enumerate(cameras):
            if cam.get("id") == camera_data["id"]:
                cameras[i] = camera_data
                updated = True
                break
        if not updated:
            cameras.append(camera_data)
            
        save_json(CAMERAS_FILE, cameras)
        return camera_data

    def delete_camera(self, camera_id: str) -> bool:
        cameras = self.get_cameras()
        initial_len = len(cameras)
        cameras = [c for c in cameras if c.get("id") != camera_id]
        if len(cameras) != initial_len:
            save_json(CAMERAS_FILE, cameras)
            return True
        return False

    def delete_camera_by_name(self, name: str) -> bool:
        cameras = self.get_cameras()
        initial_len = len(cameras)
        cameras = [c for c in cameras if c.get("name", "").lower() != name.lower()]
        if len(cameras) != initial_len:
            save_json(CAMERAS_FILE, cameras)
            return True
        return False

    # Rules operations
    def get_rules(self) -> List[Dict[str, Any]]:
        return load_json(RULES_FILE, [])

    def save_rule(self, rule_data: Dict[str, Any]) -> Dict[str, Any]:
        rules = self.get_rules()
        if not rule_data.get("id"):
            rule_data["id"] = f"rule-{uuid.uuid4().hex[:8]}"
        updated = False
        for i, r in enumerate(rules):
            if r.get("id") == rule_data["id"]:
                rules[i] = rule_data
                updated = True
                break
        if not updated:
            rules.append(rule_data)
        save_json(RULES_FILE, rules)
        return rule_data

    def delete_rule(self, rule_id: str) -> bool:
        rules = self.get_rules()
        initial_len = len(rules)
        rules = [r for r in rules if r.get("id") != rule_id]
        if len(rules) != initial_len:
            save_json(RULES_FILE, rules)
            return True
        return False

    # Users operations
    def get_users(self) -> List[Dict[str, Any]]:
        return load_json(USERS_FILE, [])

    def save_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        users = self.get_users()
        if not user_data.get("id"):
            user_data["id"] = f"user-{uuid.uuid4().hex[:8]}"
        updated = False
        for i, u in enumerate(users):
            if u.get("username") == user_data.get("username"):
                users[i] = user_data
                updated = True
                break
        if not updated:
            users.append(user_data)
        save_json(USERS_FILE, users)
        return user_data

    def delete_user(self, username: str) -> bool:
        users = self.get_users()
        initial_len = len(users)
        users = [u for u in users if u.get("username") != username]
        if len(users) != initial_len:
            save_json(USERS_FILE, users)
            return True
        return False

    # Notifications operations
    def get_notifications(self) -> List[Dict[str, Any]]:
        return load_json(NOTIFICATIONS_FILE, [])

    def save_notification(self, notif_data: Dict[str, Any]) -> Dict[str, Any]:
        notifications = self.get_notifications()
        if not notif_data.get("id"):
            notif_data["id"] = f"notif-{uuid.uuid4().hex[:8]}"
        if "read" not in notif_data:
            notif_data["read"] = False
        if "timestamp" not in notif_data:
            import datetime
            notif_data["timestamp"] = datetime.datetime.utcnow().isoformat() + "Z"
            
        updated = False
        for i, n in enumerate(notifications):
            if n.get("id") == notif_data["id"]:
                notifications[i] = notif_data
                updated = True
                break
        if not updated:
            notifications.insert(0, notif_data)
        save_json(NOTIFICATIONS_FILE, notifications)
        return notif_data

    def mark_notification_read(self, notif_id: str) -> Optional[Dict[str, Any]]:
        notifications = self.get_notifications()
        target = None
        for n in notifications:
            if n.get("id") == notif_id:
                n["read"] = True
                target = n
                break
        if target:
            save_json(NOTIFICATIONS_FILE, notifications)
        return target

    def mark_all_notifications_read(self) -> int:
        notifications = self.get_notifications()
        count = 0
        for n in notifications:
            if not n.get("read", False):
                n["read"] = True
                count += 1
        save_json(NOTIFICATIONS_FILE, notifications)
        return count

    def delete_notification(self, notif_id: str) -> bool:
        notifications = self.get_notifications()
        initial_len = len(notifications)
        notifications = [n for n in notifications if n.get("id") != notif_id]
        if len(notifications) != initial_len:
            save_json(NOTIFICATIONS_FILE, notifications)
            return True
        return False

    def clear_all_notifications(self) -> bool:
        save_json(NOTIFICATIONS_FILE, [])
        return True

storage = StorageManager()
