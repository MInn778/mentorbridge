# venv\Scripts\activate
# streamlit run app.py

import streamlit as st
import google.generativeai as genai
import os
from dotenv import load_dotenv

# .env 파일 불러오기
load_dotenv()

# API 키 설정
API_KEY = os.getenv("GOOGLE_API_KEY")

if not API_KEY:
    st.error(".env 파일에서 GOOGLE_API_KEY를 찾을 수 없습니다.")
    st.stop()

# Gemini 연결
genai.configure(api_key=API_KEY.strip())

# 모델 생성
model = genai.GenerativeModel("models/gemini-flash-lite-latest")

# 페이지 설정
st.set_page_config(
    page_title="AI 진로 상담소",
    layout="centered"
)

st.title("🎓 AI 진로 상담소")
st.write("관심사와 강점을 입력하면 AI가 진로를 추천해드립니다.")

# 채팅 기록 저장
if "messages" not in st.session_state:
    st.session_state.messages = []

# 이전 메시지 출력
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# 입력창
if prompt := st.chat_input("관심사나 잘하는 일을 입력하세요"):

    st.session_state.messages.append({
        "role": "user",
        "content": prompt
    })

    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        with st.spinner("답변 생성 중..."):
            try:
                response = model.generate_content(
                    f"""
너는 진로 상담 전문가야.

사용자의 관심사와 강점을 바탕으로:
- 어울리는 직업
- 추천 학과
- 필요한 역량
을 친절하게 설명해줘.

사용자 입력:
{prompt}
"""
                )

                answer = response.text

            except Exception as e:
                answer = f"⚠️ 오류 발생: {e}"

            st.markdown(answer)

    st.session_state.messages.append({
        "role": "assistant",
        "content": answer
    })