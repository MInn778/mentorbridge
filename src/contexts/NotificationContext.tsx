import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';

export type NotificationType = 'COMMENT' | 'MENTORING' | 'SCRAP' | 'APPLICATION_STATUS' | 'MESSAGE';

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setNotifications([]);
      return;
    }

    // Fetch initial notifications
    fetch('/api/notifications', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setNotifications(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error('Failed to fetch notifications', err));

    // Connect to SSE
    const eventSource = new EventSource(`/api/notifications/subscribe?token=${token}`);

    eventSource.addEventListener('notification', (event) => {
      try {
        const newNotif = JSON.parse(event.data);
        setNotifications(prev => [newNotif, ...prev]);
      } catch (err) {
        console.error('Error parsing SSE data', err);
      }
    });

    eventSource.addEventListener('connect', (event) => {
      console.log('SSE Connected', event.data);
    });

    eventSource.onerror = (err) => {
      console.error('EventSource failed:', err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [token, isAuthenticated]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Local helper (mainly for test or optimistic UI if needed)
  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
    const newNotif: Notification = {
      ...notification,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      isRead: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markAsRead = async (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
