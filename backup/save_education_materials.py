import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("CAREERNET_API_KEY")

url = "https://www.career.go.kr/cnet/openapi/getOpenApi.json"

params = {
    "apiKey": API_KEY,
    "svcType": "api",
    "svcCode": "EDU",
    "contentType": "json"
}

print("진로교육자료 데이터 요청 중...")

response = requests.get(url, params=params)

response.raise_for_status()

data = response.json()

os.makedirs("data", exist_ok=True)

save_path = os.path.join("data", "education_materials.json")

with open(save_path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("-" * 50)
print("저장 완료!")
print(f"저장 위치: {save_path}")