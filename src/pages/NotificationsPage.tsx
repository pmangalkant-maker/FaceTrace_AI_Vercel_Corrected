import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Bell, CheckCheck, Clock, ExternalLink, ShieldAlert } from 'lucide-react';

interface NotificationsPageProps {
  onNavigate: (tab: string, caseId?: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onNavigate }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } =
    useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return n.is_read === 0;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            System Notifications & Alerts
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Stay updated on case status modifications, new community leads, and moderation actions.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded transition-colors self-start"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-xs w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 font-medium rounded transition-colors ${
            filter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 font-medium rounded transition-colors ${
            filter === 'unread' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Unread Only ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden shadow-xs">
        {filtered.length > 0 ? (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`p-4 transition-colors flex items-start justify-between gap-4 ${
                item.is_read ? 'hover:bg-slate-50' : 'bg-amber-50/40 hover:bg-amber-50/70'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {!item.is_read && (
                    <span className="w-2 h-2 rounded-full bg-amber-600 inline-block" />
                  )}
                  <h3 className="text-xs font-bold text-slate-900">{item.title}</h3>
                  <span className="text-[10px] font-mono text-slate-400">&middot; {item.type}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{item.message}</p>
                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{item.created_at}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {item.link && (
                  <button
                    onClick={() => {
                      if (!item.is_read) markAsRead(item.id);
                      if (item.link) {
                        const target = item.link.startsWith('/') ? item.link.substring(1) : item.link;
                        onNavigate(target);
                      }
                    }}
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                    title="View referenced record"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
                {!item.is_read && (
                  <button
                    onClick={() => markAsRead(item.id)}
                    className="text-[11px] text-slate-500 hover:text-slate-900 hover:underline px-2 py-1"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-xs text-slate-500">
            No notifications in this view.
          </div>
        )}
      </div>
    </div>
  );
};
