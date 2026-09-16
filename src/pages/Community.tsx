import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Plus, Users, MessageSquare, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import ApplyModal from '@/components/ApplyModal';

const categories = ['전체', '스터디', '프로젝트', '멘토 찾기', '기타'];
const meetingTypeOptions = ['온라인', '오프라인', '온오프병행'];
const regionOptions = ['전국(온라인)', '서울', '경기/인천', '대전/충청', '대구/경북', '부산/경남', '광주/전라', '강원', '제주', '기타'];
const timeSlotOptions = [
  { value: '평일_오전', label: '평일 오전' },
  { value: '평일_오후', label: '평일 오후' },
  { value: '평일_저녁', label: '평일 저녁' },
  { value: '주말', label: '주말' },
  { value: '협의', label: '시간 협의' },
];

interface Post {
  boardId: number;
  authorId: number;
  authorName: string;
  boardType: string;
  title: string;
  content: string;
  viewCount: number;
  tags: string[];
  participantNames: string[];
  maxMembers: number | null;
  commentCount: number;
  status: 'RECRUITING' | 'COMPLETED';
  meetingType: '온라인' | '오프라인' | '온오프병행' | null;
  region: string | null;
  timeSlot: '평일_오전' | '평일_오후' | '평일_저녁' | '주말' | '협의' | null;
  createdAt: string;
}

const timeSlotLabels: Record<string, string> = {
  '평일_오전': '평일 오전',
  '평일_오후': '평일 오후',
  '평일_저녁': '평일 저녁',
  '주말': '주말',
  '협의': '시간 협의',
};

export default function Community() {
  const [activeCategory, setActiveCategory] = useState('전체');
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [meetingFilter, setMeetingFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [timeSlotFilter, setTimeSlotFilter] = useState('');
  const [applyTarget, setApplyTarget] = useState<Post | null>(null);
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

  const handleApply = (e: React.MouseEvent, post: Post) => {
    e.stopPropagation();
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }
    if (post.status === 'COMPLETED') {
      alert("이미 모집이 완료된 게시글입니다.");
      return;
    }
    setApplyTarget(post);
  };

  const submitApplication = async (reason: string) => {
    if (!applyTarget) return;
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: applyTarget.authorId,
          content: reason,
          messageType: 'APPLICATION',
          relatedGroupId: applyTarget.boardId
        })
      });
      if (res.ok) {
        setApplyTarget(null);
        alert("지원이 완료되었습니다.");
      } else {
        alert("지원에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("오류가 발생했습니다.");
    }
  };

  const getCategoryLabel = (boardType: string) =>
    getCategory(boardType) === '멘토 찾기' ? '멘토 지원하기' :
    getCategory(boardType) === '스터디' ? '스터디 지원하기' : '프로젝트 지원하기';

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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="관심 있는 스터디나 멘토를 검색해보세요"
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={meetingFilter}
          onChange={(e) => setMeetingFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">진행 방식 전체</option>
          {meetingTypeOptions.map(mt => <option key={mt} value={mt}>{mt}</option>)}
        </select>
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">지역 전체</option>
          {regionOptions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select
          value={timeSlotFilter}
          onChange={(e) => setTimeSlotFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">시간대 전체</option>
          {timeSlotOptions.map(ts => <option key={ts.value} value={ts.value}>{ts.label}</option>)}
        </select>
        {(meetingFilter || regionFilter || timeSlotFilter) && (
          <button
            onClick={() => { setMeetingFilter(''); setRegionFilter(''); setTimeSlotFilter(''); }}
            className="px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors"
          >
            필터 초기화
          </button>
        )}
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
        {posts
          .filter(p => activeCategory === '전체' || getCategory(p.boardType) === activeCategory)
          .filter(p => !meetingFilter || p.meetingType === meetingFilter)
          .filter(p => !regionFilter || p.region === regionFilter)
          .filter(p => !timeSlotFilter || p.timeSlot === timeSlotFilter)
          .filter(p => {
            const q = searchQuery.trim().toLowerCase();
            if (!q) return true;
            return (
              p.title.toLowerCase().includes(q) ||
              p.content.toLowerCase().includes(q) ||
              p.authorName.toLowerCase().includes(q) ||
              (p.tags || []).some(tag => tag.toLowerCase().includes(q))
            );
          })
          .map((post) => (
          <div 
            key={post.boardId} 
            onClick={() => navigate(`/community/${post.boardId}`)}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col"
          >
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold",
                    getCategory(post.boardType) === '멘토 찾기' ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"
                  )}>
                    {getCategory(post.boardType)}
                  </span>
                  <span className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold",
                    post.status === 'COMPLETED' ? "bg-slate-200 text-slate-600" : "bg-green-100 text-green-600"
                  )}>
                    {post.status === 'COMPLETED' ? '모집 완료' : '모집 중'}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[3.5rem]">
                {post.title}
              </h3>
              {(post.meetingType || post.region || post.timeSlot) && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {post.meetingType && (
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded-md">{post.meetingType}</span>
                  )}
                  {post.region && (
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md">{post.region}</span>
                  )}
                  {post.timeSlot && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-md">{timeSlotLabels[post.timeSlot]}</span>
                  )}
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
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
                    <span className="text-xs">
                      {post.participantNames?.length || 0}{post.maxMembers ? `/${post.maxMembers}` : ''}명
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare size={14} />
                    <span className="text-xs">{post.commentCount || 0}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {getCategory(post.boardType) !== '기타' && (
              post.status === 'COMPLETED' ? (
                <button disabled className="w-full mt-4 flex items-center justify-center gap-2 bg-slate-200 text-slate-500 py-3 rounded-xl font-bold text-sm cursor-not-allowed">
                  모집 완료되었습니다
                </button>
              ) : (
                <button
                  onClick={(e) => handleApply(e, post)}
                  className={cn(
                    "w-full mt-4 flex items-center justify-center gap-2 text-white py-3 rounded-xl font-bold text-sm transition-colors",
                    getCategory(post.boardType) === '멘토 찾기' ? "bg-orange-500 hover:bg-orange-600" :
                    getCategory(post.boardType) === '스터디' ? "bg-blue-600 hover:bg-blue-700" :
                    "bg-purple-600 hover:bg-purple-700"
                  )}
                >
                  <UserPlus size={16} />
                  {getCategory(post.boardType) === '멘토 찾기' ? '멘토 지원하기' :
                   getCategory(post.boardType) === '스터디' ? '스터디 지원하기' : '프로젝트 지원하기'}
                </button>
              )
            )}
          </div>
        ))}
      </div>

      {applyTarget && (
        <ApplyModal
          title={applyTarget.title}
          actionLabel={getCategoryLabel(applyTarget.boardType)}
          onClose={() => setApplyTarget(null)}
          onSubmit={submitApplication}
        />
      )}
    </div>
  );
}
