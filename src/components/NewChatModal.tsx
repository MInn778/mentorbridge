import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { X, Search, Users, UserPlus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserSearchResult {
  id: number;
  name: string;
  role: 'MENTOR' | 'MENTEE';
}

interface NewChatModalProps {
  onClose: () => void;
  onCreated: (roomId: number) => void;
  // 지정되면 "새 채팅 만들기" 대신 해당 단체 채팅방에 인원을 추가하는 모달로 동작한다.
  existingRoomId?: number;
}

export default function NewChatModal({ onClose, onCreated, existingRoomId }: NewChatModalProps) {
  const { token } = useAuth();
  const [mode, setMode] = useState<'direct' | 'group'>(existingRoomId ? 'group' : 'direct');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [selected, setSelected] = useState<UserSearchResult[]>([]);
  const [groupName, setGroupName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/chat/users/search?query=${encodeURIComponent(query.trim())}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setResults(await res.json());
      } catch (err) {
        console.error(err);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, token]);

  const toggleSelected = (user: UserSearchResult) => {
    setSelected((prev) =>
      prev.some((u) => u.id === user.id) ? prev.filter((u) => u.id !== user.id) : [...prev, user]
    );
  };

  const handleStartDirect = async (user: UserSearchResult) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/chat/rooms/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetUserId: user.id }),
      });
      if (res.ok) {
        const room = await res.json();
        onCreated(room.id);
      } else {
        alert('채팅방을 시작하지 못했습니다.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateGroup = async () => {
    if (selected.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/chat/rooms/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: groupName.trim() || null, memberIds: selected.map((u) => u.id) }),
      });
      if (res.ok) {
        const room = await res.json();
        onCreated(room.id);
      } else {
        alert('단체 채팅방을 만들지 못했습니다.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMembers = async () => {
    if (!existingRoomId || selected.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/chat/rooms/${existingRoomId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ memberIds: selected.map((u) => u.id) }),
      });
      if (res.ok) {
        onCreated(existingRoomId);
      } else {
        alert('인원을 추가하지 못했습니다.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">
            {existingRoomId ? '인원 초대' : '새 채팅 시작'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {!existingRoomId && (
          <div className="px-6 pt-4 flex gap-2">
            <button
              onClick={() => { setMode('direct'); setSelected([]); }}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-colors',
                mode === 'direct' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
              )}
            >
              <UserPlus size={16} /> 1:1 채팅
            </button>
            <button
              onClick={() => setMode('group')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-colors',
                mode === 'group' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
              )}
            >
              <Users size={16} /> 단체 채팅
            </button>
          </div>
        )}

        <div className="p-6 space-y-4 overflow-y-auto">
          {mode === 'group' && !existingRoomId && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">채팅방 이름 (선택)</label>
              <input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="예: 캡스톤 스터디"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>
          )}

          {mode === 'group' && selected.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selected.map((u) => (
                <span
                  key={u.id}
                  onClick={() => toggleSelected(u)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold cursor-pointer hover:bg-blue-100"
                >
                  {u.name} <X size={12} />
                </span>
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">이름(2글자 이상) 또는 정확한 이메일로 검색</label>
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="사용자 검색..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>
          </div>

          <div className="space-y-1 max-h-60 overflow-y-auto">
            {results.length === 0 && query.trim() && (
              <p className="text-sm text-slate-400 text-center py-4">
                {!query.includes('@') && query.trim().length < 2 ? '이름은 2글자 이상 입력해주세요.' : '검색 결과가 없습니다.'}
              </p>
            )}
            {results.map((u) => {
              const isSelected = selected.some((s) => s.id === u.id);
              return (
                <button
                  key={u.id}
                  disabled={isSubmitting}
                  onClick={() => (mode === 'direct' && !existingRoomId ? handleStartDirect(u) : toggleSelected(u))}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left disabled:opacity-50"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-900">{u.name}</p>
                    <p className="text-xs text-slate-400">{u.role === 'MENTOR' ? '멘토' : '멘티'}</p>
                  </div>
                  {mode === 'group' && isSelected && (
                    <span className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {mode === 'group' && (
          <div className="px-6 py-4 border-t border-slate-100">
            <button
              onClick={existingRoomId ? handleAddMembers : handleCreateGroup}
              disabled={selected.length === 0 || isSubmitting}
              className="w-full py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {existingRoomId
                ? `초대하기 (${selected.length}명 선택됨)`
                : `단체 채팅방 만들기 (${selected.length}명 선택됨)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
