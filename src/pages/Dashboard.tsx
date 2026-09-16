import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Target, Users, Briefcase, Trophy, MessageSquare, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">활동 대시보드</h1>
        <p className="text-slate-500 mt-2">환영합니다! 오늘의 활동 현황입니다.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: '참여 중인 스터디', value: '3', icon: Users, color: 'bg-blue-500' },
          { label: '진행 중인 멘토링', value: '1', icon: Target, color: 'bg-orange-500' },
          { label: '제출한 피드백', value: '5', icon: MessageSquare, color: 'bg-green-500' },
          { label: '스크랩한 공고', value: '12', icon: Briefcase, color: 'bg-purple-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className={cn("p-2 rounded-lg text-white", stat.color)}>
                <stat.icon size={20} />
              </div>
              <span className="text-2xl font-bold text-slate-900">{stat.value}</span>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">최근 활동 내역</h2>
              <button className="text-sm text-blue-600 font-medium hover:underline">전체보기</button>
            </div>
            <div className="space-y-4">
              {[
                { title: '알고리즘 스터디 모집글에 댓글을 남겼습니다.', time: '2시간 전', type: 'comment' },
                { title: '김멘토님께 포트폴리오 피드백을 요청했습니다.', time: '5시간 전', type: 'mentoring' },
                { title: '네이버 신입 공채 공고를 스크랩했습니다.', time: '어제', type: 'scrap' },
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{activity.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-lg">
            <h2 className="text-xl font-bold mb-2">AI 진로 추천</h2>
            <p className="text-blue-100 text-sm mb-6">아직 진로를 결정하지 못하셨나요? AI가 당신의 적성을 분석해드립니다.</p>
            <Link to="/ai-career" className="inline-flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors">
              시작하기 <ArrowRight size={16} />
            </Link>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">추천 공모전</h2>
            <div className="space-y-4">
              {[
                { title: '2024 대학생 IT 연합 해커톤', dday: 'D-12' },
                { title: '삼성전자 오픈소스 경진대회', dday: 'D-5' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl">
                  <span className="text-sm font-medium text-slate-700 truncate mr-2">{item.title}</span>
                  <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md whitespace-nowrap">{item.dday}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
