import requests
import xml.etree.ElementTree as ET

API_KEY = "1e21b6e85e900ad61362755eb97c595b60d86b4e19b51958a9b39345323b613a"
API_URL = "https://apis.data.go.kr/1471000/CsmtcsIngdCpntInfoService01/getCsmtcsIngdCpntList"

def test_api_variants(query):
    variants = [
        "https://apis.data.go.kr/1471000/CsmtcsIngdCpntInfoService01/getCsmtcsIngdCpntList",
        "http://apis.data.go.kr/1471000/CsmtcsIngdCpntInfoService01/getCsmtcsIngdCpntList",
        "https://apis.data.go.kr/1471000/CsmtcsIngdCpntInfoService/getCsmtcsIngdCpntList",
        "http://apis.data.go.kr/1471000/CsmtcsIngdCpntInfoService/getCsmtcsIngdCpntList",
    ]
    
    keys = [
        API_KEY,
        "data-portal-test-key"
    ]
    
    for url in variants:
        for key in keys:
            print(f"\n--- Testing URL: {url} | Key: {key[:10]}... ---")
            
            # 1. Query Param Test
            print("Trying Query Params...")
            try:
                params = {
                    "serviceKey": key,
                    "pageNo": "1",
                    "numOfRows": "1",
                    "type": "json"
                }
                # No ingdName first to see if key works
                response = requests.get(url, params=params, timeout=5)
                print(f"Query Result: {response.status_code}")
                if response.status_code == 200:
                    print("SUCCESS with no params!")
                    return
            except Exception as e:
                print(f"Query Error: {e}")

            # 2. Header Test (Infuser)
            print("Trying Header (Infuser)...")
            try:
                headers = {"Authorization": f"Infuser {key}"}
                response = requests.get(url, headers=headers, timeout=5)
                print(f"Header Result: {response.status_code}")
                if response.status_code == 200:
                    print("SUCCESS with header!")
                    return
            except Exception as e:
                print(f"Header Error: {e}")

    # FoodSafetyKorea Format
    fs_variants = [
        f"http://openapi.foodsafetykorea.go.kr/api/{API_KEY}/getCsmtcsIngdCpntList/json/1/5",
        f"http://openapi.foodsafetykorea.go.kr/api/{API_KEY}/C002/json/1/5", # C002 is a common candidate if it's coded
        f"http://openapi.foodsafetykorea.go.kr/api/{API_KEY}/I1270/json/1/5",
    ]
    
    for url in fs_variants:
        print(f"\n--- Testing FoodSafetyKorea URL: {url} ---")
        try:
            response = requests.get(url, timeout=5)
            print(f"Result: {response.status_code}")
            print(f"Content: {response.text[:200]}...")
            if response.status_code == 200 and "INFO-100" not in response.text:
                print("SUCCESS with FoodSafetyKorea!")
                return
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    test_api_variants("글리세린")
