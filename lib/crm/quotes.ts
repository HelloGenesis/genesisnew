import "server-only";

import { randomBytes } from "node:crypto";

import { getPrisma } from "@/lib/db";
import { notes, razorpay, razorpayKeys } from "@/lib/razorpay";

import { date, money } from "./catalog";
import { appUrl, queueEmail, queueStaffEmail } from "./notify";
import { openProject, winLead } from "./projects";
import { quoteRef, quoteTotals } from "./quote-templates";
import { queueSheet } from "./sheets";

/**
 * QUOTES, FROM THE DASHBOARD TO A PROJECT.
 *
 *   Draft → Send (a Razorpay payment link for the total, a pending order, and
 *   the quotation email with its link) → the client opens /quote/<token>,
 *   accepts, and pays → the webhook fulfils the order (lib/crm/orders): one
 *   project for the quote, the lead won.
 *
 * An influencer plan is the same document with its creator list; approving
 * it opens the campaign with those creators shortlisted, paid or not.
 */

export const newToken = () => randomBytes(18).toString("base64url");

export async function totalsOf(quoteId: string) {
  const q = await getPrisma().quote.findUniqueOrThrow({ where: { id: quoteId }, include: { lines: true, creators: true } });
  return { quote: q, ...quoteTotals({ lines: q.lines, creatorFees: q.creators.map((c) => c.feePaise), discountPaise: q.discountPaise, addGst: q.addGst, gstPercent: q.gstPercent }) };
}

/** Recomputes and stores the totals (after any edit). */
export async function refreshTotals(quoteId: string) {
  const t = await totalsOf(quoteId);
  await getPrisma().quote.update({ where: { id: quoteId }, data: { subtotalPaise: t.subtotal, taxPaise: t.tax, totalPaise: t.total } });
  return t;
}

/**
 * Sends a quote: a fresh payment link when the total is due now (the old one
 * cancelled, so a client can never pay a superseded figure), a pending order
 * the webhook can fulfil, the email, and the lead moved to Proposal sent.
 */
export async function sendQuote(quoteId: string, actorId: string, message: string | null, withPayment: boolean, view: "both" | "proposal" | "pricing" = "both") {
  const prisma = getPrisma();
  const t = await refreshTotals(quoteId);
  const q = t.quote;
  const ref = quoteRef(q.number);
  let paymentUrl: string | null = null;
  let linkId: string | null = null;

  if (withPayment && t.total > 0 && razorpayKeys()) {
    if (q.razorpayLinkId) await razorpay(`payment_links/${q.razorpayLinkId}/cancel`, {}).catch(() => undefined);
    const reference = `GMQ${q.number}-${randomBytes(3).toString("hex")}`.toUpperCase();
    const link = await razorpay<{ id: string; short_url: string }>("payment_links", {
      amount: t.total,
      currency: "INR",
      reference_id: reference,
      description: `Genesis Media quote ${ref}: ${q.title}`.slice(0, 250),
      customer: { name: q.contactName, email: q.contactEmail, ...(q.contactPhone ? { contact: q.contactPhone.replace(/[\s-]/g, "") } : {}) },
      notify: { sms: false, email: false },
      reminder_enable: true,
      expire_by: Math.floor(Math.max(q.expiresAt.getTime(), Date.now() + 86400_000) / 1000) + 7 * 86400,
      notes: notes({ quote: ref, items: q.lines.map((l) => `${l.title} x${l.qty}`).join("; "), company: q.company ?? undefined }),
      callback_url: appUrl(`/quote/${q.token}?paid=1`),
      callback_method: "get",
    });
    linkId = link.id;
    paymentUrl = link.short_url;

    /* The order the webhook fulfils. One per quote: a re-send replaces the unpaid one. */
    await prisma.order.deleteMany({ where: { quoteId: q.id, status: "PENDING" } });
    const order = await prisma.order.create({
      data: {
        reference,
        channel: "MANUAL",
        quoteId: q.id,
        accountId: q.accountId,
        subtotalPaise: t.subtotal - t.discount,
        discountPaise: t.discount,
        taxPaise: t.tax,
        taxLabel: q.addGst ? `GST ${q.gstPercent}%` : "GST included / not applicable",
        totalPaise: t.total,
        oneTimePaise: t.total,
        contactName: q.contactName,
        contactEmail: q.contactEmail,
        contactPhone: q.contactPhone,
        company: q.company,
        razorpayLinkId: link.id,
        createdById: actorId,
        lines: {
          create: [
            ...q.lines.map((l) => ({ productId: l.productId ?? `quote.${l.kind}`, name: l.title, group: l.subtitle ?? "Quote", division: l.division ?? q.division ?? "STUDIOS", kind: "ONE_TIME" as const, qty: l.qty, chargePaise: l.qty * l.unitPaise })),
            ...(t.creators > 0 ? [{ productId: "quote.creators", name: `Creator fees (${q.creators.length})`, group: "Influencer plan", division: "INFLUENCE" as const, kind: "ONE_TIME" as const, qty: 1, chargePaise: t.creators }] : []),
          ],
        },
      },
    });
    await queueSheet("orders", order.id);
  }

  await prisma.quote.update({
    where: { id: q.id },
    data: { status: "SENT", sentAt: new Date(), ...(linkId ? { razorpayLinkId: linkId, paymentUrl } : withPayment ? {} : { razorpayLinkId: null, paymentUrl: null }) },
  });
  /* The lead it answers, even when the quote started from a brief or a client: theirs by email (Genesis, 12 Oct 2026). */
  const leadId = q.leadId ?? (await prisma.lead.findFirst({ where: { email: q.contactEmail, status: { notIn: ["WON", "LOST"] } }, orderBy: { createdAt: "desc" }, select: { id: true } }))?.id ?? null;
  if (leadId && !q.leadId) await prisma.quote.update({ where: { id: q.id }, data: { leadId } });
  if (leadId) {
    await prisma.lead.updateMany({ where: { id: leadId, status: { in: ["NEW", "CONTACTED", "QUALIFIED", "CALL_BOOKED"] } }, data: { status: "PROPOSAL_SENT", valuePaise: t.total } });
    await prisma.activity.create({ data: { leadId, kind: "EMAIL", actorId, body: `${view === "proposal" ? "Proposal" : q.kind === "INFLUENCER_PLAN" ? "Influencer plan" : "Quote"} ${ref} sent${view === "proposal" ? "" : `: ${money(t.total)}`}.` } });
    await queueSheet("leads", leadId);
  }

  const plan = q.kind === "INFLUENCER_PLAN";
  const pricing = view !== "proposal";
  const link = appUrl(`/quote/${q.token}${view === "both" ? "" : `?view=${view}`}`);
  const lines = pricing ? q.lines.map((l) => `• ${l.title}${l.qty > 1 ? ` × ${l.qty}` : ""}: ${money(l.qty * l.unitPaise)}`) : [];
  if (pricing && plan && q.creators.length) lines.push(`• ${q.creators.length} creators: ${money(t.creators)}`);
  const half = Math.round(t.tax / 2);
  await queueEmail({
    kind: "quote_sent",
    to: [q.contactEmail],
    subject: `${view === "proposal" ? "Proposal" : plan ? "Influencer plan" : "Quotation"} ${ref} · ${q.title}`,
    text: [
      `Hi ${q.contactName.split(" ")[0]},`,
      "",
      message ?? (view === "proposal" ? "Thank you for the brief. Here's our proposal: the platforms, the problems we'll solve, the objectives and the creators." : plan ? "Here's the influencer plan we've put together for you, with the creator list." : "Thank you for the brief. Here's our quotation."),
      "",
      `${q.title}`,
      ...lines,
      pricing && t.discount ? `Discount: −${money(t.discount)}` : "",
      pricing && q.addGst ? (q.igst ? `IGST ${q.gstPercent}%: ${money(t.tax)}` : `CGST ${q.gstPercent / 2}%: ${money(half)}\nSGST ${q.gstPercent / 2}%: ${money(t.tax - half)}`) : "",
      pricing ? `Total: ${money(t.total)}` : "",
      "",
      `View the full ${view === "proposal" ? "proposal" : plan ? "plan" : "quotation"}${view === "pricing" ? "" : " (scope, notes and terms)"}${plan ? " and approve it" : ""}:`,
      link,
      paymentUrl ? `\nPay securely (card, UPI, net banking): ${paymentUrl}` : "",
      "",
      `Valid until ${date(q.expiresAt)}. Reply to this email with any questions.`,
    ]
      .filter((l, i, all) => l !== "" || all[i - 1] !== "")
      .join("\n"),
  });
  return { paymentUrl };
}

/** The client approves on /quote/<token>: the lead is won and the project opens (payment, if due, follows). */
export async function acceptQuote(token: string, acceptedBy: string) {
  const prisma = getPrisma();
  const q = await prisma.quote.findUnique({ where: { token }, include: { projects: { select: { id: true } } } });
  if (!q || ["ACCEPTED", "PAID", "DECLINED"].includes(q.status) || q.expiresAt < new Date()) return null;
  await prisma.quote.update({ where: { id: q.id }, data: { status: "ACCEPTED", acceptedAt: new Date(), acceptedBy } });
  const projectId = q.projects[0]?.id ?? (await openFor(q.id));
  await queueStaffEmail({
    kind: "quote_accepted",
    scope: "all",
    subject: `Accepted: ${q.kind === "INFLUENCER_PLAN" ? "influencer plan" : "quote"} ${quoteRef(q.number)} · ${q.company ?? q.contactName}`,
    text: `${acceptedBy} accepted "${q.title}" (${money(q.totalPaise)}).${q.paymentUrl ? " Payment link is with the client." : ""}\n\n${appUrl(`/admin/projects/${projectId}`)}`,
    dedupeKey: `quote-accepted:${q.id}`,
  });
  return { projectId, paymentUrl: q.paymentUrl };
}

/** The quote's account and project: the lead won (or an account made from the quote's contact), creators shortlisted. */
export async function openFor(quoteId: string): Promise<string> {
  const prisma = getPrisma();
  const q = await prisma.quote.findUniqueOrThrow({ where: { id: quoteId }, include: { creators: true, lines: true } });
  const existing = await prisma.project.findFirst({ where: { quoteId }, select: { id: true } });
  if (existing) return existing.id;

  let accountId = q.accountId;
  /* The lead this quote answers: its own, or the open lead with the same email. */
  const leadId = q.leadId ?? (await prisma.lead.findFirst({ where: { email: q.contactEmail, status: { notIn: ["WON", "LOST"] } }, select: { id: true } }))?.id ?? null;
  if (leadId && !q.leadId) await prisma.quote.update({ where: { id: quoteId }, data: { leadId } });
  if (leadId) {
    const won = await winLead(leadId, q.createdById, `Won on quote ${quoteRef(q.number)}.`);
    accountId = accountId ?? won?.accountId ?? null;
    /* winLead opens a generic project only when the lead had none; take it over for this quote instead of opening a second. */
    if (won?.projectId) {
      await prisma.project.update({ where: { id: won.projectId }, data: { quoteId, name: q.title } });
      await attachCreators(won.projectId, q.creators);
      return won.projectId;
    }
  }
  if (!accountId) {
    accountId = (await prisma.account.create({ data: { name: q.company ?? q.contactName, email: q.contactEmail, phone: q.contactPhone, status: "ACTIVE" } })).id;
    await prisma.accountInvite.upsert({ where: { accountId_email: { accountId, email: q.contactEmail } }, create: { accountId, email: q.contactEmail, role: "OWNER" }, update: {} });
    await prisma.quote.update({ where: { id: quoteId }, data: { accountId } });
  }
  const project = await openProject({
    accountId,
    name: q.title,
    division: q.division ?? q.lines[0]?.division ?? "INFLUENCE",
    productName: q.kind === "INFLUENCER_PLAN" ? "Influencer campaign" : `${q.title} ${q.lines.map((l) => l.title).join(" ")}`,
    quoteId,
    leadId,
    managerId: q.createdById,
    brief: q.notes,
    why: `Opened from quote ${quoteRef(q.number)}.`,
  });
  await attachCreators(project.id, q.creators);
  return project.id;
}

async function attachCreators(projectId: string, creators: { creatorId: string | null; feePaise: number | null; deliverables: string | null }[]) {
  for (const c of creators) {
    if (!c.creatorId) continue;
    await getPrisma().campaignCreator.upsert({
      where: { projectId_creatorId: { projectId, creatorId: c.creatorId } },
      create: { projectId, creatorId: c.creatorId, status: "SHORTLISTED", feePaise: c.feePaise, deliverables: c.deliverables, notes: "Approved by the client on the influencer plan." },
      update: {},
    });
  }
}
