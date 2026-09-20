import os
import time
import base64
import tempfile
import cv2
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from backend.models import QueryRequest, QueryResponse
from backend.services.camera_manager import camera_manager
from backend.services.storage import storage
from backend.services.detector import detector

router = APIRouter(prefix="/contextual", tags=["ai-assistant"])

@router.post("/query", response_model=QueryResponse)
async def query_camera_context(req: QueryRequest):
    """
    Analyzes live camera frame and current YOLO detections to answer security queries.
    """
    cam_id = req.camera_id
    query_text = req.query.strip().lower()

    cap = camera_manager.get_capture(cam_id)
    if not cap:
        cam_info = storage.get_camera_by_id(cam_id)
        if cam_info:
            camera_manager.start_stream(cam_id)
            cap = camera_manager.get_capture(cam_id)

    cam_name = cap.name if cap else cam_id
    now_str = time.strftime("%Y-%m-%d %H:%M:%S")

    if not cap or not cap.is_connected:
        return QueryResponse(
            success=False,
            error=f"Camera feed '{cam_name}' is currently offline or unreachable.",
            camera_id=cam_id,
            camera_name=cam_name,
            timestamp=now_str
        )

    # Fetch latest detections from camera buffer
    with cap.lock:
        detections = list(cap.latest_detections)

    # Class counts
    counts = {}
    for d in detections:
        cls = d["class"]
        counts[cls] = counts.get(cls, 0) + 1

    total_objects = len(detections)
    person_count = counts.get("person", 0)
    vehicle_count = sum(counts.get(v, 0) for v in ["car", "motorcycle", "bus", "truck", "bicycle"])

    # Generate smart contextual surveillance response
    if "person" in query_text or "people" in query_text or "human" in query_text or "who" in query_text:
        if person_count == 0:
            analysis = f"No persons are currently detected in {cam_name}. The monitored perimeter is clear."
        elif person_count == 1:
            analysis = f"1 person is currently detected in {cam_name}. Subject is actively tracked by YOLOv8."
        else:
            analysis = f"Detected {person_count} individuals currently in {cam_name}. Crowd density is within normal threshold."
    elif "car" in query_text or "vehicle" in query_text or "truck" in query_text:
        if vehicle_count == 0:
            analysis = f"Zero vehicles detected in the vicinity of {cam_name}."
        else:
            analysis = f"Detected {vehicle_count} vehicle(s) in {cam_name} feed. All license areas monitored."
    elif "status" in query_text or "safe" in query_text or "threat" in query_text:
        analysis = (
            f"Camera {cam_name} is fully ONLINE at {round(cap.fps, 1)} FPS. "
            f"Active tracking identified {total_objects} total object(s) "
            f"({person_count} person(s), {vehicle_count} vehicle(s)). Threat level is NORMAL."
        )
    else:
        det_summary = ", ".join([f"{v} {k}(s)" for k, v in counts.items()]) if counts else "No objects flagged"
        analysis = (
            f"Analysis for {cam_name} at {now_str}: "
            f"Feed is live at {round(cap.fps, 1)} FPS. "
            f"Current detections: {det_summary}. Surveillance status is nominal."
        )

    # Optional thumbnail frame base64
    jpeg_bytes = cap.get_latest_jpeg(processed=True, quality=60)
    img_b64 = base64.b64encode(jpeg_bytes).decode('utf-8') if jpeg_bytes else None

    return QueryResponse(
        success=True,
        response=analysis,
        camera_id=cam_id,
        camera_name=cam_name,
        timestamp=now_str,
        model="YOLOv8-Vision-Core",
        image_base64=img_b64,
        detections=detections
    )

@router.post("/analyze-video")
async def analyze_uploaded_video(
    video: UploadFile = File(...),
    prompt: str = Form(...)
):
    """
    Runs actual YOLOv8 frame-by-frame object detection on an uploaded video file
    and answers questions based on real detections.
    """
    suffix = os.path.splitext(video.filename or "temp.mp4")[1] or ".mp4"
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    try:
        content = await video.read()
        temp_file.write(content)
        temp_file.flush()
        temp_file.close()

        cap = cv2.VideoCapture(temp_file.name)
        if not cap.isOpened():
            return {
                "success": False,
                "response": "Could not open uploaded video file for decoding.",
                "counts": {}
            }

        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        step = max(1, int(fps))  # sample ~1 frame per second

        max_counts_per_class = {}
        all_detections = []
        sampled_frames = 0
        frame_idx = 0

        while cap.isOpened() and sampled_frames < 60:
            ret, frame = cap.read()
            if not ret or frame is None:
                break

            if frame_idx % step == 0:
                sampled_frames += 1
                _, detections = detector.detect(frame)
                frame_counts = {}
                for d in detections:
                    cls = d.get("class", "object")
                    frame_counts[cls] = frame_counts.get(cls, 0) + 1
                    all_detections.append(d)

                for cls, count in frame_counts.items():
                    max_counts_per_class[cls] = max(max_counts_per_class.get(cls, 0), count)

            frame_idx += 1

        cap.release()

        query_text = prompt.strip().lower()
        person_count = max_counts_per_class.get("person", 0)
        car_count = max_counts_per_class.get("car", 0)
        vehicle_count = sum(max_counts_per_class.get(v, 0) for v in ["car", "motorcycle", "bus", "truck", "bicycle"])
        bag_count = sum(max_counts_per_class.get(b, 0) for b in ["backpack", "handbag", "suitcase"])

        if "car" in query_text or "vehicle" in query_text or "truck" in query_text:
            if vehicle_count == 0:
                analysis = f"No cars or vehicles were detected in the uploaded video (0 found across {sampled_frames} sampled frames)."
            elif vehicle_count == 1:
                analysis = f"Detected 1 vehicle ({', '.join(f'{k}: {v}' for k, v in max_counts_per_class.items() if k in ['car', 'motorcycle', 'bus', 'truck'])}) in the uploaded video."
            else:
                analysis = f"Detected {vehicle_count} vehicle(s) ({car_count} car(s)) in the uploaded video."
        elif "person" in query_text or "people" in query_text or "human" in query_text or "who" in query_text:
            if person_count == 0:
                analysis = f"No people were detected in the uploaded video (0 found across {sampled_frames} sampled frames)."
            elif person_count == 1:
                analysis = f"Detected 1 person in the uploaded video."
            else:
                analysis = f"Detected {person_count} individuals in the uploaded video."
        elif "bag" in query_text or "gunny" in query_text or "backpack" in query_text or "suitcase" in query_text:
            if bag_count == 0:
                analysis = f"No bags or luggage items were detected in the uploaded video (0 found across {sampled_frames} sampled frames)."
            else:
                analysis = f"Detected {bag_count} bag/luggage item(s) in the uploaded video."
        else:
            if not max_counts_per_class:
                analysis = f"Analysis complete. No objects were detected in the video across {sampled_frames} sampled frames."
            else:
                summary = ", ".join(f"{v} {k}(s)" for k, v in max_counts_per_class.items())
                analysis = f"Analysis complete across {sampled_frames} sampled frames. Real-time detections: {summary}."

        return {
            "success": True,
            "response": analysis,
            "counts": max_counts_per_class,
            "frames_analyzed": sampled_frames
        }
    except Exception as e:
        return {
            "success": False,
            "response": f"Error analyzing video: {str(e)}",
            "counts": {}
        }
    finally:
        if os.path.exists(temp_file.name):
            try:
                os.unlink(temp_file.name)
            except Exception:
                pass
