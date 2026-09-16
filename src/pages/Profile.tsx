import React from 'react';
import { User, Mail, Phone, Calendar, Shield, Award, MapPin } from 'lucide-react';

export default function Profile() {
  // 임시 데이터 (실제로는 API 연동을 통해 가져와야 함)
  const userInfo = {
    id: 'mentee_dreamtree',
    name: '김멘티',
    role: 'mentee', // 'mentor' 또는 'mentee'
    email: 'dreamtree@mentorbridge.com',
    phone: '010-1234-5678',
    joinDate: '2024-03-15',
    location: '서울특별시 강남구',
    interests: ['AI', '프론트엔드 개발', '데이터 분석'],
  };

  const isMentor = userInfo.role === 'mentor';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 헤더 섹션 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-32 bg-white border-b border-slate-100"></div>
        <div className="px-8 pb-8 relative">
          <div className="flex justify-between items-end -mt-12 mb-6">
            <div className="flex items-end gap-6">
              <div className="h-24 w-24 rounded-full bg-white p-1 shadow-md">
                <div className="h-full w-full rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <User size={48} />
                </div>
              </div>
              <div className="mb-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-900">{userInfo.name}</h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    isMentor 
                      ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}>
                    {isMentor ? '멘토 (Mentor)' : '멘티 (Mentee)'}
                  </span>
                </div>
                <p className="text-slate-500 font-medium">@{userInfo.id}</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-colors mb-2">
              프로필 수정
            </button>
          </div>
        </div>
      </div>

      {/* 기본 정보 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Shield size={20} className="text-blue-600" />
              계정 정보
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail size={18} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">이메일</p>
                  <p className="text-sm font-medium text-slate-900">{userInfo.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone size={18} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">연락처</p>
                  <p className="text-sm font-medium text-slate-900">{userInfo.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar size={18} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">가입일</p>
                  <p className="text-sm font-medium text-slate-900">{userInfo.joinDate}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">지역</p>
                  <p className="text-sm font-medium text-slate-900">{userInfo.location}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Award size={20} className="text-blue-600" />
              나의 관심 분야
            </h2>
            <div className="flex flex-wrap gap-2">
              {userInfo.interests.map((interest, index) => (
                <span 
                  key={index}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm font-medium text-slate-700"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center h-48 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <Award size={24} />
            </div>
            <p className="text-slate-500 font-medium">아직 완료한 활동 내역이 없습니다.</p>
            <p className="text-sm text-slate-400 mt-1">멘토링이나 스터디에 참여해보세요!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
