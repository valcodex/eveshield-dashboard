import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Emergency } from "../../types";
import { useAuth } from "../../store/AuthContext";

interface Responder {
  id: string;
  type: "POLICE" | "MEDICAL" | "FIRE";
  status: string;
  user: { fullName: string };
}

export default function ResponseControls({ emergency }: { emergency: Emergency }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [responderId, setResponderId] = useState("");

  const canDispatch = user && ["ORG_ADMIN", "ORG_OPERATOR"].includes(user.role);

  const { data: responders = [] } = useQuery({
    queryKey: ["responders", "AVAILABLE"],
    queryFn: async () => (await api.get<{ data: Responder[] }>("/responders", { params: { status: "AVAILABLE" } })).data.data,
    enabled: !!canDispatch,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["emergencies"] });
    queryClient.invalidateQueries({ queryKey: ["emergency", emergency.id] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
  };

  const patchEmergency = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.patch(`/emergencies/${emergency.id}`, body),
    onSuccess: refresh,
  });

  const assign = useMutation({
    mutationFn: () => api.post("/assignResponder", { emergencyId: emergency.id, responderId }),
    onSuccess: () => {
      setResponderId("");
      refresh();
    },
  });

  return (
    <div className="rounded-xl border border-panel-border bg-panel/70 p-4 shadow-panel">
      <h3 className="mb-3 font-mono text-[11px] uppercase tracking-wider text-ink-muted">Response Controls</h3>

      {canDispatch && (
        <div className="mb-4 flex gap-2">
          <select
            value={responderId}
            onChange={(e) => setResponderId(e.target.value)}
            className="flex-1 rounded-md border border-panel-border bg-panel-raised px-2 py-2 text-xs text-ink-primary outline-none"
          >
            <option value="">Assign responder…</option>
            {responders.map((r) => (
              <option key={r.id} value={r.id}>
                {r.type} · {r.user.fullName}
              </option>
            ))}
          </select>
          <button
            disabled={!responderId || assign.isPending}
            onClick={() => assign.mutate()}
            className="rounded-md bg-operational/20 px-3 py-2 text-xs font-semibold text-operational disabled:opacity-40"
          >
            Assign
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <ActionButton label="Acknowledge" onClick={() => patchEmergency.mutate({ status: "ACKNOWLEDGED" })} />
        <ActionButton label="In progress" onClick={() => patchEmergency.mutate({ status: "IN_PROGRESS" })} />
        <ActionButton label="Request backup" onClick={() => patchEmergency.mutate({ requestBackup: true })} />
        <ActionButton
          label="Escalate"
          tone="amber"
          onClick={() => patchEmergency.mutate({ escalate: true })}
        />
        <ActionButton
          label="Mark resolved"
          tone="signal"
          className="col-span-2"
          onClick={() => patchEmergency.mutate({ status: "RESOLVED" })}
        />
      </div>

      <div className="mt-4">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note to the timeline…"
          rows={2}
          className="w-full rounded-md border border-panel-border bg-panel-raised px-3 py-2 text-xs text-ink-primary outline-none placeholder:text-ink-faint"
        />
        <button
          disabled={!note.trim()}
          onClick={() => {
            patchEmergency.mutate({ note });
            setNote("");
          }}
          className="mt-2 w-full rounded-md border border-panel-border py-1.5 text-xs text-ink-muted transition hover:text-ink-primary disabled:opacity-40"
        >
          Add note
        </button>
      </div>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  tone,
  className,
}: {
  label: string;
  onClick: () => void;
  tone?: "amber" | "signal";
  className?: string;
}) {
  const toneClass =
    tone === "amber"
      ? "bg-amber-soft text-amber"
      : tone === "signal"
      ? "bg-signal-soft text-signal"
      : "bg-panel-raised text-ink-primary";
  return (
    <button onClick={onClick} className={`rounded-md px-3 py-2 text-xs font-medium transition hover:opacity-80 ${toneClass} ${className ?? ""}`}>
      {label}
    </button>
  );
}
