import React, { useEffect, useState } from 'react';
import { Trophy, Calendar, Link as LinkIcon, ArrowUpRight, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Activity {
  id: number;
  title: string;
  organizer: string | null;
  startDate: string | null;
  endDate: string | null;
  reward: string | null;
  link: string | null;
  tags: string[];
  authorName: string;
}

const emptyForm = { title: '', organizer: '', startDate: '', endDate: '', reward: '', link: '', tags: '' };

export default function Activities() {
  const { token, user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // 등록은 멘토·관리자, 삭제는 관리자만 (서버에서도 막음)
  const canCreate = user?.role === 'MENTOR' || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';

  const fetchActivities = () => {
    if (!token) return;
    fetch('/api/activities', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => (res.ok ? res.json() : []))
      .then(setActivities)
      .catch(() => {});
  };

  useEffect(fetchActivities, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setForm(emptyForm);
        fetchActivities();
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.message || '등록에 실패했습니다.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('이 공모전/활동을 삭제하시겠습니까?')) return;
    const res = await fetch(`/api/admin/activities/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setActivities(prev => prev.filter(a => a.id !== id));
    else alert('삭제에 실패했습니다.');
  };

  const period = (a: Activity) =>
    a.startDate || a.endDate ? `${a.startDate?.replaceAll('-', '.') ?? ''} ~ ${a.endDate?.replaceAll('-', '.') ?? ''}` : null;

  const input = 'w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">공모전 & 활동</h1>
          <p className="text-slate-500 mt-2">스펙을 쌓고 실력을 증명할 수 있는 기회를 놓치지 마세요.</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors"
          >
            <Plus size={16} /> 공모전/활동 등록
          </button>
        )}
      </header>

      {activities.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500">
          {token ? '등록된 공모전/활동이 없습니다.' : '로그인 후 확인할 수 있습니다.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activities.map(act => (
            <div key={act.id} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col h-full group">
              <div className="flex items-start justify-between mb-6 gap-2">
                <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
                  <Trophy size={24} />
                </div>
                <div className="flex gap-2 items-center flex-wrap justify-end">
                  {act.tags.map(tag => (
                    <span key={tag} className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                      {tag}
                    </span>
                  ))}
                  {isAdmin && (
                    <button onClick={() => handleDelete(act.id)} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors" title="삭제">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{act.title}</h3>
              <p className="text-sm font-semibold text-slate-600 mb-6">
                {act.organizer}
                <span className="text-xs font-normal text-slate-400 ml-2">등록: {act.authorName}</span>
              </p>

              <div className="mt-auto space-y-4">
                {period(act) && (
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <Calendar size={16} className="text-slate-400" />
                    <span>{period(act)}</span>
                  </div>
                )}
                {act.reward && (
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <Trophy size={16} className="text-slate-400" />
                    <span className="font-bold text-blue-600">{act.reward}</span>
                  </div>
                )}
                {act.link && (
                  <a
                    href={act.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 flex items-center justify-center gap-2 w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-colors"
                  >
                    <LinkIcon size={18} /> 상세 정보 및 지원하기 <ArrowUpRight size={16} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">공모전/활동 등록</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <input required placeholder="제목 *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={input} />
              <input placeholder="주최 (예: 한국인공지능협회)" value={form.organizer} onChange={e => setForm({ ...form, organizer: e.target.value })} className={input} />
              <div className="flex gap-3 items-center">
                <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className={input} />
                <span className="text-slate-400">~</span>
                <input type="date" value={form.endDate} min={form.startDate || undefined} onChange={e => setForm({ ...form, endDate: e.target.value })} className={input} />
              </div>
              <input placeholder="혜택 (예: 총 상금 1,000만원)" value={form.reward} onChange={e => setForm({ ...form, reward: e.target.value })} className={input} />
              <input type="url" placeholder="링크 (https://...)" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} className={input} />
              <input placeholder="태그 (쉼표로 구분, 예: 공모전, AI, 기획)" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className={input} />
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors text-sm">
                  취소
                </button>
                <button type="submit" disabled={submitting} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors text-sm disabled:opacity-50">
                  {submitting ? '등록 중...' : '등록하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
