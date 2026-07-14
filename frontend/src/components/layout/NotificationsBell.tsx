import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { getSocket, SOCKET_EVENTS } from "../../lib/socket";
import { AppNotification } from "../../types";

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [liveCount, setLiveCount] = useState(0);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await api.get<{ data: AppNotification[] }>("/notifications")).data.data,
  });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onNotification = () => setLiveCount((c) => c + 1);
    socket.on(SOCKET_EVENTS.NOTIFICATION, onNotification);
    return () => {
      socket.off(SOCKET_EVENTS.NOTIFICATION, onNotification);
    };
  }, []);

  const unread = notifications.length + liveCount;

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((v) => !v);
          setLiveCount(0);
        }}
        className="relative rounded-md border border-panel-border bg-panel-raised p-2 text-ink-muted transition hover:text-ink-primary"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-crimson px-1 font-mono text-[9px] text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-panel-border bg-panel shadow-panel">
          <div className="border-b border-panel-border px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-ink-muted">
            Notifications
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="px-4 py-6 text-center text-xs text-ink-faint">Nothing here yet.</p>
            )}
            {notifications.map((n) => (
              <div key={n.id} className="border-b border-panel-border/60 px-4 py-3 last:border-b-0">
                <p className="text-sm text-ink-primary">{n.title}</p>
                <p className="text-xs text-ink-muted">{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
