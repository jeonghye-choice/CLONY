"""
ocr_utils.py — CLONY OCR 보강 모듈 (무료, 오픈소스)

구성:
1. PaddleOCR 엔진 (EasyOCR 대비 한국어 처리 정확도 향상)
2. thefuzz 기반 퍼지 매칭 (오탈자 성분명 자동 교정)
3. ingredient_mapping.json 연동 (성분 표준화)

설치:
    pip install paddlepaddle paddleocr thefuzz python-Levenshtein
"""

import json
import os
import re
import unicodedata
import numpy as np
import cv2
from typing import Optional

# ─────────────────────────────────────────────────────────────────
# 1. 매핑 DB 로드
# ─────────────────────────────────────────────────────────────────

_MAPPING_PATH = os.path.join(
    os.path.dirname(__file__),
    "../database/ingredients/ingredient_mapping.json",
)

def _load_mapping() -> dict:
    """ingredient_mapping.json 로드 (KoName → EN INCI)"""
    try:
        with open(_MAPPING_PATH, "r", encoding="utf-8") as f:
            raw: dict = json.load(f)
        # 정규화: 소문자 + NFC
        return {
            unicodedata.normalize("NFC", k).strip().lower(): v
            for k, v in raw.items()
        }
    except Exception as e:
        print(f"[OCR-Utils] mapping 로드 실패: {e}")
        return {}

INGREDIENT_MAP: dict = _load_mapping()
INGREDIENT_KEYS: list = list(INGREDIENT_MAP.keys())

# ─────────────────────────────────────────────────────────────────
# 2. PaddleOCR 초기화 (Lazy)
# ─────────────────────────────────────────────────────────────────

_paddle_reader = None
PADDLEOCR_AVAILABLE = False

try:
    from paddleocr import PaddleOCR  # type: ignore
    PADDLEOCR_AVAILABLE = True
    print("[OCR-Utils] PaddleOCR 사용 가능 (Lazy 초기화)")
except ImportError:
    print("[OCR-Utils] PaddleOCR 미설치 → EasyOCR 폴백")


def _get_paddle_reader():
    global _paddle_reader
    if _paddle_reader is None:
        from paddleocr import PaddleOCR
        _paddle_reader = PaddleOCR(use_angle_cls=True, lang="korean", show_log=False)
        print("[OCR-Utils] PaddleOCR 초기화 완료")
    return _paddle_reader

# ─────────────────────────────────────────────────────────────────
# 3. thefuzz 초기화
# ─────────────────────────────────────────────────────────────────

FUZZY_AVAILABLE = False
try:
    from thefuzz import process as fuzz_process  # type: ignore
    FUZZY_AVAILABLE = True
    print("[OCR-Utils] thefuzz 사용 가능")
except ImportError:
    import difflib  # 폴백
    print("[OCR-Utils] thefuzz 미설치 → difflib 폴백")

# ─────────────────────────────────────────────────────────────────
# 4. 이미지 전처리
# ─────────────────────────────────────────────────────────────────

def preprocess_for_ocr(image: np.ndarray) -> np.ndarray:
    """
    성분표 이미지에 최적화된 전처리 파이프라인:
    1. 그레이스케일
    2. CLAHE 대비 강화
    3. 이진화 (Otsu)
    4. 노이즈 제거 (Morphological)
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # CLAHE: 작은 글씨 대비 향상
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)

    # Otsu 이진화
    _, binary = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # 모폴로지 노이즈 제거
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    cleaned = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)

    # PaddleOCR은 컬러 이미지를 선호하므로 3채널로 복원
    result = cv2.cvtColor(cleaned, cv2.COLOR_GRAY2BGR)
    return result

# ─────────────────────────────────────────────────────────────────
# 5. 퍼지 매칭 성분명 교정
# ─────────────────────────────────────────────────────────────────

def fuzzy_correct_ingredient(raw: str, threshold: int = 75) -> Optional[str]:
    """
    인식된 원시 텍스트를 ingredient_mapping.json 키에 퍼지 매칭하여 교정.

    Args:
        raw: OCR이 인식한 원시 텍스트 (예: '글리세라', '나이아신마이드')
        threshold: 유사도 최소 기준 (0~100, 기본 75)

    Returns:
        교정된 표준 성분명 (한글), 매칭 실패 시 None
    """
    normalized = unicodedata.normalize("NFC", raw).strip().lower()

    # 1. 정확 매칭 우선
    if normalized in INGREDIENT_MAP:
        return list(INGREDIENT_MAP.keys())[list(INGREDIENT_MAP.keys()).index(normalized)]

    if not INGREDIENT_KEYS:
        return None

    # 2. 퍼지 매칭
    if FUZZY_AVAILABLE:
        match, score = fuzz_process.extractOne(normalized, INGREDIENT_KEYS)
        if score >= threshold:
            return match
    else:
        # difflib 폴백
        import difflib
        matches = difflib.get_close_matches(normalized, INGREDIENT_KEYS, n=1, cutoff=threshold / 100)
        if matches:
            return matches[0]

    return None

# ─────────────────────────────────────────────────────────────────
# 6. 텍스트 파싱 — 성분 블록 추출
# ─────────────────────────────────────────────────────────────────

# 성분표 시작 마커 패턴 (한글/영문)
_INGREDIENT_MARKERS = [
    r"전성분[：:·\s]?",
    r"성\s*분[：:·\s]?",
    r"ingredients?[：:·\s]?",
    r"all\s+ingredients?[：:·\s]?",
]
_MARKER_RE = re.compile("|".join(_INGREDIENT_MARKERS), re.IGNORECASE)

def extract_ingredient_block(full_text: str) -> str:
    """
    OCR 전체 텍스트에서 '전성분:' 이후 성분 블록만 추출.
    마커가 없으면 전체 반환.
    """
    match = _MARKER_RE.search(full_text)
    if match:
        return full_text[match.end():].strip()
    return full_text


def split_ingredients(block: str) -> list[str]:
    """
    성분 블록을 개별 성분으로 분리.
    구분자: 쉼표(,), 글자 방점(·), 슬래시(/), 줄바꿈
    """
    tokens = re.split(r"[,·/\n]+", block)
    cleaned = []
    for t in tokens:
        t = t.strip().rstrip(".")
        # 너무 짧거나 숫자/특수문자만인 경우 제외
        if len(t) >= 2 and not re.match(r"^[\d\s\(\)\[\]%]+$", t):
            cleaned.append(t)
    return cleaned

# ─────────────────────────────────────────────────────────────────
# 7. PaddleOCR 실행 메인 함수
# ─────────────────────────────────────────────────────────────────

def run_paddleocr(image: np.ndarray) -> dict:
    """
    PaddleOCR를 실행하고 성분 리스트를 반환합니다.

    Returns:
        {
            "full_text": str,             # 전체 인식 텍스트
            "ingredients": list[str],     # 교정된 성분명 리스트
            "raw_boxes": list             # 원시 박스 데이터
        }
    """
    if not PADDLEOCR_AVAILABLE:
        raise RuntimeError("PaddleOCR이 설치되지 않았습니다. `pip install paddlepaddle paddleocr` 실행 후 재시도하세요.")

    processed = preprocess_for_ocr(image)
    reader = _get_paddle_reader()

    # PaddleOCR는 NumPy 배열 직접 지원
    result = reader.ocr(processed, cls=True)

    raw_boxes = []
    text_lines = []

    if result and result[0]:
        for line in result[0]:
            bbox, (text, confidence) = line
            if confidence > 0.4:
                raw_boxes.append({"text": text, "confidence": confidence})
                text_lines.append(text)

    full_text = "\n".join(text_lines)
    print(f"[PaddleOCR] 인식된 텍스트 블록 수: {len(raw_boxes)}")
    print(f"[PaddleOCR] 텍스트 미리보기: {full_text[:300]}...")

    # 성분 블록 추출 및 분리
    ing_block = extract_ingredient_block(full_text)
    raw_ingredients = split_ingredients(ing_block)

    # 퍼지 매칭으로 성분명 교정
    corrected_ingredients = []
    for raw in raw_ingredients:
        corrected = fuzzy_correct_ingredient(raw)
        if corrected:
            corrected_ingredients.append(corrected)
            if corrected.lower() != raw.lower():
                print(f"[Fuzzy] '{raw}' → '{corrected}'")
        else:
            # 교정 실패해도 원시 텍스트 유지 (Gemini가 추후 보정)
            corrected_ingredients.append(raw)

    # 중복 제거
    seen = set()
    unique_ingredients = []
    for ing in corrected_ingredients:
        key = ing.lower()
        if key not in seen:
            seen.add(key)
            unique_ingredients.append(ing)

    print(f"[PaddleOCR] 최종 성분 수: {len(unique_ingredients)}")
    return {
        "full_text": full_text,
        "ingredients": unique_ingredients,
        "raw_boxes": raw_boxes,
    }

# ─────────────────────────────────────────────────────────────────
# 8. 통합 OCR 실행 (우선순위: PaddleOCR → EasyOCR → 에러)
# ─────────────────────────────────────────────────────────────────

def run_best_ocr(image: np.ndarray) -> dict:
    """
    사용 가능한 최선의 OCR 엔진을 선택하여 실행합니다.
    PaddleOCR > EasyOCR 순서로 시도합니다.
    """
    if PADDLEOCR_AVAILABLE:
        try:
            print("[OCR-Utils] PaddleOCR 실행 중...")
            return run_paddleocr(image)
        except Exception as e:
            print(f"[OCR-Utils] PaddleOCR 실패: {e} → EasyOCR 폴백 시도")

    # EasyOCR 폴백 (main.py의 기존 run_easyocr 함수 활용)
    try:
        import easyocr
        print("[OCR-Utils] EasyOCR 폴백 실행 중...")

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)

        reader = easyocr.Reader(["ko", "en"])
        results = reader.readtext(enhanced, detail=1)

        raw_boxes = []
        text_lines = []
        for (_, text, prob) in results:
            if prob > 0.35:
                raw_boxes.append({"text": text, "confidence": prob})
                text_lines.append(text)

        full_text = "\n".join(text_lines)
        ing_block = extract_ingredient_block(full_text)
        raw_ingredients = split_ingredients(ing_block)

        corrected = []
        for raw in raw_ingredients:
            fixed = fuzzy_correct_ingredient(raw)
            corrected.append(fixed if fixed else raw)

        return {
            "full_text": full_text,
            "ingredients": list(dict.fromkeys(corrected)),
            "raw_boxes": raw_boxes,
        }
    except Exception as e:
        print(f"[OCR-Utils] EasyOCR도 실패: {e}")
        return {"full_text": "", "ingredients": [], "raw_boxes": []}
