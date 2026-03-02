import sqlite3
import json
import requests
import time

# ============================================================
# Config
# ============================================================
DB_NAME = "clony.db"
# 식약처_화장품 원료성분정보 (Cosmetics Raw Material Information)
API_KEY = "1e21b6e85e900ad61362755eb97c595b60d86b4e19b51958a9b39345323b613a"
BASE_URL = "http://apis.data.go.kr/1471000/CsmtcsIngdInfoService01/getCsmtcsIngdInfoList01"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS ingredients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            name_en TEXT,
            cas_no TEXT,
            category TEXT,
            effect TEXT,
            description TEXT,
            good_for TEXT,
            caution TEXT,
            synergy TEXT,
            conflict TEXT,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def sync_ingredients(num_pages=5, rows_per_page=50):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    total_added = 0
    total_updated = 0
    
    print(f"🚀 Starting Ingredient Sync: {num_pages} pages, {rows_per_page} rows per page")
    
    for page in range(1, num_pages + 1):
        # API URL
        url = f"{BASE_URL}?serviceKey={API_KEY}&pageNo={page}&numOfRows={rows_per_page}&type=json"
        
        try:
            print(f"📦 Fetching page {page}...")
            response = requests.get(url, timeout=15)
            
            if response.status_code != 200:
                print(f"❌ Error: {response.status_code}")
                continue

            data = response.json()
            body = data.get('response', {}).get('body', {})
            items = body.get('items', [])
            if isinstance(items, dict): items = items.get('item', [])
            
            if not items:
                print(f"⚠️ No items on page {page}.")
                break
                
            for item in items:
                # API fields: ingd_name (KOR), ingd_eng_name (ENG), cas_no, origin_mjr_kora_nm (Effect/Category)
                name = item.get('ingd_name')
                if not name: continue
                
                name_en = item.get('ingd_eng_name', '')
                cas_no = item.get('cas_no', '')
                effect = item.get('origin_mjr_kora_nm', '')
                description = f"기원 및 정의: {item.get('origin_defnt_kora_nm', '정보 없음')}"
                
                # Check for existence
                c.execute("SELECT id FROM ingredients WHERE name = ?", (name,))
                row = c.fetchone()
                
                if row:
                    # Update existing
                    c.execute('''
                        UPDATE ingredients 
                        SET name_en = ?, cas_no = ?, effect = ?, description = ?, last_updated = CURRENT_TIMESTAMP
                        WHERE id = ?
                    ''', (name_en, cas_no, effect, description, row[0]))
                    total_updated += 1
                else:
                    # Insert new
                    c.execute('''
                        INSERT INTO ingredients (name, name_en, cas_no, effect, description)
                        VALUES (?, ?, ?, ?, ?)
                    ''', (name, name_en, cas_no, effect, description))
                    total_added += 1
            
            conn.commit()
            print(f"✅ Page {page} synced. Added: {total_added}, Updated: {total_updated}")
            time.sleep(0.5)
            
        except Exception as e:
            print(f"❌ Exception on page {page}: {e}")
            break
            
    conn.close()
    print(f"🎊 Ingredient Sync Complete! Total Added: {total_added}, Total Updated: {total_updated}")

if __name__ == "__main__":
    init_db()
    sync_ingredients(num_pages=5, rows_per_page=100)
