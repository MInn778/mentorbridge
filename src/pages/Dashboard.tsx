import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Target, Users, Briefcase, MessageSquare, ArrowRight, ExternalLink, ChevronDown, Pin, Megaphone, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import NoticePopup from '@/components/NoticePopup';

interface DashboardStats {
  studyCount: number;
  mentoringCount: number;
  feedbackCount: number;
  bookmarkCount: number;
}

interface StudyGroup {
  groupId: number;
  boardId: number;
  leaderName: string;
  groupName: string;
  maxMembers: number;
  status: string;
  currentMembersCount: number;
}

interface Matching {
  matchingId: number;
  myRole: 'MENTEE' | 'MENTOR';
  otherPartyName: string;
  status: 'REQUESTED' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';
  createdAt: string;
}

interface FeedbackPost {
  id: number;
  title: string;
  content: string;
  createdAt: string;
}

interface Bookmark {
  bookmarkId: number;
  jobTitle: string;
  originalUrl: string;
  source: string;
  savedAt: string;
}

interface Notice {
  id: number;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
}

const matchingStatusLabel: Record<Matching['status'], string> = {
  REQUESTED: '대기중',
  ACCEPTED: '수락됨',
  REJECTED: '거절됨',
  COMPLETED: '완료',
};

type TabKey = 'study' | 'mentoring' | 'feedback' | 'bookmark';

export default function Dashboard() {
  const { notifications } = useNotifications();
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey | null>(null);

  const [myStudies, setMyStudies] = useState<StudyGroup[]>([]);
  const [myMatchings, setMyMatchings] = useState<Matching[]>([]);
  const [myFeedback, setMyFeedback] = useState<FeedbackPost[]>([]);
  const [myBookmarks, setMyBookmarks] = useState<Bookmark[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);

  const fetchMatchings = () => {
    if (!token) return;
    fetch('/api/mentors/my-matchings', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => (res.ok ? res.json() : []))
      .then(setMyMatchings)
      .catch(() => {});
  };

  const fetchStats = () => {
    if (!token) return;
    fetch('/api/dashboard/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => (res.ok ? res.json() : Promise.reject(res)))
      .then(setStats)
      .catch(err => console.error('Failed to fetch dashboard stats', err));
  };

  useEffect(() => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    fetchStats();
    fetchMatchings();
    fetch('/api/studies/my', { headers }).then(res => (res.ok ? res.json() : [])).then(setMyStudies).catch(() => {});
    fetch('/api/feedback/my', { headers }).then(res => (res.ok ? res.json() : [])).then(setMyFeedback).catch(() => {});
    fetch('/api/jobs/bookmarks', { headers }).then(res => (res.ok ? res.json() : [])).then(setMyBookmarks).catch(() => {});
    fetch('/api/notices', { headers }).then(res => (res.ok ? res.json() : [])).then(setNotices).catch(() => {});
  }, [token]);

  const toggleTab = (tab: TabKey) => setActiveTab(prev => (prev === tab ? null : tab));

  const respondToMatching = async (matchingId: number, action: 'accept' | 'reject' | 'complete') => {
    if (action === 'complete' && !confirm('이 멘토링을 완료 처리하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/mentors/matchings/${matchingId}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchMatchings();
        fetchStats();
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.message || '처리 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const statCards: { key: TabKey; label: string; value: number | undefined; icon: typeof Users; color: string }[] = [
    { key: 'study', label: '참여 중인 스터디', value: stats?.studyCount, icon: Users, color: 'bg-blue-500' },
    { key: 'mentoring', label: '진행 중인 멘토링', value: stats?.mentoringCount, icon: Target, color: 'bg-orange-500' },
    { key: 'feedback', label: '제출한 피드백', value: stats?.feedbackCount, icon: MessageSquare, color: 'bg-green-500' },
    { key: 'bookmark', label: '스크랩한 공고', value: stats?.bookmarkCount, icon: Briefcase, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <NoticePopup notices={notices} />

      <header>
        <h1 className="text-3xl font-bold text-slate-900">활동 대시보드</h1>
        <p className="text-slate-500 mt-2">환영합니다! 오늘의 활동 현황입니다.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <button
            key={stat.key}
            onClick={() => toggleTab(stat.key)}
            className={cn(
              "text-left bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow",
              activeTab === stat.key ? "border-blue-400 ring-2 ring-blue-100" : "border-slate-200"
            )}
          >
            <div className="flex items-center justify-between">
              <div className={cn("p-2 rounded-lg text-white", stat.color)}>
                <stat.icon size={20} />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold text-slate-900">{stat.value ?? '-'}</span>
                <ChevronDown size={16} className={cn("text-slate-400 transition-transform", activeTab === stat.key && "rotate-180")} />
              </div>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-500">{stat.label}</p>
          </button>
        ))}
      </div>

      {activeTab && (
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in duration-300">
          {activeTab === 'study' && (
            myStudies.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-6">참여 중인 스터디가 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {myStudies.map(g => (
                  <Link key={g.groupId} to={`/community/${g.boardId}`} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-bold text-slate-900">{g.groupName}</p>
                      <p className="text-xs text-slate-400 mt-1">방장: {g.leaderName}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full whitespace-nowrap">
                      {g.currentMembersCount}/{g.maxMembers}명
                    </span>
                  </Link>
                ))}
              </div>
            )
          )}

          {activeTab === 'mentoring' && (
            myMatchings.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-6">진행 중인 멘토링이 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {myMatchings.map(m => (
                  <div key={m.matchingId} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-bold text-slate-900">{m.otherPartyName}</p>
                      <p className="text-xs text-slate-400 mt-1">{m.myRole === 'MENTEE' ? '내가 신청한 멘토' : '나에게 신청한 멘티'}</p>
                    </div>
                    {m.myRole === 'MENTOR' && m.status === 'REQUESTED' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => respondToMatching(m.matchingId, 'accept')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors"
                        >
                          <Check size={14} /> 승인
                        </button>
                        <button
                          onClick={() => respondToMatching(m.matchingId, 'reject')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                        >
                          <X size={14} /> 거절
                        </button>
                      </div>
                    ) : m.status === 'ACCEPTED' ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap bg-green-100 text-green-700">
                          {matchingStatusLabel[m.status]}
                        </span>
                        <button
                          onClick={() => respondToMatching(m.matchingId, 'complete')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
                        >
                          <Check size={14} /> 완료 처리
                        </button>
                      </div>
                    ) : (
                      <span className={cn(
                        "text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap",
                        m.status === 'REJECTED' ? "bg-red-100 text-red-600" :
                        m.status === 'COMPLETED' ? "bg-slate-200 text-slate-600" :
                        "bg-orange-100 text-orange-600"
                      )}>
                        {matchingStatusLabel[m.status]}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'feedback' && (
            myFeedback.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-6">제출한 피드백이 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {myFeedback.map(f => (
                  <Link key={f.id} to="/feedback" className="block p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-slate-50 transition-colors">
                    <p className="font-bold text-slate-900 line-clamp-1">{f.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{new Date(f.createdAt).toLocaleDateString()}</p>
                  </Link>
                ))}
              </div>
            )
          )}

          {activeTab === 'bookmark' && (
            myBookmarks.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-6">스크랩한 공고가 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {myBookmarks.map(b => (
                  <a key={b.bookmarkId} href={b.originalUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-bold text-slate-900">{b.jobTitle}</p>
                      <p className="text-xs text-slate-400 mt-1">{b.source}</p>
                    </div>
                    <ExternalLink size={16} className="text-slate-400" />
                  </a>
                ))}
              </div>
            )
          )}
        </section>
      )}

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
          {notices.length > 0 && (
            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Megaphone size={18} className="text-blue-600" /> 공지사항
              </h2>
              <div className="space-y-3">
                {notices.slice(0, 3).map(n => (
                  <div key={n.id} className="p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5">
                      {n.isPinned && <Pin size={12} className="text-orange-500 shrink-0" />}
                      <p className="text-sm font-bold text-slate-800 line-clamp-1">{n.title}</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.content}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

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
