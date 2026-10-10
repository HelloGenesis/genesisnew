import type { Metadata } from "next";
import Link from "next/link";

import { LoginPanel } from "@/components/crm/login-panel";
import { isAuth0Configured } from "@/lib/auth0";
import { devLoginEnabled, safeNext } from "@/lib/crm/session";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

/** Sign-in methods switched on in Auth0 and tested (AUTH0_CONNECTIONS, comma separated). */
function connections(): string[] {
  const list = (process.env.AUTH0_CONNECTIONS ?? "email,google-oauth2").split(",").map((c) => c.trim()).filter(Boolean);
  return list;
}

/**
 * ONE SIGN-IN FOR EVERYONE — Genesis's team, clients, agencies and vendors.
 * No passwords: Google, or a one-time code by email or SMS (Auth0
 * passwordless). Where they land depends on who they are: staff to /admin,
 * everyone else to their portal.
 */
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const target = safeNext(next ?? null, "");
  return (
    <main className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-12 sm:px-6 sm:py-20 lg:grid-cols-[1fr_26rem] lg:items-center">
      <div>
        <p className="micro-label">Genesis Media · Workspace</p>
        <h1 className="mt-3 text-balance text-[2.25rem] font-normal leading-[1.05] tracking-tight text-bone sm:text-[3rem]">
          Your projects, files and invoices, <span className="font-serif italic text-brand-ink">in one place.</span>
        </h1>
        <p className="mt-4 max-w-xl text-pretty text-ash">
          For Genesis clients, partner agencies and our creative crew. Review and approve work, send briefs, follow every project from brief to delivery, and
          download invoices. No password: we send you a one-time code.
        </p>
      </div>
      <div>
        {error === "authentication_failed" && <p className="crm-notice crm-notice-warn mb-4">That sign-in didn&apos;t go through. Please try again.</p>}
        {isAuth0Configured() ? (
          <LoginPanel connections={connections()} next={target || "/portal"} />
        ) : devLoginEnabled() ? (
          <form action="/login/dev" method="post" className="crm-card crm-pad space-y-4">
            <p className="crm-notice crm-notice-warn">Local development sign-in. Auth0 is not configured on this machine, so any email signs in without a code.</p>
            <input type="hidden" name="next" value={target} />
            <label className="block">
              <span className="crm-label">Email address</span>
              <input name="email" type="email" required className="crm-input" placeholder="you@genesismedia.co" />
            </label>
            <button className="crm-btn crm-btn-primary w-full">Sign in</button>
          </form>
        ) : (
          <div className="crm-card crm-pad">
            <p className="text-ash">Sign-in isn&apos;t switched on yet. Please contact us at <a className="crm-link" href="mailto:hello@genesismedia.co">hello@genesismedia.co</a>.</p>
          </div>
        )}
        <p className="mt-6 text-[0.8125rem] text-faint">
          By continuing you agree to our <Link className="crm-link" href="/terms">Terms</Link> and <Link className="crm-link" href="/privacy">Privacy Policy</Link>.
        </p>
      </div>
    </main>
  );
}
