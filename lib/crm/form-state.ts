/** What a CRM server action returns to its form: a message, good or bad. */
export type ActionState = { ok: boolean; message: string } | null;

export const ok = (message: string): ActionState => ({ ok: true, message });
export const fail = (message: string): ActionState => ({ ok: false, message });

/** A trimmed string from a form, or null when empty. */
export function text(form: FormData, name: string, max = 4000): string | null {
  const value = String(form.get(name) ?? "").trim();
  return value ? value.slice(0, max) : null;
}

/** A date input's YYYY-MM-DD as a Date, or null. */
export function day(form: FormData, name: string): Date | null {
  const value = String(form.get(name) ?? "");
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00.000Z`) : null;
}

/** One URL per line (or comma), http(s) only. */
export function links(form: FormData, name: string): string[] {
  return String(form.get(name) ?? "")
    .split(/[\n,]+/)
    .map((l) => l.trim())
    .filter((l) => /^https?:\/\/\S+$/i.test(l))
    .slice(0, 10);
}

export const isEmail = (value: string | null): value is string => Boolean(value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
