# 커리어넷 데이터(data/*.json)를 Gemini 임베딩으로 미리 변환해서 Spring 백엔드가 읽을 검색 인덱스를 만든다.
# 실행: python build_career_index.py  (루트 .env의 GEMINI_API_KEY 필요)
# 데이터를 새로 받았을 때(fetch_careernet.py)만 다시 실행하면 된다. 결과 파일은 git에 함께 올린다.
# 모델/차원을 바꾸면 백엔드 CareerService의 EMBED_MODEL/쿼리 차원도 같이 바꿔야 함 (같은 공간에서 비교해야 하므로)

import base64
import json
import os
import struct
import time

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()
API_KEY = (os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or "").strip()
if not API_KEY:
    raise SystemExit(".env에 GEMINI_API_KEY를 설정하세요.")

MODEL = "gemini-embedding-001"
DIM = 768
# 무료 키는 분당 토큰 한도가 낮아서 100개씩 보내면 429가 난다. 작게 나눠 천천히 보낸다.
BATCH = 20
PAUSE_SEC = 15
OUT = os.path.join("mentoring", "src", "main", "resources", "career", "career_index.json")
# 하루 한도에 걸려 중간에 멈춰도 다시 실행하면 이어서 진행하도록 완료된 결과를 저장 (git 제외)
CACHE = os.path.join("data", ".embed_cache.json")


def load(name):
    with open(os.path.join("data", name), encoding="utf-8") as f:
        return json.load(f)


def clean(v):
    return " ".join(str(v or "").split())


def build_docs():
    docs = []
    for j in load("career_data.json")["dataSearch"]["content"]:
        docs.append(f"[직업] {clean(j.get('job'))}\n분류: {clean(j.get('profession'))}\n"
                    f"하는 일: {clean(j.get('summary'))}\n유사 직업: {clean(j.get('similarJob'))}\n"
                    f"연봉: {clean(j.get('salery'))} / 발전 가능성: {clean(j.get('possibility'))} / 고용 평등: {clean(j.get('equalemployment'))}")
    for m in load("major_info.json")["dataSearch"]["content"]:
        docs.append(f"[학과] {clean(m.get('mClass'))} ({clean(m.get('lClass'))})\n세부 학과명: {clean(m.get('facilName'))}")
    for e in load("job_encyclopedia.json"):
        docs.append(f"[직업백과] {clean(e.get('job_nm'))}\n직업군: {clean(e.get('top_nm'))} / {clean(e.get('aptit_name'))}\n"
                    f"하는 일: {clean(e.get('work'))}\n관련 직업: {clean(e.get('rel_job_nm'))}\n"
                    f"임금: {clean(e.get('wage'))} / 일과 삶의 균형: {clean(e.get('wlb'))} / 사회적 평판: {clean(e.get('social'))}")
    return docs


def embed_all(client, texts):
    """text -> base64 벡터. 캐시에 있는 문서는 건너뛴다."""
    cache = {}
    if os.path.exists(CACHE):
        with open(CACHE, encoding="utf-8") as f:
            cache = json.load(f)
    todo = [t for t in dict.fromkeys(texts) if t not in cache]
    print(f"  이미 완료 {len(texts) - len(todo)}개, 남은 문서 {len(todo)}개")

    for i in range(0, len(todo), BATCH):
        chunk = todo[i:i + BATCH]
        for attempt in range(8):
            try:
                res = client.models.embed_content(
                    model=MODEL, contents=chunk,
                    config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT", output_dimensionality=DIM))
                break
            except Exception as e:  # 분당 한도(429)면 잠시 쉬었다 재시도, 계속 실패하면 하루 한도일 수 있음
                if attempt == 7:
                    raise SystemExit(f"계속 실패합니다. 하루 한도일 수 있으니 내일 다시 실행하세요 (진행 상황은 저장됨): {str(e)[:120]}")
                print(f"  한도 대기 60초 ({str(e)[:60]})")
                time.sleep(60)
        for t, e in zip(chunk, res.embeddings):
            cache[t] = encode(e.values)
        with open(CACHE, "w", encoding="utf-8") as f:
            json.dump(cache, f, ensure_ascii=False)
        print(f"  {len(texts) - len(todo) + i + len(chunk)}/{len(texts)}")
        time.sleep(PAUSE_SEC)
    return [cache[t] for t in texts]


def encode(vec):
    # 768차원 이하는 정규화돼서 나오지 않으므로 직접 정규화 -> 백엔드는 내적만으로 코사인 유사도 계산
    norm = sum(x * x for x in vec) ** 0.5 or 1.0
    return base64.b64encode(struct.pack(f"<{len(vec)}f", *(x / norm for x in vec))).decode()


if __name__ == "__main__":
    texts = build_docs()
    print(f"문서 {len(texts)}개 임베딩 중 ({MODEL}, {DIM}차원)")
    vectors = embed_all(genai.Client(api_key=API_KEY), texts)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({"model": MODEL, "dim": DIM,
                   "docs": [{"text": t, "vector": v} for t, v in zip(texts, vectors)]},
                  f, ensure_ascii=False)
    print(f"저장: {OUT} ({os.path.getsize(OUT) // 1024}KB)")
