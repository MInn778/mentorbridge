import React, { useEffect, useState } from 'react';
import { X, Pin } from 'lucide-react';

interface Notice {
  id: number;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
}

const hideKey = (id: number) => `notice_hide_until_${id}`;

function isHidden(id: number): boolean {
  const until = localStorage.getItem(hideKey(id));
  if (!until) return false;
  return new Date(until).getTime() > Date.now();
}

export default function NoticePopup({ notices }: { notices: Notice[] }) {
  const [visible, setVisible] = useState<Notice[]>([]);
  const [hideDay, setHideDay] = useState(false);
  const [hideWeek, setHideWeek] = useState(false);

  useEffect(() => {
    if (notices.length === 0) return;
    const toShow = notices.filter(n => !isHidden(n.id));
    if (toShow.length > 0) setVisible(toShow);
    // notices가 다시 로드될 때마다(탭 재방문 등) 새로 판단하도록 id 목록에 의존
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notices.map(n => n.id).join(',')]);

  if (visible.length === 0) return null;

  const handleClose = () => {
    if (hideDay || hideWeek) {
      const days = hideWeek ? 7 : 1;
      const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      visible.forEach(n => localStorage.setItem(hideKey(n.id), until));
    }
    setVisible([]);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">공지사항</h2>
          <button onClick={handleClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto">
          {visible.map(n => (
            <div key={n.id} className="pb-4 border-b border-slate-100 last:border-0 last:pb-0">
              <div className="flex items-center gap-1.5">
                {n.isPinned && <Pin size={14} className="text-orange-500 shrink-0" />}
                <p className="font-bold text-slate-900">{n.title}</p>
              </div>
              <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{n.content}</p>
              <p className="text-xs text-slate-400 mt-2">{new Date(n.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-slate-100 space-y-4">
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hideDay}
                onChange={(e) => { setHideDay(e.target.checked); if (e.target.checked) setHideWeek(false); }}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
              />
              오늘 하루 보지 않기
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hideWeek}
                onChange={(e) => { setHideWeek(e.target.checked); if (e.target.checked) setHideDay(false); }}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
              />
              일주일 동안 보지 않기
            </label>
          </div>
          <button
            onClick={handleClose}
            className="w-full bg-slate-900 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
