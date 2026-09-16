import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { User, Shield, Edit2, Check, X, Target, Users, ExternalLink, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface StudyGroup {
  groupId: number;
  boardId: number;
  leaderId: number;
  leaderName: string;
  groupName: string;
  maxMembers: number;
  status: string;
  currentMembersCount: number;
}

interface UserProfile {
  profileId: number;
  userId: number;
  userName: string;
  role: 'MENTOR' | 'MENTEE' | 'ADMIN' | null;
  status: '학생' | '취준생' | '재직자' | null;
  major: string | null;
  skills: string | null;
  goal: string | null;
  goalType: '취업' | '대학원' | '자격증' | null;
  profileImageUrl: string | null;
  interests?: string[];
  participatingGroups?: StudyGroup[];
}

export default function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const { token, user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [interestInput, setInterestInput] = useState('');

  // If no userId is in URL, it's "my profile"
  const isMyProfile = !userId || (profile && currentUser && profile.userName === currentUser.name);

  useEffect(() => {
    if (!token && !userId) {
      setIsLoading(false);
      return;
    }

    const endpoint = userId ? `/api/profiles/${userId}` : '/api/profiles/me';
    const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

    fetch(endpoint, { headers })
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setEditForm(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, [token, userId]);

  const handleAddInterest = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && interestInput.trim()) {
      e.preventDefault();
      const current = editForm.interests || [];
      if (!current.includes(interestInput.trim()) && current.length < 10) {
        setEditForm({ ...editForm, interests: [...current, interestInput.trim()] });
      }
      setInterestInput('');
    }
  };

  const removeInterest = (tagToRemove: string) => {
    setEditForm({ ...editForm, interests: (editForm.interests || []).filter(tag => tag !== tagToRemove) });
  };

  const handleSave = async () => {
    try {
      const res = await fetch('/api/profiles/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        setIsEditing(false);
        alert('프로필이 저장되었습니다.');
      } else {
        alert('프로필 저장에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('오류가 발생했습니다.');
    }
  };

  if (isLoading) {
    return <div className="text-center py-20 text-slate-500">프로필 불러오는 중...</div>;
  }

  if (!profile && !userId && !token) {
    return <div className="text-center py-20 text-slate-500">로그인이 필요합니다.</div>;
  }

  if (!profile) {
    return <div className="text-center py-20 text-slate-500">프로필 정보를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-32 bg-slate-50 border-b border-slate-100"></div>
        <div className="px-8 pb-8 relative">
          <div className="flex justify-between items-end -mt-12 mb-6">
            <div className="flex items-end gap-6">
              <div className="h-24 w-24 rounded-full bg-white p-1 shadow-md">
                <div className="h-full w-full rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-3xl">
                  {profile.userName?.charAt(0) || <User size={40} />}
                </div>
              </div>
              <div className="mb-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900">{profile.userName || '이름 없음'}</h1>
                  {profile.role && (
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                      profile.role === 'MENTOR' ? 'bg-orange-100 text-orange-600' :
                      profile.role === 'ADMIN' ? 'bg-slate-800 text-white' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {profile.role === 'MENTOR' ? '멘토' : profile.role === 'ADMIN' ? '관리자' : '멘티'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {isMyProfile && (
              !isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-colors mb-2"
                >
                  <Edit2 size={16} /> 프로필 수정
                </button>
              ) : (
                <div className="flex gap-2 mb-2">
                  <button 
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                  >
                    <Check size={16} /> 저장
                  </button>
                  <button 
                    onClick={() => { setIsEditing(false); setEditForm(profile); setInterestInput(''); }}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-colors"
                  >
                    <X size={16} /> 취소
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Shield size={20} className="text-blue-600" />
            기본 정보
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">현재 상태</label>
              {isEditing ? (
                <select 
                  value={editForm.status || ''} 
                  onChange={(e) => setEditForm({...editForm, status: e.target.value as any})}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">선택</option>
                  <option value="학생">학생</option>
                  <option value="취준생">취준생</option>
                  <option value="재직자">재직자</option>
                </select>
              ) : (
                <p className="text-sm font-medium text-slate-900">{profile.status || '-'}</p>
              )}
            </div>
            
            <div>
              <label className="text-xs text-slate-500 mb-1 block">전공</label>
              {isEditing ? (
                <input 
                  type="text" 
                  value={editForm.major || ''} 
                  onChange={(e) => setEditForm({...editForm, major: e.target.value})}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 컴퓨터공학"
                />
              ) : (
                <p className="text-sm font-medium text-slate-900">{profile.major || '-'}</p>
              )}
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">보유 기술 (쉼표로 구분)</label>
              {isEditing ? (
                <input 
                  type="text" 
                  value={editForm.skills || ''} 
                  onChange={(e) => setEditForm({...editForm, skills: e.target.value})}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: React, Java, Spring"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.skills ? profile.skills.split(',').map((skill, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-100 rounded-md text-xs font-medium text-slate-700">
                      {skill.trim()}
                    </span>
                  )) : '-'}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block flex items-center gap-1">
                <Sparkles size={12} /> 관심분야 태그
              </label>
              {isEditing ? (
                <div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(editForm.interests || []).map(tag => (
                      <span key={tag} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-semibold">
                        #{tag}
                        <button type="button" onClick={() => removeInterest(tag)} className="hover:text-blue-900">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    onKeyDown={handleAddInterest}
                    disabled={(editForm.interests || []).length >= 10}
                    placeholder="태그를 입력하고 Enter (예: 프론트엔드, 알고리즘, 오프라인)"
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.interests && profile.interests.length > 0 ? profile.interests.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-bold">
                      #{tag}
                    </span>
                  )) : <p className="text-sm text-slate-400">-</p>}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Target size={20} className="text-blue-600" />
            목표
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">목표 유형</label>
              {isEditing ? (
                <select 
                  value={editForm.goalType || ''} 
                  onChange={(e) => setEditForm({...editForm, goalType: e.target.value as any})}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">선택</option>
                  <option value="취업">취업</option>
                  <option value="대학원">대학원</option>
                  <option value="자격증">자격증</option>
                </select>
              ) : (
                <p className="text-sm font-medium text-slate-900">{profile.goalType || '-'}</p>
              )}
            </div>
            
            <div>
              <label className="text-xs text-slate-500 mb-1 block">목표 상세 내용</label>
              {isEditing ? (
                <textarea 
                  value={editForm.goal || ''} 
                  onChange={(e) => setEditForm({...editForm, goal: e.target.value})}
                  className="w-full p-2 border border-slate-200 rounded-lg min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="이루고 싶은 목표를 자세히 적어주세요."
                />
              ) : (
                <p className="text-sm font-medium text-slate-900 whitespace-pre-wrap">{profile.goal || '-'}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {profile.participatingGroups && profile.participatingGroups.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Users size={20} className="text-blue-600" />
            참여 중인 스터디 및 프로젝트
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {profile.participatingGroups.map(group => (
              <div key={group.groupId} className="p-5 border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-md">
                    {group.status}
                  </span>
                  <Link to={`/community/${group.boardId}`} className="text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink size={16} />
                  </Link>
                </div>
                <h3 className="font-bold text-slate-900 mb-2 truncate">{group.groupName}</h3>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">방장: <span className="font-semibold text-slate-700">{group.leaderName}</span></span>
                  <span className="text-slate-500">{group.currentMembersCount} / {group.maxMembers}명</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
