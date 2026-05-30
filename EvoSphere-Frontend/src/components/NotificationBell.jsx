import { useState, useRef, useEffect } from 'react';

// Notifications are local-state only for now (no backend endpoint exists).
// They can be wired to a WebSocket or polling endpoint in the future.
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const ref = useRef(null);

  const unread = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg hover:bg-surface2 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-ev-red text-[10px] flex items-center justify-center font-bold" style={{ color: '#fff' }}>
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-72 rounded-xl border border-border p-3 shadow-2xl z-50" style={{ backgroundColor: '#111118' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-sm font-bold">Notifications</span>
            {notifications.length > 0 && (
              <button onClick={() => setNotifications(n => n.map(x => ({ ...x, is_read: true })))} className="text-xs text-ev-purple hover:underline">
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0
            ? <p className="text-xs text-muted-foreground font-mono py-4 text-center">No notifications yet</p>
            : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.map(n => (
                  <div key={n.id} className={`p-2.5 rounded-lg ${n.is_read ? 'opacity-60' : 'bg-surface2'}`}>
                    <p className="text-sm font-bold font-mono">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}
    </div>
  );
}
