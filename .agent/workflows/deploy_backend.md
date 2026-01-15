---
description: How to deploy the Clony Backend for public access
---

# Deploying Clony Backend

Currently, your server runs on your personal computer (`localhost` or `192.168...`). This means only devices on your **same Wi-Fi** can connect. To let other users (friends, public) use the app from anywhere, you must **deploy** the server to the cloud.

## Option 1: Quick Testing (Ngrok)
Use this if you just want to show a friend temporarily without setting up a full server.

1.  Download [ngrok](https://ngrok.com/).
2.  Run your local server: `python server/main.py`.
3.  Open a new terminal and run: `ngrok http 8000`.
4.  Copy the `https://....ngrok-free.app` URL.
5.  Update `API_URL` in `App.tsx` with this new URL.

## Option 2: Permanent Cloud Hosting (Render / Fly.io)
Use this for the real app release.

### Recommended: Render.com (Free Tier available)
1.  Push your code to **GitHub**.
2.  Sign up for [Render.com](https://render.com/).
3.  Create a **New Web Service**.
4.  Connect your GitHub repository.
5.  Settings:
    *   **Build Command**: `pip install -r requirements.txt`
    *   **Start Command**: `uvicorn server.main:app --host 0.0.0.0 --port 10000`
6.  Render will give you a public URL (e.g., `https://clony-backend.onrender.com`).
7.  Update `API_URL` in `App.tsx` to this new URL and publish your app!
