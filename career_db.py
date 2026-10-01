import json
import os
import shutil
import time
from dotenv import load_dotenv

from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document

load_dotenv()

EMBEDDING_MODEL = "models/gemini-embedding-001"


def create_career_vector_db():
    data_folder = "data"
    db_folder = "career_db_free"

    if not os.path.exists(data_folder):
        print("에러: data 폴더가 없습니다.")
        return

    json_files = [f for f in os.listdir(data_folder) if f.endswith(".json")]

    if not json_files:
        print("에러: data 폴더 안에 JSON 파일이 없습니다.")
        return

    documents = []

    for filename in json_files:
        file_path = os.path.join(data_folder, filename)
        print(f"읽는 중: {filename}")

        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        if "dataSearch" in data:
            items = data["dataSearch"].get("content", [])

            for item in items:
                job_name = (
                    item.get("job")
                    or item.get("jobnm")
                    or item.get("jobNm")
                    or item.get("major")
                    or item.get("schoolName")
                    or item.get("title")
                    or "이름 없음"
                )

                summary = (
                    item.get("summary")
                    or item.get("job_summary")
                    or item.get("job_dic_list")
                    or item.get("content")
                    or item.get("description")
                    or item.get("majorSummary")
                    or "내용 없음"
                )

                page_content = json.dumps(item, ensure_ascii=False, indent=2)

                documents.append(
                    Document(
                        page_content=f"파일명: {filename}\n대표명: {job_name}\n요약: {summary}\n\n전체내용:\n{page_content}",
                        metadata={
                            "source_file": filename,
                            "name": job_name
                        }
                    )
                )

        elif isinstance(data, list):
            for item in data:
                text = json.dumps(item, ensure_ascii=False, indent=2)
                documents.append(
                    Document(
                        page_content=f"파일명: {filename}\n{text}",
                        metadata={"source_file": filename}
                    )
                )

        else:
            text = json.dumps(data, ensure_ascii=False, indent=2)
            documents.append(
                Document(
                    page_content=f"파일명: {filename}\n{text}",
                    metadata={"source_file": filename}
                )
            )

    print(f"\n총 Document 개수: {len(documents)}")

    if not documents:
        print("에러: 변환된 문서가 없습니다.")
        return

    if os.path.exists(db_folder):
        shutil.rmtree(db_folder)
        print("기존 career_db_free 삭제 완료")

    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("에러: GOOGLE_API_KEY(또는 GEMINI_API_KEY)가 설정되어 있지 않습니다.")
        return

    # 로컬 PyTorch 임베딩 모델(jhgan/ko-sroberta-multitask) 대신 Gemini 임베딩 API를 쓴다.
    # Render 무료 플랜(512MB RAM)에서는 PyTorch+transformers를 메모리에 올릴 수 없어서
    # 임베딩 자체를 API 호출로 대체해 서버 쪽 메모리 사용량을 거의 없앤다.
    print("임베딩 모델(Gemini API) 준비 중...")
    embeddings = GoogleGenerativeAIEmbeddings(model=EMBEDDING_MODEL, google_api_key=api_key)

    print("새 벡터 DB 생성 중...")
    # 한 배치에 넣는 문서가 많으면(특히 이 데이터처럼 문서 하나가 큰 경우) 요청 하나의 토큰 수가
    # 무료 티어의 분당 토큰 제한을 넘어서 429가 난다. 배치를 작게 쪼개고, 그래도 429가 나면
    # 지수 백오프로 재시도한다.
    BATCH_SIZE = 3
    MAX_RETRIES = 6
    vectordb = None
    total_batches = (len(documents) - 1) // BATCH_SIZE + 1
    for i in range(0, len(documents), BATCH_SIZE):
        batch = documents[i:i + BATCH_SIZE]
        batch_no = i // BATCH_SIZE + 1
        print(f"  배치 {batch_no}/{total_batches} ({len(batch)}개) 임베딩 중...")

        for attempt in range(MAX_RETRIES):
            try:
                if vectordb is None:
                    vectordb = Chroma.from_documents(
                        documents=batch,
                        embedding=embeddings,
                        persist_directory=db_folder
                    )
                else:
                    vectordb.add_documents(batch)
                break
            except Exception as e:
                if "RESOURCE_EXHAUSTED" in str(e) and attempt < MAX_RETRIES - 1:
                    wait = 10 * (attempt + 1)
                    print(f"    429 - {wait}초 대기 후 재시도 ({attempt + 1}/{MAX_RETRIES})")
                    time.sleep(wait)
                else:
                    raise

        if i + BATCH_SIZE < len(documents):
            time.sleep(2)

    print("\n완료! career_db_free가 새로 생성되었습니다.")


if __name__ == "__main__":
    create_career_vector_db()
