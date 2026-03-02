"""
import_aihub_ingredients.py — AI-Hub 화장품 OCR 데이터로 성분 매핑 확장

사용법:
    python import_aihub_ingredients.py --input /path/to/aihub_labels/ --output ../database/ingredients/ingredient_mapping.json

AI-Hub 데이터 신청: https://aihub.or.kr/aihubdata/data/view.do?currMenu=115&topMenu=100&aihubDataSe=data&dataSetSn=71603
데이터셋: '의약품·화장품 패키징 OCR 데이터'
다운로드 후 annotation JSON 파일들이 있는 폴더를 --input 인자로 지정하세요.
"""

import json
import os
import re
import argparse
import unicodedata
from pathlib import Path


# ─── 파싱 헬퍼 ─────────────────────────────────────────────────

def normalize(text: str) -> str:
    """NFC 정규화 + 공백 제거"""
    return unicodedata.normalize("NFC", text).strip()


def extract_ingredients_from_label(label_path: str) -> list[str]:
    """
    AI-Hub 실제 JSON 형식에서 성분명 후보 텍스트 추출.

    실제 구조:
    {
        "category": 0 or 1,  # 0=의약품, 1=화장품
        "images": [{"class": "화장품", ...}],
        "annotations": [{
            "polygons": [
                {"type": int, "text": "성분명", ...},
                ...
            ]
        }]
    }
    type 값: 1=제품명, 2=브랜드명, 3=성분명, 4=용량, 5=기타 텍스트
    → type=3 이면 성분명 확실, 그 외는 화장품 클래스에서 추가 수집
    """
    with open(label_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 화장품 데이터만 처리 (의약품은 성분 형식이 달라 제외)
    image_class = ""
    if data.get("images"):
        image_class = data["images"][0].get("class", "")

    texts = []
    for ann in data.get("annotations", []):
        for poly in ann.get("polygons", []):
            text = poly.get("text", "").strip()
            poly_type = poly.get("type", 0)

            if not text or len(text) < 2:
                continue

            # type 3: 명시적 성분명
            if poly_type == 3:
                texts.append(normalize(text))
            # 화장품 라벨의 경우, 모든 텍스트에서 성분 후보 수집
            elif "화장품" in image_class:
                # 성분명 패턴: 한글+영문 혼합, 추출물/오일/애씨드 포함 단어
                if _looks_like_ingredient(text):
                    texts.append(normalize(text))

    return texts


_INGREDIENT_SUFFIXES = (
    "추출물", "오일", "에씨드", "애씨드", "글라이콜", "아민", "놀",
    "글리세린", "세라마이드", "히알루론산", "나이아신", "레티놀",
    "extract", "acid", "oil", "glycol", "amine",
)

def _looks_like_ingredient(text: str) -> bool:
    """성분명처럼 생긴 텍스트인지 휴리스틱 판단"""
    t = text.lower()
    if any(t.endswith(s) or s in t for s in _INGREDIENT_SUFFIXES):
        return True
    # 2~30자 사이, 숫자/특수문자만으로 이뤄지지 않은 텍스트
    if 2 <= len(text) <= 30 and not re.match(r"^[\d\s%()㎎mg]+$", text):
        return True
    return False



def guess_inci_name(ko_name: str) -> str:
    """
    한글 성분명에서 INCI 영문명을 추측.
    실제 매핑이 있으면 그것을 사용하고, 없으면 소문자 변환으로 힌트 제공.
    """
    # 자주 쓰이는 성분 변환 규칙 (확장 가능)
    KNOWN = {
        "정제수": "WATER",
        "글리세린": "GLYCERIN",
        "나이아신아마이드": "NIACINAMIDE",
        "부틸렌글라이콜": "BUTYLENE GLYCOL",
        "판테놀": "PANTHENOL",
        "병풀추출물": "CENTELLA ASIATICA EXTRACT",
        "히알루론산": "HYALURONIC ACID",
        "소듐하이알루로네이트": "SODIUM HYALURONATE",
        "알란토인": "ALLANTOIN",
        "세라마이드엔피": "CERAMIDE NP",
        "마데카소사이드": "MADECASSOSIDE",
        "살리실릭애씨드": "SALICYLIC ACID",
        "글라이콜릭애씨드": "GLYCOLIC ACID",
        "토코페롤": "TOCOPHEROL",
        "아스코빅애씨드": "ASCORBIC ACID",
        "레티놀": "RETINOL",
        "스쿠알란": "SQUALANE",
        "베타인": "BETAINE",
        "다이메티콘": "DIMETHICONE",
        "녹차추출물": "CAMELLIA SINENSIS LEAF EXTRACT",
        "알로에베라잎추출물": "ALOE BARBADENSIS LEAF EXTRACT",
        "1,2-헥산다이올": "1,2-HEXANEDIOL",
    }
    return KNOWN.get(ko_name, ko_name.upper())


# ─── 메인 로직 ─────────────────────────────────────────────────

def merge_into_mapping(new_ingredients: list[str], mapping: dict) -> tuple[dict, int]:
    """기존 매핑에 새 성분명 병합. 추가된 개수 반환."""
    added = 0
    for ko in new_ingredients:
        if ko not in mapping:
            mapping[ko] = guess_inci_name(ko)
            added += 1
    return mapping, added


def main():
    parser = argparse.ArgumentParser(description="AI-Hub 화장품 OCR 데이터로 성분 매핑 확장")
    parser.add_argument("--input", required=True, help="AI-Hub 라벨 JSON 폴더 경로")
    parser.add_argument(
        "--output",
        default=os.path.join(os.path.dirname(__file__), "../database/ingredients/ingredient_mapping.json"),
        help="출력 매핑 JSON 경로",
    )
    args = parser.parse_args()

    input_dir = Path(args.input)
    output_path = Path(args.output)

    # 기존 매핑 로드
    if output_path.exists():
        with open(output_path, "r", encoding="utf-8") as f:
            mapping = json.load(f)
        print(f"[Import] 기존 매핑 로드: {len(mapping)}개 성분")
    else:
        mapping = {}
        print("[Import] 새 매핑 파일 생성")

    # AI-Hub 라벨 파일 순회
    label_files = list(input_dir.rglob("*.json"))
    print(f"[Import] 처리할 라벨 파일: {len(label_files)}개")

    all_ingredients = []
    for label_path in label_files:
        try:
            ingredients = extract_ingredients_from_label(str(label_path))
            all_ingredients.extend(ingredients)
        except Exception as e:
            print(f"[Import] {label_path.name} 처리 실패: {e}")

    print(f"[Import] 추출된 총 성분 후보: {len(all_ingredients)}개 (중복 포함)")

    # 중복 제거
    unique_ingredients = list(dict.fromkeys(all_ingredients))
    print(f"[Import] 중복 제거 후: {len(unique_ingredients)}개")

    # 기존 매핑과 병합
    mapping, added = merge_into_mapping(unique_ingredients, mapping)
    print(f"[Import] 새로 추가된 성분: {added}개 → 전체: {len(mapping)}개")

    # 저장
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(mapping, f, ensure_ascii=False, indent=2)
    print(f"[Import] 저장 완료: {output_path}")


if __name__ == "__main__":
    main()
