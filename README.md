# CyberVision AI

CyberVision AI is an intelligent surveillance and digital forensics platform designed for real-time video threat detection, automated incident alerting, and digital evidence investigation. The system combines computer vision, dynamic rule evaluation, and forensic case management to assist security teams in monitoring live camera feeds and analyzing security incidents.

---

## Overview

CyberVision AI automates monitoring across IP/RTSP streams, webcams, and recorded feeds. It processes incoming frames with real-time object detection models, evaluates activity against user-defined security policies, triggers alerts upon policy violations, and provides forensic tools to manage cases, verify evidence integrity, and generate investigation reports.

---

## Workflow

The system operates through a sequential five-stage pipeline:

1. **Video Ingestion & Preprocessing**
   - Captures live video streams from IP/RTSP cameras, DirectShow webcams, or pre-recorded video files.
   - Normalizes frame rates, adjusts resolution, and adds timestamp overlays for frame synchronization.

2. **Computer Vision & Threat Detection**
   - Applies deep-learning object detection (YOLOv8) to identify people, vehicles, weapons, and custom objects in real time.
   - Tracks objects across frames and calculates confidence metrics to reduce false positives.

3. **Rules Evaluation & Triggering**
   - Evaluates detections against defined security parameters such as perimeter intrusion, unauthorized presence, and restricted zone entry.
   - Debounces repeated triggers using cooldown logic to prevent alert fatigue.

4. **Alerts & Real-Time Monitoring**
   - Emits prioritized notifications (critical, warning, informational) to the web dashboard.
   - Displays live camera feeds with interactive controls, status metrics, and AI assistant query support.

5. **Digital Forensics & Reporting**
   - Converts detected incidents into forensic cases with chain-of-custody tracking.
   - Calculates cryptographic SHA-256 hashes on uploaded evidence files to ensure data integrity.
   - Reconstructs chronological event timelines and compiles findings into standardized investigation PDF reports.

---

## Architecture

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS, Lucide Icons
- **Backend API:** FastAPI, Python, Uvicorn, Pydantic
- **Computer Vision:** OpenCV, Ultralytics YOLOv8, PyTorch
- **Evidence & Storage:** Cryptographic hashing (SHA-256), JSON/file-based datastores, PDF reporting engine

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- Git

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate      # On Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
python main.py
```
The backend API server runs by default on `http://localhost:8000`.

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend application will be accessible at `http://localhost:3000`.
