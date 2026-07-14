import { formatDistanceToNow } from "date-fns";
import { Emergency } from "../../types";

const PRIORITY_STYLES: Record<string, string> = {
  CRITICAL: "border-l-crimson bg-crimson-soft/40",
  HIGH: "border-l-crimson/70 bg-panel-raised",
  MEDIUM: "border-l-amber bg-panel-raised",
  LOW: "border-l-signal bg-panel-raised",
};

const STATUS_DOT: Record<string, string> = {
  PENDING: "bg-crimson animate-blink",
  ACKNOWLEDGED: "bg-amber",
  DISPATCHED: "bg-operational",
  IN_PROGRESS: "bg-operational",
  RESOLVED: "bg-signal",
  CANCELLED: "bg-ink-faint",
};

export default function EmergencyFeed({
  emergencies,
  selectedId,
  onSelect,
}: {
  emergencies: Emergency[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-panel-border bg-panel/70 shadow-panel">
      <div className="border-b border-panel-border px-4 py-3">
        <h2 className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
          Emergency Feed · {emergencies.length}
        </h2>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {emergencies.length === 0 && (
          <p className="px-2 py-8 text-center text-xs text-ink-faint">No emergencies match these filters.</p>
        )}
        {emergencies.map((e) => (
          <button
            key={e.id}
            onClick={() => onSelect(e.id)}
            className={`w-full rounded-lg border-l-4 p-3 text-left transition ${PRIORITY_STYLES[e.priority]} ${
              selectedId === e.id ? "ring-1 ring-operational" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-ink-muted">{e.emergencyCode}</span>
              <span className={`h-2 w-2 rounded-full ${STATUS_DOT[e.status]}`} />
            </div>
            <p className="mt-1 truncate font-display text-sm font-semibold text-ink-primary">
              {e.victim.fullName}
            </p>
            <p className="truncate text-xs text-ink-muted">Victim ID: {e.victim.victimCode}</p>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="rounded bg-panel px-2 py-0.5 font-mono uppercase tracking-wider text-ink-muted">
                {e.status.replace("_", " ")}
              </span>
              <span className="text-ink-faint">{formatDistanceToNow(new Date(e.triggeredAt), { addSuffix: true })}</span>
            </div>
            {e.responders[0] && (
              <p className="mt-1 truncate text-[11px] text-operational">
                {e.responders[0].responder.user.fullName} · {e.responders[0].responder.type}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
