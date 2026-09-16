import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Upload, FileText, MessageSquare, Sparkles, Loader2, CheckCircle2, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

export default function Feedback() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<{author: string, text: string, time: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // In a real app, we would read the file content. 
      // For this demo, we'll simulate reading a text-based file.
      const prompt = `당신은 전문 커리어 멘토입니다. 사용자가 제출한 '${file.name}' 파일에 대해 피드백을 제공해주세요.
      (실제 파일 내용은 보안상 생략되었으나, 일반적인 포트폴리오/자소서라고 가정하고 개선 방향에 대한 조언을 마크다운 형식으로 작성해주세요.)
      1. 강점 분석
      2. 개선이 필요한 부분
      3. 향후 학습 방향`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setAiFeedback(response.text || "피드백을 생성할 수 없습니다.");
    } catch (error) {
      console.error("AI Error:", error);
      setAiFeedback("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = () => {
    if (!comment.trim()) return;
    setComments([...comments, {
      author: "김멘토",
      text: comment,
      time: "방금 전"
    }]);
    setComment("");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">피드백 시스템</h1>
        <p className="text-slate-500 mt-2">포트폴리오나 자소서를 올리고 멘토와 AI의 피드백을 받아보세요.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[300px]",
              file ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-400 hover:bg-slate-50"
            )}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
            />
            {file ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-600 text-white rounded-2xl inline-block">
                  <FileText size={40} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 truncate max-w-[200px]">{file.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                  AI 피드백 받기
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-slate-100 text-slate-400 rounded-2xl inline-block">
                  <Upload size={40} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">파일 업로드</p>
                  <p className="text-sm text-slate-400 mt-1">PDF, DOCX, TXT 파일 지원</p>
                </div>
              </div>
            )}
          </div>

          {aiFeedback && (
            <div className="bg-green-50 p-6 rounded-3xl border border-green-100">
              <div className="flex items-center gap-2 text-green-700 font-bold mb-2">
                <CheckCircle2 size={20} />
                <span>AI 분석 완료</span>
              </div>
              <p className="text-sm text-green-600">AI가 파일을 분석하여 피드백을 생성했습니다. 오른쪽 패널에서 확인하세요.</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm min-h-[400px]">
            <div className="flex items-center gap-2 text-slate-900 font-bold mb-6 border-b border-slate-100 pb-4">
              <Sparkles className="text-blue-600" size={20} />
              <h2>AI 피드백 리포트</h2>
            </div>
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                <p className="text-slate-400 font-medium">AI가 문서를 정밀 분석 중입니다...</p>
              </div>
            ) : aiFeedback ? (
              <div className="prose prose-slate max-w-none animate-in fade-in duration-500">
                <ReactMarkdown>{aiFeedback}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <p className="text-slate-400">파일을 업로드하고 AI 피드백 버튼을 눌러주세요.</p>
              </div>
            )}
          </section>

          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-slate-900 font-bold mb-6 border-b border-slate-100 pb-4">
              <MessageSquare className="text-blue-600" size={20} />
              <h2>멘토 코멘트</h2>
            </div>
            
            <div className="space-y-6 mb-8">
              {comments.length > 0 ? comments.map((c, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                    <CheckCircle2 size={20} />
                  </div>
                  <div className="flex-1 bg-slate-50 p-4 rounded-2xl">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-slate-900">{c.author}</span>
                      <span className="text-xs text-slate-400">{c.time}</span>
                    </div>
                    <p className="text-sm text-slate-700">{c.text}</p>
                  </div>
                </div>
              )) : (
                <p className="text-center text-slate-400 py-4">아직 멘토의 코멘트가 없습니다.</p>
              )}
            </div>

            <div className="relative">
              <textarea 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="멘토에게 궁금한 점을 남겨보세요..."
                className="w-full p-4 pr-12 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-none"
              />
              <button 
                onClick={handleAddComment}
                className="absolute right-3 bottom-3 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
