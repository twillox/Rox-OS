'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, ShieldAlert, Zap, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
};

export function CEOInbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    const fetchNotifs = async () => {
      try {
        const res = await fetch('/api/os/notifications');
        const data = await res.json();
        if (data.success && mounted) {
          setNotifications(data.data);
        }
      } catch (e) {
        console.error("Failed to fetch notifications");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000); // poll every 10s
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const markAsRead = async (id: string, action?: 'delete') => {
    try {
      if (action === 'delete') {
        setNotifications(prev => prev.filter(n => n.id !== id));
      } else {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
      
      await fetch('/api/os/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isRead: true, action })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-white border border-gray-100 hover:bg-gray-50 transition-colors mr-2"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#0a0a0f]" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-96 bg-[#FAFAFA] border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                CEO Inbox
                {unreadCount > 0 && <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-xs">{unreadCount} New</span>}
              </h3>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-50 rounded-md text-gray-500 hover:text-gray-900 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="p-8 text-center text-gray-500 text-sm animate-pulse">Checking inbox...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6 opacity-50" />
                  </div>
                  <p className="text-sm">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {notifications.map(notif => (
                    <div key={notif.id} className={`p-4 hover:bg-white transition-colors ${!notif.isRead ? 'bg-indigo-500/5' : ''}`}>
                      <div className="flex gap-3">
                        <div className="mt-1 flex-shrink-0">
                          {notif.type === 'WARNING' || notif.type === 'ACTION_REQUIRED' ? (
                            <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 border border-rose-500/30">
                              <ShieldAlert className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                              <Zap className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 mb-1">{notif.title}</h4>
                          <p className="text-xs text-gray-500 leading-relaxed mb-3">{notif.message}</p>
                          
                          <div className="flex items-center gap-2">
                            {notif.actionUrl && (
                              <button 
                                onClick={() => {
                                  markAsRead(notif.id);
                                  router.push(notif.actionUrl!);
                                  setIsOpen(false);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-indigo-500 text-gray-900 text-xs font-medium hover:bg-indigo-600 transition-colors"
                              >
                                Review
                              </button>
                            )}
                            {!notif.isRead && (
                              <button 
                                onClick={() => markAsRead(notif.id)}
                                className="px-3 py-1.5 rounded-lg bg-gray-50 text-gray-900 text-xs font-medium hover:bg-gray-100 transition-colors"
                              >
                                Mark Read
                              </button>
                            )}
                            <button 
                                onClick={() => markAsRead(notif.id, 'delete')}
                                className="p-1.5 rounded-lg hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 transition-colors ml-auto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
