import React from 'react';
import { ExternalLink, Building2, MapPin, Clock, Search } from 'lucide-react';

export default function Recruitment() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">채용 & 정보</h1>
        <p className="text-slate-500 mt-2">최신 채용 정보와 기업 트렌드를 확인하세요.</p>
      </header>

      <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-center gap-4">
        <div className="p-3 bg-blue-600 text-white rounded-2xl">
          <Building2 size={24} />
        </div>
        <div>
          <h2 className="font-bold text-blue-900">사람인 API 연동 예정</h2>
          <p className="text-sm text-blue-700">실시간 채용 공고를 곧 여기서 바로 확인하실 수 있습니다.</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="회사명, 직무, 키워드로 검색"
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {[
          { company: '네이버', title: '2024 상반기 신입 개발자 공개 채용', location: '성남시 분당구', type: '신입', deadline: 'D-7' },
          { company: '카카오', title: 'FE 개발자 경력 수시 채용', location: '제주시', type: '경력', deadline: '상시' },
          { company: '토스', title: 'Data Scientist (Product)', location: '서울시 강남구', type: '경력', deadline: 'D-14' },
          { company: '당근', title: '백엔드 엔지니어 인턴십', location: '서울시 서초구', type: '인턴', deadline: 'D-3' },
        ].map((job, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all group cursor-pointer">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{job.title}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                    <span className="text-sm font-semibold text-slate-600">{job.company}</span>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <MapPin size={12} /> {job.location}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock size={12} /> {job.type}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-4">
                <span className="text-sm font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-lg">{job.deadline}</span>
                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                  <ExternalLink size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
