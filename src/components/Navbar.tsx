import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User as UserIcon, Bell, LogOut, Settings, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: '나의 활동', path: '/dashboard' },
  { name: 'AI 진로 추천', path: '/ai-career' },
  { name: '스터디&커뮤니티', path: '/community' },
  { name: '멘토 시스템', path: '/mentors' },
  { name: '채용 & 정보', path: '/recruitment' },
  { name: '공모전 & 활동', path: '/activities' },
  { name: '피드백 시스템', path: '/feedback' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const location = useLocation();
  const nickname = "멘티꿈나무";

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link 
              to="/" 
              className="flex items-center gap-2 shrink-0"
              onClick={() => window.scrollTo(0, 0)}
            >
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">M</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 hidden sm:block">MentorBridge</span>
            </Link>

            {/* Desktop Menu - Right next to logo */}
            <div className="hidden xl:block">
              <div className="flex items-center space-x-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "px-3 py-2 rounded-md text-sm font-semibold transition-all whitespace-nowrap",
                      location.pathname === item.path
                        ? "text-blue-600 bg-blue-50"
                        : "text-slate-600 hover:text-blue-600 hover:bg-slate-50"
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors hidden sm:block">
              <Bell size={20} />
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 pl-4 border-l border-slate-200 hover:opacity-80 transition-opacity"
              >
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200">
                  <UserIcon size={18} />
                </div>
                <span className="text-sm font-bold text-slate-700 hidden md:block">{nickname}</span>
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2 border-b border-slate-100 mb-1">
                    <p className="text-xs text-slate-400 font-medium">내 계정</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{nickname}</p>
                  </div>
                  <Link 
                    to="/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                  >
                    <UserCircle size={16} /> 프로필 보기
                  </Link>
                  <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                    <Settings size={16} /> 설정
                  </button>
                  <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors mt-1">
                    <LogOut size={16} /> 로그아웃
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="xl:hidden flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-50 focus:outline-none"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} /> }
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="xl:hidden bg-white border-b border-slate-200 animate-in slide-in-from-top duration-200">
          <div className="space-y-1 px-2 pb-3 pt-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium",
                  location.pathname === item.path
                    ? "text-blue-600 bg-blue-50"
                    : "text-slate-600 hover:text-blue-600 hover:bg-slate-50"
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
