import React from 'react';
import { Award, BookOpen, Briefcase, Star, MessageCircle } from 'lucide-react';

const mentors = [
  {
    id: '1',
    name: '김민준',
    title: '시니어 프론트엔드 개발자',
    company: 'Google Korea',
    experience: '10년',
    avatar: 'https://picsum.photos/seed/mentor1/200',
    specs: ['React', 'TypeScript', 'Next.js', 'Web Performance'],
    history: [
      '현) Google Korea Senior Engineer',
      '전) Naver FE Platform Team',
      '전) Kakao Commerce FE Dev'
    ],
    rating: 4.9,
    reviews: 128
  },
  {
    id: '2',
    name: '이서연',
    title: '데이터 사이언티스트',
    company: 'Toss',
    experience: '7년',
    avatar: 'https://picsum.photos/seed/mentor2/200',
    specs: ['Python', 'Machine Learning', 'SQL', 'Big Data'],
    history: [
      '현) Toss Data Platform Lead',
      '전) Coupang Data Science Team',
      'KAIST 전산학 석사'
    ],
    rating: 4.8,
    reviews: 95
  },
  {
    id: '3',
    name: '박지훈',
    title: '프로덕트 디자이너',
    company: 'Line',
    experience: '8년',
    avatar: 'https://picsum.photos/seed/mentor3/200',
    specs: ['UI/UX', 'Figma', 'Design System', 'Prototyping'],
    history: [
      '현) Line Design System Team',
      '전) Woowa Brothers Product Design',
      'iF Design Award 수상 (2022)'
    ],
    rating: 5.0,
    reviews: 156
  }
];

export default function MentorSystem() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">멘토 시스템</h1>
        <p className="text-slate-500 mt-2">검증된 현직자 멘토들에게 직접 배우고 성장하세요.</p>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {mentors.map((mentor) => (
          <div key={mentor.id} className="bg-white overflow-hidden rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row">
            <div className="md:w-72 bg-slate-50 p-8 flex flex-col items-center text-center border-b md:border-b-0 md:border-r border-slate-200">
              <img 
                src={mentor.avatar} 
                alt={mentor.name} 
                className="w-32 h-32 rounded-full border-4 border-white shadow-lg mb-4 object-cover"
                referrerPolicy="no-referrer"
              />
              <h3 className="text-xl font-bold text-slate-900">{mentor.name}</h3>
              <p className="text-sm font-medium text-blue-600 mt-1">{mentor.company}</p>
              <p className="text-xs text-slate-400 mt-1">{mentor.title}</p>
              
              <div className="flex items-center gap-1 mt-4 text-orange-500">
                <Star size={16} fill="currentColor" />
                <span className="text-sm font-bold">{mentor.rating}</span>
                <span className="text-xs text-slate-400 font-normal">({mentor.reviews})</span>
              </div>

              <button className="w-full mt-6 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors">
                <MessageCircle size={18} /> 멘토링 신청
              </button>
            </div>

            <div className="flex-1 p-8 space-y-8">
              <section>
                <div className="flex items-center gap-2 text-slate-900 font-bold mb-4">
                  <Award size={20} className="text-blue-600" />
                  <h4>전문 분야</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {mentor.specs.map(spec => (
                    <span key={spec} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold">
                      {spec}
                    </span>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 text-slate-900 font-bold mb-4">
                  <Briefcase size={20} className="text-blue-600" />
                  <h4>히스토리 & 경력</h4>
                </div>
                <ul className="space-y-3">
                  {mentor.history.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-600 text-sm">
                      <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <div className="flex items-center gap-2 text-slate-900 font-bold mb-4">
                  <BookOpen size={20} className="text-blue-600" />
                  <h4>멘토링 가능 시간</h4>
                </div>
                <p className="text-sm text-slate-500">평일 오후 8시 이후 / 주말 협의 가능</p>
              </section>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
