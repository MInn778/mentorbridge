import React from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '@/contexts/NotificationContext';
import { Bell, MessageSquare, Briefcase, FileText, CheckCircle, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Notifications() {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  const getIcon = (type: string) => {
    switch (type) {
      case 'comment': return <MessageSquare size={20} />;
      case 'scrap': return <Briefcase size={20} />;
      case 'mentoring': return <FileText size={20} />;
      case 'application_status': return <CheckCircle size={20} />;
      case 'message': return <Mail size={20} />;
      default: return <Bell size={20} />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'comment': return 'bg-blue-500';
      case 'scrap': return 'bg-purple-500';
      case 'mentoring': return 'bg-orange-500';
      case 'application_status': return 'bg-green-500';
      case 'message': return 'bg-indigo-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">전체 알림</h1>
          <p className="text-slate-500 mt-2">나의 활동과 관련된 모든 알림을 확인하세요.</p>
        </div>
        <button 
          onClick={markAllAsRead}
          className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors"
        >
          모두 읽음 처리
        </button>
      </header>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500">
            도착한 알림이 없습니다.
          </div>
        ) : (
          notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={cn(
                "bg-white p-6 rounded-2xl border transition-all flex items-start gap-4",
                notification.isRead ? "border-slate-100 bg-slate-50/50" : "border-slate-200 shadow-sm"
              )}
            >
              <div className={cn("p-2 rounded-lg text-white mt-1 shrink-0", getColor(notification.type))}>
                {getIcon(notification.type)}
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <p className={cn(
                    "font-medium",
                    notification.isRead ? "text-slate-600" : "text-slate-900"
                  )}>
                    {notification.title}
                  </p>
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {new Date(notification.createdAt).toLocaleString()}
                  </span>
                </div>
                
                <div className="mt-4 flex gap-3 items-center">
                  {notification.link && (
                    <Link 
                      to={notification.link}
                      onClick={() => markAsRead(notification.id)}
                      className="text-sm font-bold text-blue-600 hover:underline"
                    >
                      확인하기
                    </Link>
                  )}
                  {!notification.isRead && (
                    <button 
                      onClick={() => markAsRead(notification.id)}
                      className="text-sm font-medium text-slate-500 hover:text-slate-700"
                    >
                      읽음 표시
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
