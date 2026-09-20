from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field
from datetime import datetime

# Filter Definition
class CameraFilter(BaseModel):
    filter_id: str
    filter_name: str
    enabled: bool = True

# Camera Models
class CameraBase(BaseModel):
    name: str
    rtsp_url: str
    location: Optional[str] = "Main Facility"
    model: Optional[str] = "Integrated Vision Cam"
    filters: Optional[List[CameraFilter]] = []

class CameraCreate(CameraBase):
    pass

class Camera(CameraBase):
    id: str
    status: str = "online"  # "online" | "offline"
    stream_url: Optional[str] = None
    webrtc_url: Optional[str] = None
    hls_url: Optional[str] = None
    thumbnail_url: Optional[str] = "/camera-placeholder.jpg"
    is_streaming: bool = False
    last_seen: Optional[str] = Field(default_factory=lambda: datetime.utcnow().isoformat())

# Streaming Models
class StreamInfo(BaseModel):
    camera_id: str
    hls_url: str
    status: str = "active"
    with_detection: bool = True
    fps: Optional[float] = 0.0

class StreamStatusResponse(BaseModel):
    active_streams: List[StreamInfo]

# Automation Rules Models
class AttendanceCondition(BaseModel):
    role: str = "employee"
    entryTimeStart: Optional[str] = None
    entryTimeEnd: Optional[str] = None
    exitTime: Optional[str] = None
    intervalCheck: Optional[bool] = False

class VehicleCondition(BaseModel):
    role: str = "authorized"
    licensePlatePattern: Optional[str] = None

class GeneralCondition(BaseModel):
    description: str = "General security check"
    role: Optional[str] = None

class Rule(BaseModel):
    id: str
    name: str
    cameraId: Optional[str] = None
    cameraName: Optional[str] = None
    event: str  # "authorized_entry", "attendance", "vehicle_recognized", etc.
    condition: Dict[str, Any]
    action: str = "notify"  # "notify", "record", "trigger_alarm", "custom"
    enabled: bool = True
    schedule: str = "08:00 - 18:00"
    days: List[str] = ["Mon", "Tue", "Wed", "Thu", "Fri"]

# User Management Models
class UserProfile(BaseModel):
    id: Optional[str] = None
    full_name: str
    username: str
    age: int
    role: str = "worker"  # "admin" | "worker"
    photo_url: Optional[str] = None
    photoPath: Optional[str] = None
    lastDetection: Optional[str] = None
    message: Optional[str] = None

# Contextual AI Assistant Models
class QueryRequest(BaseModel):
    camera_id: str
    query: str

class QueryResponse(BaseModel):
    success: bool
    response: Optional[str] = None
    error: Optional[str] = None
    camera_id: Optional[str] = None
    camera_name: Optional[str] = None
    timestamp: Optional[str] = None
    model: Optional[str] = "YOLOv8-Vision-Engine"
    image_base64: Optional[str] = None
    detections: Optional[List[Dict[str, Any]]] = None
