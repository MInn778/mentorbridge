import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Users, UserCheck, FileText, Megaphone, Check, X, Trash2, Pin, Flag, ShieldCheck } from 'lucide-react';

interface AdminUser {
  userId: number;
  email: string;
  name: string;
  role: 'MENTOR' | 'MENTEE' | 'ADMIN';
  isSuspended: boolean;
  isMentorVerified: boolean;
  joinDate: string;
}

interface MentorRequest {
  requestId: number;
  userId: number;
  userName: string;
  userEmail: string;
  selfIntro: string;
  career: string;
  proofUrl: string | null;
  specs: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectReason: string | null;
  requestedAt: string;
}

interface AdminPost {
  boardId: number;
  authorName: string;
  boardType: string;
  title: string;
  createdAt: string;
}

interface Notice {
  id: number;
  authorName: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
}

interface Report {
  reportId: number;
  postId: number;
  postTitle: string;
  reporterId: number;
  reporterName: string;
  reason: string;
  status: '접수' | '처리중' | '완료';
  processResult: string | null;
  createdAt: string;
  processedAt: string | null;
}

type Tab = 'users' | 'mentors' | 'posts' | 'reports' | 'notices';

export default function Admin() {
  const { token, user } = useAuth();
  const [tab, setTab] = useState<Tab>('users');

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [mentorRequests, setMentorRequests] = useState<MentorRequest[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [noticeForm, setNoticeForm] = useState({ title: '', content: '', isPinned: false });

  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchUsers = () => fetch('/api/admin/users', { headers: authHeaders }).then(r => r.ok ? r.json() : []).then(setUsers);
  const fetchMentorRequests = () => fetch('/api/admin/mentor-requests', { headers: authHeaders }).then(r => r.ok ? r.json() : []).then(setMentorRequests);
  const fetchPosts = () => fetch('/api/posts', { headers: authHeaders }).then(r => r.ok ? r.json() : []).then(setPosts);
  const fetchNotices = () => fetch('/api/notices', { headers: authHeaders }).then(r => r.ok ? r.json() : []).then(setNotices);
  const fetchReports = () => fetch('/api/admin/reports', { headers: authHeaders }).then(r => r.ok ? r.json() : []).then(setReports);

  useEffect(() => {
    if (!token) return;
    fetchUsers();
    fetchMentorRequests();
    fetchPosts();
    fetchNotices();
    fetchReports();
  }, [token]);

  if (user?.role !== 'ADMIN') {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <p className="text-lg font-bold text-slate-900">관리자 권한이 필요합니다.</p>
        <p className="text-sm text-slate-500 mt-2">이 페이지는 관리자만 접근할 수 있습니다.</p>
      </div>
    );
  }

  const toggleSuspend = async (u: AdminUser) => {
    if (!confirm(`${u.name}님 계정을 ${u.isSuspended ? '정지 해제' : '정지'}하시겠습니까?`)) return;
    const res = await fetch(`/api/admin/users/${u.userId}/suspend`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ suspended: !u.isSuspended }),
    });
    if (res.ok) fetchUsers();
    else alert('처리에 실패했습니다.');
  };

  const approveRequest = async (id: number) => {
    const res = await fetch(`/api/admin/mentor-requests/${id}/approve`, { method: 'POST', headers: authHeaders });
    if (res.ok) fetchMentorRequests();
    else alert('승인에 실패했습니다.');
  };

  const rejectRequest = async (id: number) => {
    const reason = prompt('반려 사유를 입력해주세요.');
    if (reason === null) return;
    const res = await fetch(`/api/admin/mentor-requests/${id}/reject`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ reason }),
    });
    if (res.ok) fetchMentorRequests();
    else alert('반려에 실패했습니다.');
  };

  const deletePost = async (boardId: number) => {
    if (!confirm('이 게시글을 삭제하시겠습니까?')) return;
    const res = await fetch(`/api/admin/posts/${boardId}`, { method: 'DELETE', headers: authHeaders });
    if (res.ok) fetchPosts();
    else alert('삭제에 실패했습니다.');
  };

  const submitNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeForm.title.trim() || !noticeForm.content.trim()) return;
    const res = await fetch('/api/admin/notices', { method: 'POST', headers: authHeaders, body: JSON.stringify(noticeForm) });
    if (res.ok) {
      setNoticeForm({ title: '', content: '', isPinned: false });
      fetchNotices();
    } else {
      alert('등록에 실패했습니다.');
    }
  };

  const deleteNotice = async (id: number) => {
    if (!confirm('이 공지를 삭제하시겠습니까?')) return;
    const res = await fetch(`/api/admin/notices/${id}`, { method: 'DELETE', headers: authHeaders });
    if (res.ok) fetchNotices();
    else alert('삭제에 실패했습니다.');
  };

  const promoteToAdmin = async (u: AdminUser) => {
    if (!confirm(`${u.name}님을 관리자로 지정하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;
    const res = await fetch(`/api/admin/users/${u.userId}/promote`, { method: 'PATCH', headers: authHeaders });
    if (res.ok) fetchUsers();
    else alert('처리에 실패했습니다.');
  };

  const updateReport = async (reportId: number, status: '처리중' | '완료', processResult?: string) => {
    const res = await fetch(`/api/admin/reports/${reportId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status, processResult: processResult ?? null }),
    });
    if (res.ok) fetchReports();
    else alert('처리에 실패했습니다.');
  };

  const resolveReport = async (report: Report) => {
    const result = prompt('처리 결과를 입력해주세요. (예: 게시글 삭제 조치)');
    if (result === null) return;
    await updateReport(report.reportId, '완료', result);
  };

  const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
    { key: 'users', label: '사용자 관리', icon: Users },
    { key: 'mentors', label: '멘토 신청 심사', icon: UserCheck },
    { key: 'posts', label: '게시글 관리', icon: FileText },
    { key: 'reports', label: '신고 관리', icon: Flag },
    { key: 'notices', label: '공지사항', icon: Megaphone },
  ];

  const pendingCount = mentorRequests.filter(r => r.status === 'PENDING').length;
  const pendingReportCount = reports.filter(r => r.status !== '완료').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">관리자 페이지</h1>
        <p className="text-slate-500 mt-2">사용자, 멘토 신청, 게시글, 공지사항을 관리합니다.</p>
      </header>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all",
              tab === t.key ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200 hover:border-slate-400"
            )}
          >
            <t.icon size={16} />
            {t.label}
            {t.key === 'mentors' && pendingCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            )}
            {t.key === 'reports' && pendingReportCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingReportCount}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs">
                <tr>
                  <th className="text-left px-6 py-3 font-bold">이름</th>
                  <th className="text-left px-6 py-3 font-bold">이메일</th>
                  <th className="text-left px-6 py-3 font-bold">역할</th>
                  <th className="text-left px-6 py-3 font-bold">가입일</th>
                  <th className="text-left px-6 py-3 font-bold">상태</th>
                  <th className="text-right px-6 py-3 font-bold">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.userId} className={u.isSuspended ? "bg-red-50/50" : ""}>
                    <td className="px-6 py-4 font-semibold text-slate-900">{u.name}</td>
                    <td className="px-6 py-4 text-slate-500">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold">{u.role}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{new Date(u.joinDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      {u.isSuspended ? (
                        <span className="text-red-600 font-bold text-xs">정지됨</span>
                      ) : (
                        <span className="text-green-600 font-bold text-xs">활성</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.role !== 'ADMIN' && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => promoteToAdmin(u)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-800 hover:text-white transition-colors"
                          >
                            <ShieldCheck size={14} /> 관리자로 지정
                          </button>
                          <button
                            onClick={() => toggleSuspend(u)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                              u.isSuspended ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-red-50 text-red-600 hover:bg-red-100"
                            )}
                          >
                            {u.isSuspended ? '정지 해제' : '정지'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'mentors' && (
        <div className="space-y-4">
          {mentorRequests.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">신청 내역이 없습니다.</div>
          ) : (
            mentorRequests.map(r => (
              <div key={r.requestId} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{r.userName}</span>
                      <span className="text-xs text-slate-400">{r.userEmail}</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-bold",
                        r.status === 'PENDING' ? "bg-orange-100 text-orange-600" :
                        r.status === 'APPROVED' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                      )}>
                        {r.status === 'PENDING' ? '대기중' : r.status === 'APPROVED' ? '승인됨' : '반려됨'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{new Date(r.requestedAt).toLocaleString()}</p>
                  </div>
                  {r.status === 'PENDING' && (
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => approveRequest(r.requestId)} className="flex items-center gap-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg text-xs font-bold hover:bg-green-100">
                        <Check size={14} /> 승인
                      </button>
                      <button onClick={() => rejectRequest(r.requestId)} className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100">
                        <X size={14} /> 반려
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <p><span className="font-bold text-slate-700">자기소개:</span> <span className="text-slate-600">{r.selfIntro}</span></p>
                  <p><span className="font-bold text-slate-700">경력:</span> <span className="text-slate-600">{r.career}</span></p>
                  {r.specs && r.specs.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {r.specs.map(s => <span key={s} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-semibold">{s}</span>)}
                    </div>
                  )}
                  {r.rejectReason && <p className="text-red-500 text-xs">반려 사유: {r.rejectReason}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'posts' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs">
                <tr>
                  <th className="text-left px-6 py-3 font-bold">제목</th>
                  <th className="text-left px-6 py-3 font-bold">유형</th>
                  <th className="text-left px-6 py-3 font-bold">작성자</th>
                  <th className="text-left px-6 py-3 font-bold">작성일</th>
                  <th className="text-right px-6 py-3 font-bold">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {posts.map(p => (
                  <tr key={p.boardId}>
                    <td className="px-6 py-4 font-semibold text-slate-900 max-w-xs truncate">{p.title}</td>
                    <td className="px-6 py-4 text-slate-500">{p.boardType}</td>
                    <td className="px-6 py-4 text-slate-500">{p.authorName}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => deletePost(p.boardId)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">접수된 신고가 없습니다.</div>
          ) : (
            reports.map(r => (
              <div key={r.reportId} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{r.postTitle}</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-bold",
                        r.status === '접수' ? "bg-orange-100 text-orange-600" :
                        r.status === '처리중' ? "bg-blue-100 text-blue-600" : "bg-slate-200 text-slate-600"
                      )}>
                        {r.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      신고자: {r.reporterName} · {new Date(r.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {r.status !== '완료' && (
                    <div className="flex gap-2 shrink-0">
                      {r.status === '접수' && (
                        <button
                          onClick={() => updateReport(r.reportId, '처리중')}
                          className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100"
                        >
                          처리 시작
                        </button>
                      )}
                      <button
                        onClick={() => resolveReport(r)}
                        className="flex items-center gap-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg text-xs font-bold hover:bg-green-100"
                      >
                        <Check size={14} /> 처리 완료
                      </button>
                      <button
                        onClick={() => deletePost(r.postId)}
                        className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100"
                      >
                        <Trash2 size={14} /> 게시글 삭제
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <p><span className="font-bold text-slate-700">신고 사유:</span> <span className="text-slate-600">{r.reason}</span></p>
                  {r.processResult && (
                    <p className="text-green-600 text-xs">처리 결과: {r.processResult} ({r.processedAt && new Date(r.processedAt).toLocaleString()})</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'notices' && (
        <div className="space-y-6">
          <form onSubmit={submitNotice} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-900">새 공지 작성</h2>
            <input
              type="text"
              required
              value={noticeForm.title}
              onChange={e => setNoticeForm({ ...noticeForm, title: e.target.value })}
              placeholder="제목"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              required
              value={noticeForm.content}
              onChange={e => setNoticeForm({ ...noticeForm, content: e.target.value })}
              placeholder="내용"
              rows={4}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" checked={noticeForm.isPinned} onChange={e => setNoticeForm({ ...noticeForm, isPinned: e.target.checked })} />
              상단 고정
            </label>
            <button type="submit" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors">
              등록하기
            </button>
          </form>

          <div className="space-y-3">
            {notices.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">등록된 공지가 없습니다.</div>
            ) : (
              notices.map(n => (
                <div key={n.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      {n.isPinned && <Pin size={14} className="text-orange-500" />}
                      <span className="font-bold text-slate-900">{n.title}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">{n.content}</p>
                    <p className="text-xs text-slate-400 mt-2">{n.authorName} · {new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  <button onClick={() => deleteNotice(n.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
