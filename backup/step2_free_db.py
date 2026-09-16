import json
import os
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document

# 1. 제미나이 API 키 설정
os.environ["GOOGLE_API_KEY"] = "너의_API_KEY"

def create_free_vector_db():

    # JSON 파일 경로
    json_path = os.path.join("data", "career_data.json")

    # 2. JSON 데이터 읽기
    if not os.path.exists(json_path):
        print("에러: data/career_data.json 파일이 없습니다.")
        return

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    job_list = data["dataSearch"]["content"]

    # 3. AI 학습용 데이터 변환
    documents = []
    print(f"총 {len(job_list)}개의 직업 데이터를 가공 중입니다...")

    for job in job_list:
        name = job.get('jobnm') or job.get('jobNm') or "이름 없음"
        summary = job.get('job_summary') or job.get('job_dic_list') or "내용 없음"

        page_content = f"직업명: {name}\n개요: {summary}"

        metadata = {"job_name": name}

        documents.append(
            Document(
                page_content=page_content,
                metadata=metadata
            )
        )

    # 4. 임베딩 모델
    print("임베딩 모델 로드 중...")
    embeddings = HuggingFaceEmbeddings(
        model_name="jhgan/ko-sroberta-multitask",
        model_kwargs={'device': 'cpu'}
    )

    # 5. ChromaDB 생성
    print("벡터 DB 생성 중...")
    vector_db = Chroma.from_documents(
        documents=documents,
        embedding=embeddings,
        persist_directory="./career_db_free"
    )

    print("완료!")

if __name__ == "__main__":
    create_free_vector_db()