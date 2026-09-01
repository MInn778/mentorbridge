import React, { useState } from 'react';
import { Send, X } from 'lucide-react';

interface ApplyModalProps {
  title: string;
  actionLabel: string; // 예: "스터디 지원하기"
  subtitle?: string; // 기본값: `"{title}"에 지원합니다.`
  fieldLabel?: string; // 기본값: "지원 사유"
  placeholder?: string;
  submitLabel?: string; // 기본값: "지원하기"
  onClose: () => void;
  onSubmit: (reason: string) => void | Promise<void>;
}

export default function ApplyModal({
  title,
  actionLabel,
  subtitle,
  fieldLabel = '지원 사유',
  placeholder = '본인을 어필할 수 있는 지원 동기를 적어주세요.',
  submitLabel = '지원하기',
  onClose,
  onSubmit,
}: ApplyModalProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(reason.trim());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{actionLabel}</h2>
            <p className="text-sm text-slate-500 mt-1 line-clamp-1">{subtitle || `"${title}"에 지원합니다.`}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors shrink-0">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">{fieldLabel}</label>
            <textarea
              required
              autoFocus
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm min-h-[140px] resize-none"
              placeholder={placeholder}
            />
          </div>
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors text-sm"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!reason.trim() || submitting}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
            >
              <Send size={16} /> {submitting ? '전송 중...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
