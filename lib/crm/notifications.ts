import "server-only";

import { getPrisma } from "@/lib/db";

import { appUrl, queueEmail } from "./notify";

/**
 * THE BELL (Genesis, 12 Oct 2026: "give a notification"). A row per person,
 * shown in the CRM's header, and — when `email` is set — the same message by
 * email through the outbox.
 */
export async function notify(userIds: (string | null | undefined)[], input: { title: string; body?: string; href?: string; email?: boolean; dedupeKey?: string }) {
  const ids = [...new Set(userIds.filter((id): id is string => Boolean(id)))];
  if (ids.length === 0) return;
  const prisma = getPrisma();
  await prisma.notification.createMany({ data: ids.map((userId) => ({ userId, title: input.title.slice(0, 200), body: input.body?.slice(0, 1000), href: input.href })) });
  if (!input.email) return;
  const people = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, email: true } });
  for (const person of people) {
    await queueEmail({
      kind: "notification",
      to: [person.email],
      subject: input.title,
      text: [input.body ?? "", input.href ? `\n${appUrl(input.href)}` : ""].join("\n").trim(),
      dedupeKey: input.dedupeKey ? `${input.dedupeKey}:${person.id}` : undefined,
    });
  }
}

/** Owners and admins: they see everything that comes in. */
export async function adminIds(): Promise<string[]> {
  const rows = await getPrisma().staffRole.findMany({ where: { role: { in: ["OWNER", "ADMIN"] } }, select: { userId: true } });
  return [...new Set(rows.map((r) => r.userId))];
}
