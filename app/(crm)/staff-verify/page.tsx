import type { Metadata } from "next";
import { redirect } from "next/navigation";
import QRCode from "qrcode";

import { getPrisma } from "@/lib/db";
import { getViewer, safeNext } from "@/lib/crm/session";
import { newTotpSecret, otpauthUrl } from "@/lib/crm/totp";

import { CodeForm } from "./code-form";

export const metadata: Metadata = { title: "Staff verification" };
export const dynamic = "force-dynamic";

/**
 * Two-factor for the CRM (as genesis-coworking). First visit: scan a QR code
 * into an authenticator app, then enter a code. After that: just the code,
 * every 12 hours. Skipped when Auth0 already did MFA for this sign-in.
 */
export default async function StaffVerifyPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next ?? "/admin", "/admin");
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (viewer.roles.length === 0) redirect("/admin/forbidden");
  if (viewer.mfa) redirect(next);

  const prisma = getPrisma();
  const row =
    (await prisma.staffTotp.findUnique({ where: { userId: viewer.id } })) ??
    (await prisma.staffTotp.upsert({ where: { userId: viewer.id }, create: { userId: viewer.id, secret: newTotpSecret() }, update: {} }));
  const setup = !row.confirmedAt;
  const qr = setup ? await QRCode.toString(otpauthUrl(row.secret, viewer.email ?? viewer.phone ?? "staff"), { type: "svg", margin: 1, width: 220 }) : null;

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
      <div className="crm-card crm-pad space-y-5">
        <p className="micro-label">Genesis Media · Staff</p>
        <h1 className="text-[1.75rem] font-normal tracking-tight text-bone">{setup ? "Set up two-factor" : "Enter your code"}</h1>
        {setup ? (
          <>
            <ol className="list-decimal space-y-2 pl-5 text-ash">
              <li>
                Open <strong className="text-bone">Google Authenticator</strong> (or any authenticator app) on your phone.
              </li>
              <li>
                Tap <strong className="text-bone">+</strong> → <strong className="text-bone">Scan a QR code</strong>, and scan this:
              </li>
            </ol>
            <div className="mx-auto w-fit rounded-xl bg-white p-3" dangerouslySetInnerHTML={{ __html: qr! }} />
            <details className="text-[0.875rem] text-ash">
              <summary className="cursor-pointer">Can&apos;t scan? Enter this key instead</summary>
              <p className="mt-2 break-all font-mono text-bone">{row.secret.match(/.{1,4}/g)!.join(" ")}</p>
            </details>
            <p className="text-ash">
              3. Type the 6-digit code the app shows for <strong className="text-bone">Genesis Media</strong>.
            </p>
          </>
        ) : (
          <p className="text-ash">
            Open your authenticator app and type the 6-digit code for <strong className="text-bone">Genesis Media</strong>.
          </p>
        )}
        <CodeForm next={next} />
        {!setup && (
          <p className="text-[0.8125rem] text-ash">
            New phone, or the app shows no Genesis Media entry? Ask an owner to reset your two-factor in Staff &amp; roles, then sign in again to scan a new code. Codes change every 30 seconds; check the phone&apos;s clock is set automatically.
          </p>
        )}
        <p className="text-[0.75rem] text-faint">Signed in as {viewer.email ?? viewer.phone}. You&apos;ll be asked again after 12 hours.</p>
      </div>
    </main>
  );
}
