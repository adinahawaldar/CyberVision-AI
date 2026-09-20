import sys
import os
from pathlib import Path

# Fix Windows console encoding
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

import uvicorn
from backend.config import HOST, PORT

def main():
    print("=" * 70)
    print("      [*] CYBERVISION-AI  //  AI SURVEILLANCE & CAMERA BACKEND       ")
    print("=" * 70)
    print(f"[*] Serving on:   http://{HOST}:{PORT}")
    print(f"[*] API Docs:     http://localhost:{PORT}/docs")
    print(f"[*] Live Cameras: http://localhost:{PORT}/api/v1/cameras")
    print(f"[*] Streaming:    http://localhost:{PORT}/api/v1/streaming/live/<camera_id>")
    print("=" * 70)

    uvicorn.run("backend.main:app", host=HOST, port=PORT, reload=False)

if __name__ == "__main__":
    main()
