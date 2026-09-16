import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Send, Loader2, RefreshCcw, ArrowRight, SkipForward } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const questions = [
  { id: 1, text: "관심 있는 IT 분야는 무엇인가요?", placeholder: "예: 웹 개발, 데이터 분석, 인공지능 등", field: "interest" },
  { id: 2, text: "현재 보유하고 있는 기술 스택은 무엇인가요?", placeholder: "예: React, Python, Java, SQL 등", field: "techStack" },
  { id: 3, text: "취득했거나 준비 중인 자격증이 있나요?", placeholder: "예: 정보처리기사, AWS Certified 등", field: "certificates" },
  { id: 4, text: "본인의 성향이나 선호하는 작업 방식은?", placeholder: "예: 논리적인 분석 선호, 창의적인 디자인 선호 등", field: "personality" },
];

export default function AICareer() {
  const [step, setStep] = useState(0);
  const [currentInput, setCurrentInput] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleNext = (isSkip = false) => {
    const field = questions[step].field;
    const newAnswers = { ...answers, [field]: isSkip ? "답변하지 않음" : currentInput };
    setAnswers(newAnswers);
    setCurrentInput("");

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      generateRecommendation(newAnswers);
    }
  };

  const generateRecommendation = async (finalAnswers: Record<string, string>) => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `사용자의 주관식 답변을 바탕으로 IT 진로를 추천해주세요.
      답변 내용:
      1. 관심 분야: ${finalAnswers.interest}
      2. 기술 스택: ${finalAnswers.techStack}
      3. 자격증: ${finalAnswers.certificates}
      4. 성향/방식: ${finalAnswers.personality}
      
      추천하는 구체적인 직무, 필요한 추가 기술 스택, 그리고 학습 로드맵을 한국어로 상세히 설명해주세요. 마크다운 형식을 사용하세요. 답변하지 않은 항목은 고려하지 말고 나머지 정보를 바탕으로 최선의 추천을 해주세요.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setResult(response.text || "추천 결과를 생성할 수 없습니다.");
    } catch (error) {
      console.error("AI Error:", error);
      setResult("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(0);
    setAnswers({});
    setResult(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="text-center">
        <div className="inline-flex items-center justify-center p-3 bg-blue-100 text-blue-600 rounded-2xl mb-4">
          <Sparkles size={32} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">AI 진로 추천 시스템</h1>
        <p className="text-slate-500 mt-2">당신의 정보를 바탕으로 최적의 커리어 패스를 제안합니다.</p>
      </header>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm min-h-[400px] flex flex-col">
        {!result && !loading && step < questions.length && (
          <div className="space-y-8 flex-1">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-blue-600 uppercase tracking-wider">Question {step + 1} of {questions.length}</span>
              <div className="h-2 w-32 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300" 
                  style={{ width: `${((step + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-800">{questions[step].text}</h2>
              <textarea
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                placeholder={questions[step].placeholder}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px] resize-none text-slate-700"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => handleNext(true)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
              >
                <SkipForward size={20} /> 건너뛰기
              </button>
              <button
                onClick={() => handleNext(false)}
                disabled={!currentInput.trim()}
                className="flex-[2] flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                다음 단계 <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            <p className="text-slate-600 font-medium animate-pulse">AI가 당신의 미래를 분석 중입니다...</p>
          </div>
        )}

        {result && (
          <div className="space-y-6 animate-in zoom-in-95 duration-300">
            <div className="prose prose-slate max-w-none">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
            <button
              onClick={reset}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-colors"
            >
              <RefreshCcw size={20} /> 다시 검사하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
