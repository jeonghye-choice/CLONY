import sqlite3
import json

DB_NAME = "clony.db"

# KBEAUTY_PRODUCTS 데이터 (data/kbeautyProducts.ts에서 수동 추출 및 변환)
# 전체를 다 넣으면 너무 길어지므로 주요 제품들 위주로 구성
migrated_data = [
    {
        "brand": "COSRX",
        "name": "Advanced Snail 96 Mucin Power Essence",
        "category": "에센스",
        "price": 21000,
        "image_url": "🐌",
        "ingredients": [
            {"name": "Snail Secretion Filtrate (96%)", "nameKo": "달팽이점액여과물", "benefit": "보습, 재생"}
        ],
        "skin_scores": {"OSNW": 95, "DSNT": 85}
    },
    {
        "brand": "COSRX",
        "name": "BHA Blackhead Power Liquid",
        "category": "각질제거",
        "price": 19500,
        "image_url": "💧",
        "ingredients": [
            {"name": "Betaine Salicylate (BHA)", "nameKo": "베타인살리실레이트", "benefit": "각질제거, 모공"}
        ],
        "skin_scores": {"OSNW": 98, "DSNT": 60}
    },
    {
        "brand": "Anua",
        "name": "Heartleaf 77% Soothing Toner",
        "category": "토너",
        "price": 20500,
        "image_url": "🌿",
        "ingredients": [
            {"name": "Houttuynia Cordata Extract (77%)", "nameKo": "어성초추출물", "benefit": "진정"}
        ],
        "skin_scores": {"OSNW": 97, "DSNT": 80}
    },
    {
        "brand": "VT",
        "name": "Reedle Shot 100 Essence",
        "category": "에센스",
        "price": 32000,
        "image_url": "💉",
        "ingredients": [
            {"name": "Cica Reedle", "nameKo": "시카 리들", "benefit": "흡수촉진"}
        ],
        "skin_scores": {"OSNW": 90, "DSNT": 88}
    },
    {
        "brand": "라운드랩",
        "name": "1025 독도 토너",
        "category": "토너",
        "price": 13500,
        "image_url": "⛰️",
        "ingredients": [
            {"name": "Deep Sea Water", "nameKo": "해수", "benefit": "미네랄 보습"}
        ],
        "skin_scores": {"OSNW": 95, "DSNT": 88}
    }
    # ... 더 많은 데이터를 추가할 수 있음
]

def migrate():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    
    # 중복 없이 삽입
    count = 0
    for p in migrated_data:
        c.execute("SELECT id FROM products WHERE name = ?", (p['name'],))
        if c.fetchone():
            continue
            
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
        count += 1
        
    conn.commit()
    conn.close()
    print(f"✅ Migrated {count} K-Beauty products to database!")

if __name__ == "__main__":
    migrate()
