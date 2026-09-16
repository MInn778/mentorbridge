import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { X, Send } from 'lucide-react';

interface SendMessageModalProps {
  receiverId: number;
  receiverName: string;
  onClose: () => void;
}

export default function SendMessageModal({ receiverId, receiverName, onClose }: SendMessageModalProps) {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { token } = useAuth();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId,
          content,
          messageType: 'NORMAL'
        })
      });

      if (res.ok) {
        alert('쪽지를 보냈습니다.');
        onClose();
      } else {
        alert('쪽지 전송에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('오류가 발생했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">쪽지 보내기</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSend} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">받는 사람</label>
            <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900">
              {receiverName}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">내용</label>
            <textarea
              required
              autoFocus
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="쪽지 내용을 입력하세요..."
              className="w-full min-h-[120px] px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-slate-900"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSending || !content.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md shadow-blue-200"
            >
              <Send size={18} />
              보내기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
