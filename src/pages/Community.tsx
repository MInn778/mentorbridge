import React, { useState } from 'react';
import { Search, Plus, Users, MessageSquare, UserPlus, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

const categories = ['전체', '스터디', '프로젝트', '멘토 찾기', 'Q&A'];

export default function Community() {
  const [activeCategory, setActiveCategory] = useState('전체');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">스터디 & 커뮤니티</h1>
          <p className="text-slate-500 mt-2">함께 성장할 동료와 멘토를 찾아보세요.</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
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
        {[
          { title: 'React 초보 탈출 스터디원 모집', category: '스터디', author: '코딩왕', members: '3/5', comments: 12, tags: ['React', 'Beginner'] },
          { title: '현직자 멘토님께 커피챗 요청드려요', category: '멘토 찾기', author: '취준생A', members: '0/1', comments: 3, tags: ['Backend', 'Java'] },
          { title: '사이드 프로젝트 같이 하실 디자이너 구함', category: '프로젝트', author: '기획자B', members: '2/4', comments: 8, tags: ['UI/UX', 'Figma'] },
          { title: '알고리즘 코테 준비방', category: '스터디', author: '알고마스터', members: '15/20', comments: 45, tags: ['Python', 'Algorithm'] },
          { title: '프론트엔드 포트폴리오 리뷰 멘토님!', category: '멘토 찾기', author: '주니어C', members: '0/1', comments: 5, tags: ['Frontend', 'Review'] },
        ].filter(p => activeCategory === '전체' || p.category === activeCategory).map((post, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-4">
              <span className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold",
                post.category === '멘토 찾기' ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"
              )}>
                {post.category}
              </span>
              <span className="text-xs text-slate-400">3시간 전</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[3.5rem]">
              {post.title}
            </h3>
            <div className="flex flex-wrap gap-2 mt-4">
              {post.tags.map(tag => (
                <span key={tag} className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">#{tag}</span>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-slate-200" />
                <span className="text-xs font-semibold text-slate-600">{post.author}</span>
              </div>
              <div className="flex items-center gap-4 text-slate-400">
                <div className="flex items-center gap-1">
                  <Users size={14} />
                  <span className="text-xs">{post.members}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare size={14} />
                  <span className="text-xs">{post.comments}</span>
                </div>
              </div>
            </div>
            {post.category === '멘토 찾기' && (
              <button className="w-full mt-4 flex items-center justify-center gap-2 bg-orange-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors">
                <UserPlus size={16} /> 멘토 지원하기
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
