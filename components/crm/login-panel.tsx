"use client";

import { useState } from "react";

type Mode = { kind: "choose" } | { kind: "email" } | { kind: "sms" } | { kind: "code"; connection: "email" | "sms"; destination: string };

const PROVIDERS: Record<string, string> = {
  "google-oauth2": "Continue with Google",
  apple: "Continue with Apple",
  windowslive: "Continue with Microsoft",
};

function mask(destination: string) {
  if (destination.includes("@")) {
    const [user, domain] = destination.split("@");
    return `${user!.slice(0, 2)}${"•".repeat(Math.max(1, user!.length - 2))}@${domain}`;
  }
  return `${destination.slice(0, 3)}${"•".repeat(Math.max(0, destination.length - 5))}${destination.slice(-2)}`;
}

async function post(path: string, body: unknown) {
  const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), credentials: "same-origin" });
  if (res.ok) return null;
  const data = (await res.json().catch(() => ({}))) as { error?: string; error_description?: string };
  return { status: res.status, ...data };
}

/**
 * Sign-in (from genesis-coworking). Social providers redirect through Auth0; email and mobile codes
 * use Auth0 passwordless (codes, expiry, resend throttling and attempt limits
 * are Auth0's). After sign-in, /account/complete maps the identity and
 * returns to `next`. `linking` reuses the same panel to add a verified
 * channel to an existing account.
 */
export function LoginPanel({ connections, next, linking = false }: { connections: string[]; next: string; linking?: boolean }) {
  const [mode, setMode] = useState<Mode>(() =>
    connections.length === 1 && (connections[0] === "email" || connections[0] === "sms") ? { kind: connections[0] } : { kind: "choose" },
  );
  const [value, setValue] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /* Resend unlocks 30 seconds after a code is sent (a timer, not the clock read during render). */
  const [canResend, setCanResend] = useState(false);
  const complete = `/account/complete?next=${encodeURIComponent(next)}`;

  const start = async (connection: "email" | "sms", destination: string) => {
    setBusy(true);
    setError(null);
    const failure = await post("/auth/passwordless/start", connection === "email" ? { connection, email: destination, send: "code" } : { connection, phoneNumber: destination });
    setBusy(false);
    if (failure) {
      setError(failure.status === 429 ? "Please wait before requesting another code." : failure.error_description ?? "We could not send a code. Check the details and try again.");
      return false;
    }
    setCanResend(false);
    window.setTimeout(() => setCanResend(true), 30_000);
    setMode({ kind: "code", connection, destination });
    return true;
  };

  const verify = async (connection: "email" | "sms", destination: string) => {
    setBusy(true);
    setError(null);
    const failure = await post("/auth/passwordless/verify", connection === "email" ? { connection, email: destination, verificationCode: code } : { connection, phoneNumber: destination, verificationCode: code });
    if (failure) {
      setBusy(false);
      setError(failure.status === 429 ? "Please wait before trying again." : "Code is invalid or expired.");
      return;
    }
    // A full page load, on purpose: /account/complete is a route handler that sets cookies and redirects.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(complete);
  };

  if (mode.kind === "code") {
    return (
      <form className="crm-card crm-pad space-y-5" onSubmit={(e) => { e.preventDefault(); void verify(mode.connection, mode.destination); }} noValidate>
        <div>
          <h2 className="font-sans font-semibold text-[1.375rem] text-bone">Check your {mode.connection === "email" ? "email" : "phone"}</h2>
          <p className="mt-1 text-ash">Enter the code we sent to {mask(mode.destination)}.</p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="otp" className="crm-label">Verification code</label>
          <input id="otp" className="crm-input tabular-nums tracking-[0.3em]" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" maxLength={8}
            value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} aria-invalid={Boolean(error)} aria-describedby={error ? "otp-error" : undefined} required />
          {error && <p id="otp-error" className="text-[0.8125rem] text-[#dc2626]" role="alert">{error}</p>}
          <p className="text-[0.75rem] text-faint">The code expires after a few minutes, as set by our sign-in provider.</p>
        </div>
        <button className="crm-btn crm-btn-primary w-full" disabled={busy || code.length < 4}>{busy ? "Verifying…" : "Verify & continue"}</button>
        <div className="flex flex-wrap justify-between gap-2">
          <button type="button" className="text-[0.875rem] text-ash underline-offset-4 hover:text-bone hover:underline disabled:opacity-50" disabled={busy || !canResend} onClick={() => void start(mode.connection, mode.destination)}>
            {canResend ? "Resend code" : "Resend code (wait 30 s)"}
          </button>
          <button type="button" className="text-[0.875rem] text-ash underline-offset-4 hover:text-bone hover:underline disabled:opacity-50" onClick={() => { setMode({ kind: mode.connection }); setCode(""); setError(null); }}>
            Change email or number
          </button>
        </div>
      </form>
    );
  }

  if (mode.kind === "email" || mode.kind === "sms") {
    const isEmail = mode.kind === "email";
    const valid = isEmail ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) : /^\+[1-9][0-9]{7,14}$/.test(value.replace(/[\s-]/g, ""));
    return (
      <form className="crm-card crm-pad space-y-5" noValidate onSubmit={(e) => {
        e.preventDefault();
        if (!valid) { setError(isEmail ? "Enter a valid email address." : "Enter your mobile number with country code, e.g. +91 98765 43210."); return; }
        void start(mode.kind, isEmail ? value.trim().toLowerCase() : value.replace(/[\s-]/g, ""));
      }}>
        <div className="space-y-1.5">
          <label htmlFor="destination" className="crm-label">{isEmail ? "Email address" : "Mobile number with country code"}</label>
          <input id="destination" className="crm-input" type={isEmail ? "email" : "tel"} autoComplete={isEmail ? "email" : "tel"} inputMode={isEmail ? "email" : "tel"}
            placeholder={isEmail ? "you@example.com" : "+91 98765 43210"} value={value} onChange={(e) => setValue(e.target.value)}
            aria-invalid={Boolean(error)} aria-describedby={error ? "dest-error" : undefined} required />
          {error && <p id="dest-error" className="text-[0.8125rem] text-[#dc2626]" role="alert">{error}</p>}
        </div>
        <button className="crm-btn crm-btn-primary w-full" disabled={busy}>{busy ? "Sending…" : isEmail ? "Send verification code" : "Send OTP"}</button>
        <button type="button" className="text-[0.875rem] text-ash underline-offset-4 hover:text-bone hover:underline disabled:opacity-50" onClick={() => { setMode({ kind: "choose" }); setError(null); }}>Back to all sign-in options</button>
      </form>
    );
  }

  return (
    <div className="grid gap-3">
      {Object.entries(PROVIDERS).filter(([c]) => connections.includes(c)).map(([connection, label]) => (
        <a key={connection} className="crm-btn crm-btn-secondary w-full" href={`/auth/login?connection=${connection}${linking ? "&prompt=login" : ""}&returnTo=${encodeURIComponent(complete)}`}>{label}</a>
      ))}
      {connections.includes("email") && <button type="button" className="crm-btn crm-btn-secondary w-full" onClick={() => setMode({ kind: "email" })}>Continue with email</button>}
      {connections.includes("sms") && <button type="button" className="crm-btn crm-btn-secondary w-full" onClick={() => setMode({ kind: "sms" })}>Continue with mobile</button>}
      {error && <p className="text-[0.8125rem] text-[#dc2626]" role="alert">{error}</p>}
    </div>
  );
}
