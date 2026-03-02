import sqlite3
import json
import requests
import xml.etree.ElementTree as ET
import time

# ============================================================
# Config
# ============================================================
DB_NAME = "clony.db"
API_KEY = "1e21b6e85e900ad61362755eb97c595b60d86b4e19b51958a9b39345323b613a"
# 화장품 성분 구성 정보 API (Component Info - main.py reference)
BASE_URL = "http://apis.data.go.kr/1471000/CsmtcsIngdCpntInfoService01/getCsmtcsIngdCpntList"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS products (
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
    conn.commit()
    conn.close()

def fetch_and_sync_ingredients(num_pages=5, rows_per_page=50):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    total_added = 0
    
    print(f"🚀 Starting Sync: {num_pages} pages, {rows_per_page} rows per page")
    
    for page in range(1, num_pages + 1):
        # ⚠️ 공공데이터포털 serviceKey는 이미 인코딩되어 있을 수 있어 수동으로 URL 조립 권장
        url = f"{BASE_URL}?serviceKey={API_KEY}&pageNo={page}&numOfRows={rows_per_page}&type=json"
        
        try:
            print(f"📦 Fetching page {page}...")
            response = requests.get(url, timeout=15)
            
            if response.status_code != 200:
                print(f"❌ Error: {response.status_code}")
                continue

            # Check if response is JSON
            data = None
            try:
                data = response.json()
            except:
                # If not JSON, try XML (sometimes returns XML even if type=json requested on error)
                print("⚠️ Not a JSON response, checking for XML error...")
                if b"<returnAuthMsg>" in response.content:
                    msg = ET.fromstring(response.content).findtext(".//returnAuthMsg")
                    print(f"❌ API Auth Error: {msg}")
                    break
                continue

            body = data.get('response', {}).get('body', {})
            items = body.get('items', [])
            if isinstance(items, dict): items = items.get('item', [])
            
            if not items:
                print(f"⚠️ No items on page {page}. Total results reported: {body.get('totalCount')}")
                break
                
            for item in items:
                name = item.get('item_name', 'Unknown Product')
                brand = item.get('entp_name', '공공데이터')
                category = "화장품"
                ing_str = item.get('ingr_name', '')
                ing_list = [i.strip() for i in ing_str.split(',') if i.strip()]
                ingredients = [{"name": ing, "nameKo": ing, "benefit": "성분 포함"} for ing in ing_list]
                
                c.execute("SELECT id FROM products WHERE name = ?", (name,))
                if c.fetchone(): continue
                
                c.execute('''
                    INSERT INTO products (name, brand, category, price, image_url, ingredients_json, skin_type_score)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (name, brand, category, 0, "", json.dumps(ingredients), json.dumps({"OSNW": 75, "DSNT": 75})))
                total_added += 1
            
            conn.commit()
            print(f"✅ Page {page} synced (Added {len(items)} items). Total: {total_added}")
            time.sleep(1)
            
        except Exception as e:
            print(f"❌ Exception on page {page}: {e}")
            break
            
    conn.close()
    print(f"🎊 Sync Complete! Added {total_added} products from MFDS.")

if __name__ == "__main__":
    init_db()
    fetch_and_sync_ingredients(num_pages=5, rows_per_page=50)

if __name__ == "__main__":
    init_db()
    fetch_and_sync_ingredients(num_pages=3, rows_per_page=50)
