# Deploying CyberVision-AI Backend to Render

This backend is pre-configured for one-click deployment on [Render](https://render.com).

---

## Deployment Steps

### Option A: Using Web Service UI (Manual)
1. Go to your **[Render Dashboard](https://dashboard.render.com/)**.
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository: `adinahawaldar/CyberVision-AI`.
4. Configure the service settings:
   - **Name**: `cybervision-ai-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: `Free`
5. Under **Environment Variables**, add (optional / defaults are included):
   - `PORT`: `10000` (Render assigns `$PORT` automatically)
   - `HOST`: `0.0.0.0`
   - `YOLO_MODEL`: `yolov8n.pt`
   - `DETECTION_CONFIDENCE`: `0.45`
   - `DETECTION_FPS_LIMIT`: `25`
6. Click **Deploy Web Service**.

---

### Option B: Using Render Blueprint (`render.yaml`)
1. In Render Dashboard, click **New +** -> **Blueprint**.
2. Connect this repository. Render will automatically detect [backend/render.yaml](file:///d:/CyberVision-AI/backend/render.yaml) and configure the build and start commands.
3. Click **Apply**.

---

## Verifying Deployment
Once deployed, test your live Render URL:
- **Root Health**: `https://<your-render-url>.onrender.com/`
- **Swagger API Docs**: `https://<your-render-url>.onrender.com/docs`
- **Cameras Endpoint**: `https://<your-render-url>.onrender.com/api/v1/cameras`
- **Health Check**: `https://<your-render-url>.onrender.com/api/v1/health`
