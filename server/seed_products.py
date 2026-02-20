import sqlite3
import json
import random

DB_NAME = "clony.db"

# 1. Real Data with Images (Olive Young Best)
products_data = [
    {
        "name": "1025 독도 토너",
        "brand": "라운드랩",
        "category": "토너/패드",
        "price": 13500,
        "image_url": "https://image.oliveyoung.co.kr/uploads/images/goods/550/10/0000/0014/A00000014552401ko.jpg?l=ko",
        "ingredients": [
            {"name": "Houttuynia Cordata Extract", "nameKo": "어성초 추출물", "benefit": "진정"},
            {"name": "Panthenol", "nameKo": "판테놀", "benefit": "장벽강화"}
        ],
        "skin_scores": {"OSNW": 95, "DSNT": 88}
    },
    {
        "name": "자작나무 수분 크림",
        "brand": "라운드랩",
        "category": "크림",
        "price": 23000,
        "image_url": "https://image.oliveyoung.co.kr/uploads/images/goods/550/10/0000/0013/A00000013718012ko.jpg?l=ko",
        "ingredients": [
             {"name": "Betula Platyphylla Japonica Juice", "nameKo": "자작나무수액", "benefit": "수분공급"},
             {"name": "Hyaluronic Acid", "nameKo": "히알루론산", "benefit": "보습"}
        ],
        "skin_scores": {"OSNW": 85, "DSNT": 98}
    },
    {
        "name": "다이브인 저분자 히알루론산 세럼",
        "brand": "토리든",
        "category": "에센스/세럼",
        "price": 16000,
        "image_url": "https://image.oliveyoung.co.kr/uploads/images/goods/550/10/0000/0012/A00000012975913ko.jpg?l=ko",
        "ingredients": [
            {"name": "Hyaluronic Acid", "nameKo": "히알루론산", "benefit": "속보습충전"},
            {"name": "D-Panthenol", "nameKo": "D-판테놀", "benefit": "진정"}
        ],
        "skin_scores": {"OSNW": 90, "DSNT": 96}
    },
    {
        "name": "레드 블레미쉬 클리어 수딩 크림",
        "brand": "닥터지",
        "category": "크림",
        "price": 28800,
        "image_url": "https://image.oliveyoung.co.kr/uploads/images/goods/550/10/0000/0014/A00000014733907ko.jpg?l=ko",
        "ingredients": [
            {"name": "Cica Complex", "nameKo": "시카 컴플렉스", "benefit": "강력 진정"},
            {"name": "Madecassoside", "nameKo": "마데카소사이드", "benefit": "재생"}
        ],
        "skin_scores": {"OSNW": 99, "DSNT": 85}
    },
    {
        "name": "그린탠저린 비타C 잡티 케어 세럼",
        "brand": "구달",
        "category": "에센스/세럼",
        "price": 24000,
        "image_url": "https://image.oliveyoung.co.kr/uploads/images/goods/550/10/0000/0014/A00000014720917ko.jpg?l=ko",
        "ingredients": [
            {"name": "Citrus Tangerina Extract", "nameKo": "청귤추출물", "benefit": "잡티케어"},
            {"name": "Niacinamide", "nameKo": "나이아신아마이드", "benefit": "미백"}
        ],
        "skin_scores": {"OSNW": 88, "DSNT": 92}
    },
    {
        "name": "어성초 77 수딩 토너",
        "brand": "아누아",
        "category": "토너/패드",
        "price": 20500,
        "image_url": "https://image.oliveyoung.co.kr/uploads/images/goods/550/10/0000/0013/A00000013838411ko.jpg?l=ko",
        "ingredients": [
            {"name": "Houttuynia Cordata", "nameKo": "어성초", "benefit": "트러블진정"}
        ],
        "skin_scores": {"OSNW": 97, "DSNT": 80}
    },
    {
        "name": "마데카소사이드 흔적 패드",
        "brand": "메디힐",
        "category": "토너/패드",
        "price": 17900,
        "image_url": "https://image.oliveyoung.co.kr/uploads/images/goods/550/10/0000/0017/A00000017192606ko.jpg?l=ko",
        "ingredients": [
            {"name": "Madecassoside", "nameKo": "마데카소사이드", "benefit": "흔적진정"}
        ],
        "skin_scores": {"OSNW": 93, "DSNT": 90}
    },
    # 2. Additional Rich Data from K-Beauty Dataset (Images are emojis in source, so handled as text or empty)
    {
        "name": "Advanced Snail 96 Mucin Power Essence",
        "brand": "COSRX",
        "category": "에센스",
        "price": 21000,
        "image_url": "",
        "ingredients": [
            {"name": "Snail Secretion Filtrate", "nameKo": "달팽이점액여과물", "benefit": "보습, 재생"}
        ],
        "skin_scores": {"OSNW": 85, "DSNT": 95, "ORPT": 80, "DRPT": 90}
    },
    {
        "name": "BHA Blackhead Power Liquid",
        "brand": "COSRX",
        "category": "각질제거",
        "price": 19500,
        "image_url": "",
        "ingredients": [
            {"name": "Betaine Salicylate", "nameKo": "베타인살리실레이트 (BHA)", "benefit": "각질제거, 모공"}
        ],
        "skin_scores": {"OSNW": 98, "DSNT": 60, "ORPT": 95, "DRPT": 65}
    },
    {
        "name": "Low pH Good Morning Gel Cleanser",
        "brand": "COSRX",
        "category": "클렌저",
        "price": 12000,
        "image_url": "",
        "ingredients": [
            {"name": "Tea Tree Oil", "nameKo": "티트리오일", "benefit": "진정, 항균"}
        ],
        "skin_scores": {"OSNW": 92, "DSNT": 75, "ORPT": 90, "DRPT": 80}
    },
    {
        "name": "Peach 77% Niacin Essence Toner",
        "brand": "Anua",
        "category": "토너",
        "price": 24000,
        "image_url": "",
        "ingredients": [
            {"name": "Peach Extract", "nameKo": "복숭아추출물", "benefit": "보습, 생기"},
            {"name": "Niacinamide", "nameKo": "나이아신아마이드", "benefit": "미백"}
        ],
        "skin_scores": {"OSNW": 85, "DSNT": 90}
    },
    {
        "name": "Reedle Shot 100 Essence",
        "brand": "VT",
        "category": "에센스",
        "price": 32000,
        "image_url": "",
        "ingredients": [
            {"name": "Cica Reedle", "nameKo": "시카 리들", "benefit": "피부결, 흡수촉진"}
        ],
        "skin_scores": {"OSNW": 90, "DSNT": 88, "ORPT": 92}
    },
    {
        "name": "Cica Sleeping Mask",
        "brand": "VT",
        "category": "마스크팩",
        "price": 22000,
        "image_url": "",
        "ingredients": [
            {"name": "Centella Asiatica", "nameKo": "병풀추출물", "benefit": "진정"}
        ],
        "skin_scores": {"OSNW": 95, "DSNT": 90}
    },
    {
        "name": "Mask Fit Red Cushion",
        "brand": "TIRTIR",
        "category": "메이크업",
        "price": 29000,
        "image_url": "",
        "ingredients": [
             {"name": "Hibiscus Sabdariffa Flower Extract", "nameKo": "히비스커스 꽃 추출물", "benefit": "항산화"}
        ],
        "skin_scores": {"OSNW": 80, "DSNT": 85}
    },
    {
        "name": "Supple Preparation Facial Toner",
        "brand": "Dear Klairs",
        "category": "토너",
        "price": 18900,
        "image_url": "",
        "ingredients": [
            {"name": "Hyaluronic Acid", "nameKo": "히알루론산", "benefit": "보습"},
            {"name": "Centella Asiatica Extract", "nameKo": "병풀추출물", "benefit": "진정"}
        ],
        "skin_scores": {"OSNW": 85, "DSNT": 98, "DRNW": 95}
    },
    {
        "name": "Freshly Juiced Vitamin Drop",
        "brand": "Dear Klairs",
        "category": "세럼",
        "price": 21900,
        "image_url": "",
        "ingredients": [
            {"name": "Vitamin C", "nameKo": "비타민C", "benefit": "미백, 흔적케어"}
        ],
        "skin_scores": {"OSNW": 88, "DSNT": 70, "ORPT": 90}
    },
     {
        "name": "Relief Sun: Rice + Probiotics",
        "brand": "Beauty of Joseon",
        "category": "선크림",
        "price": 18000,
        "image_url": "",
        "ingredients": [
            {"name": "Rice Extract", "nameKo": "쌀추출물", "benefit": "영양, 미백"},
             {"name": "Probiotics", "nameKo": "프로바이오틱스", "benefit": "균형"}
        ],
        "skin_scores": {"OSNW": 82, "DSNT": 96}
    },
     {
        "name": "Dynasty Cream",
        "brand": "Beauty of Joseon",
        "category": "크림",
        "price": 24000,
        "image_url": "",
        "ingredients": [
            {"name": "Rice Bran Water", "nameKo": "쌀겨수", "benefit": "보습, 윤기"},
            {"name": "Ginseng Water", "nameKo": "인삼수", "benefit": "영양, 활력"}
        ],
        "skin_scores": {"OSNW": 70, "DSNT": 99}
    },
    {
        "name": "Hyaluronic Acid Watery Sun Gel",
        "brand": "Isntree",
        "category": "선크림",
        "price": 21000,
        "image_url": "",
        "ingredients": [
            {"name": "Hyaluronic Acid", "nameKo": "히알루론산 8종", "benefit": "수분, 자외선차단"}
        ],
        "skin_scores": {"OSNW": 92, "DSNT": 95}
    },
    {
        "name": "Green Tea Fresh Toner",
        "brand": "Isntree",
        "category": "토너",
        "price": 16500,
        "image_url": "",
        "ingredients": [
            {"name": "Green Tea Extract", "nameKo": "제주 녹차 추출물", "benefit": "피지조절, 진정"}
        ],
        "skin_scores": {"OSNW": 99, "DSNT": 75}
    },
    {
        "name": "제주 화산송이 모공 클렌징 폼",
        "brand": "Innisfree",
        "category": "클렌저",
        "price": 11000,
        "image_url": "",
        "ingredients": [
            {"name": "Volcanic Clusters", "nameKo": "화산송이", "benefit": "모공, 피지"}
        ],
        "skin_scores": {"OSNW": 98, "DSNT": 60}
    },
    {
        "name": "Cicapair Tiger Grass Color Correcting Treatment",
        "brand": "Dr.Jart+",
        "category": "크림/메이크업",
        "price": 45000,
        "image_url": "",
        "ingredients": [
             {"name": "Centella Asiatica", "nameKo": "병풀 (시카)", "benefit": "진정, 커버"}
        ],
        "skin_scores": {"OSNW": 95, "DSNT": 90}
    }
]


def seed_products():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    
    # Reset Table
    c.execute("DROP TABLE IF EXISTS products")
    c.execute('''
        CREATE TABLE products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            brand TEXT NOT NULL,
            category TEXT,
            price INTEGER,
            image_url TEXT,
            ingredients_json TEXT,
            skin_type_score TEXT,
            matching_score INTEGER DEFAULT 0
        )
    ''')
    
    for p in products_data:
        c.execute('''
            INSERT INTO products (name, brand, category, price, image_url, ingredients_json, skin_type_score)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            p['name'],
            p['brand'],
            p['category'],
            p['price'],
            p['image_url'],
            json.dumps(p['ingredients']),
            json.dumps(p['skin_scores'])
        ))
        
    conn.commit()
    conn.close()
    print(f"✅ Product Database Seeded with {len(products_data)} REAL items!")

if __name__ == "__main__":
    seed_products()
