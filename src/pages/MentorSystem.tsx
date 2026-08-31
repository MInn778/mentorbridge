import React, { useState, useEffect } from 'react';
import { Award, BookOpen, Briefcase, Star, MessageCircle, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface MentorProfile {
  mentorId: number;
  userId: number;
  name: string;
  mentorIntro: string;
  mentorCareer: string;
  specs: string[];
  profileImageUrl: string | null;
  rating: number;
  reviewCount: number;
}

export default function MentorSystem() {
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyForm, setApplyForm] = useState({ intro: '', career: '', specs: '' });
  const { token, isAuthenticated } = useAuth();

  const fetchMentors = async () => {
    try {
      const res = await fetch('/api/mentors');
      if (res.ok) {
        setMentors(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMentors();
  }, []);

  const handleApplyMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return alert('로그인이 필요합니다.');
    try {
      const res = await fetch('/api/mentors/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          selfIntro: applyForm.intro,
          career: applyForm.career,
          specs: applyForm.specs.split(',').map(s => s.trim()),
          proofUrl: null
        })
      });
      if (res.ok) {
        alert('멘토 신청이 승인되었습니다!');
        setShowApplyModal(false);
        fetchMentors();
      } else {
        alert('신청 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestMatch = async (mentorId: number) => {
    if (!isAuthenticated) return alert('로그인이 필요합니다.');
    try {
      const res = await fetch(`/api/mentors/${mentorId}/match`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        alert('멘토링 신청이 완료되었습니다.');
      } else {
        alert('신청 처리 중 오류가 발생했거나 본인에게 신청할 수 없습니다.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">멘토 시스템</h1>
          <p className="text-slate-500 mt-2">검증된 현직자 멘토들에게 직접 배우고 성장하세요.</p>
        </div>
        <button 
          onClick={() => setShowApplyModal(true)}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors"
        >
          <Plus size={16} /> 멘토 등록하기
        </button>
      </header>

      {mentors.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500">
          현재 등록된 멘토가 없습니다. 첫 멘토가 되어보세요!
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {mentors.map((mentor) => (
            <div key={mentor.mentorId} className="bg-white overflow-hidden rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row">
              <div className="md:w-72 bg-slate-50 p-8 flex flex-col items-center text-center border-b md:border-b-0 md:border-r border-slate-200">
                <img 
                  src={mentor.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.name)}&background=random`} 
                  alt={mentor.name} 
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg mb-4 object-cover"
                />
                <h3 className="text-xl font-bold text-slate-900">{mentor.name} 멘토</h3>
                
                <div className="flex items-center gap-1 mt-4 text-orange-500">
                  <Star size={16} fill="currentColor" />
                  <span className="text-sm font-bold">{mentor.rating}</span>
                  <span className="text-xs text-slate-400 font-normal">({mentor.reviewCount})</span>
                </div>

                <button 
                  onClick={() => handleRequestMatch(mentor.mentorId)}
                  className="w-full mt-6 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors"
                >
                  <MessageCircle size={18} /> 멘토링 신청
                </button>
              </div>

              <div className="flex-1 p-8 space-y-8">
                <section>
                  <div className="flex items-center gap-2 text-slate-900 font-bold mb-4">
                    <Award size={20} className="text-blue-600" />
                    <h4>전문 분야 (Specs)</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {mentor.specs && mentor.specs.length > 0 ? mentor.specs.map(spec => (
                      <span key={spec} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold">
                        {spec}
                      </span>
                    )) : (
                      <span className="text-sm text-slate-400">등록된 전문 분야가 없습니다.</span>
                    )}
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-2 text-slate-900 font-bold mb-4">
                    <Briefcase size={20} className="text-blue-600" />
                    <h4>자기소개 및 경력</h4>
                  </div>
                  <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap mb-4 bg-slate-50 p-4 rounded-xl">
                    {mentor.mentorIntro}
                  </p>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">
                    {mentor.mentorCareer}
                  </p>
                </section>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Apply Mentor Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">멘토 등록 신청</h2>
              <p className="text-sm text-slate-500 mt-1">간단한 정보를 입력하고 멘토 활동을 시작해보세요.</p>
            </div>
            <form onSubmit={handleApplyMentor} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">자기소개</label>
                <textarea 
                  required
                  value={applyForm.intro}
                  onChange={e => setApplyForm({...applyForm, intro: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm min-h-[100px]"
                  placeholder="멘티들에게 자신을 어필할 수 있는 소개글을 적어주세요."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">경력 사항</label>
                <textarea 
                  required
                  value={applyForm.career}
                  onChange={e => setApplyForm({...applyForm, career: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm min-h-[80px]"
                  placeholder="예: 현) Google Korea Senior Engineer"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">전문 분야 (쉼표로 구분)</label>
                <input 
                  type="text"
                  required
                  value={applyForm.specs}
                  onChange={e => setApplyForm({...applyForm, specs: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                  placeholder="예: React, TypeScript, Next.js"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors text-sm"
                >
                  취소
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors text-sm"
                >
                  신청 완료 (자동 승인)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
