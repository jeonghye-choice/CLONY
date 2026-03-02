import sqlite3
import pandas as pd

DB_NAME = "clony.db"

def list_users():
    try:
        conn = sqlite3.connect(DB_NAME)
        
        # SQL Query
        df = pd.read_sql_query("SELECT * FROM users", conn)
        
        if df.empty:
            print("\n[DB] 현재 가입된 회원이 없습니다.")
        else:
            print("\n[DB] 가입된 회원 목록:")
            print("="*40)
            print(df)
            print("="*40)
            
        conn.close()
    except Exception as e:
        # Fallback if pandas is not installed or other error
        print(f"\n[Warning] 상세 조회 실패 ({e}). 기본 모드로 조회합니다.\n")
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute("SELECT * FROM users")
        rows = c.fetchall()
        print(f"총 {len(rows)}명의 회원이 있습니다:")
        for row in rows:
            print(row)
        conn.close()

if __name__ == "__main__":
    list_users()
