import { ReactNode } from "react";
import { Activity, Bell, LogOut, MapPinned, ShieldAlert, Users } from "lucide-react";
import { useAuth } from "../../store/AuthContext";
import NotificationsBell from "./NotificationsBell";

const ROLE_LABEL: Record<string, string> = {
  ORG_ADMIN: "Organization Admin",
  ORG_OPERATOR: "Operator",
  POLICE: "Police Officer",
  MEDICAL: "Medical Responder",
};

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen w-full bg-void">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-panel-border bg-panel/60 md:flex">
        <div className="flex items-center gap-2 border-b border-panel-border px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-crimson-soft text-crimson">
            <ShieldAlert size={18} />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">EveShield</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <NavItem icon={<Activity size={16} />} label="Operations" active />
          <NavItem icon={<Users size={16} />} label="Victims" />
          <NavItem icon={<MapPinned size={16} />} label="Live Map" />
          <NavItem icon={<Bell size={16} />} label="Notifications" />
        </nav>

        <div className="border-t border-panel-border px-4 py-4">
          <p className="font-mono text-xs text-ink-muted">{user?.fullName}</p>
          <p className="font-mono text-[10px] uppercase tracking-wider text-operational">
            {user ? ROLE_LABEL[user.role] : ""}
          </p>
          <button
            onClick={logout}
            className="mt-3 flex items-center gap-2 text-xs text-ink-muted transition hover:text-crimson-bright"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-panel-border bg-panel/40 px-6 py-3">
          <div>
            <h1 className="font-display text-sm font-semibold tracking-tight text-ink-primary">
              Emergency Operations Center
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted">Live console</p>
          </div>
          <NotificationsBell />
        </header>
        <div className="scanline w-full" />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active }: { icon: ReactNode; label: string; active?: boolean }) {
  return (
    <div
      className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
        active ? "bg-panel-raised text-ink-primary" : "text-ink-muted hover:bg-panel-raised/60 hover:text-ink-primary"
      }`}
    >
      {icon}
      {label}
    </div>
  );
}
