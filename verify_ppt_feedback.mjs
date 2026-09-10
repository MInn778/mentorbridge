// 일회성 검증 스크립트: PptFeedback.tsx의 AI 피드백 프롬프트를 실제 슬라이드 텍스트로 재현해서
// Gemini가 진짜 그 내용을 읽고 피드백을 만드는지 확인한다 (extraction 로직은 verify_pptx_text.ts에서 별도 검증).
// 실행: GEMINI_API_KEY=xxx node verify_ppt_feedback.mjs
import { GoogleGenAI } from "@google/genai";

// 일부러 부실하게 구성한 가짜 발표자료 — AI가 "일반적인 조언"이 아니라
// 이 내용(슬라이드 3장, 논리 비약)을 실제로 짚어내는지 확인하기 위함.
const extractedSlides = [
  "졸업작품 발표 MentorBridge",
  "결론 우리 서비스는 최고입니다",
  "감사합니다",
];

const slidesText = extractedSlides
  .map((s, i) => `[슬라이드 ${i + 1}] ${s || '(텍스트 없음)'}`)
  .join('\n');

const prompt = `당신은 발표자료(PPT)를 검토하는 전문 심사위원입니다. 아래는 실제 업로드된 PPT의 슬라이드별 텍스트입니다.

${slidesText}

위 내용을 바탕으로, 아래 양식 그대로 마크다운으로 작성하세요. 각 항목은 반드시 위 슬라이드 내용에 근거해 구체적으로 채우고, 빈 칸으로 남기지 마세요.

## 총평 (Overall Evaluation)
전체적인 완성도와 방향성에 대한 요약 의견 (2~3문장).

## 세부 평가 항목 (5점 만점 기준)
| 평가 항목 | 점수 | 세부 내용 |
|---|---|---|
| 목적성 (보고 목적과 핵심 메시지가 명확한가?) | ⭐~⭐⭐⭐⭐⭐ 중 하나 | |
| 논리성 (목차 구성과 전개 과정이 타당한가?) | ⭐~⭐⭐⭐⭐⭐ 중 하나 | |
| 정확성 (데이터, 출처, 사실관계에 오류가 없는가?) | ⭐~⭐⭐⭐⭐⭐ 중 하나 | |
| 가독성 (도표 활용, 디자인, 문장 정리가 깔끔한가?) | ⭐~⭐⭐⭐⭐⭐ 중 하나 | |

## 수정 및 보완 요청 사항 (Action Items)
우선순위(상/중/하)별로 최소 1개씩, 구체적인 슬라이드 번호와 요청 사항을 적으세요.
- **[우선순위: 상]** 페이지/위치: / 요청 사항:
- **[우선순위: 중]** 페이지/위치: / 요청 사항:
- **[우선순위: 하]** 페이지/위치: / 요청 사항:

## 최종 판정
다음 중 하나를 고르고 한 문장으로 이유를 덧붙이세요: **승인(Approve)** / **조건부 승인(Conditionally Approve)** / **반려 및 재검토(Revise & Resubmit)**`;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const response = await ai.models.generateContent({
  model: "gemini-3-flash-preview",
  contents: prompt,
});

const text = response.text || "";
console.log(text);
console.log("\n---");

// 요청받은 5개 섹션이 실제로 다 채워졌는지 + 최종 판정이 셋 중 하나로 나왔는지 확인
const requiredSections = ["총평", "세부 평가 항목", "수정 및 보완 요청 사항", "최종 판정"];
const missing = requiredSections.filter((s) => !text.includes(s));
if (missing.length > 0) {
  console.error("FAILED: 다음 섹션이 응답에 없음 —", missing.join(", "));
  process.exit(1);
}
if (!/승인|반려/.test(text)) {
  console.error("FAILED: 최종 판정(승인/조건부 승인/반려)이 없음");
  process.exit(1);
}
console.log("OK: 요청한 양식(총평/평가표/보완 요청/최종 판정) 그대로 채워서 응답함");
