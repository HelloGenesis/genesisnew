import Link from "next/link";
import { redirect } from "next/navigation";

import { saveName } from "@/app/(crm)/account/actions";
import { switchAccount } from "@/app/(crm)/portal/actions";
import { AccountCart } from "@/components/crm/account-cart";
import { SignOut } from "@/components/crm/sign-out";
import { CartProvider } from "@/components/genesis/cart";
import { getViewer, portalAccounts } from "@/lib/crm/session";
import { workspaceProfile } from "@/lib/crm/workspace";
import { getPrisma } from "@/lib/db";
import { CAMPAIGN_CREATOR_STATUS } from "@/lib/crm/catalog";
import { inr } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata = { title: "My account" };

/**
 * MY ACCOUNT — ONE LOGIN, EVERYTHING (Genesis, 14 Oct 2026: "as a normal user
 * I should see the cart… the same login is used for admin and the Genesis
 * CRM… if a user has multiple products or purchases they should see them from
 * this one login"). Whoever signs in lands here (staff go straight to the
 * CRM, and have it here too): their cart, every order, subscription, quote
 * and invoice made out to their verified email or their accounts, and a door
 * into each workspace they belong to.
 */

const money = (paise: number) => inr(Math.round(paise / 100));
const day = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const ORDER_STATUS: Record<string, string> = { PENDING: "Awaiting payment", PAID: "Paid", REFUNDED: "Refunded", FAILED: "Payment failed", CANCELLED: "Cancelled" };
const SUB_STATUS: Record<string, string> = { CREATED: "Setting up", AUTHENTICATED: "Starting", ACTIVE: "Active", PENDING: "Payment due", HALTED: "Paused: payment failed", PAUSED: "Paused", CANCELLED: "Cancelled", COMPLETED: "Completed" };

export default async function AccountPage() {
  const viewer = await getViewer();
  const agencyName = viewer?.workspaceId ? (await workspaceProfile(viewer.workspaceId))?.name ?? null : null;
  if (!viewer) redirect("/login?next=/account");
  const prisma = getPrisma();
  /* Purchases are matched by email only when this person proved they own it. */
  const verified = (await prisma.user.findUnique({ where: { id: viewer.id }, select: { emailVerified: true } }))?.emailVerified ? viewer.email : null;
  const accounts = await portalAccounts(viewer);
  const accountIds = viewer.memberships.map((m) => m.accountId);
  const byEmail = (field: string) => (verified ? [{ [field]: { equals: verified, mode: "insensitive" as const } }] : []);

  /* An influencer with portal access (Staff & roles): the creator rows with this verified email, and only their own campaigns. */
  const creators = verified
    ? await prisma.creator.findMany({
        where: { email: { equals: verified, mode: "insensitive" } },
        select: { id: true, name: true, handle: true, followers: true, reelRatePaise: true, storyRatePaise: true, dlRatePaise: true, campaigns: { orderBy: { createdAt: "desc" }, take: 50, select: { id: true, status: true, feePaise: true, deliverables: true, postUrl: true, project: { select: { name: true } } } } },
      })
    : [];
  const [orders, quotes, invoices] = await Promise.all([
    prisma.order.findMany({
      where: { OR: [...byEmail("contactEmail"), ...(accountIds.length ? [{ accountId: { in: accountIds } }] : [])], status: { in: ["PAID", "PENDING", "REFUNDED"] } },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { lines: { select: { name: true, qty: true, kind: true } }, subscription: { select: { status: true, nextChargeAt: true, amountPaise: true } } },
    }),
    verified
      ? prisma.quote.findMany({ where: { contactEmail: { equals: verified, mode: "insensitive" }, status: { in: ["SENT", "VIEWED", "ACCEPTED", "PAID"] } }, orderBy: { updatedAt: "desc" }, take: 30, select: { token: true, number: true, title: true, status: true, totalPaise: true, sentAt: true, createdAt: true } })
      : [],
    prisma.invoice.findMany({
      where: { OR: [...byEmail("billToEmail"), ...(accountIds.length ? [{ accountId: { in: accountIds } }] : [])], status: { in: ["SENT", "PAID"] } },
      orderBy: { issueDate: "desc" },
      take: 30,
      select: { token: true, number: true, status: true, totalPaise: true, issueDate: true },
    }),
  ]);
  /* Orders by the same person show once even when they match both ways. */
  const seen = new Set<string>();
  const purchases = orders.filter((o) => !seen.has(o.id) && seen.add(o.id));
  /* The name to greet: theirs, or the one on their last order until they save it. */
  const orderName = purchases[0]?.contactName.replace(/\s*\(.*\)$/, "") ?? "";
  const first = (viewer.name ?? "").split(" ")[0];
  const subscriptions = purchases.filter((o) => o.subscription && o.subscription.status !== "CANCELLED" && o.subscription.status !== "COMPLETED");

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="micro-label">My account</p>
          <h1 className="mt-2 text-balance text-[2rem] font-normal leading-tight text-bone sm:text-[2.5rem]">{first ? `Hi ${first}, welcome to Genesis.` : "Hi, welcome to Genesis."}</h1>
          <p className="mt-2 text-ash">Your cart, purchases and workspaces, in one place.</p>
          <p className="mt-1 break-all text-[0.875rem] text-faint">Signed in as {viewer.email ?? viewer.phone}</p>
        </div>
        <SignOut className="crm-btn crm-btn-secondary crm-btn-sm" />
      </header>

      {!viewer.name && (
        <form action={saveName} className="crm-card crm-pad flex flex-wrap items-end gap-3">
          <label className="min-w-[14rem] flex-1">
            <span className="crm-label">What should we call you?</span>
            <input name="name" required maxLength={80} autoComplete="name" defaultValue={orderName} className="crm-input" placeholder="Your name" />
          </label>
          <button className="crm-btn crm-btn-primary">Save</button>
        </form>
      )}

      {(viewer.roles.length > 0 || accounts.length > 0) && (
        <section aria-labelledby="spaces" className="crm-card crm-pad space-y-4">
          <h2 id="spaces" className="font-sans font-semibold text-[1.375rem] text-bone">Your workspaces</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {viewer.roles.length > 0 && (
              <Link href="/admin" className="rounded-2xl border border-[var(--glass-border)] p-4 transition-colors hover:bg-[var(--hover-wash)]">
                {/* An agency's own CRM goes by the agency's name (lib/crm/workspace). */}
                <span className="block text-bone">{agencyName ? `${agencyName} CRM` : "Genesis CRM"}</span>
                <span className="text-[0.875rem] text-ash">Leads, quotes, plans, invoices · {viewer.workspaceId ? (viewer.workspaceRole === "ADMIN" ? "admin" : "member") : viewer.roles.map((r) => r.toLowerCase()).join(", ")}</span>
              </Link>
            )}
            {accounts.map((a) => (
              <form key={a.id} action={switchAccount}>
                <input type="hidden" name="accountId" value={a.id} />
                <button className="h-full w-full rounded-2xl border border-[var(--glass-border)] p-4 text-left transition-colors hover:bg-[var(--hover-wash)]">
                  <span className="block text-bone">{a.name}</span>
                  <span className="text-[0.875rem] text-ash">{a.kind === "AGENCY" ? "Agency portal" : a.kind === "VENDOR" ? "Vendor portal" : "Client portal"}: projects, approvals, requests, invoices</span>
                </button>
              </form>
            ))}
          </div>
        </section>
      )}

      {creators.map((c) => (
        <section key={c.id} aria-labelledby={`creator-${c.id}`} className="crm-card crm-pad space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id={`creator-${c.id}`} className="font-sans font-semibold text-[1.375rem] text-bone">Your creator profile · @{c.handle}</h2>
            <p className="text-[0.875rem] text-ash">
              Reel {(c.reelRatePaise ? money(c.reelRatePaise) : "—")} · Story {(c.storyRatePaise ? money(c.storyRatePaise) : "—")} · DL {(c.dlRatePaise ? money(c.dlRatePaise) : "—")}
            </p>
          </div>
          {c.campaigns.length === 0 ? (
            <p className="text-ash">No campaigns yet. When Genesis puts you on one, it shows here.</p>
          ) : (
            <ul className="divide-y divide-[var(--glass-border)]">
              {c.campaigns.map((k) => (
                <li key={k.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <span className="min-w-0">
                    <span className="block text-bone">{k.project.name}</span>
                    <span className="text-[0.8125rem] text-faint">{k.deliverables ?? "Deliverables to be confirmed"}{k.postUrl ? " · " : ""}{k.postUrl && <a href={k.postUrl} target="_blank" rel="noreferrer" className="crm-link">Your post</a>}</span>
                  </span>
                  <span className="text-[0.875rem] text-ash">{k.feePaise ? <span className="tabular-nums text-bone">{money(k.feePaise)} · </span> : null}{CAMPAIGN_CREATOR_STATUS[k.status].label}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <section aria-labelledby="cart" className="crm-card crm-pad space-y-4">
        <h2 id="cart" className="font-sans font-semibold text-[1.375rem] text-bone">Your cart</h2>
        <CartProvider>
          <AccountCart />
        </CartProvider>
      </section>

      {subscriptions.length > 0 && (
        <section aria-labelledby="subs" className="crm-card crm-pad space-y-3">
          <h2 id="subs" className="font-sans font-semibold text-[1.375rem] text-bone">Your subscriptions</h2>
          <ul className="divide-y divide-[var(--glass-border)]">
            {subscriptions.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span className="min-w-0 text-bone">{o.lines.filter((l) => l.kind === "MEMBERSHIP").map((l) => l.name).join(", ") || o.reference}</span>
                <span className="text-[0.875rem] text-ash">
                  {SUB_STATUS[o.subscription!.status]} · {money(o.subscription!.amountPaise)} {o.billing === "monthly" ? "a month" : "a quarter"}
                  {o.subscription!.nextChargeAt ? ` · next charge ${day(o.subscription!.nextChargeAt)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="orders" className="crm-card crm-pad space-y-3">
        <h2 id="orders" className="font-sans font-semibold text-[1.375rem] text-bone">Your purchases</h2>
        {purchases.length === 0 ? (
          <p className="text-ash">
            No purchases yet{verified ? "" : " (we match purchases to your email once it's verified)"}. Bought with a different email? Sign out and sign in with that one.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--glass-border)]">
            {purchases.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span className="min-w-0">
                  <span className="block text-bone">{o.lines.map((l) => `${l.name}${l.qty > 1 ? ` × ${l.qty}` : ""}`).join(", ") || "Order"}</span>
                  <span className="text-[0.8125rem] text-faint">{o.reference} · {day(o.createdAt)}</span>
                </span>
                <span className="text-[0.875rem]">
                  <span className="tabular-nums text-bone">{money(o.totalPaise)}</span> <span className={o.status === "PAID" ? "text-[#16a34a]" : "text-ash"}>· {ORDER_STATUS[o.status]}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {quotes.length > 0 && (
        <section aria-labelledby="quotes" className="crm-card crm-pad space-y-3">
          <h2 id="quotes" className="font-sans font-semibold text-[1.375rem] text-bone">Quotes & proposals for you</h2>
          <ul className="divide-y divide-[var(--glass-border)]">
            {quotes.map((q) => (
              <li key={q.token} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <Link href={`/quote/${q.token}`} className="min-w-0 text-bone underline-offset-2 hover:underline">#{q.number} · {q.title}</Link>
                <span className="text-[0.875rem] text-ash"><span className="tabular-nums text-bone">{money(q.totalPaise)}</span> · {day(q.sentAt ?? q.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {invoices.length > 0 && (
        <section aria-labelledby="invoices" className="crm-card crm-pad space-y-3">
          <h2 id="invoices" className="font-sans font-semibold text-[1.375rem] text-bone">Invoices</h2>
          <ul className="divide-y divide-[var(--glass-border)]">
            {invoices.map((i) => (
              <li key={i.token} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <Link href={`/invoice/${i.token}`} className="min-w-0 text-bone underline-offset-2 hover:underline">{i.number}</Link>
                <span className="text-[0.875rem] text-ash"><span className="tabular-nums text-bone">{money(i.totalPaise)}</span> · {day(i.issueDate)} · <span className={i.status === "PAID" ? "text-[#16a34a]" : ""}>{i.status === "PAID" ? "Paid" : "Due"}</span></span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="crm-card crm-pad flex flex-wrap items-center justify-between gap-3">
        <p className="text-ash">Looking for something else, or want to add a teammate?</p>
        <div className="flex flex-wrap gap-2">
          <Link href="/pricing" className="crm-btn crm-btn-secondary crm-btn-sm">Plans & pricing</Link>
          <a href="mailto:hello@genesismedia.co" className="crm-btn crm-btn-secondary crm-btn-sm">Email the team</a>
        </div>
      </section>
    </main>
  );
}
