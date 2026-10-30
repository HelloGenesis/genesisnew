import "server-only";

import { randomBytes } from "node:crypto";

import { CRM_PLAN_PRICES, crmCycleCharge, crmCycleTotal, crmPerMonth, findCrmPlan } from "@/lib/crm-plans";
import { getPrisma } from "@/lib/db";
import { TERMS_VERSION } from "@/lib/legal-commerce";
import { inr } from "@/lib/money";
import { razorpay, razorpayKeys, notes } from "@/lib/razorpay";

import { appUrl, queueEmail, queueStaffEmail } from "./notify";
import { recordCrmCheckout } from "./orders";

/**
 * NOVA BY GENESIS'S 14-DAY FREE TRIAL (Genesis, 31 Oct 2026: "a trial should
 * start immediately; after 3–4 days stop the trial and ask the user to add
 * their card details and choose a plan; tell them they pay ₹0 now and the
 * card is charged on the 14th day; they can cancel, and inform them by mail").
 *
 *   Day 0   Start: their own Nova CRM at once (an agency workspace), no card.
 *   Day 3   The CRM pauses on "choose a plan and add your card" until they do.
 *           The card is a Razorpay subscription that starts on day 14: ₹0
 *           now (Razorpay checks the card with ₹5 and refunds it at once).
 *   Day 14  The first charge; the plan runs monthly until cancelled.
 *   Any time: cancel from Plan & billing; nothing is charged after that.
 *
 * Every step is emailed (the welcome, the day before the card is due, the
 * pause, the card added, two days before the first charge, the plan started,
 * cancelled, and a trial that ran out). Monthly billing only: Indian banks
 * won't auto-debit a card for more than ₹15,000 without approving each
 * charge, which a year's plan would be.
 *
 * Account rows are always asked for with workspaceId: null, as they are each
 * agency's own row in Genesis's records.
 */

export const TRIAL_DAYS = 14;
export const CARD_AFTER_DAYS = 3;
const DAY = 864e5;

export type TrialState = "TRIAL" | "CARD_ADDED" | "ACTIVE" | "CANCELLED" | "ENDED";
export type Trial = { id: string; name: string; state: TrialState; startedAt: Date; cardDueAt: Date; endsAt: Date; plan: string | null; subscriptionId: string | null; email: string | null };

export const prettyDate = (d: Date) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(d);
export const monthlyTotal = (planKey: string) => {
  const plan = findCrmPlan(planKey);
  return plan ? crmCycleTotal(plan, "monthly") : 0;
};

/** This agency's trial, or null when it isn't on one. */
export async function trialOf(workspaceId: string | null | undefined): Promise<Trial | null> {
  if (!workspaceId) return null;
  const a = await getPrisma().account.findFirst({
    where: { id: workspaceId, workspaceId: null, trialStartedAt: { not: null } },
    select: { id: true, name: true, email: true, trialState: true, trialStartedAt: true, trialCardDueAt: true, trialEndsAt: true, trialPlan: true, trialSubscriptionId: true },
  });
  if (!a?.trialStartedAt || !a.trialCardDueAt || !a.trialEndsAt) return null;
  return { id: a.id, name: a.name, email: a.email, state: (a.trialState ?? "TRIAL") as TrialState, startedAt: a.trialStartedAt, cardDueAt: a.trialCardDueAt, endsAt: a.trialEndsAt, plan: a.trialPlan, subscriptionId: a.trialSubscriptionId };
}

/** What the CRM should do for this trial now: carry on, ask for the card, or stop. */
export function trialGate(t: Trial | null, now = new Date()): "open" | "card" | "ended" {
  if (!t) return "open";
  if (t.state === "ACTIVE" || t.state === "CARD_ADDED") return "open";
  if (t.state === "ENDED") return "ended";
  /* Cancelled with a card: it runs to the trial's end. Without one: to the day the card was due, not past it. */
  if (t.state === "CANCELLED") return now >= (t.subscriptionId ? t.endsAt : t.cardDueAt) ? "ended" : "open";
  if (now >= t.endsAt) return "ended";
  return now >= t.cardDueAt ? "card" : "open";
}

/** Who hears about this trial: its admins, and the address it was started with. */
async function trialEmails(accountId: string, email: string | null) {
  const admins = await getPrisma().user.findMany({ where: { workspaceId: accountId, workspaceRole: "ADMIN", emailVerified: true }, select: { email: true } });
  return [...new Set([email, ...admins.map((u) => u.email)].filter((e): e is string => Boolean(e)).map((e) => e.toLowerCase()))];
}

export class TrialProblem extends Error {}

/** Starts a trial: the agency, its CRM, its admin's invitation, and the emails. */
export async function startTrial(input: { name: string; email: string; phone: string; company: string }) {
  const prisma = getPrisma();
  const email = input.email.trim().toLowerCase();
  const user = await prisma.user.findFirst({ where: { email, emailVerified: true }, select: { id: true, workspaceId: true, _count: { select: { staffRoles: true } } } });
  if (user?._count.staffRoles) throw new TrialProblem("That email is on Genesis's own team. Use a different email for your agency's trial.");
  if (user?.workspaceId) throw new TrialProblem("That email already has a Nova CRM. Sign in to open it.");
  if (await prisma.appSetting.findUnique({ where: { key: `agency-invite:${email}` } })) throw new TrialProblem("That email already has a Nova CRM waiting. Sign in with it to open it.");

  const now = new Date();
  const cardDueAt = new Date(now.getTime() + CARD_AFTER_DAYS * DAY);
  const endsAt = new Date(now.getTime() + TRIAL_DAYS * DAY);
  const agency = await prisma.account.create({
    data: {
      name: input.company.trim(),
      kind: "AGENCY",
      status: "ACTIVE",
      crmWorkspace: true,
      workspaceId: null,
      email,
      phone: input.phone.trim(),
      crmProfile: { name: input.company.trim(), email, phone: input.phone.trim() },
      trialStartedAt: now,
      trialCardDueAt: cardDueAt,
      trialEndsAt: endsAt,
      trialState: "TRIAL",
    },
  });
  /* Their admin: now if they've signed in to Genesis before, else when they first sign in with this email (lib/crm/session). */
  if (user) await prisma.user.update({ where: { id: user.id }, data: { workspaceId: agency.id, workspaceRole: "ADMIN" } });
  else await prisma.appSetting.upsert({ where: { key: `agency-invite:${email}` }, create: { key: `agency-invite:${email}`, value: JSON.stringify({ ws: agency.id, role: "ADMIN" }) }, update: { value: JSON.stringify({ ws: agency.id, role: "ADMIN" }) } });
  /* The team sees them as a lead in Genesis's own CRM. */
  await prisma.lead.create({ data: { workspaceId: null, name: input.name.trim(), email, phone: input.phone.trim(), company: input.company.trim(), division: "CRM", interest: "Nova by Genesis free trial", source: "WEBSITE_FORM", status: "QUALIFIED", nextFollowUp: new Date(now.getTime() + 2 * DAY), notes: `Started a 14-day Nova trial on ${prettyDate(now)}. Card due ${prettyDate(cardDueAt)}; first charge ${prettyDate(endsAt)} if they add one.` } });

  const first = input.name.trim().split(/\s+/)[0];
  await queueEmail({
    kind: "nova_trial_started",
    to: [email],
    subject: "Your 14-day Nova trial has started",
    text: `Hi ${first},\n\nWelcome to Nova by Genesis. Your CRM for ${input.company.trim()} is ready, with everything switched on for 14 days.\n\nSign in with this email (${email}), with Google or a one-time code:\n${appUrl("/login?next=/admin")}\n\nThe first time, you'll set up an authenticator app for two-factor sign-in, then a short tour shows you around.\n\nHow the trial works:\n• Now to ${prettyDate(cardDueAt)}: use everything, no card needed.\n• From ${prettyDate(cardDueAt)}: choose a plan and add your card to keep going. You pay ₹0 that day.\n• ${prettyDate(endsAt)}: your trial ends and your card is first charged for the plan you chose, then monthly.\n• Cancel any time before ${prettyDate(endsAt)} and you won't be charged. We'll email you before every step.\n\nQuestions? Just reply.`,
    dedupeKey: `nova-trial-started:${agency.id}`,
  });
  await queueStaffEmail({
    kind: "nova_trial_started",
    scope: "sales",
    subject: `New Nova trial: ${input.company.trim()}`,
    text: `${input.name.trim()} (${email}, ${input.phone.trim()}) at ${input.company.trim()} started a 14-day Nova trial.\n\nCard due ${prettyDate(cardDueAt)}; first charge ${prettyDate(endsAt)} if they add one. A lead is in the CRM to follow up.\n\n${appUrl("/admin/leads")}`,
    dedupeKey: `nova-trial-started-staff:${agency.id}`,
  });
  return { id: agency.id, cardDueAt, endsAt };
}

/** The card step: a Razorpay subscription for the chosen plan that starts when the trial ends. */
export async function startCard(trial: Trial, planKey: string, payer: { name: string | null; email: string | null; phone: string | null }) {
  const plan = findCrmPlan(planKey);
  if (!plan) throw new TrialProblem("Pick a plan.");
  if (trial.state !== "TRIAL") throw new TrialProblem(trial.state === "CARD_ADDED" || trial.state === "ACTIVE" ? "Your card is already added." : "This trial has ended.");
  const keys = razorpayKeys();
  if (!keys) throw new TrialProblem("Card payments aren't switched on yet. Message us on WhatsApp and we'll set it up.");
  const total = crmCycleTotal(plan, "monthly");
  const charge = crmCycleCharge(plan, "monthly");
  const reference = `GM-NOVA-${Date.now().toString(36)}-${randomBytes(2).toString("hex")}`.toUpperCase();
  /* Razorpay needs the start a little in the future: the trial's end, or tomorrow if that's sooner. */
  const startAt = Math.max(Math.floor(trial.endsAt.getTime() / 1000), Math.floor(Date.now() / 1000) + 86400);
  const made = await razorpay<{ id: string }>("plans", { period: "monthly", interval: 1, item: { name: `Nova by Genesis ${plan.key} (monthly)`, amount: total * 100, currency: "INR", description: `Nova by Genesis ${plan.key}, billed monthly, GST 18% included` }, notes: { reference } });
  const sub = await razorpay<{ id: string; short_url?: string }>("subscriptions", {
    plan_id: made.id,
    total_count: 120,
    quantity: 1,
    start_at: startAt,
    customer_notify: 1,
    notes: notes({ reference, product: `Nova by Genesis ${plan.key}`, trial_account: trial.id, company: trial.name, first_charge: prettyDate(new Date(startAt * 1000)) }),
  });
  const consent = `Accepted Terms & Conditions and Cancellation & Refund Policy (version ${TERMS_VERSION}) on ${new Date().toISOString()}; free trial, first charge on ${prettyDate(new Date(startAt * 1000))}`;
  await recordCrmCheckout({ reference, plan: plan.key, billing: "monthly", chargeRupees: charge, totalRupees: total, consent, razorpaySubscriptionId: sub.id, customer: { name: payer.name ?? trial.name, email: payer.email ?? trial.email ?? "", phone: payer.phone ?? "", company: trial.name, address: "" } });
  const prisma = getPrisma();
  await prisma.order.updateMany({ where: { reference }, data: { accountId: trial.id } });
  await prisma.account.updateMany({ where: { id: trial.id, workspaceId: null }, data: { trialPlan: plan.key, trialSubscriptionId: sub.id } });
  return { key: keys.id, subscriptionId: sub.id, url: sub.short_url, reference, description: `Nova by Genesis ${plan.key}: ₹0 today, ${inr(total)} a month from ${prettyDate(new Date(startAt * 1000))}`, prefill: { name: payer.name ?? "", email: payer.email ?? "", contact: (payer.phone ?? "").replace(/[\s-]/g, "") } };
}

/** The card is on file (from Checkout's signed reply, or Razorpay's webhook, whichever is first). */
export async function cardAdded(subscriptionId: string) {
  const prisma = getPrisma();
  const a = await prisma.account.findFirst({ where: { trialSubscriptionId: subscriptionId, workspaceId: null } });
  if (!a?.trialEndsAt || !a.trialPlan) return;
  const { count } = await prisma.account.updateMany({ where: { id: a.id, workspaceId: null, trialState: "TRIAL" }, data: { trialState: "CARD_ADDED" } });
  if (!count) return;
  const total = monthlyTotal(a.trialPlan);
  await queueEmail({
    kind: "nova_card_added",
    to: await trialEmails(a.id, a.email),
    subject: "Card added: ₹0 today, your trial carries on",
    text: `Your card is saved for Nova by Genesis ${a.trialPlan}, and nothing has been charged today. If your bank showed a ₹5 check, Razorpay has already refunded it.\n\nYour trial carries on until ${prettyDate(a.trialEndsAt)}. On that day your card is charged ${inr(total)} (GST included), then monthly.\n\nChanged your mind? Cancel any time before ${prettyDate(a.trialEndsAt)} from Plan & billing and you won't be charged:\n${appUrl("/admin/plan")}`,
    dedupeKey: `nova-card-added:${a.id}`,
  });
  await queueStaffEmail({ kind: "nova_card_added", scope: "sales", subject: `Nova trial card added: ${a.name} (${a.trialPlan})`, text: `First charge ${inr(total)} on ${prettyDate(a.trialEndsAt)}.\n\n${appUrl("/admin/billing")}`, dedupeKey: `nova-card-added-staff:${a.id}` });
}

/** Razorpay's word on a trial's subscription (lib/crm/orders applySubscription). */
export async function trialSubscriptionEvent(name: string, subscriptionId: string) {
  const prisma = getPrisma();
  const a = await prisma.account.findFirst({ where: { trialSubscriptionId: subscriptionId, workspaceId: null } });
  if (!a) return false;
  if (name === "subscription.authenticated") await cardAdded(subscriptionId);
  if ((name === "subscription.charged" || name === "subscription.activated") && a.trialState !== "ACTIVE" && a.trialState !== "CANCELLED") {
    await prisma.account.updateMany({ where: { id: a.id, workspaceId: null }, data: { trialState: "ACTIVE" } });
    await queueEmail({
      kind: "nova_plan_started",
      to: await trialEmails(a.id, a.email),
      subject: `Your Nova ${a.trialPlan ?? ""} plan has started`.replace("  ", " "),
      text: `Your free trial has ended and your Nova by Genesis ${a.trialPlan ?? ""} plan is now active. Your card has been charged ${inr(monthlyTotal(a.trialPlan ?? ""))} (GST included), and Razorpay emails a receipt for every payment. It renews monthly until you cancel.\n\nEverything you set up in the trial is still there:\n${appUrl("/admin")}\n\nPlan & billing: ${appUrl("/admin/plan")}`,
      dedupeKey: `nova-plan-started:${a.id}`,
    });
    await queueStaffEmail({ kind: "nova_trial_converted", scope: "sales", subject: `Nova trial converted: ${a.name} (${a.trialPlan})`, text: `${appUrl("/admin/billing")}`, dedupeKey: `nova-trial-converted:${a.id}` });
  }
  if (name === "subscription.cancelled") await markCancelled(a.id);
  return true;
}

async function markCancelled(accountId: string) {
  const prisma = getPrisma();
  const a = await prisma.account.findFirst({ where: { id: accountId, workspaceId: null } });
  if (!a?.trialEndsAt) return;
  await prisma.account.updateMany({ where: { id: a.id, workspaceId: null }, data: { trialState: "CANCELLED" } });
  const paying = a.trialState === "ACTIVE";
  await queueEmail({
    kind: "nova_cancelled",
    to: await trialEmails(a.id, a.email),
    subject: paying ? "Your Nova plan is cancelled" : "Your Nova trial is cancelled: you won't be charged",
    text: paying
      ? "Your Nova by Genesis plan is cancelled and won't renew. Nothing more will be charged.\n\nYour data is kept for 30 days in case you change your mind: reply and we'll switch it back on."
      : `Your Nova by Genesis trial is cancelled and your card won't be charged.${a.trialEndsAt > new Date() ? ` You can keep using it until ${prettyDate(a.trialEndsAt)}.` : ""}\n\nYour data is kept for 30 days in case you change your mind: reply, or start again from ${appUrl("/resellers")}.`,
    dedupeKey: `nova-cancelled:${a.id}`,
  });
  await queueStaffEmail({ kind: "nova_cancelled", scope: "sales", subject: `Nova ${paying ? "plan" : "trial"} cancelled: ${a.name}`, text: appUrl("/admin/billing"), dedupeKey: `nova-cancelled-staff:${a.id}` });
}

/** Cancel from Plan & billing: the subscription (if there is one) at Razorpay, then here. */
export async function cancelTrial(trial: Trial) {
  if (trial.state === "CANCELLED" || trial.state === "ENDED") return;
  if (trial.subscriptionId && razorpayKeys()) await razorpay(`subscriptions/${trial.subscriptionId}/cancel`, { cancel_at_cycle_end: 0 });
  await markCancelled(trial.id);
}

/**
 * The reminders, from the job runner every minute (lib/crm/jobs): each is sent
 * once (its dedupe key), and a trial that ran out without a card is ended.
 */
export async function trialReminders(now = new Date()) {
  const prisma = getPrisma();
  const live = await prisma.account.findMany({ where: { workspaceId: null, trialState: { in: ["TRIAL", "CARD_ADDED"] } }, select: { id: true, name: true, email: true, trialState: true, trialCardDueAt: true, trialEndsAt: true, trialPlan: true } });
  let sent = 0;
  for (const a of live) {
    if (!a.trialCardDueAt || !a.trialEndsAt) continue;
    const to = await trialEmails(a.id, a.email);
    const plan = appUrl("/admin/plan");
    if (a.trialState === "TRIAL" && now >= a.trialEndsAt) {
      await prisma.account.updateMany({ where: { id: a.id, workspaceId: null, trialState: "TRIAL" }, data: { trialState: "ENDED" } });
      await queueEmail({ kind: "nova_trial_ended", to, subject: "Your Nova trial has ended", text: `Your 14-day trial of Nova by Genesis has ended without a card, so nothing has been charged.\n\nYour data is kept for 30 days. Choose a plan and add your card to pick up where you left off:\n${plan}`, dedupeKey: `nova-trial-ended:${a.id}` });
      sent++;
    } else if (a.trialState === "TRIAL" && now >= a.trialCardDueAt) {
      await queueEmail({ kind: "nova_card_due", to, subject: "Your Nova trial is paused: add a card to carry on (₹0 today)", text: `To keep using Nova by Genesis, choose a plan and add your card. You pay ₹0 today: your card is first charged on ${prettyDate(a.trialEndsAt)}, when your trial ends, and you can cancel before then.\n\nEverything you've set up is waiting:\n${plan}`, dedupeKey: `nova-card-due:${a.id}` });
      sent++;
    } else if (a.trialState === "TRIAL" && now.getTime() >= a.trialCardDueAt.getTime() - DAY) {
      await queueEmail({ kind: "nova_card_tomorrow", to, subject: "Tomorrow: choose your Nova plan (₹0 today)", text: `Your Nova trial asks for a plan and a card from tomorrow, ${prettyDate(a.trialCardDueAt)}. You pay ₹0 then: the card is first charged on ${prettyDate(a.trialEndsAt)}, and you can cancel before that.\n\nDo it now if you like:\n${plan}`, dedupeKey: `nova-card-tomorrow:${a.id}` });
      sent++;
    } else if (a.trialState === "CARD_ADDED" && now.getTime() >= a.trialEndsAt.getTime() - 2 * DAY && a.trialPlan) {
      await queueEmail({ kind: "nova_charge_soon", to, subject: `Your Nova plan starts on ${prettyDate(a.trialEndsAt)}`, text: `Your free trial ends on ${prettyDate(a.trialEndsAt)}, and your card will be charged ${inr(monthlyTotal(a.trialPlan))} (GST included) for Nova by Genesis ${a.trialPlan}, then monthly.\n\nNot continuing? Cancel before then from Plan & billing and you won't be charged:\n${plan}`, dedupeKey: `nova-charge-soon:${a.id}` });
      sent++;
    }
  }
  return { live: live.length, sent };
}

/** The agency admin acting on their own trial (the card, cancelling): never the demo, never Genesis's team. */
export async function trialAdmin() {
  const { getViewer } = await import("./session");
  const viewer = await getViewer();
  if (!viewer || viewer.demo || !viewer.workspaceId || viewer.workspaceRole !== "ADMIN") return null;
  const trial = await trialOf(viewer.workspaceId);
  return trial ? { viewer, trial } : null;
}

/** The plans as the card step shows them: monthly, before and with GST (components/crm/trial-plans). */
export const planCards = () =>
  CRM_PLAN_PRICES.map((p) => ({ key: p.key, perMonth: crmPerMonth(p, "monthly"), total: crmCycleTotal(p, "monthly"), blurb: p.blurb, features: p.features, popular: "popular" in p ? p.popular : undefined }));

/** Whole days until the trial ends (0 on the last day). */
export const daysLeft = (t: Trial, now = new Date()) => Math.max(0, Math.ceil((t.endsAt.getTime() - now.getTime()) / DAY));
