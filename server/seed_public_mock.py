import sqlite3
import json
import random

DB_NAME = "clony.db"

brands = ["이니스프리", "에뛰드", "미샤", "더페이스샵", "토니모리", "홀리카홀리카", "네이처리퍼블릭", "스킨푸드", "에스쁘아", "클리오"]
categories = ["스킨케어", "메이크업", "선케어", "클렌징", "마스크팩"]
ingredients_pool = [
    {"name": "Water", "nameKo": "정제수", "benefit": "보습"},
    {"name": "Glycerin", "nameKo": "글리세린", "benefit": "수분 유지"},
    {"name": "Butylene Glycol", "nameKo": "부틸렌글라이콜", "benefit": "보습"},
    {"name": "Niacinamide", "nameKo": "나이아신아마이드", "benefit": "미백"},
    {"name": "Adenosine", "nameKo": "아데노신", "benefit": "주름 개선"},
    {"name": "Centella Asiatica Extract", "nameKo": "병풀추출물", "benefit": "진정"},
    {"name": "Sodium Hyaluronate", "nameKo": "소듐하이알루로네이트", "benefit": "강력 보습"},
    {"name": "Panthenol", "nameKo": "판테놀", "benefit": "장벽 강화"},
    {"name": "Ceramide NP", "nameKo": "세라마이드엔피", "benefit": "피부 장벽"}
]

def generate_mock_data(count=100):
    products = []
    for i in range(count):
        brand = random.choice(brands)
        cat = random.choice(categories)
        name = f"{brand} {cat} {random.randint(100, 999)}"
        price = random.randint(10000, 50000)
        
        # 3-5 ingredients randomly
        num_ing = random.randint(3, 5)
        selected_ing = random.sample(ingredients_pool, num_ing)
        
        products.append({
            "name": name,
            "brand": brand,
            "category": cat,
            "price": price,
            "ingredients": selected_ing,
            "skin_scores": {"OSNW": random.randint(60, 99), "DSNT": random.randint(60, 99)}
        })
    return products

def seed_mock():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    
    products = generate_mock_data(100)
    added = 0
    
    for p in products:
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
            "", # No image
            json.dumps(p['ingredients']),
            json.dumps(p['skin_scores'])
        ))
        added += 1
        
    conn.commit()
    conn.close()
    print(f"✅ Seeded {added} simulated public data items to database!")

if __name__ == "__main__":
    seed_mock()
