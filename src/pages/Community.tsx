import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Plus, Users, MessageSquare, UserPlus, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

const categories = ['전체', '스터디', '프로젝트', '멘토 찾기'];

interface Post {
  boardId: number;
  authorId: number;
  authorName: string;
  boardType: string;
  title: string;
  content: string;
  viewCount: number;
  tags: string[];
  createdAt: string;
}

export default function Community() {
  const [activeCategory, setActiveCategory] = useState('전체');
  const [posts, setPosts] = useState<Post[]>([]);
  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch('/api/posts', { headers })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setPosts(data);
        } else {
          console.error('Invalid data format:', data);
          setPosts([]);
        }
      })
      .catch(err => console.error('Failed to fetch posts:', err));
  }, [token]);

  const getCategory = (boardType: string) => {
    if (boardType === '스터디모집') return '스터디';
    if (boardType === '프로젝트모집') return '프로젝트';
    if (boardType === '멘토모집' || boardType === '멘티모집') return '멘토 찾기';
    return '기타';
  };

  const handleApply = async (e: React.MouseEvent, post: Post) => {
    e.stopPropagation();
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }
    const messageType = 'APPLICATION';
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: post.authorId,
          content: `${post.title}에 지원합니다.`,
          messageType: messageType,
          relatedGroupId: post.boardId // Using boardId as relatedGroupId for study/project applications
        })
      });
      if (res.ok) {
        alert("지원이 완료되었습니다.");
      } else {
        alert("지원에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("오류가 발생했습니다.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">스터디 & 커뮤니티</h1>
          <p className="text-slate-500 mt-2">함께 성장할 동료와 멘토를 찾아보세요.</p>
        </div>
        <button 
          onClick={() => navigate('/community/write')}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
        >
          <Plus size={20} /> 모집글 작성하기
        </button>
      </header>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="관심 있는 스터디나 멘토를 검색해보세요"
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-6 py-4 bg-white border border-slate-200 rounded-2xl text-slate-600 font-medium hover:bg-slate-50">
          <Filter size={20} /> 필터
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all",
              activeCategory === cat
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:border-blue-300"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.filter(p => activeCategory === '전체' || getCategory(p.boardType) === activeCategory).map((post) => (
          <div 
            key={post.boardId} 
            onClick={() => navigate(`/community/${post.boardId}`)}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col"
          >
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <span className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold",
                  getCategory(post.boardType) === '멘토 찾기' ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"
                )}>
                  {getCategory(post.boardType)}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[3.5rem]">
                {post.title}
              </h3>
              <div className="flex flex-wrap gap-2 mt-4">
                {(post.tags || []).map(tag => (
                  <span key={tag} className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">#{tag}</span>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-slate-200" />
                  <span className="text-xs font-semibold text-slate-600">{post.authorName}</span>
                </div>
                <div className="flex items-center gap-4 text-slate-400">
                  <div className="flex items-center gap-1">
                    <Users size={14} />
                    <span className="text-xs">-/-</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare size={14} />
                    <span className="text-xs">0</span>
                  </div>
                </div>
              </div>
            </div>
            
            {getCategory(post.boardType) === '멘토 찾기' && (
              <button onClick={(e) => handleApply(e, post)} className="w-full mt-4 flex items-center justify-center gap-2 bg-orange-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors">
                <UserPlus size={16} /> 멘토 지원하기
              </button>
            )}
            {getCategory(post.boardType) === '스터디' && (
              <button onClick={(e) => handleApply(e, post)} className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors">
                <UserPlus size={16} /> 스터디 지원하기
              </button>
            )}
            {getCategory(post.boardType) === '프로젝트' && (
              <button onClick={(e) => handleApply(e, post)} className="w-full mt-4 flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-purple-700 transition-colors">
                <UserPlus size={16} /> 프로젝트 지원하기
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
