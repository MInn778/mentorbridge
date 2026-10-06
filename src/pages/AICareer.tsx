import React, { useState } from 'react';
import { Sparkles, Send, Loader2, RefreshCcw, ArrowRight, SkipForward, MessageCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/contexts/AuthContext';

const questions = [
  { id: 1, text: "관심 있는 분야나 직군은 무엇인가요?", placeholder: "예: 의료, 교육, 디자인, 금융, IT, 요리 등", field: "interest" },
  { id: 2, text: "보유한 기술이나 잘하는 일은 무엇인가요?", placeholder: "예: 글쓰기, 외국어, 그림, 엑셀, 프로그래밍 등", field: "techStack" },
  { id: 3, text: "취득했거나 준비 중인 자격증이 있나요?", placeholder: "예: 컴퓨터활용능력, 간호사 면허, 토익, 정보처리기사 등", field: "certificates" },
  { id: 4, text: "본인의 성향이나 선호하는 작업 방식은?", placeholder: "예: 논리적인 분석 선호, 창의적인 디자인 선호 등", field: "personality" },
];

const suggestedQuestions = [
  "추천해준 직업들의 연봉은 어느 정도인가요?",
  "준비하는 데 기간은 얼마나 걸리나요?",
  "관련 학과나 전공은 무엇이 있나요?",
];

type ChatMessage = { role: 'user' | 'assistant'; content: string };

export default function AICareer() {
  const { token } = useAuth();
  // 진로추천 API는 Spring 백엔드에 있어서 로그인 토큰이 필요하다 (Gemini 사용량 보호)
  const authHeaders = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  const [step, setStep] = useState(0);
  const [currentInput, setCurrentInput] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

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
      const res = await fetch('/api/career/recommend', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(finalAnswers),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '추천 생성에 실패했습니다.');
      setResult(data.result || "추천 결과를 생성할 수 없습니다.");
    } catch (error) {
      console.error("AI Error:", error);
      setResult(`오류가 발생했습니다. 다시 시도해주세요.\n\n(${error instanceof Error ? error.message : error})`);
    } finally {
      setLoading(false);
    }
  };

  // 서버는 상태를 저장하지 않으므로 처음 답변 + 추천 결과 + 이전 대화를 매번 함께 보낸다.
  const askFollowUp = async (question: string) => {
    if (!question.trim() || chatLoading) return;
    const history = messages;
    setMessages([...history, { role: 'user', content: question }]);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await fetch('/api/career/chat', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ answers, recommendation: result, history, question }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '답변 생성에 실패했습니다.');
      setMessages(prev => [...prev, { role: 'assistant', content: data.result }]);
    } catch (error) {
      console.error("AI Chat Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: `오류가 발생했습니다. 다시 시도해주세요.\n\n(${error instanceof Error ? error.message : error})` }]);
    } finally {
      setChatLoading(false);
    }
  };

  const reset = () => {
    setStep(0);
    setAnswers({});
    setResult(null);
    setChatOpen(false);
    setMessages([]);
    setChatInput("");
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
            <div className="flex gap-4">
              <button
                onClick={reset}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-colors"
              >
                <RefreshCcw size={20} /> 다시 검사하기
              </button>
              {!chatOpen && (
                <button
                  onClick={() => setChatOpen(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-colors"
                >
                  <MessageCircle size={20} /> 대화 이어가기
                </button>
              )}
            </div>

            {chatOpen && (
              <div className="border-t border-slate-200 pt-6 space-y-4">
                {messages.length === 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-slate-500">추천 질문</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedQuestions.map(q => (
                        <button
                          key={q}
                          onClick={() => askFollowUp(q)}
                          className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-100 transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((m, i) => (
                  <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                    {m.role === 'user' ? (
                      <div className="max-w-[80%] px-4 py-3 bg-blue-600 text-white rounded-2xl rounded-br-sm whitespace-pre-wrap">{m.content}</div>
                    ) : (
                      <div className="max-w-[90%] px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl rounded-bl-sm prose prose-slate prose-sm max-w-none">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                ))}

                {chatLoading && (
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Loader2 size={16} className="animate-spin" /> 답변을 작성하고 있습니다...
                  </div>
                )}

                <div className="flex gap-2">
                  <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        askFollowUp(chatInput);
                      }
                    }}
                    placeholder="추천 결과에 대해 궁금한 점을 물어보세요 (Enter 전송, Shift+Enter 줄바꿈)"
                    rows={2}
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-slate-700"
                  />
                  <button
                    onClick={() => askFollowUp(chatInput)}
                    disabled={!chatInput.trim() || chatLoading}
                    className="px-5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="전송"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
