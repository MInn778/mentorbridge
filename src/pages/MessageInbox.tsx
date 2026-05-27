import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: number;
  senderId: number;
  senderName: string;
  receiverId: number;
  receiverName: string;
  content: string;
  isRead: boolean;
  messageType: 'NORMAL' | 'APPLICATION' | 'SYSTEM';
  relatedGroupId: number | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | null;
  createdAt: string;
}

export default function MessageInbox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const { token } = useAuth();
  const navigate = useNavigate();

  const fetchMessages = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/messages', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setMessages(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [token]);

  const handleAction = async (messageId: number, action: 'accept' | 'reject') => {
    try {
      const res = await fetch(`/api/messages/${messageId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        alert(action === 'accept' ? '수락되었습니다.' : '거절되었습니다.');
        fetchMessages();
      } else {
        alert('처리 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <MessageSquare size={48} className="mb-4 text-slate-300" />
        <p>로그인 후 이용할 수 있습니다.</p>
        <button onClick={() => navigate('/login')} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg">로그인하기</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">쪽지함</h1>
        <p className="text-slate-500 mt-2">받은 쪽지와 지원서를 확인하세요.</p>
      </header>

      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500">
            도착한 쪽지가 없습니다.
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={cn(
              "bg-white p-6 rounded-2xl border transition-all",
              message.isRead ? "border-slate-100 bg-slate-50/50" : "border-slate-200 shadow-sm"
            )}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-2 py-1 rounded text-xs font-bold",
                    message.messageType === 'APPLICATION' ? "bg-orange-100 text-orange-600" :
                    message.messageType === 'SYSTEM' ? "bg-slate-200 text-slate-600" :
                    "bg-blue-100 text-blue-600"
                  )}>
                    {message.messageType === 'APPLICATION' ? '지원서' : 
                     message.messageType === 'SYSTEM' ? '시스템' : '일반 쪽지'}
                  </span>
                  <span className="font-bold text-slate-900">
                    {message.messageType === 'SYSTEM' ? '시스템' : message.senderName}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(message.createdAt).toLocaleString()}
                </span>
              </div>
              
              <p className="text-slate-700 mt-4 whitespace-pre-wrap">
                {message.content}
              </p>

              {message.messageType === 'APPLICATION' && message.status === 'PENDING' && (
                <div className="mt-6 flex gap-3">
                  <button 
                    onClick={() => handleAction(message.id, 'accept')}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors"
                  >
                    <Check size={16} /> 수락
                  </button>
                  <button 
                    onClick={() => handleAction(message.id, 'reject')}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-600 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
                  >
                    <X size={16} /> 거절
                  </button>
                </div>
              )}
              
              {message.messageType === 'APPLICATION' && message.status && message.status !== 'PENDING' && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                  <span className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-bold",
                    message.status === 'ACCEPTED' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {message.status === 'ACCEPTED' ? '수락됨' : '거절됨'}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
