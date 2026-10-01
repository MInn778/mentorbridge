import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Client, IMessage } from '@stomp/stompjs';
import { createChatClient } from '@/lib/chatSocket';
import { MessageCircle, Plus, Send, Users, UserPlus, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import NewChatModal from '@/components/NewChatModal';

interface ChatParticipant {
  id: number;
  name: string;
}

interface ChatMessage {
  id: number;
  roomId: number;
  senderId: number;
  senderName: string;
  senderEmail: string;
  content: string;
  createdAt: string;
}

interface ChatRoom {
  id: number;
  name: string;
  isGroup: boolean;
  participants: ChatParticipant[];
  lastMessage: ChatMessage | null;
  unreadCount: number;
  createdAt: string;
}

export default function Chat() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { roomId: roomIdParam } = useParams();
  const activeRoomId = roomIdParam ? Number(roomIdParam) : null;

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [connected, setConnected] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  const clientRef = useRef<Client | null>(null);
  const subscribedRooms = useRef<Set<number>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeRoomIdRef = useRef<number | null>(activeRoomId);
  activeRoomIdRef.current = activeRoomId;

  const activeRoom = rooms.find((r) => r.id === activeRoomId) || null;

  const fetchRooms = useCallback(async () => {
    if (!token) return [];
    const res = await fetch('/api/chat/rooms', { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return [];
    const data: ChatRoom[] = await res.json();
    setRooms(data);
    return data;
  }, [token]);

  const subscribeToRoom = useCallback((roomId: number) => {
    const client = clientRef.current;
    if (!client || !client.connected || subscribedRooms.current.has(roomId)) return;
    subscribedRooms.current.add(roomId);
    client.subscribe(`/topic/rooms/${roomId}`, (frame: IMessage) => {
      const msg: ChatMessage = JSON.parse(frame.body);
      if (msg.roomId === activeRoomIdRef.current) {
        setMessages((prev) => [...prev, msg]);
        markRead(msg.roomId);
      }
      setRooms((prev) =>
        prev
          .map((r) =>
            r.id === msg.roomId
              ? {
                  ...r,
                  lastMessage: msg,
                  unreadCount: msg.roomId === activeRoomIdRef.current ? 0 : r.unreadCount + 1,
                }
              : r
          )
          .sort((a, b) => {
            const at = a.lastMessage?.createdAt ?? a.createdAt;
            const bt = b.lastMessage?.createdAt ?? b.createdAt;
            return new Date(bt).getTime() - new Date(at).getTime();
          })
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // STOMP 연결은 이 페이지에 머무는 동안 한 번만 맺고, 내가 속한 모든 방을 구독해서
  // 지금 보고 있지 않은 방의 새 메시지도 목록에서 실시간으로 뱃지/미리보기가 갱신되게 한다.
  useEffect(() => {
    if (!token) return;

    const client = createChatClient(token);
    clientRef.current = client;

    client.onConnect = () => {
      setConnected(true);
      rooms.forEach((r) => subscribeToRoom(r.id));
    };
    client.onDisconnect = () => setConnected(false);
    client.onStompError = (frame) => console.error('STOMP error', frame.headers['message']);

    client.activate();

    fetchRooms();

    return () => {
      client.deactivate();
      clientRef.current = null;
      subscribedRooms.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // 방 목록이 갱신될 때마다(처음 로드, 새 방 생성 등) 아직 구독 안 한 방을 구독한다.
  useEffect(() => {
    if (!connected) return;
    rooms.forEach((r) => subscribeToRoom(r.id));
  }, [rooms, connected, subscribeToRoom]);

  const markRead = async (roomId: number) => {
    if (!token) return;
    try {
      await fetch(`/api/chat/rooms/${roomId}/read`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      console.error(err);
    }
  };

  // 선택된 방이 바뀌면 메시지 내역을 불러오고 읽음 처리한다.
  useEffect(() => {
    if (!activeRoomId || !token) {
      setMessages([]);
      return;
    }
    (async () => {
      const res = await fetch(`/api/chat/rooms/${activeRoomId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setMessages(await res.json());
      await markRead(activeRoomId);
      setRooms((prev) => prev.map((r) => (r.id === activeRoomId ? { ...r, unreadCount: 0 } : r)));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoomId, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content || !activeRoomId) return;

    const client = clientRef.current;
    if (client && client.connected) {
      client.publish({
        destination: `/app/rooms/${activeRoomId}/send`,
        body: JSON.stringify({ content }),
      });
    } else if (token) {
      // 소켓이 아직 연결되지 않았을 때를 대비한 REST fallback
      fetch(`/api/chat/rooms/${activeRoomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((msg) => msg && setMessages((prev) => [...prev, msg]));
    }
    setDraft('');
  };

  const handleRoomCreated = async (roomId: number) => {
    setShowNewChat(false);
    setShowInvite(false);
    await fetchRooms();
    navigate(`/chat/${roomId}`);
  };

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <MessageCircle size={48} className="mb-4 text-slate-300" />
        <p>로그인 후 이용할 수 있습니다.</p>
        <button onClick={() => navigate('/login')} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg">
          로그인하기
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">채팅</h1>
          <p className="text-slate-500 mt-2 flex items-center gap-1.5 text-sm">
            {connected ? <Wifi size={14} className="text-green-500" /> : <WifiOff size={14} className="text-slate-300" />}
            {connected ? '실시간 연결됨' : '연결 중...'}
          </p>
        </div>
        <button
          onClick={() => setShowNewChat(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
        >
          <Plus size={16} /> 새 채팅
        </button>
      </header>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden flex h-[70vh] min-h-[500px]">
        {/* 채팅방 목록 */}
        <div className="w-72 shrink-0 border-r border-slate-100 overflow-y-auto">
          {rooms.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400">채팅방이 없습니다.<br />새 채팅을 시작해보세요.</div>
          ) : (
            rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => navigate(`/chat/${room.id}`)}
                className={cn(
                  'w-full text-left px-4 py-3.5 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-start gap-3',
                  room.id === activeRoomId && 'bg-blue-50/60'
                )}
              >
                <div className={cn(
                  'h-10 w-10 rounded-full flex items-center justify-center shrink-0',
                  room.isGroup ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                )}>
                  {room.isGroup ? <Users size={18} /> : <UserPlus size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {room.name}{room.isGroup && <span className="text-slate-400 font-normal"> ({room.participants.length})</span>}
                    </p>
                    {room.unreadCount > 0 && (
                      <span className="shrink-0 text-[10px] font-bold bg-red-500 text-white rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                        {room.unreadCount > 99 ? '99+' : room.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {room.lastMessage ? room.lastMessage.content : '대화를 시작해보세요'}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 flex flex-col min-w-0">
          {!activeRoom ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <MessageCircle size={40} className="mb-3 text-slate-200" />
              <p className="text-sm">왼쪽에서 채팅방을 선택하세요.</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">{activeRoom.name}</p>
                  {activeRoom.isGroup && (
                    <p className="text-xs text-slate-400">
                      {activeRoom.participants.map((p) => p.name).join(', ')}
                    </p>
                  )}
                </div>
                {activeRoom.isGroup && (
                  <button
                    onClick={() => setShowInvite(true)}
                    className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
                  >
                    <UserPlus size={14} /> 인원 초대
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {messages.map((msg) => {
                  const isMine = msg.senderEmail === user?.email;
                  return (
                    <div key={msg.id} className={cn('flex flex-col', isMine ? 'items-end' : 'items-start')}>
                      {!isMine && activeRoom.isGroup && (
                        <span className="text-[11px] text-slate-400 mb-0.5 ml-1">{msg.senderName}</span>
                      )}
                      <div
                        className={cn(
                          'max-w-[70%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap break-words',
                          isMine ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                        )}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-slate-300 mt-0.5 px-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} className="p-4 border-t border-slate-100 flex gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900"
                />
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  className="flex items-center justify-center w-11 h-11 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0"
                >
                  <Send size={18} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} onCreated={handleRoomCreated} />}
      {showInvite && activeRoom && (
        <NewChatModal existingRoomId={activeRoom.id} onClose={() => setShowInvite(false)} onCreated={handleRoomCreated} />
      )}
    </div>
  );
}
