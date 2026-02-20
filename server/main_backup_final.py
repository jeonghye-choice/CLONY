from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import uvicorn
import os

app = FastAPI()

# --- CORS Setup ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for mobile dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Database Setup ---
DB_NAME = "clony.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    # Create Users Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            email TEXT PRIMARY KEY,
            password TEXT NOT NULL,
            nickname TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# --- Pydantic Models ---
class UserSignup(BaseModel):
    email: str
    password: str
    nickname: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    nickname: str
    message: str

# --- Kakao OAuth ---
from auth_kakao import KakaoAuthRequest, kakao_oauth_login

# --- Endpoints ---

@app.get("/")
def read_root():
    return {"message": "Clony Backend is Running!"}

# Register Kakao OAuth endpoint
@app.post("/auth/kakao")
async def kakao_login_endpoint(request: KakaoAuthRequest):
    return await kakao_oauth_login(request)

@app.post("/signup", response_model=UserResponse)
def signup(user: UserSignup):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    
    try:
        # Check if email exists
        c.execute("SELECT * FROM users WHERE email=?", (user.email,))
        if c.fetchone():
            raise HTTPException(status_code=400, detail="이미 가입된 이메일입니다.")

        # Check if nickname exists
        c.execute("SELECT * FROM users WHERE nickname=?", (user.nickname,))
        if c.fetchone():
            raise HTTPException(status_code=400, detail="이미 사용 중인 닉네임입니다.")

        # Insert User (In production, hash the password!)
        c.execute("INSERT INTO users (email, password, nickname) VALUES (?, ?, ?)", 
                  (user.email, user.password, user.nickname))
        conn.commit()
        return {"nickname": user.nickname, "message": "회원가입 성공"}
        
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/login", response_model=UserResponse)
def login(user: UserLogin):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    
    # Check credentials
    c.execute("SELECT nickname FROM users WHERE email=? AND password=?", (user.email, user.password))
    row = c.fetchone()
    conn.close()
    
    if row:
        return {"nickname": row[0], "message": "로그인 성공"}
    else:
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 잘못되었습니다.")

import shutil
import random
import cv2
import numpy as np
import mediapipe as mp
import gc

# MediaPipe Setup
try:
    import mediapipe.solutions.face_mesh as mp_face_mesh
    import mediapipe.solutions.drawing_utils as mp_drawing
except (ImportError, ModuleNotFoundError):
    try:
        import mediapipe.python.solutions.face_mesh as mp_face_mesh
        import mediapipe.python.solutions.drawing_utils as mp_drawing
    except (ImportError, ModuleNotFoundError):
        import mediapipe as mp
        mp_face_mesh = mp.solutions.face_mesh
        mp_drawing = mp.solutions.drawing_utils

face_mesh = mp_face_mesh.FaceMesh(
    static_image_mode=True,
    max_num_faces=1,
    refine_landmarks=False,
    min_detection_confidence=0.5
)

def image_quality_check(image):
    """
    Check image brightness and blurriness.
    Returns: (is_valid, message, score_dict)
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # 1. Brightness Check
    avg_brightness = np.mean(gray)
    if avg_brightness < 40:
        return False, "조명이 너무 어둡습니다. 밝은 곳에서 촬영해주세요.", {"brightness": int(avg_brightness)}
    if avg_brightness > 220:
        return False, "조명이 너무 밝습니다. 적절한 조명에서 촬영해주세요.", {"brightness": int(avg_brightness)}

    # 2. Blur Check (Laplacian Variance)
    blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()
    if blur_score < 100: # Threshold can be adjusted
        return False, "사진이 흔들렸습니다. 카메라를 고정하고 촬영해주세요.", {"blur": int(blur_score)}

    return True, "O.K.", {"brightness": int(avg_brightness), "blur": int(blur_score)}

def optimize_for_mobile(image, max_dimension=800):
    """
    Simulate 8-bit quantization optimization for low-end device support.
    1. Resize image if too large (reduces memory/cpu usage).
       - 800px is the sweet spot: preserves pores/wrinkles but saves ~40% more memory than 1024px.
    2. Force convert to uint8 (8-bit integer) to ensure efficient processing.
    """
    h, w = image.shape[:2]
    
    # 1. Resize Optimization
    if max(h, w) > max_dimension:
        scale = max_dimension / max(h, w)
        new_w, new_h = int(w * scale), int(h * scale)
        image = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)
        print(f"Quantization Optimization: Resized to {new_w}x{new_h} (Target: {max_dimension}px)")

    # 2. 8-bit Quantization (Force uint8)
    image = image.astype(np.uint8)
    
    return image

def analyze_face_pose(image):
    """
    Analyze face using MediaPipe: Check if face exists and head pose (frontal).
    Returns: (is_valid, message, cropped_image, landmarks_info)
    """
    # Optimize before MediaPipe
    optimized_image = optimize_for_mobile(image)

    results = face_mesh.process(cv2.cvtColor(optimized_image, cv2.COLOR_BGR2RGB))
    
    if not results.multi_face_landmarks:
        return False, "얼굴을 찾을 수 없습니다. 얼굴이 잘 보이도록 촬영해주세요.", None, None

    landmarks = results.multi_face_landmarks[0].landmark
    h, w, _ = optimized_image.shape

    # Smart Crop: Get Bounding Box from Landmarks
    x_min, y_min = w, h
    x_max, y_max = 0, 0
    
    for lm in landmarks:
        x, y = int(lm.x * w), int(lm.y * h)
        if x < x_min: x_min = x
        if x > x_max: x_max = x
        if y < y_min: y_min = y
        if y > y_max: y_max = y
    
    # Add padding (e.g., 20% on each side)
    pad_x = int((x_max - x_min) * 0.2)
    pad_y = int((y_max - y_min) * 0.3) # More padding on top/bottom
    
    x_min = max(0, x_min - pad_x)
    y_min = max(0, y_min - pad_y)
    x_max = min(w, x_max + pad_x)
    y_max = min(h, y_max + pad_y)
    
    cropped_image = optimized_image[y_min:y_max, x_min:x_max]
    
    # TODO: Calculate Head Pose (Yaw, Pitch) if stricter validation is needed.
    # For now, if landmarks are detected, we assume it's a face.
    
    # Draw Landmarks on the image for visualization
    debug_image = optimized_image.copy()
    
    # Simple drawing without styles to avoid API compatibility issues
    mp_drawing.draw_landmarks(
        image=debug_image,
        landmark_list=results.multi_face_landmarks[0],
        connections=mp_face_mesh.FACEMESH_TESSELATION,
        landmark_drawing_spec=mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=1, circle_radius=1),
        connection_drawing_spec=mp_drawing.DrawingSpec(color=(0, 200, 0), thickness=1))
    
    mp_drawing.draw_landmarks(
        image=debug_image,
        landmark_list=results.multi_face_landmarks[0],
        connections=mp_face_mesh.FACEMESH_CONTOURS,
        landmark_drawing_spec=None,
        connection_drawing_spec=mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2))

    # Crop the DEBUG image too
    cropped_debug_image = debug_image[y_min:y_max, x_min:x_max]

    return True, "얼굴 감지 성공", cropped_image, cropped_debug_image, {"landmarks_count": len(landmarks)}


@app.post("/analyze")
async def analyze_skin(file: UploadFile = File(...)):
    # 1. Read file into memory
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if image is None:
        raise HTTPException(status_code=400, detail="이미지 파일을 읽을 수 없습니다.")

    # 2. CNN/Image Processing Checks
    # Quality Check
    is_valid_quality, msg_quality, quality_scores = image_quality_check(image)
    if not is_valid_quality:
        # We can return a specific error code or just a 400 with the message
        return {
            "score": 0,
            "message": f"분석 실패: {msg_quality}",
            "error_type": "QUALITY_CHECK_FAILED",
            "details": quality_scores
        }

    # Face Analysis & Cropping
    is_valid_face, msg_face, cropped_image, debug_image, face_info = analyze_face_pose(image)
    if not is_valid_face:
        return {
            "score": 0,
            "message": f"분석 실패: {msg_face}",
            "error_type": "FACE_DETECTION_FAILED"
        }

    # Save the CROPPED image for Gemini
    if not os.path.exists("uploads"):
        os.makedirs("uploads")
    
    # Use original filename but maybe prepend 'processed_'
    file_path = f"uploads/processed_{file.filename}"
    cv2.imwrite(file_path, cropped_image)
    
    # 3. AI Analysis using Gemini (on the cropped, high-quality face)
    try:
        import google.generativeai as genai
        
        # NOTE: You must provide a valid API KEY here!
        API_KEY = "AIzaSyAzVmdbMG64EkOHsGdyQIaeNsSuGx-VvDc"
        
        if API_KEY == "YOU_MUST_ENTER_YOUR_API_KEY_HERE":
             print("Warning: No API Key provided. Using Mock Data.")
             raise Exception("No API Key")

        genai.configure(api_key=API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash')

        # Load PROCESSED image
        img = genai.upload_file(file_path)

        prompt = """
        Analyze this closeup skin photo for a dermatology app. 
        Provide a JSON response with the following integer scores (0-100, where higher usually means 'more' of that trait, but for score higher is better skin health):
        
        - "score": Overall Skin Health Score (0-100, 100 is best)
        - "moisture": Moisture Level (0-100, 100 is very hydrated)
        - "oiliness": Oiliness Level (0-100, 100 is very oily)
        - "pores": Pore Visibility/Size (0-100, 100 is very enlarged pores, 0 is invisible)
        - "sensitivity": Redness/Sensitivity (0-100, 100 is very sensitive/red)
        - "glasses": Boolean, true if wearing GLASSES or Sunglasses. Be STRICT.
        - "bangs": Boolean, true if hair (bangs) is covering the forehead.
        - "lighting": Integer (0-100), 0 is pitch black, 100 is perfect studio lighting.

        Also determine the "type" (e.g. "지성 (Oily)", "건성 (Dry)", "복합성 (Combination)", "민감성 (Sensitive)").
        And a list of "concerns" (e.g. ["모공", "수분 부족"]).
        And a detailed "description" (Korean, polite tone, 2-3 sentences. Explain the skin condition specifically. ex: 'Please manage the T-zone oiliness...', 'The pores on the cheeks are...').
        
        JSON Format:
        {
            "score": 85,
            "moisture": 70,
            "oiliness": 40,
            "pores": 30,
            "sensitivity": 20,
            "glasses": false,
            "bangs": false,
            "lighting": 80,
            "type": "복합성",
            "concerns": ["모공"],
            "description": "전반적으로 수분은 양호하지만, 코와 이마 주변의 모공이 다소 넓어져 있습니다. 유분 조절이 필요한 지성 피부에 가까우니 꼼꼼한 세안을 추천드려요.",
            "message": "분석 완료"
        }
        """

        response = model.generate_content([prompt, img])
        
        # Simple cleanup if the model returns markdown code blocks
        text_response = response.text.replace("```json", "").replace("```", "").strip()
        
        import json
        result = json.loads(text_response)
        
        # Append Quality Info to result if needed
        # Append Quality Info to result if needed
        result["quality_check"] = quality_scores
        
        # Add Debug Image (Base64)
        _, buffer = cv2.imencode('.jpg', debug_image)
        import base64
        img_str = base64.b64encode(buffer).decode('utf-8')
        result["debug_image"] = f"data:image/jpeg;base64,{img_str}"
        
        return result

    except Exception as e:
        print(f"Gemini Error (Falling back to mock): {e}")
        # Fallback Mock Data
        score = random.randint(60, 95)
        skin_types = ["지성 (Oily)", "건성 (Dry)", "복합성 (Combination)", "민감성 (Sensitive)"]
        selected_type = random.choice(skin_types)
        
        concerns = []
        if score < 80: concerns = ["모공", "수분 부족"]
        elif score < 90: concerns = ["피지"]
        else: concerns = ["없음 (완벽!)"]

        return {
            "score": score,
            "moisture": random.randint(40, 90),
            "oiliness": random.randint(20, 80),
            "pores": random.randint(10, 60),
            "sensitivity": random.randint(10, 50),
            "glasses": False,
            "lighting": 90,
            "type": selected_type,
            "concerns": concerns,
            "description": f"{selected_type} 피부입니다. 전반적으로 건강하지만 {concerns[0] if concerns else '특별한'} 관리가 필요할 수 있습니다.",
            "message": "AI 분석 완료 (체험 모드 - 에러 발생으로 모의 데이터)",
            "error": str(e)
        }
    finally:
        # 3. Privacy: Delete the file immediately after analysis
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"Privacy: Deleted {file_path}")
        
        # 4. Aggressive Memory Cleanup
        gc.collect()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
