# python career_api.py  (runs on :8080, matches vite's /api proxy target)

import os
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from google import genai

load_dotenv()

API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=API_KEY.strip()) if API_KEY else None
MODEL = "gemini-3-flash-preview"

embeddings = HuggingFaceEmbeddings(model_name="jhgan/ko-sroberta-multitask", model_kwargs={"device": "cpu"})
db = Chroma(persist_directory="career_db_free", embedding_function=embeddings)

app = Flask(__name__)


@app.route("/api/career/recommend", methods=["POST"])
def recommend():
    if client is None:
        return jsonify({"error": ".env에 GEMINI_API_KEY(또는 GOOGLE_API_KEY)를 설정하고 서버를 재시작하세요."}), 500

    answers = request.get_json(force=True) or {}
    query = " ".join(str(v) for v in answers.values() if v)
    docs = db.similarity_search(query, k=5) if query else []
    context = "\n\n".join(d.page_content for d in docs)

    prompt = f"""당신은 전문 커리어 멘토입니다. 아래 커리어넷 실제 데이터를 참고하여 사용자에게 IT 진로를 추천해주세요.

[참고 데이터]
{context}

[사용자 답변]
- 관심 분야: {answers.get('interest', '')}
- 기술 스택: {answers.get('techStack', '')}
- 자격증: {answers.get('certificates', '')}
- 성향/방식: {answers.get('personality', '')}

추천하는 구체적인 직무, 필요한 추가 기술 스택, 학습 로드맵을 한국어 마크다운으로 상세히 설명해주세요.
참고 데이터에 실려있는 실제 직업/학과 정보를 최대한 반영하고, 답변하지 않은 항목은 고려하지 마세요."""

    try:
        response = client.models.generate_content(model=MODEL, contents=prompt)
        text = response.text
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify({
        "result": text,
        "sources": [d.metadata.get("source_file") for d in docs],
    })


if __name__ == "__main__":
    app.run(port=8080, debug=False)
