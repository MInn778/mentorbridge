import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WritePost() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('editId');
  const { token } = useAuth();
  
  const [boardType, setBoardType] = useState('스터디모집');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [status, setStatus] = useState<'RECRUITING' | 'COMPLETED'>('RECRUITING');
  const [maxMembers, setMaxMembers] = useState(10);
  const [meetingType, setMeetingType] = useState<'온라인' | '오프라인' | '온오프병행' | ''>('');
  const [region, setRegion] = useState('');
  const [timeSlot, setTimeSlot] = useState<'평일_오전' | '평일_오후' | '평일_저녁' | '주말' | '협의' | ''>('');

  const meetingTypes: Array<'온라인' | '오프라인' | '온오프병행'> = ['온라인', '오프라인', '온오프병행'];
  const regions = ['전국(온라인)', '서울', '경기/인천', '대전/충청', '대구/경북', '부산/경남', '광주/전라', '강원', '제주', '기타'];
  const timeSlots: Array<{ value: '평일_오전' | '평일_오후' | '평일_저녁' | '주말' | '협의'; label: string }> = [
    { value: '평일_오전', label: '평일 오전' },
    { value: '평일_오후', label: '평일 오후' },
    { value: '평일_저녁', label: '평일 저녁' },
    { value: '주말', label: '주말' },
    { value: '협의', label: '시간 협의' },
  ];

  // value는 백엔드 BoardType enum과 그대로 맞춰야 하고, label만 화면에 표시되는 이름
  const boardTypes = [
    { value: '스터디모집', label: '스터디모집' },
    { value: '멘토모집', label: '멘토모집' },
    { value: '멘티모집', label: '멘티모집' },
    { value: '프로젝트모집', label: '프로젝트모집' },
    { value: '자유', label: '기타' },
  ];

  useEffect(() => {
    if (editId && token) {
      fetch(`/api/posts/${editId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        setBoardType(data.boardType);
        setTitle(data.title);
        setContent(data.content);
        setTags(data.tags || []);
        if (data.status) setStatus(data.status);
        if (data.maxMembers) setMaxMembers(data.maxMembers);
        setMeetingType(data.meetingType || '');
        setRegion(data.region || '');
        setTimeSlot(data.timeSlot || '');
      })
      .catch(err => console.error(err));
    }
  }, [editId, token]);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim()) && tags.length < 5) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const url = editId ? `/api/posts/${editId}` : '/api/posts';
      const method = editId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          boardType, title, content, tags, status,
          maxMembers: boardType === '자유' ? null : maxMembers,
          meetingType: boardType === '자유' ? null : (meetingType || null),
          region: boardType === '자유' ? null : (region || null),
          timeSlot: boardType === '자유' ? null : (timeSlot || null),
        })
      });

      if (response.ok) {
        alert(editId ? '게시글이 수정되었습니다.' : '모집글이 등록되었습니다.');
        navigate(editId ? `/post/${editId}` : '/community');
      } else {
        alert('게시글 등록/수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error submitting post:', error);
      alert('오류가 발생했습니다.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center gap-4 border-b border-slate-200 pb-6">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{editId ? '모집글 수정' : '모집글 작성'}</h1>
          <p className="text-sm text-slate-500 mt-1">새로운 스터디나 프로젝트 팀원을 모집해보세요.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        
        <div className="space-y-3">
          <label className="block text-sm font-bold text-slate-700">게시판 유형</label>
          <div className="flex flex-wrap gap-2">
            {boardTypes.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setBoardType(value)}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border",
                  boardType === value
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-white border-slate-200 text-slate-600 hover:border-blue-300"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-bold text-slate-700">제목</label>
          <input 
            type="text" 
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="직관적이고 명확한 제목을 작성해주세요 (예: 리액트 기초 스터디원 모집합니다)"
            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-900"
          />
        </div>

        {boardType !== '자유' && (
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-700">모집 인원 수 제한</label>
            <input
              type="number"
              min={1}
              max={999}
              required
              value={maxMembers}
              onChange={e => setMaxMembers(Math.max(1, Number(e.target.value)))}
              className="w-full sm:w-48 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-900"
              placeholder="예: 5"
            />
            <p className="text-xs text-slate-400">작성자(방장) 본인도 인원에 포함됩니다.</p>
          </div>
        )}

        {boardType !== '자유' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-700">진행 방식</label>
              <div className="flex flex-wrap gap-2">
                {meetingTypes.map(mt => (
                  <button
                    key={mt}
                    type="button"
                    onClick={() => setMeetingType(meetingType === mt ? '' : mt)}
                    className={cn(
                      "px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border",
                      meetingType === mt
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-white border-slate-200 text-slate-600 hover:border-blue-300"
                    )}
                  >
                    {mt}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-700">활동 지역</label>
                <select
                  value={region}
                  onChange={e => setRegion(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-900"
                >
                  <option value="">선택 안 함</option>
                  {regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-700">선호 시간대</label>
                <select
                  value={timeSlot}
                  onChange={e => setTimeSlot(e.target.value as any)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-900"
                >
                  <option value="">선택 안 함</option>
                  {timeSlots.map(ts => <option key={ts.value} value={ts.value}>{ts.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <label className="block text-sm font-bold text-slate-700">모집 상태</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="status" checked={status === 'RECRUITING'} onChange={() => setStatus('RECRUITING')} className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300" />
              <span className="font-semibold text-slate-700">모집 중</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="status" checked={status === 'COMPLETED'} onChange={() => setStatus('COMPLETED')} className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300" />
              <span className="font-semibold text-slate-700">모집 완료</span>
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-bold text-slate-700">상세 내용</label>
          <textarea 
            required
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={12}
            placeholder={`모집 분야, 진행 방식, 예상 일정 등을 상세히 적어주시면 더 좋은 분들을 만날 확률이 높아집니다!`}
            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none text-slate-900"
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-bold text-slate-700">
            태그 <span className="text-slate-400 font-normal">(최대 5개)</span>
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-semibold">
                #{tag}
                <button type="button" onClick={() => removeTag(tag)} className="hover:text-blue-900">
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
          <div className="relative">
            <input 
              type="text" 
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              disabled={tags.length >= 5}
              placeholder="태그를 입력하고 Enter를 누르세요 (예: React, Frontend)"
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 disabled:opacity-50"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
          <button 
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-3 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            취소
          </button>
          <button 
            type="submit"
            className="flex items-center gap-2 px-8 py-3 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors"
          >
            <Save size={20} />
            {editId ? '수정하기' : '등록하기'}
          </button>
        </div>

      </form>
    </div>
  );
}
