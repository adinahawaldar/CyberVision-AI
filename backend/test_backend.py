import sys
import asyncio
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

import httpx
from backend.main import app
from backend.services.camera_manager import camera_manager

async def run_tests():
    print("[*] Initializing camera streams for testing...", flush=True)
    camera_manager.initialize_stored_cameras()
    await asyncio.sleep(1.0) # Wait for initial frames to render

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        print("\n--- [1] Testing Root Endpoint ---", flush=True)
        r = await client.get("/")
        assert r.status_code == 200, f"Root failed: {r.text}"
        print("✓ Root endpoint:", r.json(), flush=True)
        
        print("\n--- [2] Testing Users & Roles ---", flush=True)
        r = await client.get("/api/v1/users/roles")
        assert r.status_code == 200
        roles = r.json()
        assert "Admin" in roles or "Worker" in roles or "Employee" in roles
        print("✓ User roles:", roles, flush=True)
        
        r = await client.get("/api/v1/users/profiles")
        assert r.status_code == 200
        profiles = r.json()
        assert len(profiles) > 0
        print(f"✓ Profiles count: {len(profiles)} - sample: {profiles[0]['username']} ({profiles[0]['role']})", flush=True)

        print("\n--- [3] Testing Cameras ---", flush=True)
        r = await client.get("/api/v1/cameras")
        assert r.status_code == 200
        cameras = r.json()
        assert len(cameras) >= 3
        print(f"✓ Cameras count: {len(cameras)}", flush=True)
        for c in cameras:
            print(f"   - {c['id']}: {c['name']} (status={c['status']}, stream={c['stream_url']})", flush=True)

        print("\n--- [4] Testing Streaming & Snapshot ---", flush=True)
        r = await client.get("/api/v1/streaming/")
        assert r.status_code == 200
        print("✓ Stream status:", r.json(), flush=True)
        
        # Give snapshot another small moment if needed
        for _ in range(5):
            r = await client.get("/api/v1/streaming/snapshot/cam-synthetic-2")
            if r.status_code == 200:
                break
            await asyncio.sleep(0.5)

        assert r.status_code == 200
        assert r.headers["content-type"] == "image/jpeg"
        print(f"✓ Snapshot for cam-synthetic-2 returned {len(r.content)} bytes of JPEG", flush=True)

        print("\n--- [5] Testing Automation Rules ---", flush=True)
        r1 = await client.get("/api/v1/rules")
        r2 = await client.get("/api/v1/rules/")
        assert r1.status_code == 200 and r2.status_code == 200
        rules = r1.json()
        print(f"✓ Rules count: {len(rules)} (both /rules and /rules/ supported)", flush=True)

        print("\n--- [6] Testing Notifications / Alerts ---", flush=True)
        r = await client.get("/api/v1/notifications")
        assert r.status_code == 200
        notifs = r.json()
        print(f"✓ Notifications count: {len(notifs)}", flush=True)
        
        # Test creating a notification
        new_notif = {
            "title": "Automated Security Test Alert",
            "message": "Detection engine verified healthy.",
            "type": "info"
        }
        r = await client.post("/api/v1/notifications", json=new_notif)
        assert r.status_code == 200
        created_id = r.json()["id"]
        print(f"✓ Created notification: {created_id}", flush=True)
        
        # Test mark read
        r = await client.patch(f"/api/v1/notifications/{created_id}/read")
        assert r.status_code == 200
        assert r.json()["read"] == True
        print(f"✓ Notification marked read: {created_id}", flush=True)

        # Delete test notification
        r = await client.delete(f"/api/v1/notifications/{created_id}")
        assert r.status_code == 200
        print(f"✓ Notification deleted: {created_id}", flush=True)

        print("\n--- [7] Testing System Health ---", flush=True)
        r = await client.get("/api/v1/health")
        assert r.status_code == 200
        health = r.json()
        assert "cameras" in health and "servers" in health and "storage" in health
        print(f"✓ Health: CPU {health['servers']['cpu']['usage']}%, RAM {health['servers']['memory']['usagePercentage']}%, Cameras {health['cameras']['online']}/{health['cameras']['total']}", flush=True)

        print("\n--- [8] Testing Contextual AI Assistant Query ---", flush=True)
        r = await client.post("/api/v1/contextual/query", json={
            "camera_id": "cam-synthetic-2",
            "query": "Is there any threat or suspicious activity?"
        })
        assert r.status_code == 200
        ai_resp = r.json()
        print(f"✓ AI response (success={ai_resp['success']}): {ai_resp.get('response')}", flush=True)

        print("\n========================================================", flush=True)
        print("   ALL 8 BACKEND TEST SUITES PASSED SUCCESSFULLY!   ", flush=True)
        print("========================================================", flush=True)

    # Clean stop cameras
    for cam_id in list(camera_manager.captures.keys()):
        camera_manager.stop_stream(cam_id)

if __name__ == "__main__":
    asyncio.run(run_tests())
