import "server-only";

import { getPrisma } from "@/lib/db";
import { razorpayKeys } from "@/lib/razorpay";

/**
 * PAST RAZORPAY PAYMENTS AND INVOICES (Genesis, 12 Oct 2026: "integrate our
 * current data … invoices"). Everything Razorpay has taken since a date comes
 * into Billing, matched to the client by email, with Razorpay's invoice
 * attached where there is one. New payments already arrive by webhook; this
 * fills in the history. Safe to run again: a payment is only ever one row.
 */

async function get<T>(path: string): Promise<T> {
  const keys = razorpayKeys();
  if (!keys) throw new Error("Razorpay keys are not set");
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
    headers: { Authorization: `Basic ${Buffer.from(`${keys.id}:${keys.secret}`).toString("base64")}` },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Razorpay ${response.status}: ${(await response.text()).slice(0, 200)}`);
  return (await response.json()) as T;
}

type RzpPayment = { id: string; amount: number; status: string; method?: string; email?: string; contact?: string; invoice_id?: string | null; order_id?: string | null; created_at: number; amount_refunded?: number };
type RzpInvoice = { id: string; payment_id?: string | null; short_url?: string; status: string };

export async function importRazorpayHistory(sinceDays = 365) {
  const prisma = getPrisma();
  const from = Math.floor(Date.now() / 1000) - sinceDays * 86400;
  let added = 0;
  let matched = 0;
  const invoices = new Map<string, RzpInvoice>();
  for (let skip = 0; skip < 2000; skip += 100) {
    const page = await get<{ items: RzpInvoice[] }>(`invoices?count=100&skip=${skip}&from=${from}`).catch(() => ({ items: [] as RzpInvoice[] }));
    for (const inv of page.items) if (inv.payment_id) invoices.set(inv.payment_id, inv);
    if (page.items.length < 100) break;
  }
  for (let skip = 0; skip < 5000; skip += 100) {
    const page = await get<{ items: RzpPayment[] }>(`payments?count=100&skip=${skip}&from=${from}`);
    for (const p of page.items) {
      if (p.status !== "captured" && p.status !== "refunded") continue;
      if (await prisma.payment.findUnique({ where: { razorpayId: p.id }, select: { id: true } })) continue;
      const mail = p.email?.toLowerCase();
      const account = mail
        ? ((await prisma.account.findFirst({ where: { email: mail }, select: { id: true } })) ??
          (await prisma.accountMember.findFirst({ where: { user: { email: mail } }, select: { accountId: true } }).then((m) => (m ? { id: m.accountId } : null))))
        : null;
      const order = await prisma.order.findFirst({ where: { razorpayPaymentId: p.id }, select: { id: true, accountId: true } });
      const invoice = invoices.get(p.id);
      await prisma.payment.create({
        data: {
          razorpayId: p.id,
          status: p.status === "refunded" || (p.amount_refunded ?? 0) >= p.amount ? "REFUNDED" : "CAPTURED",
          amountPaise: p.amount,
          method: p.method ?? null,
          orderId: order?.id ?? null,
          accountId: order?.accountId ?? account?.id ?? null,
          invoiceId: invoice?.id ?? p.invoice_id ?? null,
          invoiceUrl: invoice?.short_url ?? null,
          paidAt: new Date(p.created_at * 1000),
        },
      });
      added += 1;
      if (order?.accountId ?? account?.id) matched += 1;
    }
    if (page.items.length < 100) break;
  }
  return { added, matched };
}
