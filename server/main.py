from fastapi import FastAPI, HTTPException, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import uvicorn
import os
import requests
import xml.etree.ElementTree as ET
import difflib
import unicodedata
from auth_kakao import KakaoAuthRequest, kakao_oauth_login
from auth_google import GoogleAuthRequest, google_oauth_login

# ============================================================
# API Config
# ============================================================
COSMETICS_API_KEY = "1e21b6e85e900ad61362755eb97c595b60d86b4e19b51958a9b39345323b613a"
COSMETICS_API_URL = "https://apis.data.go.kr/1471000/CsmtcsIngdCpntInfoService01/getCsmtcsIngdCpntList"

# Unified Google API Key (for Gemini & Cloud Vision)
# Updated to the known working key from analyze_skin
GOOGLE_API_KEY = "AIzaSyAzVmdbMG64EkOHsGdyQIaeNsSuGx-VvDc"


# EasyOCR Setup (Optional)
try:
    import easyocr
    import difflib # For similarity matching
    # Initialize Reader once (GPU/CPU automatic)
    print("[EasyOCR] Loading model... (This may take a while on first run)")
    # reader = easyocr.Reader(['ko', 'en']) # Deferred initialization to prevent timeout
    EASYOCR_AVAILABLE = True
    print("[EasyOCR] Model loaded successfully (Lazy Init).")
except Exception as e:
    EASYOCR_AVAILABLE = False
    print(f"[EasyOCR] Initialization failed: {e}. Falling back to Gemini Vision.")

app = FastAPI()

@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"[DEBUG] Incoming: {request.method} {request.url}")
    return await call_next(request)

# --- CORS Setup ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    
    # Create Ingredients Table (Caching MFDS Data)
    c.execute('''
        CREATE TABLE IF NOT EXISTS ingredients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            name_en TEXT,
            cas_no TEXT,
            category TEXT,
            effect TEXT,
            description TEXT,
            good_for TEXT, -- JSON string: ["건성", "민감성"]
            caution TEXT,
            synergy TEXT, -- JSON string: ["성분1", "성분2"]
            conflict TEXT, -- JSON string: ["성분3"]
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # --- Recreate Products Table with New Schema ---
    # DROP table to enforce new schema (Prototype only)
    c.execute("DROP TABLE IF EXISTS products")
    
    c.execute('''
        CREATE TABLE products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,          -- Product_Name
            brand TEXT NOT NULL,         -- Brand
            category TEXT,               -- Category
            price INTEGER,
            original_price INTEGER,
            image_url TEXT,
            all_ingredients TEXT,        -- All_Ingredients (Comma separated)
            key_ingredients TEXT,        -- Key_Ingredients (JSON Array)
            ewg_grade INTEGER,           -- EWG_Grade
            skin_type_fit TEXT,          -- Skin_Type_Fit (JSON: {To: 'Good', Dry: 'Caution'})
            caution_notes TEXT,          -- Caution_Notes
            matching_score INTEGER DEFAULT 0
        )
    ''')
    
    conn.commit()
    conn.close()
    
    # Insert Initial Data
    insert_initial_products()

def insert_initial_products():
    import json
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    
    # Check if empty
    c.execute("SELECT count(*) FROM products")
    if c.fetchone()[0] > 0:
        conn.close()
        return

    products = [
        # 1. 보습/장벽
        {
            "name": "에스트라 아토베리어 365 크림",
            "brand": "AESTURA",
            "category": "크림",
            "price": 31000,
            "image_url": "https://image.oliveyoung.co.kr/uploads/images/goods/550/10/0000/0014/A00000014553205ko.jpg",
            "all_ingredients": "정제수, 글리세린, 부틸렌글라이콜, 세라마이드엔피, 콜레스테롤, 스테아릭애씨드, ...",
            "key_ingredients": ["세라마이드엔피", "콜레스테롤", "지방산"],
            "ewg_grade": 1,
            "skin_type_fit": {"OSNW": "Good", "DSNT": "Best", "DRNW": "Good"},
            "caution_notes": ""
        },
        {
            "name": "라운드랩 자작나무 수분 선크림",
            "brand": "ROUND LAB",
            "category": "선케어",
            "price": 25000,
            "image_url": "https://image.oliveyoung.co.kr/uploads/images/goods/550/10/0000/0014/A00000014902613ko.jpg",
            "all_ingredients": "정제수, 자작나무수액, 등등...",
            "key_ingredients": ["자작나무수액", "히알루론산", "나이아신아마이드"],
            "ewg_grade": 1,
            "skin_type_fit": {"OSNW": "Good", "DRPT": "Good"},
            "caution_notes": "유기자차 성분 주의"
        },
        # 2. 진정/트러블
        {
            "name": "아누아 어성초 77% 진정 토너",
            "brand": "ANUA",
            "category": "토너",
            "price": 30500,
            "image_url": "https://image.oliveyoung.co.kr/uploads/images/goods/550/10/0000/0014/A00000014496701ko.jpg",
            "all_ingredients": "약모밀추출물(77%), 정제수, 1,2-헥산다이올, ...",
            "key_ingredients": ["약모밀추출물", "판테놀"],
            "ewg_grade": 1,
            "skin_type_fit": {"OSNT": "Best", "OSPT": "Best"},
            "caution_notes": ""
        },
        {
            "name": "토리든 다이브인 세럼",
            "brand": "Torriden",
            "category": "세럼",
            "price": 22000,
            "image_url": "https://image.oliveyoung.co.kr/uploads/images/goods/550/10/0000/0013/A00000013718012ko.jpg",
            "all_ingredients": "정제수, 부틸렌글라이콜, 글리세린, 소듐하이알루로네이트, 판테놀, 마데카소사이드...",
            "key_ingredients": ["소듐하이알루로네이트", "판테놀", "마데카소사이드"],
            "ewg_grade": 1,
            "skin_type_fit": {"DSNT": "Best", "OSNT": "Good"},
            "caution_notes": ""
        },
        {
            "name": "메디힐 마데카소사이드 흔적 패드",
            "brand": "MEDIHEAL",
            "category": "패드",
            "price": 26000,
            "image_url": "https://image.oliveyoung.co.kr/uploads/images/goods/550/10/0000/0015/A00000015525305ko.jpg",
            "all_ingredients": "정제수, 마데카소사이드, 나이아신아마이드...",
            "key_ingredients": ["마데카소사이드", "나이아신아마이드"],
            "ewg_grade": 2,
            "skin_type_fit": {"OSPT": "Best", "OSNT": "Good"},
            "caution_notes": ""
        },
        # 3. 기능성/영양
        {
            "name": "넘버즈인 3번 보들보들 결 세럼",
            "brand": "numbuzin",
            "category": "세럼",
            "price": 28000,
            "image_url": "https://image.oliveyoung.co.kr/uploads/images/goods/550/10/0000/0014/A00000014457601ko.jpg",
            "all_ingredients": "비피다발효용해물, 갈락토미세스발효여과물...",
            "key_ingredients": ["비피다발효용해물", "갈락토미세스발효여과물"],
            "ewg_grade": 2,
            "skin_type_fit": {"DRNW": "Best", "DRNT": "Good"},
            "caution_notes": "발효 성분 알러지 주의"
        },
        # 4. 미스트 (User Requested)
        {
            "name": "닥터자르트 시카페어 페이셜 카밍 미스트",
            "brand": "Dr.Jart+",
            "category": "미스트",
            "price": 11000,
            "original_price": 22000,
            "image_url": "https://image.oliveyoung.co.kr/uploads/images/goods/550/10/0000/0014/A00000014660101ko.jpg",
            "all_ingredients": "정제수, 프로판다이올, 병풀추출물, 마데카소사이드, 카라기난추출물, 사탕수수추출물, 라벤더오일, 로즈마리잎오일, 왕귤껍질오일, 캐모마일꽃오일, 해수, 초피나무열매추출물, 서양톱풀추출물, 성모초추출물, 트루로즈오브예리코추출물, 말로우추출물, 레몬밤잎추출물, 페퍼민트잎추출물, 카우슬립추출물, 꼬리풀추출물, 어성초추출물, 락토바실러스발효물, 제충국꽃추출물, 레몬유칼립투스오일, 글리세린, 부틸렌글라이콜, 폴리글리세릴-2올리에이트, 피이지-60하이드로제네이티드캐스터오일, 디프로필렌글라이콜, 옥틸도데세스-16, 디포타슘글리시리제이트, 시트릭애씨드, 판테놀, 아시아티코사이드, 소듐피씨에이, 아시아틱애씨드, 하이드로제네이티드레시틴, 마데카식애씨드, 마그네슘피씨에이, 1,2-헥산다이올, 징크피씨에이, 피이지-40하이드로제네이티드캐스터오일, 망가니즈피씨에이, 소듐하이알루로네이트, 페녹시에탄올, 포타슘소르베이트, 디소듐이디티에이, 리모넨, 리날룰",
            "key_ingredients": ["병풀추출물", "마데카소사이드", "판테놀"],
            "ewg_grade": 1,
            "skin_type_fit": {"OSNW": "Best", "OSPT": "Best", "DSNT": "Good"},
            "caution_notes": "에센셜 오일 함유로 민감성 피부 주의"
        }
    ]

    for p in products:
        c.execute('''
            INSERT INTO products (name, brand, category, price, original_price, image_url, all_ingredients, key_ingredients, ewg_grade, skin_type_fit, caution_notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            p["name"], p["brand"], p["category"], p["price"], p.get("original_price"), p["image_url"],
            p["all_ingredients"], json.dumps(p["key_ingredients"], ensure_ascii=False),
            p["ewg_grade"], json.dumps(p["skin_type_fit"], ensure_ascii=False),
            p["caution_notes"]
        ))
    
    conn.commit()
    conn.close()
    print("[DB] Initial Product Data Injected.")


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

@app.post("/auth/kakao")
async def auth_kakao(request: KakaoAuthRequest):
    return await kakao_oauth_login(request)

@app.post("/auth/google")
async def auth_google(request: GoogleAuthRequest):
    return await google_oauth_login(request)

import shutil
import random
import cv2
import numpy as np
import mediapipe as mp
import gc

# MediaPipe Setup (Deferred)
_face_mesh_instance = None

def get_face_mesh_v2():
    global _face_mesh_instance
    if _face_mesh_instance is not None:
        return _face_mesh_instance
        
    try:
        from mediapipe.python.solutions import face_mesh as mp_face_mesh
    except (ImportError, ModuleNotFoundError, AttributeError):
        import mediapipe.solutions.face_mesh as mp_face_mesh
        
    _face_mesh_instance = mp_face_mesh.FaceMesh(
        static_image_mode=True,
        max_num_faces=1,
        refine_landmarks=False,
        min_detection_confidence=0.5
    )
    return _face_mesh_instance

def get_mp_drawing():
    try:
        from mediapipe.python.solutions import drawing_utils as mp_drawing
    except (ImportError, ModuleNotFoundError, AttributeError):
        import mediapipe.solutions.drawing_utils as mp_drawing
    return mp_drawing

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


# ============================================================
# EasyOCR & Similarity Matching Logic
# ============================================================

# Standard Ingredient Dictionary with Rich Metadata
STANDARD_INGREDIENTS_DATA = {
    "정제수": {"nameEn": "Water", "effect": "보습, 용제", "description": "가장 기본이 되는 성분으로 다른 성분들을 용해시킵니다.", "goodFor": ["모든 피부"], "caution": "특이사항 없음"},
    "글리세린": {"nameEn": "Glycerin", "effect": "보습, 피부 보호", "description": "강력한 보습 효과로 피부를 촉촉하게 유지합니다.", "goodFor": ["건성 피부", "모든 피부"], "caution": "고농도 사용 시 끈적임이나 개인에 따른 일시적 자극이 있을 수 있습니다."},
    "부틸렌글라이콜": {"nameEn": "Butylene Glycol", "effect": "보습, 점도 조절", "description": "피부 보습력을 높이고 발림성을 개선합니다.", "goodFor": ["건성 피부"], "caution": "민감성 피부는 발진 등 자극이 있을 수 있으며, 여드름성 피부는 모공 막힘에 주의하세요."},
    "프로판다이올": {"nameEn": "Propanediol", "effect": "보습, 용매", "description": "옥수수 유래 천연 보습 성분으로 피부를 촉촉하게 유지합니다.", "goodFor": ["민감성 피부"], "caution": "천연 유래 성분이나 드물게 피부 자극이나 알레르기 반응이 나타날 수 있습니다."},
    "나이아신아마이드": {"nameEn": "Niacinamide", "effect": "미백, 장벽 강화", "description": "피부 톤 개선과 장벽 강화에 도움을 줍니다.", "goodFor": ["모든 피부", "미백 필요"], "caution": "고농도 사용 시 일시적 따가움이나 붉어짐이 있을 수 있습니다. 비타민 C와 혼용 시 자극에 주의하세요."},
    "1,2-헥산다이올": {"nameEn": "1,2-Hexanediol", "effect": "보존제, 보습", "description": "화장품 변질을 방지하고 보습 효과를 제공합니다.", "goodFor": ["모든 피부"], "caution": "자극이 매우 적으나 드물게 접촉성 피부염 반응이 있을 수 있습니다."},
    "판테놀": {"nameEn": "Panthenol", "effect": "진정, 재생", "description": "피부 진정과 손상된 장벽 회복에 도움을 줍니다.", "goodFor": ["민감성 피부", "손상 피부"], "caution": "드물게 가려움, 알레르기 반응이 있을 수 있으므로 민감성 피부는 패치 테스트를 권장합니다."},
    "소듐하이알루로네이트": {"nameEn": "Sodium Hyaluronate", "effect": "강력 보습", "description": "히알루론산의 일종으로 수분 유실을 방지합니다.", "goodFor": ["건성 피부", "수부지"], "caution": "대체로 안전하나 개인의 체질에 따라 가려움이나 발진이 나타날 수 있습니다."},
    "알란토인": {"nameEn": "Allantoin", "effect": "진정, 보호", "description": "피부 자극을 완화하고 피부를 보호합니다.", "goodFor": ["민감성 피부"], "caution": "드물게 화끈거림이나 따가움이 있을 수 있으므로 사용 전 패치 테스트를 권장합니다."},
    "베타인": {"nameEn": "Betaine", "effect": "보습, 진정", "description": "유수분 밸런스를 맞추고 자극을 완화합니다.", "goodFor": ["건성 피부"], "caution": "대체로 안전하지만 특정 피부 유형에서 경미한 자극이 나타날 수 있습니다."},
    "아데노신": {"nameEn": "Adenosine", "effect": "주름 개선", "description": "피부 탄력을 높이고 주름 개선에 도움을 줍니다.", "goodFor": ["탄력 저하 피부"], "caution": "안전한 성분이나 민감한 피부의 경우 붉어짐이나 각질 부각이 있을 수 있습니다."},
    "세라마이드엔피": {"nameEn": "Ceramide NP", "effect": "장벽 강화", "description": "피부 지질층과 유사하여 장벽을 튼튼하게 합니다.", "goodFor": ["건성 피부", "민감성 피부"], "caution": "피부 장벽 성분이나 드물게 발적, 가려움 등 알레르기 반응이 있을 수 있습니다."},
    "병풀추출물": {"nameEn": "Centella Asiatica Extract", "effect": "진정, 재생", "description": "자극받은 피부를 진정시키고 상처 회복을 돕습니다.", "goodFor": ["민감성 피부", "트러블 피부"], "caution": "진정 효과가 뛰어나지만 고농도 제품 사용 시 개인에 따라 트러블이나 가려움이 있을 수 있습니다."},
    "마데카소사이드": {"nameEn": "Madecassoside", "effect": "진정, 보호", "description": "병풀 유래 성분으로 강력한 진정 효과가 있습니다.", "goodFor": ["민감성 피부"], "caution": "병풀 유래 성분으로 안전하지만 민감성 피부는 사용 초기 반응을 살피는 것이 좋습니다."},
    "티트리잎오일": {"nameEn": "Tea Tree Leaf Oil", "effect": "항균, 진정", "description": "피지 조절과 트러블 진정에 도움을 줍니다.", "goodFor": ["지성 피부", "여드름성 피부"], "caution": "고농도 사용 시 피부 자극이 강할 수 있으니 반드시 희석하여 사용하고 원액 접촉을 피하세요."},
    "시어버터": {"nameEn": "Shea Butter", "effect": "영양 공급, 보습", "description": "풍부한 영양을 공급하고 보호막을 형성합니다.", "goodFor": ["극건성 피부"], "caution": "보습력이 높으나 여드름성 피부는 모공을 막아 트러블을 유발할 수 있으니 주의하세요."},
    "스쿠알란": {"nameEn": "Squalane", "effect": "보습, 피지 조절", "description": "피부 지질과 유사해 흡수가 빠르고 번들거림이 적습니다.", "goodFor": ["모든 피부"], "caution": "안전성이 높으나 타 성분과 조합 시 드물게 여드름이나 가려움증을 유발할 수 있습니다."},
    "살리실릭애씨드": {"nameEn": "Salicylic Acid", "effect": "각질 제거, 피지 조절", "description": "모공 속 피지를 녹여 트러블을 예방합니다 (BHA).", "goodFor": ["지성 피부", "여드름성 피부"], "caution": "각질 제거 성분으로 따가움, 건조함, 붉어짐을 유발할 수 있습니다. 낮 사용 시 자외선 차단이 필수입니다."},
    "글라이콜릭애씨드": {"nameEn": "Glycolic Acid", "effect": "각질 제거, 톤 개선", "description": "피부 표면의 각질을 제거하여 결을 매끄럽게 합니다 (AHA).", "goodFor": ["건성 피부", "거친 피부"], "caution": "피부 민감도를 높여 따가움이나 발적을 유발할 수 있습니다. 사용 기간 중 자외선 차단제를 반드시 병행하세요."},
    "비타민C": {"nameEn": "Vitamin C (Ascorbic Acid)", "effect": "미백, 항산화", "description": "멜라닌 색소 생성을 억제하고 생기를 부여합니다.", "goodFor": ["칙칙한 피부"], "caution": "빛과 열에 취약하여 갈변에 주의해야 하며, 낮 사용 시 자외선 차단이 필수입니다. 고농도 시 따가울 수 있습니다."},
    "토코페롤": {"nameEn": "Tocopherol", "effect": "항산화, 보습", "description": "피부 산화를 방지하고 보습을 돕습니다 (비타민 E).", "goodFor": ["모든 피부"], "caution": "항산화에 좋으나 지성 피부는 과도한 유분으로 인해 모공이 막힐 수 있으니 주의하세요."}
}
# STANDARD_INGREDIENTS list created after INGREDIENT_EFFECTS is defined below


def search_ingredient_from_api(query_text: str):
    """
    Search ingredient from Korean Public Data Portal API (Or use requests).
    Returns: dict or None
    """
    try:
        # The API usually requires URL encoded service key if using requests params, 
        # BUT this specific portal often needs the decoded key passed and let requests encode it,
        # OR passed as part of the URL string if it's already encoded.
        # The key in config is 'decoded' (usually). If it ends with '=', it might be base64/encoded.
        # Let's try standard requests usage first.
        
        # NOTE: public data portal keys are tricky. 
        # If we get SERVICE_KEY_IS_NOT_REGISTERED_ERROR, we might need to use the 'decoding' key.
        # However, the user provided one specific key.
        
        # Try with the key as is first. Many APIs on the portal are picky about double encoding.
        params = {
            "serviceKey": COSMETICS_API_KEY, 
            "pageNo": 1,
            "numOfRows": 10,
            "type": "json",
            "ingdName": query_text
        }
        
        print(f"[API] Searching for: {query_text}")
        response = requests.get(COSMETICS_API_URL, params=params, timeout=5)
        # print(f"[API] URL: {response.url}")
        # print(f"[API] Status: {response.status_code}")
        
        # Check if response is JSON (ideal)
        try:
            data = response.json()
            # The structure is often ['response']['body']['items']['item'] if it's a list
            # or ['response']['body']['items'] could be empty or a list
            body = data.get('response', {}).get('body', {})
            items = body.get('items', [])
            
            if isinstance(items, dict): # Sometimes 'items' is {'item': [...]}
                items = items.get('item', [])
            
            if isinstance(items, dict): # If only one item, it might be a dict not a list
                items = [items]

            if items:
                print(f"[API] Found {len(items)} items for '{query_text}'")
                return items[0]
        except (ValueError, KeyError) as e:
            # Fallback: XML Parsing
            print(f"[API] JSON parse failed or empty, checking XML...")
            try:
                root = ET.fromstring(response.content)
                # Check for error messages in XML
                return_msg = root.findtext(".//returnAuthMsg") or root.findtext(".//errMsg")
                if return_msg:
                    print(f"[API] Error Msg: {return_msg}")
                
                item = root.find(".//item")
                if item:
                    return {
                        "ingdName": item.findtext("ingdName"),
                        "casNo": item.findtext("casNo"),
                        "originMjrKoraNm": item.findtext("originMjrKoraNm")
                    }
            except ET.ParseError:
                pass
                
        return None
        
    except Exception as e:
        print(f"[API] Search Error for '{query_text}': {e}")
        return None

def correct_ingredient_name(text: str) -> str:
    """
    유사도 매칭을 통해 오타를 보정합니다. (1차: 로컬 DB, 2차: 공공 API)
    """
    # 0. Common OCR Character Mappings (Heuristic)
    char_map = {
        '0': 'o', '1': 'i', '2': 'z', '5': 's', '8': 'b',
        '|': 'i', '[': 'i', ']': 'i', '{': '(', '}': ')',
        '!': 'i'
    }
    mapped_text = "".join([char_map.get(c, c) for c in text.lower()])

    # 1. Local Fuzzy Match
    matches = difflib.get_close_matches(mapped_text, STANDARD_INGREDIENTS, n=1, cutoff=0.7)
    if matches:
        return matches[0]
        
    # 2. Public API Search (If local match fails and text is long enough)
    if len(text) >= 2:
        api_result = search_ingredient_from_api(mapped_text)
        if api_result:
             korean_name = api_result.get('ingdName')
             if korean_name:
                 print(f"[API] Found '{text}' -> '{korean_name}'")
                 if korean_name not in STANDARD_INGREDIENTS:
                    STANDARD_INGREDIENTS.append(korean_name) 
                 return korean_name

    return mapped_text

def run_google_vision_ocr(image_bytes: bytes) -> dict:
    """
    Google Cloud Vision API를 사용하여 고정밀 OCR을 수행합니다.
    """
    import base64
    import json
    import re
    
    encoded_image = base64.b64encode(image_bytes).decode('utf-8')
    url = f"https://vision.googleapis.com/v1/images:annotate?key={GOOGLE_API_KEY}"
    
    payload = {
        "requests": [
            {
                "image": {"content": encoded_image},
                "features": [{"type": "TEXT_DETECTION"}]
            }
        ]
    }
    
    try:
        print("[Google Vision] API 요청 중...")
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        responses = data.get('responses', [])
        if not responses or 'textAnnotations' not in responses[0]:
            print("[Google Vision] 텍스트가 감지되지 않았습니다.")
            return None
            
        full_text = responses[0]['textAnnotations'][0]['description']
        print(f"[Google Vision] 인식 성공: {len(full_text)}자 감지")
        
        # 성분 보정
        # Replace newlines with commas for uniform splitting
        flat_text = full_text.replace('\n', ',')
        raw_candidates = [x.strip() for x in flat_text.split(',')]
        
        found_ingredients = []
        
        # Keywords to skip (instructional text)
        skip_keywords = ["사용", "주의", "보관", "반품", "교환", "소비자", "전문의", "상담", "어린이", "직사광선", "도포", "씻어", "경우", "화장품", "책임", "판매", "제조"]
        
        for candidate in raw_candidates:
            clean = candidate.strip()
            # 1. Skip if too short
            if len(clean) < 2: continue
            
            # --- NEW: Label Cleaning (전성분, 진성분 등 제거) ---
            # Remove "전성분:", "진성분", "Ingredients:" from the start of the line
            clean = re.sub(r"^(전성분|진성분|성분|INGREDIENTS|Ingredients)[\s:.]*", "", clean, flags=re.IGNORECASE).strip()
            if len(clean) < 2: continue
            
            # 2. Skip if it contains instructional keywords
            if any(k in clean for k in skip_keywords):
                # print(f"[Google Vision] Skipped instruction: {clean}")
                continue
                
            # 3. Skip if it looks like a phone number or URL
            if "http" in clean or "www" in clean or re.search(r"\d{2,}-\d{3,}-\d{4}", clean):
                # print(f"[Google Vision] Skipped contact info: {clean}")
                continue
            
            # 4. Remove residual punctuation
            clean = clean.strip(".,-•·[]()")

            corrected = correct_ingredient_name(clean)
            if corrected:
                 found_ingredients.append(corrected)
                 # print(f"[Google Vision] '{clean}' -> '{corrected}'")
                    
        return {
            "full_text": full_text,
            "ingredients": found_ingredients,
            "provider": "google_cloud_vision"
        }
        
    except Exception as e:
        import traceback
        error_msg = traceback.format_exc()
        with open("analysis_error.log", "a", encoding="utf-8") as f:
            f.write(f"\n--- Google Vision Error ({type(e).__name__}) ---\n")
            f.write(error_msg)
        print(f"[Google Vision] 오류 발생: {e}")
        return None

def run_easyocr(image: np.ndarray) -> dict:
    """
    EasyOCR을 실행하고 텍스트를 추출 및 보정합니다.
    """
    if not EASYOCR_AVAILABLE:
        raise RuntimeError("EasyOCR not installed")
    
    # 1. Image Preprocessing (Contrast Enhancement)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Advanced Preprocessing: CLAHE
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    
    # Lazy Init
    global reader
    if 'reader' not in globals():
        import easyocr
        print("[EasyOCR] Initializing reader on demand...")
        reader = easyocr.Reader(['ko', 'en'])

    # 2. Run OCR
    results = reader.readtext(enhanced, detail=1)
    
    found_ingredients = []
    raw_text_lines = []
    
    print(f"[OCR] Total blocks detected: {len(results)}")
    
    for (bbox, text, prob) in results:
        # Confidence Threshold (0.35 - slightly lower to catch more, then filtered by correction)
        if prob > 0.35:
            # Handle multiple ingredients in one block (comma separated)
            candidates = text.replace('·', ',').replace('/', ',').split(',')
            
            for candidate in candidates:
                clean_text = candidate.replace('.', '').strip()
                if len(clean_text) > 1:
                    corrected = correct_ingredient_name(clean_text)
                    if corrected:
                        found_ingredients.append(corrected)
                        # print(f"[OCR] '{candidate}' ({prob:.2f}) -> '{corrected}'")
            
            raw_text_lines.append(text) # Keep original text in raw_text_lines for Gemini
                
    return {
        "full_text": "\n".join(raw_text_lines),
        "ingredients": found_ingredients,
        "raw_results": [{"text": t, "prob": p} for (_, t, p) in results]
    }



# --- Local Data for Offline Analysis ---
INGREDIENT_EFFECTS = {
    # --- Moisturizing (보습) ---
    "glycerin": {"effect": "보습", "type": "건성", "concern": "건조", "nameKo": "글리세린", "component_type": "Moisturizer", "time_use": "Any"},
    "글리세린": {"effect": "보습", "type": "건성", "concern": "건조", "nameKo": "글리세린", "component_type": "Moisturizer", "time_use": "Any"},
    "butylene glycol": {"effect": "보습", "type": "건성", "concern": "건조", "nameKo": "부틸렌글라이콜", "component_type": "Moisturizer", "time_use": "Any"},
    "부틸렌글라이콜": {"effect": "보습", "type": "건성", "concern": "건조", "nameKo": "부틸렌글라이콜", "component_type": "Moisturizer", "time_use": "Any"},
    "sodium hyaluronate": {"effect": "강력 보습", "type": "건성", "concern": "속건조", "nameKo": "소듐하이알루로네이트", "component_type": "Moisturizer", "time_use": "Any"},
    "소듐하이알루로네이트": {"effect": "강력 보습", "type": "건성", "concern": "속건조", "nameKo": "소듐하이알루로네이트", "component_type": "Moisturizer", "time_use": "Any"},
    "hyaluronic acid": {"effect": "강력 보습", "type": "건성", "concern": "속건조", "nameKo": "히알루론산", "component_type": "Moisturizer", "time_use": "Any"},
    "히알루론산": {"effect": "강력 보습", "type": "건성", "concern": "속건조", "nameKo": "히알루론산", "component_type": "Moisturizer", "time_use": "Any"},
    "beta-glucan": {"effect": "보습/진정", "type": "건성", "concern": "건조", "nameKo": "베타-글루칸", "component_type": "Moisturizer", "time_use": "Any"},
    "베타-글루칸": {"effect": "보습/진정", "type": "건성", "concern": "건조", "nameKo": "베타-글루칸", "component_type": "Moisturizer", "time_use": "Any"},
    "ceramide np": {"effect": "장벽 강화", "type": "건성/민감성", "concern": "민감", "nameKo": "세라마이드엔피", "component_type": "Barrier", "time_use": "Any"},
    "세라마이드엔피": {"effect": "장벽 강화", "type": "건성/민감성", "concern": "민감", "nameKo": "세라마이드엔피", "component_type": "Barrier", "time_use": "Any"},
    "squalane": {"effect": "보습/장벽", "type": "건성", "concern": "건조", "nameKo": "스쿠알란", "component_type": "Moisturizer", "time_use": "Any"},
    "스쿠알란": {"effect": "보습/장벽", "type": "건성", "concern": "건조", "nameKo": "스쿠알란", "component_type": "Moisturizer", "time_use": "Any"},
    "shea butter": {"effect": "고보습", "type": "극건성", "concern": "악건성", "nameKo": "시어버터", "component_type": "Moisturizer", "time_use": "Any"},
    "시어버터": {"effect": "고보습", "type": "극건성", "concern": "악건성", "nameKo": "시어버터", "component_type": "Moisturizer", "time_use": "Any"},
    "panthenol": {"effect": "진정/보습", "type": "민감성", "concern": "자극", "nameKo": "판테놀", "component_type": "Calming", "time_use": "Any"},
    "판테놀": {"effect": "진정/보습", "type": "민감성", "concern": "자극", "nameKo": "판테놀", "component_type": "Calming", "time_use": "Any"},
    "betaine": {"effect": "보습/유수분밸런스", "type": "복합성", "concern": "건조", "nameKo": "베타인", "component_type": "Moisturizer", "time_use": "Any"},
    "베타인": {"effect": "보습/유수분밸런스", "type": "복합성", "concern": "건조", "nameKo": "베타인", "component_type": "Moisturizer", "time_use": "Any"},
    "1,2-hexanediol": {"effect": "보습/방부", "type": "모든 피부", "concern": "보습", "nameKo": "1,2-헥산다이올", "component_type": "Preservative", "time_use": "Any"},
    "1,2-헥산다이올": {"effect": "보습/방부", "type": "모든 피부", "concern": "보습", "nameKo": "1,2-헥산다이올", "component_type": "Preservative", "time_use": "Any"},
    "water": {"effect": "수분 공급", "type": "모든 피부", "concern": "건조", "nameKo": "정제수", "component_type": "Base", "time_use": "Any"},
    "정제수": {"effect": "수분 공급", "type": "모든 피부", "concern": "건조", "nameKo": "정제수", "component_type": "Base", "time_use": "Any"},

    # --- Soothing (진정) ---
    "centella asiatica extract": {"effect": "진정", "type": "민감성", "concern": "자극", "nameKo": "병풀추출물", "component_type": "Calming", "time_use": "Any"},
    "병풀추출물": {"effect": "진정", "type": "민감성", "concern": "자극", "nameKo": "병풀추출물", "component_type": "Calming", "time_use": "Any"},
    "madecassoside": {"effect": "진정/재생", "type": "민감성", "concern": "자극", "nameKo": "마데카소사이드", "component_type": "Calming", "time_use": "Any"},
    "마데카소사이드": {"effect": "진정/재생", "type": "민감성", "concern": "자극", "nameKo": "마데카소사이드", "component_type": "Calming", "time_use": "Any"},
    "tea tree leaf oil": {"effect": "항균/진정", "type": "지성", "concern": "여드름", "nameKo": "티트리잎오일", "component_type": "Active", "time_use": "Any"},
    "티트리잎오일": {"effect": "항균/진정", "type": "지성", "concern": "여드름", "nameKo": "티트리잎오일", "component_type": "Active", "time_use": "Any"},
    "allantoin": {"effect": "진정", "type": "민감성", "concern": "자극", "nameKo": "알란토인", "component_type": "Calming", "time_use": "Any"},
    "알란토인": {"effect": "진정", "type": "민감성", "concern": "자극", "nameKo": "알란토인", "component_type": "Calming", "time_use": "Any"},
    "aloe barbadensis leaf extract": {"effect": "진정/수분", "type": "민감성", "concern": "자극", "nameKo": "알로에베라잎추출물", "component_type": "Calming", "time_use": "Any"},
    "알로에베라잎추출물": {"effect": "진정/수분", "type": "민감성", "concern": "자극", "nameKo": "알로에베라잎추출물", "component_type": "Calming", "time_use": "Any"},
    "houttuynia cordata extract": {"effect": "진정/항균", "type": "지성/민감성", "concern": "여드름", "nameKo": "약모밀추출물", "component_type": "Calming", "time_use": "Any"},
    "약모밀추출물": {"effect": "진정/항균", "type": "지성/민감성", "concern": "여드름", "nameKo": "약모밀추출물", "component_type": "Calming", "time_use": "Any"},
    "green tea extract": {"effect": "진정/항산화", "type": "지성", "concern": "피지", "nameKo": "녹차추출물", "component_type": "Calming", "time_use": "Any"},
    "녹차추출물": {"effect": "진정/항산화", "type": "지성", "concern": "피지", "nameKo": "녹차추출물", "component_type": "Calming", "time_use": "Any"},
    "zinc oxide": {"effect": "진정/자외선 차단", "type": "민감성", "concern": "자극", "nameKo": "징크옥사이드", "component_type": "Sunscreen", "time_use": "Day"},
    "징크옥사이드": {"effect": "진정/자외선 차단", "type": "민감성", "concern": "자극", "nameKo": "징크옥사이드", "component_type": "Sunscreen", "time_use": "Day"},

    # --- Whitening / Pore Care (미백/모공) ---
    "niacinamide": {"effect": "미백/피지 조절", "type": "지성/복합성", "concern": "칙칙함/피지", "nameKo": "나이아신아마이드", "component_type": "Active", "time_use": "Any", "conflicts": ["Vitamin C"]},
    "나이아신아마이드": {"effect": "미백/피지 조절", "type": "지성/복합성", "concern": "칙칙함/피지", "nameKo": "나이아신아마이드", "component_type": "Active", "time_use": "Any", "conflicts": ["Vitamin C"]},
    "arbutin": {"effect": "미백", "type": "모든 피부", "concern": "칙칙함", "nameKo": "알부틴", "component_type": "Active", "time_use": "Any"},
    "알부틴": {"effect": "미백", "type": "모든 피부", "concern": "칙칙함", "nameKo": "알부틴", "component_type": "Active", "time_use": "Any"},
    "ascorbic acid": {"effect": "미백/항산화", "type": "모든 피부", "concern": "칙칙함", "nameKo": "아스코빅애씨드", "component_type": "Active", "time_use": "Day", "conflicts": ["Retinol", "AHA/BHA", "Niacinamide"]},
    "아스코빅애씨드": {"effect": "미백/항산화", "type": "모든 피부", "concern": "칙칙함", "nameKo": "아스코빅애씨드", "component_type": "Active", "time_use": "Day", "conflicts": ["Retinol", "AHA/BHA", "Niacinamide"]},
    "salicylic acid": {"effect": "각질/모공 케어", "type": "지성", "concern": "여드름/모공", "nameKo": "살리실릭애씨드", "component_type": "Active", "time_use": "Night", "conflicts": ["Retinol", "Vitamin C"]},
    "살리실릭애씨드": {"effect": "각질/모공 케어", "type": "지성", "concern": "여드름/모공", "nameKo": "살리실릭애씨드", "component_type": "Active", "time_use": "Night", "conflicts": ["Retinol", "Vitamin C"]},
    "citric acid": {"effect": "pH 조절/각질", "type": "지성", "concern": "각질", "nameKo": "시트릭애씨드", "component_type": "Active", "time_use": "Night", "conflicts": ["Retinol"]},
    "시트릭애씨드": {"effect": "pH 조절/각질", "type": "지성", "concern": "각질", "nameKo": "시트릭애씨드", "component_type": "Active", "time_use": "Night", "conflicts": ["Retinol"]},
    "alcohol": {"effect": "수렴/청량감", "type": "지성", "concern": "피지", "nameKo": "에탄올", "component_type": "Solvent", "time_use": "Any"},
    "에탄올": {"effect": "수렴/청량감", "type": "지성", "concern": "피지", "nameKo": "에탄올", "component_type": "Solvent", "time_use": "Any"},

    # --- Anti-Aging (노화 개발) ---
    "adenosine": {"effect": "주름 개선", "type": "노화성", "concern": "주름", "nameKo": "아데노신", "component_type": "Active", "time_use": "Any"},
    "아데노신": {"effect": "주름 개선", "type": "노화성", "concern": "주름", "nameKo": "아데노신", "component_type": "Active", "time_use": "Any"},
    "retinol": {"effect": "탄력/노화", "type": "노화성", "concern": "주름/탄력", "nameKo": "레티놀", "component_type": "Active", "time_use": "Night", "conflicts": ["Vitamin C", "AHA/BHA"]},
    "레티놀": {"effect": "탄력/노화", "type": "노화성", "concern": "주름/탄력", "nameKo": "레티놀", "component_type": "Active", "time_use": "Night", "conflicts": ["Vitamin C", "AHA/BHA"]},
    "tocopherol": {"effect": "항산화", "type": "노화성", "concern": "탄력", "nameKo": "토코페롤", "component_type": "Active", "time_use": "Any"},
    "토코페롤": {"effect": "항산화", "type": "노화성", "concern": "탄력", "nameKo": "토코페롤", "component_type": "Active", "time_use": "Any"},
    "peptide": {"effect": "탄력", "type": "노화성", "concern": "탄력", "nameKo": "펩타이드", "component_type": "Active", "time_use": "Any"},
    "펩타이드": {"effect": "탄력", "type": "노화성", "concern": "탄력", "nameKo": "펩타이드", "component_type": "Active", "time_use": "Any"},
    "collagen": {"effect": "보습/탄력", "type": "건성", "concern": "탄력", "nameKo": "콜라겐", "component_type": "Moisturizer", "time_use": "Any"},
    "콜라겐": {"effect": "보습/탄력", "type": "건성", "concern": "탄력", "nameKo": "콜라겐", "component_type": "Moisturizer", "time_use": "Any"},

    # --- New Additions (Dr.Jart+ Cicapair Mist) ---
    "propanediol": {"effect": "보습/용매", "type": "모든 피부", "concern": "건조", "nameKo": "프로판다이올"},
    "프로판다이올": {"effect": "보습/용매", "type": "모든 피부", "concern": "건조", "nameKo": "프로판다이올"},
    "chondrus crispus extract": {"effect": "보습/항산화", "type": "건성", "concern": "건조", "nameKo": "아이리쉬모스추출물"},
    "아이리쉬모스추출물": {"effect": "보습/항산화", "type": "건성", "concern": "건조", "nameKo": "아이리쉬모스추출물"},
    "saccharum officinarum extract": {"effect": "각질케어/보습", "type": "복합성", "concern": "각질", "nameKo": "사탕수수추출물"},
    "사탕수수추출물": {"effect": "각질케어/보습", "type": "복합성", "concern": "각질", "nameKo": "사탕수수추출물"},
    "dipotassium glycyrrhizate": {"effect": "강력 진정", "type": "민감성", "concern": "자극", "nameKo": "다이포타슘글리시리제이트"},
    "다이포타슘글리시리제이트": {"effect": "강력 진정", "type": "민감성", "concern": "자극", "nameKo": "다이포타슘글리시리제이트"},
    "ethylhexylglycerin": {"effect": "피부컨디셔닝", "type": "모든 피부", "concern": "보습", "nameKo": "에틸헥실글리세린"},
    "에틸헥실글리세린": {"effect": "피부컨디셔닝", "type": "모든 피부", "concern": "보습", "nameKo": "에틸헥실글리세린"},
    "sodium pca": {"effect": "천연보습인자", "type": "건성", "concern": "속건조", "nameKo": "소듐피씨에이"},
    "소듐피씨에이": {"effect": "천연보습인자", "type": "건성", "concern": "속건조", "nameKo": "소듐피씨에이"},
    "소둠피씨에이": {"effect": "천연보습인자", "type": "건성", "concern": "속건조", "nameKo": "소듐피씨에이"}, # Typos handling
    "lavender oil": {"effect": "진정/향", "type": "민감성", "concern": "스트레스", "nameKo": "라벤더오일"},
    "라벤더오일": {"effect": "진정/향", "type": "민감성", "concern": "스트레스", "nameKo": "라벤더오일"},
    "rosemary leaf oil": {"effect": "활력/항균", "type": "지성", "concern": "피지", "nameKo": "로즈마리잎오일"},
    "로즈마리잎오일": {"effect": "활력/항균", "type": "지성", "concern": "피지", "nameKo": "로즈마리잎오일"},
    "citrus grandis peel oil": {"effect": "모공수렴/미백", "type": "지성", "concern": "모공", "nameKo": "왕귤껍질오일"},
    "왕귤껍질오일": {"effect": "모공수렴/미백", "type": "지성", "concern": "모공", "nameKo": "왕귤껍질오일"},
    "magnesium pca": {"effect": "미네랄보습", "type": "건성", "concern": "건조", "nameKo": "마그네슘피씨에이"},
    "마그네슘피씨에이": {"effect": "미네랄보습", "type": "건성", "concern": "건조", "nameKo": "마그네슘피씨에이"},
    "true rose of jericho": {"effect": "수분보유력", "type": "건성", "concern": "건조", "nameKo": "트루로즈오브예리코"},
    "트루로즈오브예리코": {"effect": "수분보유력", "type": "건성", "concern": "건조", "nameKo": "트루로즈오브예리코"},
    "lemon balm leaf extract": {"effect": "진정/항산화", "type": "민감성", "concern": "자극", "nameKo": "레몬밤잎추출물"},
    "레몬밤잎추출물": {"effect": "진정/항산화", "type": "민감성", "concern": "자극", "nameKo": "레몬밤잎추출물"},
    "phenoxyethanol": {"effect": "방부제", "type": "모든 피부", "concern": "안전성", "nameKo": "페녹시에탄올"},
    "페녹시에탄올": {"effect": "방부제", "type": "모든 피부", "concern": "안전성", "nameKo": "페녹시에탄올"},
    "페녹시 에탄올": {"effect": "방부제", "type": "모든 피부", "concern": "안전성", "nameKo": "페녹시에탄올"},
    
    # --- Dr.Jart Mist Detailed Ingredients ---
    "카라기난추출물": {"effect": "보습/항산화", "type": "모든 피부", "concern": "건조", "nameKo": "카라기난추출물", "component_type": "Moisturizer", "time_use": "Any"},
    "해수": {"effect": "수분 공급/미네랄", "type": "모든 피부", "concern": "건조", "nameKo": "해수", "component_type": "Moisturizer", "time_use": "Any"},
    "초피나무열매추출물": {"effect": "진정/피부 보호", "type": "민감성", "concern": "자극", "nameKo": "초피나무열매추출물", "component_type": "Calming", "time_use": "Any"},
    "서양톱풀추출물": {"effect": "진정/수렴", "type": "민감성", "concern": "자극", "nameKo": "서양톱풀추출물", "component_type": "Calming", "time_use": "Any"},
    "성모초추출물": {"effect": "진정/피부 보호", "type": "민감성", "concern": "자극", "nameKo": "성모초추출물", "component_type": "Calming", "time_use": "Any"},
    "말로우추출물": {"effect": "진정/수분", "type": "민감성", "concern": "자극", "nameKo": "말로우추출물", "component_type": "Calming", "time_use": "Any"},
    "페퍼민트잎추출물": {"effect": "쿨링/수렴", "type": "지성", "concern": "피지", "nameKo": "페퍼민트잎추출물", "component_type": "Active", "time_use": "Any"},
    "카우슬립추출물": {"effect": "진정/보습", "type": "민감성", "concern": "자극", "nameKo": "카우슬립추출물", "component_type": "Calming", "time_use": "Any"},
    "꼬리풀추출물": {"effect": "진정/보습", "type": "민감성", "concern": "자극", "nameKo": "꼬리풀추출물", "component_type": "Calming", "time_use": "Any"},
    "락토바실러스발효물": {"effect": "장벽 강화/진정", "type": "민감성", "concern": "민감", "nameKo": "락토바실러스발효물", "component_type": "Barrier", "time_use": "Any"},
    "제충국꽃추출물": {"effect": "항균/진정", "type": "지성", "concern": "트러블", "nameKo": "제충국꽃추출물", "component_type": "Active", "time_use": "Any"},
    "레몬유칼립투스오일": {"effect": "수렴/항균", "type": "지성", "concern": "피지", "nameKo": "레몬유칼립투스오일", "component_type": "Active", "time_use": "Any"},
    "아시아티코사이드": {"effect": "진정/재생", "type": "민감성", "concern": "자극", "nameKo": "아시아티코사이드", "component_type": "Calming", "time_use": "Any"},
    "아시아틱애씨드": {"effect": "진정/재생", "type": "민감성", "concern": "자극", "nameKo": "아시아틱애씨드", "component_type": "Calming", "time_use": "Any"},
    "마데카식애씨드": {"effect": "진정/재생", "type": "민감성", "concern": "자극", "nameKo": "마데카식애씨드", "component_type": "Calming", "time_use": "Any"},
    "징크피씨에이": {"effect": "피지 조절/진정", "type": "지성", "concern": "피지", "nameKo": "징크피씨에이", "component_type": "Active", "time_use": "Any"},
    "망가니즈피씨에이": {"effect": "수분/보습", "type": "건성", "concern": "건조", "nameKo": "망가니즈피씨에이", "component_type": "Moisturizer", "time_use": "Any"},

    
    # --- New Request Additions ---
    "cholesterol": {"effect": "장벽 강화", "type": "건성", "concern": "민감", "nameKo": "콜레스테롤"},
    "콜레스테롤": {"effect": "장벽 강화", "type": "건성", "concern": "민감", "nameKo": "콜레스테롤"},
    "fatty acid": {"effect": "장벽 강화", "type": "건성", "concern": "건조", "nameKo": "지방산"},
    "지방산": {"effect": "장벽 강화", "type": "건성", "concern": "건조", "nameKo": "지방산"},
    "stearic acid": {"effect": "장벽/유화", "type": "건성", "concern": "건조", "nameKo": "스테아릭애씨드"},
    "스테아릭애씨드": {"effect": "장벽/유화", "type": "건성", "concern": "건조", "nameKo": "스테아릭애씨드"},
    "betula platyphylla japonica juice": {"effect": "수분/진정", "type": "건성/지성", "concern": "건조", "nameKo": "자작나무수액"},
    "자작나무수액": {"effect": "수분/진정", "type": "건성/지성", "concern": "건조", "nameKo": "자작나무수액"},
    "bifida ferment lysate": {"effect": "장벽/영양", "type": "노화성", "concern": "탄력", "nameKo": "비피다발효용해물"},
    "비피다발효용해물": {"effect": "장벽/영양", "type": "노화성", "concern": "탄력", "nameKo": "비피다발효용해물"},
    "galactomyces ferment filtrate": {"effect": "결케어/투명", "type": "모든 피부", "concern": "칙칙함", "nameKo": "갈락토미세스발효여과물"},
    "갈락토미세스발효여과물": {"effect": "결케어/투명", "type": "모든 피부", "concern": "칙칙함", "nameKo": "갈락토미세스발효여과물"},
    "solanum lycopersicum (tomato) fruit extract": {"effect": "모공/탄력", "type": "지성", "concern": "모공", "nameKo": "토마토추출물"},
    "토마토추출물": {"effect": "모공/탄력", "type": "지성", "concern": "모공", "nameKo": "토마토추출물"},
    "그린토마토추출물": {"effect": "모공/탄력", "type": "지성", "concern": "모공", "nameKo": "토마토추출물"},

    # --- Others ---
    "titanium dioxide": {"effect": "자외선 차단", "type": "모든 피부", "concern": "자외선", "nameKo": "티타늄디옥사이드"},
    "티타늄디옥사이드": {"effect": "자외선 차단", "type": "모든 피부", "concern": "자외선", "nameKo": "티타늄디옥사이드"},
    "dimethicone": {"effect": "수분 증발 차단", "type": "건성", "concern": "건조", "nameKo": "디메티콘"},
    "디메티콘": {"effect": "수분 증발 차단", "type": "건성", "concern": "건조", "nameKo": "디메티콘"},
}

# Merge INGREDIENT_EFFECTS keys into STANDARD_INGREDIENTS for broader matching
STANDARD_INGREDIENTS = list(set(list(STANDARD_INGREDIENTS_DATA.keys()) + list(INGREDIENT_EFFECTS.keys())))

def analyze_ingredients_locally(ingredients: list, skin_type: str = "OSNW") -> dict:
    """
    Perform heuristic analysis based on ingredient list.
    Now includes Personalized Matching Score, Composition Analysis, and Usage Guidance.
    """
    detected_effects = []
    enriched_ingredients = []
    
    # Analysis Counters
    score = 100
    composition = {"Moisturizer": 0, "Calming": 0, "Active": 0, "Preservative": 0, "Solvent": 0, "Sunscreen": 0, "Base": 0, "Others": 0}
    
    usage_guide = {
        "time": "Any",
        "conflicts": [],
        "caution": []
    }
    
    user_concerns = [] 
    if "O" in skin_type: user_concerns.append("피지")
    if "D" in skin_type: user_concerns.append("건조")
    if "S" in skin_type: user_concerns.append("민감")
    if "W" in skin_type: user_concerns.append("주름")
    if "P" in skin_type: user_concerns.append("칙칙함")

    for ing in ingredients:
        clean_ing = ing.lower().strip()
        info = INGREDIENT_EFFECTS.get(clean_ing, {})
        
        # Fuzzy match
        if not info:
             for key in INGREDIENT_EFFECTS:
                 if key in clean_ing:
                     info = INGREDIENT_EFFECTS[key]
                     break
        
        # Data Extraction
        name_ko = info.get("nameKo", clean_ing)
        benefit = info.get("effect", "")
        comp_type = info.get("component_type", "Others")
        ing_concern = info.get("concern", "")
        time_use = info.get("time_use", "Any")
        ing_conflicts = info.get("conflicts", [])

        # 1. Composition Analysis
        composition[comp_type] = composition.get(comp_type, 0) + 1
        
        # 2. Score Calculation Logic
        # Positive: Concern Match
        if ing_concern in user_concerns:
            score += 2
        
        # Negative: Mismatch (Simple logic)
        # e.g. High Oil for Oily Skin
        if "지성" in skin_type and "오일" in name_ko: 
            score -= 1
        
        # 3. Usage Guidance
        if time_use == "Night":
            usage_guide["time"] = "Night"
            usage_guide["caution"].append(f"{name_ko}: 햇빛에 민감할 수 있어 밤 사용 권장")
        
        if time_use == "Day":
             if usage_guide["time"] != "Night": usage_guide["time"] = "Day" # Night overrides Day
        
        if ing_conflicts:
            usage_guide["conflicts"].extend(ing_conflicts)

        is_likely_ingredient = False
        if benefit or comp_type != "Others":
             is_likely_ingredient = True
        elif any(clean_ing.endswith(s) for s in ["extract", "oil", "acid", "water", "glycerin", "diol"]):
             is_likely_ingredient = True
             
        if is_likely_ingredient:
            enriched_ingredients.append({
                "name": ing,
                "nameKo": name_ko,
                "benefit": benefit,
                "type": comp_type 
            })
            if benefit: detected_effects.append(benefit)

    # Final Score Adjustment
    score = min(score, 100)
    score = max(score, 60) 

    # Top 3 Ingredients (Prioritize Actives > Calming > Moisturizer)
    sorted_ingredients = sorted(enriched_ingredients, key=lambda x: 0 if x['type'] == 'Active' else 1 if x['type'] == 'Calming' else 2)
    top_3 = [ing['nameKo'] for ing in sorted_ingredients[:3]]
    
    # Conflict Dedup
    usage_guide["conflicts"] = list(set(usage_guide["conflicts"]))
    usage_guide["caution"] = list(set(usage_guide["caution"]))

    # Summary Generation
    unique_effects = list(dict.fromkeys(detected_effects)) # Preserve order, remove duplicates
    effects_str = ", ".join(unique_effects[:3]) if unique_effects else "전반적인 피부 컨디션"

    summary = ""
    if composition["Active"] > 0:
         summary += f"핵심 성분으로 {', '.join(top_3)} 등이 포함되어 있어 {effects_str}에 도움을 줍니다. "
    elif len(unique_effects) > 0:
         summary += f"주요 성분이 {effects_str} 효과를 제공합니다. "
    # Badge Selection
    badge = "안심사용"
    if score >= 90: badge = "찰떡궁합"
    elif score < 70: badge = "주의필요"

    # Fit Highlights (Simulated category scores)
    fit_highlights = []
    if composition["Calming"] > 20 or "진정" in effects_str:
        fit_highlights.append({"label": "자극 진정", "value": min(100, composition["Calming"] + 70)})
    if composition["Moisturizer"] > 20 or "보습" in effects_str:
        fit_highlights.append({"label": "수분 공급", "value": min(100, composition["Moisturizer"] + 75)})
    if "피지" in effects_str or "트러블" in effects_str:
        fit_highlights.append({"label": "모공 케어", "value": random.randint(80, 95)})
    
    # Final Composition Filtering: Only keep categories relevant to skin benefits
    filtered_composition = {
        "Active": composition.get("Active", 0),
        "Moisturizer": composition.get("Moisturizer", 0),
        "Calming": composition.get("Calming", 0)
    }
    
    return {
        "matchingScore": score,
        "skinType": skin_type,
        "badge": badge,
        "fitHighlights": fit_highlights[:3], # Top 3 highlights
        "ingredients": enriched_ingredients,
        "description": summary,
        "topIngredients": top_3,
        "composition": filtered_composition,
        "usageGuide": usage_guide
    }

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
    # Dynamic Setup
    face_mesh_detector = get_face_mesh_v2()
    drawing_utils = get_mp_drawing()
    try:
        from mediapipe.python.solutions import face_mesh as mp_face_mesh
    except:
        import mediapipe.solutions.face_mesh as mp_face_mesh

    # Optimize before MediaPipe
    optimized_image = optimize_for_mobile(image)

    results = face_mesh_detector.process(cv2.cvtColor(optimized_image, cv2.COLOR_BGR2RGB))
    
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
    
    # Draw Landmarks on the image for visualization
    debug_image = optimized_image.copy()
    
    # Simple drawing
    drawing_utils.draw_landmarks(
        image=debug_image,
        landmark_list=results.multi_face_landmarks[0],
        connections=mp_face_mesh.FACEMESH_TESSELATION,
        landmark_drawing_spec=drawing_utils.DrawingSpec(color=(0, 255, 0), thickness=1, circle_radius=1),
        connection_drawing_spec=drawing_utils.DrawingSpec(color=(0, 200, 0), thickness=1))
    
    drawing_utils.draw_landmarks(
        image=debug_image,
        landmark_list=results.multi_face_landmarks[0],
        connections=mp_face_mesh.FACEMESH_CONTOURS,
        landmark_drawing_spec=None,
        connection_drawing_spec=drawing_utils.DrawingSpec(color=(0, 255, 0), thickness=2))

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
        
        if GOOGLE_API_KEY == "YOU_MUST_ENTER_YOUR_API_KEY_HERE":
             print("Warning: No API Key provided. Using Mock Data.")
             raise Exception("No API Key")

        genai.configure(api_key=GOOGLE_API_KEY)
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

@app.post("/analyze-product")
async def analyze_product(file: UploadFile = File(...)):
    # 1. 이미지 읽기
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if image is None:
        raise HTTPException(status_code=400, detail="이미지 파일을 읽을 수 없습니다.")

    if not os.path.exists("uploads"):
        os.makedirs("uploads")

    file_path = f"uploads/product_{random.randint(1000,9999)}.jpg"
    cv2.imwrite(file_path, image)

    # ============================================================
    # 2. OCR 파이프라인 (Google Vision -> EasyOCR Fallback)
    # ============================================================
    ocr_text = None
    ocr_used = False
    extracted_ingredients = []

    # 2-1. Google Vision / Gemini OCR (High Precision)
    # print("[OCR] 정밀 OCR 분석 시작...")
    # _, buffer = cv2.imencode('.jpg', image)
    # ocr_result_data = run_google_vision_ocr(buffer.tobytes())
    
    # [Optimization] Skip Google Vision API to use Free Tier Gemini Only
    ocr_result_data = None 

    if ocr_result_data:
        ocr_text = ocr_result_data["full_text"]
        extracted_ingredients = ocr_result_data["ingredients"]
        ocr_used = True
        print(f"[OCR] 정밀 OCR 결과 사용 ({len(extracted_ingredients)}개 성분 보정됨)")
    else:
        # 2-2. EasyOCR (Local Fallback)
        if EASYOCR_AVAILABLE:
            try:
                print("[OCR] 정밀 OCR 실패 -> EasyOCR 로컬 분석 시작...")
                ocr_result = run_easyocr(image)
                ocr_text = ocr_result["full_text"]
                extracted_ingredients = ocr_result["ingredients"]
                
                print(f"[OCR] Full Text Snippet: {ocr_text[:200]}...") # Log OCR text
                if len(extracted_ingredients) > 0:
                    ocr_used = True
                    print(f"[OCR] EasyOCR 결과 사용 ({len(extracted_ingredients)}개 성분): {extracted_ingredients}")
                else:
                    print("[OCR] EasyOCR detected 0 ingredients.")
            except Exception as ocr_err:
                print(f"[OCR] EasyOCR 오류: {ocr_err}")

    # ============================================================
    # 3. Gemini 호출
    # ============================================================
    try:
        import google.generativeai as genai

        genai.configure(api_key=GOOGLE_API_KEY)
        
        # DEBUG: List available models
        try:
            print("[Gemini] Checking available models...")
            for m in genai.list_models():
                if 'generateContent' in m.supported_generation_methods:
                    print(f" - {m.name}")
        except Exception as e:
            print(f"[Gemini] Could not list models: {e}")

        # Try multiple models (Prioritize confirmed names)
        # Priorities gemini-1.5-flash as it is more reliable across regions
        models_to_try = ['gemini-1.5-flash', 'gemini-pro', 'gemini-1.0-pro']
        result = None
        
        for model_name in models_to_try:
            try:
                print(f"[Gemini] Analyzing with model: {model_name}...")
                model = genai.GenerativeModel(model_name)
                
                if ocr_used and ocr_text:
                    prompt = f"""아래는 화장품 패키지의 성분표(Ingredients List)에서 추출한 파편화된 원본 텍스트(Raw OCR data)입니다.
텍스트가 부정확할 수 있으므로, 문맥을 통해 브랜드를 유추하고 성분명을 복원하여 분석해주세요.

[추출된 원본 텍스트]
{ocr_text}

위 텍스트를 분석하여 다음 JSON 정보를 생성해주세요:
1. "name": 문맥상 가장 유력한 제품명. 
2. "brand": 문맥상 가장 유력한 브랜드명.
3. "category": 제품 카테고리 (토너, 세럼, 크림, 클렌저 등).
4. "ingredients": [ {{ "name": "English Name", "nameKo": "한글 성분명", "benefit": "효능" }} ] 
   - 중요도에 상관없이 텍스트 내에서 검출된 모든 성분을 하나도 빠짐없이 리스트업하세요. (매우 중요)
5. "keyIngredients": [ {{ "name": "English Name", "nameKo": "한글 성분명", "benefit": "효능" }} ]
   - 위 "ingredients" 중 제품의 정체성을 나타내는 핵심 활성 성분(Active Ingredients)이나 마케팅 포인트 성분만 따로 3-5개 선정하세요.
6. "warnings": 피부 타입(지성, 건성, 민감성)별 주의 성분 및 알레르기 안내.
7. "summary": 제품의 전반적인 특징과 효능 요약 (한국어). "**XX 타입 피부를 위한 분석 결과입니다**"와 같은 서두는 절대 금지합니다.
8. "effectSummary": 성분이 피부에 주는 긍정적인 변화 한 줄 요약. (예: '피부에 강력한 수분 공급과 진정 효과를 전달합니다'). 서두에 피부 타입을 언급하지 마세요.
9. "price": 제품 패키지에 가격이 적혀있거나 알고 있다면 해당 숫자를, 모른다면 현재 시장가격을 추측하여 숫자로만 적어주세요. 정보를 전혀 알 수 없으면 0.

주의: 
- 반드시 유효한 JSON 형식으로만 응답하세요. 
- 성분표가 아니거나 텍스트가 너무 부족하면 "ingredients"를 빈 배열로 하고 "summary"에 "정보가 부족합니다"라고 적어주세요.
- **"XX 타입 피부를 위한..."**과 같은 문구를 결과값 어디에도 포함하지 마세요.
- 마크다운 블록(```json)을 사용하지 마세요."""
                    response = model.generate_content(prompt)
                else:
                    img = genai.upload_file(file_path)
                    prompt = """이 화장품 패키지 이미지를 분석하여 제품 정보를 JSON으로 추출해주세요.
이미지 내의 성분표 텍스트를 최대한 판독하여 다음 항목을 채워주세요:

{
    "name": "제품명",
    "brand": "브랜드명",
    "category": "카테고리",
    "ingredients": [
        {"name": "Ingredient Name", "nameKo": "성분명", "benefit": "효능"}
    ],
    "keyIngredients": [
        {"name": "Ingredient Name", "nameKo": "성분명", "benefit": "효능"}
    ],
    "warnings": ["주의사항"],
    "summary": "AI 분석 요약",
    "effectSummary": "주요 성분들이 피부에 어떤 긍정적인 변화를 주는지 구체적인 한 줄 요약 (예: '수분 공급을 줄 수 있다' 등)",
    "price": 0 // 알고 있다면 숫자만, 모른다면 시장가 추측
}

주의:
1. 오직 JSON 응답만 허용합니다.
2. "ingredients"는 텍스트에서 보인 모든 성분을 리스트업하고, "keyIngredients"는 그 중 대표 성분 3-5개만 골라 별도로 포함합니다. (두 리스트가 동일하면 안 됩니다)
3. "summary"와 "effectSummary"에는 "XX 타입 피부를 위한 분석 결과입니다"와 같은 서두를 절대 포함하지 마세요. 바로 성분의 효능과 분석 내용을 작성하세요.
4. 성분표가 아닐 경우 "summary"에 "화장품 성분표 이미지를 스캔해주세요"라고 명시하세요."""
                    response = model.generate_content([prompt, img])

                # Cleanup response
                text_response = response.text
                if "```json" in text_response:
                    text_response = text_response.split("```json")[1].split("```")[0]
                elif "```" in text_response:
                    text_response = text_response.split("```")[1].split("```")[0]
                text_response = text_response.strip()
                print(f"[Gemini] Raw JSON length: {len(text_response)}")
                
                result = json.loads(text_response)
                print(f"[Gemini] Success with {model_name}")
                break # Exit loop if successful
                
            except Exception as model_err:
                print(f"[Gemini] Model {model_name} failed: {model_err}")
                continue
        
        if result is None:
            raise RuntimeError("All Gemini models failed.")

        if "matchingScore" not in result: result["matchingScore"] = random.randint(85, 99)
        if "skinType" not in result: result["skinType"] = random.choice(["OSNW", "DSNT", "OSNT", "DRNW"])
        if "imageUrl" not in result: result["imageUrl"] = ""
        
        # --- FIX: Ensure keyIngredients exists for Frontend ---
        if "ingredients" in result and ("keyIngredients" not in result or not result["keyIngredients"]):
            # Use top 5 ingredients as key ingredients if not specified
            result["keyIngredients"] = result["ingredients"][:5]
            print(f"[Gemini] Auto-populated keyIngredients from top items.")
        
        print(f"[Gemini] Final Result Keys: {list(result.keys())}")
        if "keyIngredients" in result:
             print(f"[Gemini] Key Ingredients: {[i.get('nameKo') for i in result['keyIngredients']]}")
             
        result["ocr_used"] = ocr_used

        # --- FINAL CLEANUP: Strictly remove forbidden prefix from summary/effectSummary ---
        def clean_summary(text):
            if not text: return text
            import re
            return re.sub(r"^[A-Z]{4}\s?타입\s?피부를\s?위한\s?분석\s?결과입니다\.?\s*", "", text).strip()
        
        if "summary" in result: result["summary"] = clean_summary(result["summary"])
        if "effectSummary" in result: result["effectSummary"] = clean_summary(result["effectSummary"])
        if "description" in result: result["description"] = clean_summary(result["description"])

        return result

    except Exception as e:
        import traceback
        error_msg = traceback.format_exc()
        with open("analysis_error.log", "a", encoding="utf-8") as f:
            f.write(f"\n--- Analysis Error {random.randint(100,999)} ---\n")
            f.write(error_msg)
        print(f"Product Analysis Error: {e}")
        
        # Emergency Fallback with Local Analysis
        if ocr_used and len(extracted_ingredients) > 0:
             print("[Gemini] AI 분석 실패 -> 로컬 분석 엔진 가동")
             local_result = analyze_ingredients_locally(extracted_ingredients)
             
             return {
                 "name": local_result.get("name", "성분 스캔 완료"),
                 "brand": local_result.get("brand", "분석된 제품"),
                 "category": local_result.get("category", "스킨케어"),
                 "matchingScore": local_result["matchingScore"],
                 "skinType": local_result["skinType"],
                 "price": 0,
                 "keyIngredients": local_result["ingredients"][:5],
                 "ingredients": local_result["ingredients"],
                 "warnings": [],
                 "effectSummary": local_result.get("description", "성분 분석 결과 보습 및 진정 효과를 제공할 수 있습니다."),
                 "summary": local_result["description"],
                 "composition": local_result["composition"],
                 "usageGuide": local_result["usageGuide"],
                 "ocr_used": True,
                 "debug_error": str(e)
             }

        # User-friendly error message
        summary = "서버 오류 또는 인식 불가능한 이미지입니다."
        if "unsupported region" in str(e).lower() or "403" in str(e):
             summary = "AI 서비스 지역 제한 오류가 발생했습니다. VPN이 켜져 있다면 꺼주시거나, 다른 Google API 키를 사용해 보세요."
        elif "NotFound" in str(e) or "404" in str(e):
             summary = "AI 모델을 찾을 수 없습니다. (gemini-pro)"

        return {
             "name": "분석 실패",
             "brand": "알 수 없음",
             "category": "기타",
             "matchingScore": 0,
             "skinType": "Unknown",
             "price": 0,
             "keyIngredients": [],
             "ingredients": [],
             "warnings": ["AI 분석 시스템에 연결할 수 없습니다."],
             "reviews": "네트워크 설정을 확인한 후 다시 시도해주세요.",
             "summary": summary,
             "ocr_used": ocr_used,
             "error": str(e)
        }
    finally:
        if os.path.exists(file_path):
             os.remove(file_path)
        gc.collect()


@app.get("/products/recommend")
def recommend_products(skin_type: str = "OSNW"):
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    # Get all products (limit 20)
    c.execute("SELECT * FROM products ORDER BY RANDOM() LIMIT 20")
    rows = c.fetchall()
    conn.close()
    
    products = []
    for row in rows:
        p = dict(row)
        
        # Parse JSON fields
        try:
            import json
            key_ingredients = json.loads(p['key_ingredients']) if p['key_ingredients'] else []
            skin_fit = json.loads(p['skin_type_fit']) if p['skin_type_fit'] else {}
        except:
            key_ingredients = []
            skin_fit = {}
            
        # Calculate Matching Score based on Skin Fit
        # Best -> 98, Good -> 90, Caution -> 50, otherwise 80
        fit_status = skin_fit.get(skin_type, "Normal")
        if fit_status == "Best": match_score = random.randint(95, 99)
        elif fit_status == "Good": match_score = random.randint(85, 94)
        elif fit_status == "Caution": match_score = random.randint(40, 60)
        else: match_score = random.randint(70, 84)

        products.append({
            "id": p['id'],
            "name": p['name'],
            "brand": p['brand'],
            "category": p['category'],
            "price": p['price'],
            "originalPrice": p['original_price'],
            "imageUrl": p['image_url'], 
            "matchingScore": match_score,
            "keyIngredients": key_ingredients, # List of strings
            "ingredients": p['all_ingredients'], # specific to new schema
            "skinType": skin_type,
            "ewgGrade": p['ewg_grade'], # Send EWG grade
            "cautionNotes": p['caution_notes']
        })
    
    # Sort by score desc
    products.sort(key=lambda x: x['matchingScore'], reverse=True)
    
    return products

@app.get("/ingredients/search")
def search_ingredients(query: str):
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    # 1. Search Local Cache (ingredients table)
    c.execute("SELECT * FROM ingredients WHERE name LIKE ? OR name_en LIKE ?", (f"%{query}%", f"%{query}%"))
    rows = [dict(row) for row in c.fetchall()]
    
    if rows:
        conn.close()
        print(f"[Backend] Found {len(rows)} ingredients for '{query}' in local cache.")
        return rows
        
    # 2. If not in local cache, try Public API
    api_result = search_ingredient_from_api(query)
    if api_result:
        # Map API result to expected format
        mapped_result = {
            "name": api_result.get('ingdName'),
            "name_en": api_result.get('ingdEngName', ''),
            "cas_no": api_result.get('casNo', ''),
            "effect": api_result.get('originMjrKoraNm', ''),
            "description": f"기원 및 정의: {api_result.get('originDefntKoraNm', '정보 없음')}",
            "category": "신규 검색 성분"
        }
        
        # Optional: Save to local cache
        try:
            c.execute('''
                INSERT OR IGNORE INTO ingredients (name, name_en, cas_no, effect, description, category)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (mapped_result['name'], mapped_result['name_en'], mapped_result['cas_no'], 
                  mapped_result['effect'], mapped_result['description'], mapped_result['category']))
            conn.commit()
        except:
            pass
            
        conn.close()
        print(f"[Backend] Found ingredient for '{query}' via Public API.")
        return [mapped_result]
        
    conn.close()
    return []

@app.get("/products/search")
def search_products(query: str):
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    c.execute("SELECT * FROM products WHERE name LIKE ? OR brand LIKE ?", (f"%{query}%", f"%{query}%"))
    rows = c.fetchall()
    conn.close()
    return [dict(row) for row in rows]

# ============================================================
# Admin API Endpoints
# ============================================================

@app.get("/admin/users")
def get_admin_users():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT email, nickname FROM users")
    users = [dict(row) for row in c.fetchall()]
    conn.close()
    return users

@app.delete("/admin/users/{email}")
def delete_admin_user(email: str):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("DELETE FROM users WHERE email = ?", (email,))
    conn.commit()
    conn.close()
    return {"message": "User deleted successfully"}

@app.get("/admin/ingredients")
def get_admin_ingredients():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM ingredients ORDER BY last_updated DESC")
    ingredients = [dict(row) for row in c.fetchall()]
    conn.close()
    return ingredients

class IngredientUpdate(BaseModel):
    name_en: str = None
    cas_no: str = None
    effect: str = None
    description: str = None
    category: str = None

@app.put("/admin/ingredients/{ingredient_id}")
def update_admin_ingredient(ingredient_id: int, core: IngredientUpdate):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('''
        UPDATE ingredients 
        SET name_en = COALESCE(?, name_en), 
            cas_no = COALESCE(?, cas_no), 
            effect = COALESCE(?, effect), 
            description = COALESCE(?, description),
            category = COALESCE(?, category),
            last_updated = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (core.name_en, core.cas_no, core.effect, core.description, core.category, ingredient_id))
    conn.commit()
    conn.close()
    return {"message": "Ingredient updated successfully"}

@app.delete("/admin/ingredients/{ingredient_id}")
def delete_admin_ingredient(ingredient_id: int):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("DELETE FROM ingredients WHERE id = ?", (ingredient_id,))
    conn.commit()
    conn.close()
    return {"message": "Ingredient deleted successfully"}

@app.get("/admin/products")
def get_admin_products():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM products")
    products = [dict(row) for row in c.fetchall()]
    conn.close()
    return products

@app.post("/admin/sync-ingredients")
def trigger_sync_ingredients():
    # Trigger logic (usually async, but for demo we can call the function)
    from sync_ingredients import sync_ingredients
    sync_ingredients(num_pages=1, rows_per_page=50) 
    return {"message": "Sync started successfully"}
    
    return [dict(row) for row in rows]

@app.get("/ingredients/search")
def search_ingredients(query: str):
    """
    Search ingredients: 1st Public API, 2nd Local standard list fallback.
    """
    # Normalize query to NFC (Korean characters are often NFD in Mac/certain environments)
    normalized_query = unicodedata.normalize('NFC', query)
    print(f"[Search] Incoming query: {query} (Normalized: {normalized_query})")
    
    # 1. Try Public API
    result = search_ingredient_from_api(normalized_query)
    if result:
        return [result]
        
    # 2. Local Fallback (Fuzzy matching against STANDARD_INGREDIENTS)
    # Ensure standard list is also normalized for comparison
    normalized_standard = [unicodedata.normalize('NFC', s) for s in STANDARD_INGREDIENTS]
    
    print(f"[Search] API failed or no result for '{normalized_query}', trying local fallback...")
    matches = difflib.get_close_matches(normalized_query, normalized_standard, n=5, cutoff=0.5)
    
    if matches:
        # Construct simplified objects matching the API response format
        fallback_results = []
        for match in matches:
            ing_data = STANDARD_INGREDIENTS_DATA.get(match, {})
            fallback_results.append({
                "ingdName": match,
                "casNo": ing_data.get("nameEn", "Local DB"),
                "originMjrKoraNm": ing_data.get("effect", "Clony 로컬 데이터베이스"),
                "description": ing_data.get("description", ""),
                "goodFor": ing_data.get("goodFor", []),
                "caution": ing_data.get("caution", "")
            })
        return fallback_results
        
    return []

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
