import React from 'react';
import { Trophy, Calendar, Link as LinkIcon, ArrowUpRight } from 'lucide-react';

export default function Activities() {
  const activities = [
    {
      title: '제2회 AI 서비스 아이디어 공모전',
      organizer: '한국인공지능협회',
      period: '2024.04.01 ~ 2024.05.15',
      reward: '총 상금 1,000만원',
      link: 'https://example.com/contest1',
      tags: ['공모전', 'AI', '기획']
    },
    {
      title: '구글 개발자 그룹(GDG) 해커톤 2024',
      organizer: 'GDG Korea',
      period: '2024.06.10 ~ 2024.06.12',
      reward: '구글 본사 견학 기회',
      link: 'https://example.com/hackathon',
      tags: ['해커톤', '개발', '네트워킹']
    },
    {
      title: '대학생 IT 연합 동아리 SOPT 34기 모집',
      organizer: 'SOPT',
      period: '2024.03.15 ~ 2024.03.30',
      reward: 'IT 프로젝트 협업 경험',
      link: 'https://example.com/sopt',
      tags: ['대외활동', '동아리', 'IT']
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">공모전 & 활동</h1>
        <p className="text-slate-500 mt-2">스펙을 쌓고 실력을 증명할 수 있는 기회를 놓치지 마세요.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {activities.map((act, i) => (
          <div key={i} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col h-full group">
            <div className="flex items-start justify-between mb-6">
              <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
                <Trophy size={24} />
              </div>
              <div className="flex gap-2">
                {act.tags.map(tag => (
                  <span key={tag} className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
              {act.title}
            </h3>
            <p className="text-sm font-semibold text-slate-600 mb-6">{act.organizer}</p>
            
            <div className="mt-auto space-y-4">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <Calendar size={16} className="text-slate-400" />
                <span>{act.period}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <Trophy size={16} className="text-slate-400" />
                <span className="font-bold text-blue-600">{act.reward}</span>
              </div>
              
              <a 
                href={act.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-6 flex items-center justify-center gap-2 w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-colors"
              >
                <LinkIcon size={18} /> 상세 정보 및 지원하기 <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
