import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, MessageSquare, Sparkles, Loader2, CheckCircle2, Send, ArrowLeft, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface MentorFeedback {
  id: number;
  mentorName: string;
  content: string;
  createdAt: string;
}

interface FeedbackPost {
  id: number;
  authorId: number;
  authorName: string;
  title: string;
  content: string;
  fileUrl?: string;
  fileName?: string;
  aiFeedback: string;
  createdAt: string;
  mentorFeedbacks?: MentorFeedback[];
}

export default function Feedback() {
  const { user, token, isAuthenticated } = useAuth();
  
  const [posts, setPosts] = useState<FeedbackPost[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [selectedPost, setSelectedPost] = useState<FeedbackPost | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [mentorComment, setMentorComment] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/feedback');
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPostDetail = async (id: number) => {
    try {
      const res = await fetch(`/api/feedback/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedPost(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (selectedPostId) {
      fetchPostDetail(selectedPostId);
    } else {
      setSelectedPost(null);
    }
  }, [selectedPostId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmitPost = async () => {
    if (!title || !file) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('file', file);

      // AI 피드백 생성(첨부파일 텍스트 추출 포함)은 서버에서 처리한다 — 요청이 끝날 때까지 시간이 좀 걸릴 수 있다.
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        setIsWriting(false);
        setTitle('');
        setContent('');
        setFile(null);
        fetchPosts();
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.message || '게시글 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error("Submit Error:", error);
      alert('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!mentorComment.trim() || !selectedPostId) return;
    
    try {
      const res = await fetch(`/api/feedback/${selectedPostId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: mentorComment })
      });
      
      if (res.ok) {
        setMentorComment("");
        fetchPostDetail(selectedPostId); // refresh
      } else {
        alert("멘토 권한이 필요합니다.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (selectedPost) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
        <button 
          onClick={() => setSelectedPostId(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-medium"
        >
          <ArrowLeft size={20} /> 목록으로 돌아가기
        </button>

        <header className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
              첨삭 요청
            </span>
            <span className="text-sm text-slate-400">{new Date(selectedPost.createdAt).toLocaleString()}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{selectedPost.title}</h1>
          <p className="text-slate-600 mb-6">{selectedPost.content}</p>
          
          {selectedPost.fileUrl && (
            <a
              href={selectedPost.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                <FileText size={24} />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">첨부파일</p>
                <p className="text-xs text-slate-500">{selectedPost.fileName || '파일 열기'}</p>
              </div>
            </a>
          )}
        </header>

        <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-slate-900 font-bold mb-6 border-b border-slate-100 pb-4">
            <Sparkles className="text-blue-600" size={20} />
            <h2>AI 피드백 리포트</h2>
          </div>
          <div className="prose prose-slate max-w-none">
            <ReactMarkdown>{selectedPost.aiFeedback}</ReactMarkdown>
          </div>
        </section>

        <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-slate-900 font-bold mb-6 border-b border-slate-100 pb-4">
            <MessageSquare className="text-blue-600" size={20} />
            <h2>멘토 코멘트 <span className="text-slate-400 text-sm font-normal">({selectedPost.mentorFeedbacks?.length || 0})</span></h2>
          </div>
          
          <div className="space-y-6 mb-8">
            {selectedPost.mentorFeedbacks && selectedPost.mentorFeedbacks.length > 0 ? (
              selectedPost.mentorFeedbacks.map((c) => (
                <div key={c.id} className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 font-bold">
                    {c.mentorName[0]}
                  </div>
                  <div className="flex-1 bg-slate-50 p-4 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-slate-900">{c.mentorName} 멘토</span>
                      <span className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{c.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-400 py-4">아직 멘토의 코멘트가 없습니다.</p>
            )}
          </div>

          {user?.role === 'MENTOR' ? (
            <div className="relative mt-8 border-t border-slate-100 pt-8">
              <h3 className="font-bold text-sm text-slate-700 mb-3">코멘트 작성하기</h3>
              <textarea 
                value={mentorComment}
                onChange={(e) => setMentorComment(e.target.value)}
                placeholder="전문적인 조언을 남겨주세요..."
                className="w-full p-4 pr-12 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px] resize-none"
              />
              <button 
                onClick={handleAddComment}
                className="absolute right-3 bottom-3 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
          ) : (
            <div className="mt-8 border-t border-slate-100 pt-6 text-center">
              <p className="text-sm text-slate-500">멘토만 코멘트를 작성할 수 있습니다.</p>
            </div>
          )}
        </section>
      </div>
    );
  }

  if (isWriting) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
        <button 
          onClick={() => setIsWriting(false)}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-medium"
        >
          <ArrowLeft size={20} /> 취소하고 돌아가기
        </button>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">새 피드백 요청하기</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">제목</label>
              <input 
                type="text" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="예: 프론트엔드 신입 지원용 이력서 피드백 부탁드립니다."
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">요청 내용</label>
              <textarea 
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="고민되는 부분이나 중점적으로 리뷰받고 싶은 부분을 적어주세요."
                className="w-full p-3 border border-slate-200 rounded-xl min-h-[150px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">파일 첨부</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all",
                  file ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-400 hover:bg-slate-50"
                )}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.hwp"
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
                    <p className="text-sm font-medium text-slate-600">이력서, 포트폴리오 또는 발표자료(PPT) 업로드</p>
                    <p className="text-xs text-slate-400">PDF, DOCX, PPT/PPTX 지원 (텍스트 추출 가능한 파일만 AI가 내용을 읽습니다)</p>
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={handleSubmitPost}
              disabled={loading || !title || !file}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  AI 분석 및 업로드 중...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  AI 분석 받고 게시하기
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">피드백 게시판</h1>
          <p className="text-slate-500 mt-2">이력서와 포트폴리오를 올리고 AI와 멘토들의 전문적인 피드백을 받아보세요.</p>
        </div>
        {isAuthenticated && user?.role === 'MENTEE' && (
          <button 
            onClick={() => setIsWriting(true)}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={18} /> 새 피드백 요청
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map(post => (
          <div 
            key={post.id} 
            onClick={() => setSelectedPostId(post.id)}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group flex flex-col h-full"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">
                {post.authorName} 님의 요청
              </span>
              <span className="text-xs text-slate-400">
                {new Date(post.createdAt).toLocaleDateString()}
              </span>
            </div>
            
            <h3 className="font-bold text-lg text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
              {post.title}
            </h3>
            
            <p className="text-sm text-slate-500 mb-6 line-clamp-2 flex-grow">
              {post.content}
            </p>
            
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <FileText size={14} /> 첨부됨
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <MessageSquare size={14} /> 멘토 답변
              </div>
            </div>
          </div>
        ))}

        {posts.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-500 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            아직 등록된 피드백 요청이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}

