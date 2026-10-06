# 커리어넷 오픈API에서 진로추천(RAG)용 데이터를 받아 data/*.json으로 저장한다.
# 실행: python fetch_careernet.py  (루트 .env의 CAREERNET_API_KEY 필요)
# 다음 단계: python build_career_index.py  (백엔드용 검색 인덱스 재생성)

import json
import os

import requests
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("CAREERNET_API_KEY", "").strip()
if not API_KEY:
    raise SystemExit(".env에 CAREERNET_API_KEY를 설정하세요.")

OPEN_API = "https://www.career.go.kr/cnet/openapi/getOpenApi.json"
JOBS_API = "https://www.career.go.kr/cnet/front/openapi/jobs.json"


def get(url, **params):
    r = requests.get(url, params={"apiKey": API_KEY, **params}, timeout=30)
    r.raise_for_status()
    return r.json()


def open_api(svc_code, **params):
    """getOpenApi 목록을 한 번에 받는다. 결과는 기존 형식 그대로 {"dataSearch": {"content": [...]}}"""
    data = get(OPEN_API, svcType="api", svcCode=svc_code, contentType="json", perPage="1000", **params)
    content = data.get("dataSearch", {}).get("content", [])
    if not content or "message" in content[0]:
        raise SystemExit(f"{svc_code} 요청 실패: {data}")
    return data, len(content)


def job_encyclopedia():
    """직업백과는 10개씩 페이지로 나뉘어 있어서 전부 돌며 합친다. 항목별로 문서가 되도록 리스트로 저장."""
    first = get(JOBS_API, pageIndex=1)
    pages = -(-first["count"] // first["pageSize"])
    jobs = first["jobs"]
    for page in range(2, pages + 1):
        jobs += get(JOBS_API, pageIndex=page)["jobs"]
        print(f"  직업백과 {page}/{pages} 페이지", end="\r")
    print()
    return jobs, len(jobs)


def save(name, data, count):
    path = os.path.join("data", name)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"저장: {path} ({count}개)")


if __name__ == "__main__":
    os.makedirs("data", exist_ok=True)
    save("career_data.json", *open_api("JOB"))
    save("major_info.json", *open_api("MAJOR", gubun="univ_list"))
    save("job_encyclopedia.json", *job_encyclopedia())
