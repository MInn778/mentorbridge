import json
import os
import shutil
from dotenv import load_dotenv

from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document

load_dotenv()


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

    print("임베딩 모델 로드 중...")
    embeddings = HuggingFaceEmbeddings(
        model_name="jhgan/ko-sroberta-multitask",
        model_kwargs={"device": "cpu"}
    )

    print("새 벡터 DB 생성 중...")
    Chroma.from_documents(
        documents=documents,
        embedding=embeddings,
        persist_directory=db_folder
    )

    print("\n완료! career_db_free가 새로 생성되었습니다.")


if __name__ == "__main__":
    create_career_vector_db()