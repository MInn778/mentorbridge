import React, { useRef, useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Upload, FileText, Sparkles, Loader2, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { extractPptxText } from '@/lib/pptxText';

// 미리보기 전용 페이지 — 네비게이션에는 아직 안 걸어둠. 확인 끝나면 /feedback 게시판에 통합 예정.
export default function PptFeedback() {
  const [file, setFile] = useState<File | null>(null);
  const [slides, setSlides] = useState<string[] | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setSlides(null);
      setFeedback(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const extracted = await extractPptxText(file);
      setSlides(extracted);

      const nonEmpty = extracted.filter((s) => s.length > 0);
      if (nonEmpty.length === 0) {
        setError('슬라이드에서 텍스트를 찾지 못했습니다 (이미지 위주 PPT는 아직 지원하지 않습니다).');
        return;
      }

      const slidesText = extracted
        .map((s, i) => `[슬라이드 ${i + 1}] ${s || '(텍스트 없음)'}`)
        .join('\n');

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      setFeedback(response.text || '피드백 생성에 실패했습니다.');
    } catch (err) {
      console.error('PPT feedback error:', err);
      setError('분석 중 오류가 발생했습니다. .pptx 파일이 맞는지 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setSlides(null);
    setFeedback(null);
    setError(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      {feedback ? (
        <button
          onClick={reset}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-medium"
        >
          <ArrowLeft size={20} /> 다시 업로드하기
        </button>
      ) : null}

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">PPT 피드백 (미리보기)</h1>
        <p className="text-slate-500 text-sm mb-6">
          발표자료(.pptx)를 업로드하면 AI가 슬라이드 텍스트를 실제로 읽고 피드백을 만들어줍니다.
        </p>

        <div
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all',
            file ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
          )}
        >
          <input
            type="file"
            accept=".pptx"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          {file ? (
            <div className="flex items-center gap-3">
              <FileText className="text-blue-600" size={24} />
              <span className="font-medium text-blue-900">{file.name}</span>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="text-slate-400 mx-auto" size={24} />
              <p className="text-sm font-medium text-slate-600">PPT(.pptx) 업로드</p>
            </div>
          )}
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading || !file}
          className="w-full mt-6 bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} /> 슬라이드 분석 중...
            </>
          ) : (
            <>
              <Sparkles size={20} /> AI 피드백 받기
            </>
          )}
        </button>

        {error && <p className="mt-4 text-sm text-red-600 text-center">{error}</p>}
      </div>

      {slides && (
        <details className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <summary className="cursor-pointer font-bold text-slate-900 text-sm">
            추출된 슬라이드 텍스트 ({slides.length}장) — 실제로 읽었는지 확인용
          </summary>
          <ol className="mt-4 space-y-3">
            {slides.map((s, i) => (
              <li key={i} className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                  {i + 1}
                </span>
                <span className="text-sm text-slate-700 leading-relaxed">
                  {s || <span className="text-slate-400">(텍스트 없음)</span>}
                </span>
              </li>
            ))}
          </ol>
        </details>
      )}

      {feedback && (
        <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-slate-900 font-bold mb-6 border-b border-slate-100 pb-4">
            <Sparkles className="text-blue-600" size={20} />
            <h2>AI 피드백 리포트</h2>
          </div>
          <div className="prose prose-slate max-w-none prose-headings:font-bold prose-h3:text-base prose-p:leading-relaxed prose-li:leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{feedback}</ReactMarkdown>
          </div>
        </section>
      )}
    </div>
  );
}
