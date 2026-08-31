import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Target, Users, Briefcase, Trophy, MessageSquare, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/contexts/NotificationContext';

export default function Dashboard() {
  const { notifications } = useNotifications();
  
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
              <Link to="/notifications" className="text-sm text-blue-600 font-medium hover:underline">전체보기</Link>
            </div>
            <div className="space-y-4">
              {notifications.length === 0 ? (
                <div className="text-center text-sm text-slate-500 py-4">최근 활동이 없습니다.</div>
              ) : (
                notifications.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className={cn(
                      "mt-1.5 h-2 w-2 rounded-full shrink-0",
                      activity.isRead ? "bg-slate-300" : "bg-blue-500"
                    )} />
                    <div className="flex-1">
                      {activity.link ? (
                        <Link to={activity.link} className="text-sm font-medium text-slate-800 hover:text-blue-600 hover:underline block line-clamp-2">
                          {activity.title}
                        </Link>
                      ) : (
                        <p className="text-sm font-medium text-slate-800 line-clamp-2">{activity.title}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">{new Date(activity.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
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
