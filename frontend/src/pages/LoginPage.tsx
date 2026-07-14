import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "../store/AuthContext";

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) navigate("/", { replace: true });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch {
      setError("Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-void px-4">
      {/* Ambient radar sweep — the page's signature element */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30">
        <div className="h-[640px] w-[640px] rounded-full border border-operational/20" />
        <div className="absolute h-[440px] w-[440px] rounded-full border border-operational/15" />
        <div className="absolute h-[240px] w-[240px] rounded-full border border-operational/10" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-crimson-soft text-crimson">
            <ShieldAlert size={26} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-primary">EveShield</h1>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
              Emergency Response Console
            </p>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-xl border border-panel-border bg-panel/80 p-6 shadow-panel backdrop-blur"
        >
          <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-ink-muted">
            Email
          </label>
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 w-full rounded-md border border-panel-border bg-void px-3 py-2 text-sm text-ink-primary outline-none focus:border-operational"
            placeholder="you@organization.org"
          />

          <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-ink-muted">
            Password
          </label>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-5 w-full rounded-md border border-panel-border bg-void px-3 py-2 text-sm text-ink-primary outline-none focus:border-operational"
            placeholder="••••••••"
          />

          {error && (
            <p className="mb-4 rounded-md border border-crimson/40 bg-crimson-soft px-3 py-2 font-mono text-xs text-crimson-bright">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-crimson py-2.5 text-sm font-semibold text-white transition hover:bg-crimson-bright disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in to console"}
          </button>

          <p className="mt-4 text-center font-mono text-[11px] text-ink-faint">
            Restricted access — authorized EveShield personnel and responders only.
          </p>
        </form>
      </div>
    </div>
  );
}
