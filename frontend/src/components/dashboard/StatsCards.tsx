import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { api } from "../../lib/api";
import { DashboardStats } from "../../types";

const CARDS = [
  { key: "activeEmergencies", label: "Active Emergencies", icon: Activity, accent: "text-crimson", ring: "border-crimson/30" },
  { key: "resolvedEmergencies", label: "Resolved Emergencies", icon: CheckCircle2, accent: "text-signal", ring: "border-signal/30" },
  { key: "highPriorityAlerts", label: "High Priority Alerts", icon: AlertTriangle, accent: "text-amber", ring: "border-amber/30" },
  { key: "victimsAwaitingResponse", label: "Victims Awaiting Response", icon: Clock, accent: "text-operational", ring: "border-operational/30" },
] as const;

export default function StatsCards() {
  const { data } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => (await api.get<{ data: DashboardStats }>("/dashboard/stats")).data.data,
    refetchInterval: 15000,
  });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {CARDS.map(({ key, label, icon: Icon, accent, ring }) => (
        <div
          key={key}
          className={`rounded-xl border bg-panel/70 p-4 shadow-panel ${ring}`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">{label}</span>
            <Icon size={16} className={accent} />
          </div>
          <p className={`mt-3 font-display text-3xl font-semibold ${accent}`}>
            {data ? data[key as keyof DashboardStats] : "—"}
          </p>
        </div>
      ))}
    </div>
  );
}
