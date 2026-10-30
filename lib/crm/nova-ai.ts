import "server-only";

import { getPrisma } from "@/lib/db";
import { razorpay, razorpayKeys } from "@/lib/razorpay";

import { appUrl, queueEmail, queueStaffEmail } from "./notify";

/**
 * NOVA AI (Genesis, 31 Oct 2026: "the AI assistant for agencies; not
 * included in the plan; only 4–6 prompts at very low usage, then it asks to
 * top up credits"). The CRM assistant (lib/crm/assistant) in an agency's own
 * CRM, quick mode only. Each agency starts with FREE_PROMPTS; every request
 * takes one credit (given back if it fails); after that, credit packs bought
 * through a Razorpay payment link. Genesis sets the packs and can grant
 * credits (AI usage page). Genesis's own team uses Nova Copilot, uncounted.
 */

export const FREE_PROMPTS = 5;
export type CreditPack = { credits: number; price: number };
/* Placeholder packs until Genesis sets its own (₹, GST included). */
const DEFAULT_PACKS: CreditPack[] = [
  { credits: 25, price: 499 },
  { credits: 100, price: 1499 },
  { credits: 300, price: 3499 },
];

export class NoCredits extends Error {
  constructor() {
    super("You've used your NOVA AI credits. Top up to keep going.");
  }
}

export async function novaAiPacks(): Promise<{ packs: CreditPack[]; placeholder: boolean }> {
  const row = await getPrisma().appSetting.findUnique({ where: { key: "nova-ai-pricing" } });
  if (!row) return { packs: DEFAULT_PACKS, placeholder: true };
  try {
    const packs = (JSON.parse(row.value) as CreditPack[]).filter((p) => p.credits > 0 && p.price > 0);
    return packs.length ? { packs, placeholder: false } : { packs: DEFAULT_PACKS, placeholder: true };
  } catch {
    return { packs: DEFAULT_PACKS, placeholder: true };
  }
}

export async function saveNovaAiPacks(packs: CreditPack[]) {
  const value = JSON.stringify(packs.filter((p) => p.credits > 0 && p.price > 0).slice(0, 6));
  await getPrisma().appSetting.upsert({ where: { key: "nova-ai-pricing" } , create: { key: "nova-ai-pricing", value }, update: { value } });
}

/** Credits left in this agency's CRM; its free allowance is added the first time it's asked. */
export async function novaAiBalance(workspaceId: string) {
  const prisma = getPrisma();
  await prisma.novaAiCredit.upsert({ where: { ref: `free:${workspaceId}` }, create: { workspaceId, delta: FREE_PROMPTS, reason: "FREE", ref: `free:${workspaceId}`, note: "Free to start" }, update: {} });
  const sum = await prisma.novaAiCredit.aggregate({ where: { workspaceId }, _sum: { delta: true } });
  return sum._sum.delta ?? 0;
}

/** Takes one credit for a request, all or nothing; the id gives it back if the request fails. */
export async function spendNovaAi(workspaceId: string, userId: string) {
  const prisma = getPrisma();
  await novaAiBalance(workspaceId);
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`nova-ai:${workspaceId}`}))`;
    const sum = await tx.novaAiCredit.aggregate({ where: { workspaceId }, _sum: { delta: true } });
    if ((sum._sum.delta ?? 0) < 1) throw new NoCredits();
    const row = await tx.novaAiCredit.create({ data: { workspaceId, delta: -1, reason: "USE", userId } });
    return row.id;
  });
}

export async function refundNovaAi(useId: string) {
  const prisma = getPrisma();
  const use = await prisma.novaAiCredit.findUnique({ where: { id: useId } });
  if (use?.reason === "USE") await prisma.novaAiCredit.upsert({ where: { ref: `refund:${useId}` }, create: { workspaceId: use.workspaceId, delta: 1, reason: "REFUND", ref: `refund:${useId}`, note: "The request failed" }, update: {} });
}

export async function grantNovaAi(workspaceId: string, credits: number, byId: string, note: string) {
  await getPrisma().novaAiCredit.create({ data: { workspaceId, delta: Math.round(credits), reason: "GRANT", userId: byId, note: note.slice(0, 200) } });
}

/** A top-up: a Razorpay payment link for one pack, back to NOVA AI once paid. */
export async function startTopUp(workspaceId: string, agencyName: string, packIndex: number, payer: { email: string | null; name: string | null }) {
  const { packs } = await novaAiPacks();
  const pack = packs[packIndex];
  if (!pack) throw new Error("Pick a pack.");
  if (!razorpayKeys()) throw new Error("Payments aren't switched on yet. Message us on WhatsApp and we'll add credits for you.");
  const link = await razorpay<{ id: string; short_url: string }>("payment_links", {
    amount: pack.price * 100,
    currency: "INR",
    description: `NOVA AI: ${pack.credits} credits for ${agencyName} (GST included)`,
    customer: { ...(payer.name ? { name: payer.name } : {}), ...(payer.email ? { email: payer.email } : {}) },
    notify: { email: Boolean(payer.email), sms: false },
    reminder_enable: false,
    callback_url: appUrl("/admin/assistant/topup"),
    callback_method: "get",
    notes: { nova_ai_workspace: workspaceId, credits: String(pack.credits) },
  });
  await getPrisma().appSetting.upsert({ where: { key: `nova-ai-topup:${link.id}` }, create: { key: `nova-ai-topup:${link.id}`, value: JSON.stringify({ ws: workspaceId, credits: pack.credits, price: pack.price }) }, update: {} });
  return link.short_url;
}

/** Credits a paid top-up once (from its return to NOVA AI; safe to call again). True when it is paid. */
export async function settleTopUp(linkId: string) {
  const prisma = getPrisma();
  const pending = await prisma.appSetting.findUnique({ where: { key: `nova-ai-topup:${linkId}` } });
  const keys = razorpayKeys();
  if (!pending || !keys) return false;
  const { ws, credits, price } = JSON.parse(pending.value) as { ws: string; credits: number; price: number };
  if (await prisma.novaAiCredit.findUnique({ where: { ref: linkId } })) return true;
  const res = await fetch(`https://api.razorpay.com/v1/payment_links/${encodeURIComponent(linkId)}`, { headers: { Authorization: `Basic ${Buffer.from(`${keys.id}:${keys.secret}`).toString("base64")}` }, cache: "no-store" });
  if (!res.ok) return false;
  const link = (await res.json()) as { status?: string };
  if (link.status !== "paid") return false;
  const created = await prisma.novaAiCredit.create({ data: { workspaceId: ws, delta: credits, reason: "TOPUP", ref: linkId, note: `Paid ₹${price.toLocaleString("en-IN")}` } }).catch(() => null);
  if (created) {
    const agency = await prisma.account.findFirst({ where: { id: ws, workspaceId: null }, select: { name: true, email: true } });
    const admins = await prisma.user.findMany({ where: { workspaceId: ws, workspaceRole: "ADMIN", emailVerified: true }, select: { email: true } });
    await queueEmail({ kind: "nova_ai_topup", to: [agency?.email, ...admins.map((a) => a.email)], subject: `${credits} NOVA AI credits added`, text: `Thank you. ${credits} NOVA AI credits have been added to ${agency?.name ?? "your CRM"} for ₹${price.toLocaleString("en-IN")} (GST included). Razorpay emails the receipt.\n\n${appUrl("/admin/assistant")}`, dedupeKey: `nova-ai-topup:${linkId}` });
    await queueStaffEmail({ kind: "nova_ai_topup", scope: "finance", subject: `NOVA AI top-up: ${agency?.name ?? ws} · ${credits} credits · ₹${price.toLocaleString("en-IN")}`, text: appUrl("/admin/billing"), dedupeKey: `nova-ai-topup-staff:${linkId}` });
  }
  return true;
}
