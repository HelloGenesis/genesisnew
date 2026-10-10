import { Download } from "lucide-react";
import Link from "next/link";

/** The CRM's building blocks (server components). Styles: app/(crm)/crm.css. */

export type Tone = "good" | "warn" | "bad" | "info" | "muted";

export function PageHead({ kicker, title, sub, exportKind, children }: { kicker: string; title: string; sub?: React.ReactNode; exportKind?: string; children?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="micro-label">{kicker}</p>
        <h1 className="mt-2 text-balance text-[1.75rem] font-normal leading-tight tracking-tight text-bone sm:text-[2.125rem]">{title}</h1>
        {sub && <p className="mt-1 text-ash">{sub}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        {exportKind && (
          <a href={`/admin/export/${exportKind}`} className="crm-btn crm-btn-secondary crm-btn-sm" download>
            Export CSV <Download className="size-4" aria-hidden />
          </a>
        )}
      </div>
    </header>
  );
}

export function Stats({ items }: { items: { label: string; value: React.ReactNode; hint?: string; tone?: Tone; href?: string }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((s) => {
        const body = (
          <>
            <dt className="text-[0.8125rem] text-ash">{s.label}</dt>
            <dd className={`mt-1 text-[1.5rem] font-semibold tabular-nums ${s.tone === "bad" ? "text-[#dc2626]" : s.tone === "warn" ? "text-brand-ink" : "text-bone"}`}>{s.value}</dd>
            {s.hint && <p className="mt-0.5 text-[0.75rem] text-faint">{s.hint}</p>}
          </>
        );
        return s.href ? (
          <Link key={s.label} href={s.href} className="crm-card block px-4 py-3 transition-transform hover:-translate-y-0.5">
            {body}
          </Link>
        ) : (
          <div key={s.label} className="crm-card px-4 py-3">
            {body}
          </div>
        );
      })}
    </dl>
  );
}

export function Badge({ tone = "muted", children }: { tone?: Tone; children: React.ReactNode }) {
  return <span className={`crm-badge crm-tone-${tone}`}>{children}</span>;
}

/** A status from one of lib/crm/catalog's maps: { label, tone }. */
export function Status({ value }: { value: { label: string; tone: Tone } }) {
  return <Badge tone={value.tone}>{value.label}</Badge>;
}

export function Card({ title, action, children, className = "" }: { title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`crm-card crm-pad ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="text-[1.0625rem] font-medium text-bone">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** Collapsible "＋ Add …" panel for create forms. */
export function AddPanel({ label, children, open = false }: { label: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details className="crm-card group" open={open}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-medium text-bone [&::-webkit-details-marker]:hidden">
        <span>＋ {label}</span>
        <span aria-hidden className="text-ash transition-transform group-open:rotate-45">＋</span>
      </summary>
      <div className="border-t border-[var(--glass-border)] px-5 py-5">{children}</div>
    </details>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="crm-card px-5 py-10 text-center text-ash">{children}</p>;
}

export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="crm-card overflow-x-auto">
      <table className="crm-table">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

/** Label + control. `hint` under it. */
export function Field({ label, children, hint, className = "" }: { label: string; children: React.ReactNode; hint?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="crm-label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[0.75rem] text-faint">{hint}</span>}
    </label>
  );
}

export function Select({ name, options, defaultValue, required, className = "", placeholder = "—" }: { name: string; options: readonly (readonly [string, string])[] | Record<string, string>; defaultValue?: string | null; required?: boolean; className?: string; placeholder?: string }) {
  const entries = Array.isArray(options) ? options : Object.entries(options);
  return (
    <select name={name} defaultValue={defaultValue ?? ""} required={required} className={`crm-input ${className}`}>
      {!required && <option value="">{placeholder}</option>}
      {entries.map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}

/** The stage tracker: one bar per stage, done / current / to come, with the current stage named. */
export function StageBar({ stages, stage, compact = false }: { stages: readonly string[]; stage: number; compact?: boolean }) {
  return (
    <div>
      <div className="flex gap-1" aria-hidden>
        {stages.map((name, i) => (
          <span key={name} title={name} className="crm-stage flex-1" data-state={i < stage ? "done" : i === stage ? "current" : "todo"} />
        ))}
      </div>
      {!compact && (
        <p className="mt-1.5 text-[0.8125rem] text-ash sm:hidden">
          Step {stage + 1} of {stages.length}: <span className="font-semibold text-bone">{stages[stage]}</span>
        </p>
      )}
      {!compact && (
        <ol className="mt-2 hidden justify-between text-[0.75rem] sm:flex">
          {stages.map((name, i) => (
            <li key={name} className={i === stage ? "font-semibold text-bone" : i < stage ? "text-ash" : "text-faint"}>
              {i < stage ? "✓ " : ""}
              {name}
            </li>
          ))}
        </ol>
      )}
      {compact && <p className="mt-1 text-[0.75rem] text-ash">{stages[stage]}</p>}
    </div>
  );
}

/** A thread of messages, newest last. */
export function Thread({ messages, viewerId }: { messages: { id: string; body: string; createdAt: Date; fromStaff: boolean; internal: boolean; links: string[]; author: { name: string | null; email: string | null } | null; authorId: string | null }[]; viewerId: string }) {
  if (messages.length === 0) return <p className="text-ash">No messages yet.</p>;
  return (
    <ol className="space-y-3">
      {messages.map((m) => {
        const mine = m.authorId === viewerId;
        return (
          <li key={m.id} className={`max-w-[46rem] rounded-2xl px-4 py-3 ${m.internal ? "border border-dashed border-[#f59e0b]/60 bg-[#f59e0b]/10" : mine ? "ml-auto bg-[#ffc516]/15" : "bg-[var(--hover-wash)]"}`}>
            <p className="text-[0.75rem] text-faint">
              {m.author?.name ?? m.author?.email ?? "Genesis"}
              {m.fromStaff ? " · Genesis" : ""}
              {m.internal ? " · internal note" : ""} · {new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(m.createdAt)}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-pretty text-bone">{m.body}</p>
            {m.links.length > 0 && (
              <ul className="mt-2 space-y-1">
                {m.links.map((link) => (
                  <li key={link}>
                    <a href={link} target="_blank" rel="noopener noreferrer" className="crm-link break-all text-[0.875rem]">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function Notice({ children, warn = false }: { children: React.ReactNode; warn?: boolean }) {
  return <div className={`crm-notice ${warn ? "crm-notice-warn" : ""}`}>{children}</div>;
}
