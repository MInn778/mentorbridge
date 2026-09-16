import os
import json
import requests
from dotenv import load_dotenv

# .env 읽기
load_dotenv()

# API 키 가져오기
API_KEY = os.getenv("CAREERNET_API_KEY")

# 직업백과 API 주소
url = "https://www.career.go.kr/cnet/front/openapi/jobs.json"

params = {
    "apiKey": API_KEY
}

print("직업백과 데이터를 요청 중입니다...")

# API 요청
response = requests.get(url, params=params)

# 오류 확인
response.raise_for_status()

# JSON 변환
data = response.json()

# data 폴더 생성
os.makedirs("data", exist_ok=True)

# JSON 저장
save_path = os.path.join("data", "job_encyclopedia.json")

with open(save_path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("-" * 50)
print("저장 완료!")
print(f"저장 위치: {save_path}")