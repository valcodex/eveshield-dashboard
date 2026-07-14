import { Droplet, Phone, User } from "lucide-react";
import { Victim } from "../../types";

export default function VictimProfileCard({ victim }: { victim: Victim }) {
  return (
    <div className="rounded-xl border border-panel-border bg-panel/70 p-4 shadow-panel">
      <h3 className="mb-3 font-mono text-[11px] uppercase tracking-wider text-ink-muted">Victim Profile</h3>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-panel-border bg-panel-raised text-ink-muted">
          {victim.profilePhotoUrl ? (
            <img src={victim.profilePhotoUrl} alt={victim.fullName} className="h-full w-full object-cover" />
          ) : (
            <User size={20} />
          )}
        </div>
        <div>
          <p className="font-display text-base font-semibold text-ink-primary">{victim.fullName}</p>
          <p className="font-mono text-xs text-ink-muted">{victim.victimCode}</p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <Field label="Phone" value={victim.phoneNumber} icon={<Phone size={12} />} />
        <Field label="Gender" value={victim.gender ?? "—"} />
        <Field label="Age" value={victim.age?.toString() ?? "—"} />
        <Field label="Blood group" value={victim.bloodGroup ?? "—"} icon={<Droplet size={12} />} />
      </dl>

      {victim.medicalNotes && (
        <div className="mt-3 rounded-md border border-amber/30 bg-amber-soft px-3 py-2 text-xs text-amber">
          {victim.medicalNotes}
        </div>
      )}

      {victim.emergencyContacts.length > 0 && (
        <div className="mt-4">
          <h4 className="mb-2 font-mono text-[10px] uppercase tracking-wider text-ink-muted">Emergency Contacts</h4>
          <ul className="space-y-1.5">
            {victim.emergencyContacts.map((c) => (
              <li key={c.id} className="flex items-center justify-between text-xs">
                <span className="text-ink-primary">
                  {c.name} {c.relation && <span className="text-ink-faint">({c.relation})</span>}
                </span>
                <span className="font-mono text-ink-muted">{c.phone}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <dt className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-ink-faint">
        {icon} {label}
      </dt>
      <dd className="text-ink-primary">{value}</dd>
    </div>
  );
}
