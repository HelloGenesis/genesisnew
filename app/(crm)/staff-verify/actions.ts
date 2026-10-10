"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { recordAuditLog } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import { getViewer, safeNext, signStaffTwoFactor, STAFF_2FA_COOKIE, staffTwoFactorCookieOptions } from "@/lib/crm/session";
import { verifyTotp } from "@/lib/crm/totp";

export type VerifyState = { message: string } | null;

/** Checks the authenticator code; on success marks this sign-in as two-factor for 12 hours and continues. */
export async function verifyStaffCode(_: VerifyState, form: FormData): Promise<VerifyState> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/admin");
  if (viewer.roles.length === 0) redirect("/admin/forbidden");
  const prisma = getPrisma();
  const row = await prisma.staffTotp.findUnique({ where: { userId: viewer.id } });
  if (!row) return { message: "Set-up has expired. Reload the page and scan the new code." };
  const step = verifyTotp(row.secret, String(form.get("code") ?? ""), row.lastStep);
  if (step === null) return { message: "That code didn't match. Check the 6-digit code in your authenticator app and try again." };
  /* Atomic: a code works once, even for two requests at the same moment. */
  const updated = await prisma.staffTotp.updateMany({
    where: { userId: viewer.id, lastStep: { lt: step } },
    data: { lastStep: step, confirmedAt: row.confirmedAt ?? new Date() },
  });
  if (updated.count === 0) return { message: "That code was already used. Wait for the next one." };
  await recordAuditLog({ action: "staff.two_factor_verified", entity: "user", entityId: viewer.id, actorId: viewer.id });
  (await cookies()).set(STAFF_2FA_COOKIE, signStaffTwoFactor(viewer.id, viewer.sub), staffTwoFactorCookieOptions);
  redirect(safeNext(String(form.get("next") ?? "/admin"), "/admin"));
}
