import { Search } from "lucide-react";

export interface Filters {
  search: string;
  status: string;
  priority: string;
  type: string;
}

const STATUS_OPTIONS = ["", "PENDING", "ACKNOWLEDGED", "DISPATCHED", "IN_PROGRESS", "RESOLVED", "CANCELLED"];
const TYPE_OPTIONS = ["", "POLICE", "MEDICAL", "FIRE", "GENERAL"];
const PRIORITY_OPTIONS = ["", "LOW", "MEDIUM", "HIGH", "CRITICAL"];

export default function FiltersBar({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-1 min-w-[220px] items-center gap-2 rounded-md border border-panel-border bg-panel-raised px-3 py-2">
        <Search size={14} className="text-ink-muted" />
        <input
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search by name, phone, victim ID, or emergency ID"
          className="w-full bg-transparent text-sm text-ink-primary outline-none placeholder:text-ink-faint"
        />
      </div>

      <Select
        value={filters.status}
        onChange={(v) => onChange({ ...filters, status: v })}
        options={STATUS_OPTIONS}
        placeholder="Status"
      />
      <Select
        value={filters.priority}
        onChange={(v) => onChange({ ...filters, priority: v })}
        options={PRIORITY_OPTIONS}
        placeholder="Priority"
      />
      <Select
        value={filters.type}
        onChange={(v) => onChange({ ...filters, type: v })}
        options={TYPE_OPTIONS}
        placeholder="Type"
      />
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-panel-border bg-panel-raised px-3 py-2 font-mono text-xs uppercase tracking-wider text-ink-muted outline-none"
    >
      <option value="">{placeholder}: All</option>
      {options
        .filter(Boolean)
        .map((o) => (
          <option key={o} value={o}>
            {o.replace("_", " ")}
          </option>
        ))}
    </select>
  );
}
