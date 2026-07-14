import { format } from "date-fns";
import { EmergencyUpdate } from "../../types";

export default function EmergencyTimeline({ updates }: { updates: EmergencyUpdate[] }) {
  return (
    <div className="rounded-xl border border-panel-border bg-panel/70 p-4 shadow-panel">
      <h3 className="mb-3 font-mono text-[11px] uppercase tracking-wider text-ink-muted">Emergency Timeline</h3>
      <ol className="space-y-3">
        {updates.map((u, idx) => (
          <li key={u.id} className="relative flex gap-3 pl-1">
            <div className="flex flex-col items-center">
              <span className="mt-1 h-2 w-2 rounded-full bg-operational" />
              {idx < updates.length - 1 && <span className="mt-1 w-px flex-1 bg-panel-border" />}
            </div>
            <div className="pb-2">
              <p className="font-mono text-[11px] text-ink-faint">{format(new Date(u.createdAt), "HH:mm")}</p>
              <p className="text-sm text-ink-primary">{u.message}</p>
            </div>
          </li>
        ))}
        {updates.length === 0 && <p className="text-xs text-ink-faint">No events recorded yet.</p>}
      </ol>
    </div>
  );
}
