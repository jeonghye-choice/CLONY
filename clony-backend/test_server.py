from fastapi import FastAPI
import uvicorn
import mediapipe as mp
import os

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Clony Backend is Running!", "mediapipe": str(mp.__version__)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
