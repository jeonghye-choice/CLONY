import requests

API_KEY = "1e21b6e85e900ad61362755eb97c595b60d86b4e19b51958a9b39345323b613a"
endpoints = [
    "http://apis.data.go.kr/1471000/CsmtcsIngdCpntInfoService01/getCsmtcsIngdCpntList", # 1
    "http://apis.data.go.kr/1471000/CsmtcsIngdInfoService01/getCsmtcsIngdInfoList01", # 2
    "https://apis.data.go.kr/1471000/CsmtcsIngdInfoService01/getCsmtcsIngdInfoList01", # 3
]

for i, url in enumerate(endpoints):
    print(f"Testing {i+1}: {url}")
    params = {"serviceKey": API_KEY, "pageNo": 1, "numOfRows": 1, "type": "json"}
    try:
        res = requests.get(url, params=params, timeout=5)
        print(f"Status: {res.status_code}")
        print(f"Body: {res.text[:200]}")
    except Exception as e:
        print(f"Error: {e}")
    print("-" * 20)
