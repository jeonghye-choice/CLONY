---
description: How to setup and run the Clony Python Backend
---

# Run Clony Backend Server

This workflow will help you set up the Python environment and run the FastAPI server for the Clony app.

## 1. Install Python
If you haven't already, download and install Python from [python.org](https://www.python.org/downloads/).
*   **Important**: During installation, check the box **"Add Python to PATH"**.

## 2. Check Python Installation
Open a new terminal and run:
```bash
python --version
```
If you see a version number (e.g., `Python 3.11.x`), you are ready.

## 3. Install Dependencies
Install the required libraries (`fastapi`, `uvicorn`, `multipart`) using pip:

```bash
pip install fastapi uvicorn python-multipart
```

## 4. Run the Server
Navigate to the `clony-mobile` folder and run the server:

```bash
# Make sure you are in 'clony-mobile' directory
python server/main.py
```

You should see output like:
`INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)`

## 5. Verify
Open `http://localhost:8000` in your browser. You should see `{"message": "Clony Backend is Running!"}`.
