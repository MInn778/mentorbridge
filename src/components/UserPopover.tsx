import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import SendMessageModal from './SendMessageModal';

interface UserPopoverProps {
  userId: number;
  userName: string;
  className?: string;
}

export default function UserPopover({ userId, userName, className = '' }: UserPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { token, user: currentUser } = useAuth();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    setIsOpen(false);
    navigate(`/profile/${userId}`);
  };

  const handleMessageClick = () => {
    setIsOpen(false);
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }
    setIsMessageModalOpen(true);
  };

  return (
    <>
      <div className="relative inline-block" ref={popoverRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`font-bold hover:text-blue-600 transition-colors ${className}`}
        >
          {userName}
        </button>

        {isOpen && (
          <div className="absolute z-50 left-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={handleProfileClick}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors text-left border-b border-slate-100"
            >
              <User size={16} /> 프로필 보기
            </button>
            <button
              onClick={handleMessageClick}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors text-left"
            >
              <MessageSquare size={16} /> 쪽지 보내기
            </button>
          </div>
        )}
      </div>

      {isMessageModalOpen && (
        <SendMessageModal
          receiverId={userId}
          receiverName={userName}
          onClose={() => setIsMessageModalOpen(false)}
        />
      )}
    </>
  );
}
