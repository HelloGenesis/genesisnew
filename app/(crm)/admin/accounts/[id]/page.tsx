import Link from "next/link";
import { notFound } from "next/navigation";

import { AccountFields } from "@/components/crm/account-fields";
import { ActionForm } from "@/components/crm/action-form";
import { Badge, Card, Field, PageHead, Select, StageBar, Status, Table } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import {
  ACCOUNT_KIND,
  ACCOUNT_STATUS,
  DIVISION_LABEL,
  DIVISIONS,
  ORDER_STATUS,
  PROJECT_STATUS,
  REQUEST_KIND,
  REQUEST_STATUS,
 
  SUBSCRIPTION_STATUS,
  date,
  dateTime,
  money,
  projectRef,
  requestRef,
} from "@/lib/crm/catalog";
import { appUrl } from "@/lib/crm/notify";
import { accountOptions, inDays, staffOptions } from "@/lib/crm/options";
import { can, requireStaff } from "@/lib/crm/session";
import { TEMPLATES } from "@/lib/crm/stages";

import { createProject } from "../../actions/delivery";
import { inviteMember, logActivity, removeMember, sendPaymentLink, updateAccount } from "../../actions/sales";
import { stagesOf } from "@/lib/crm/stages";

export const dynamic = "force-dynamic";

export default async function AccountPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireStaff("sales");
  const { id } = await params;
  const prisma = getPrisma();
  const account = await prisma.account.findUnique({
    where: { id },
    include: {
      parent: true,
      referredBy: true,
      brands: { orderBy: { name: "asc" } },
      referrals: { orderBy: { name: "asc" } },
      members: { include: { user: true } },
      invites: true,
      projects: { orderBy: [{ status: "asc" }, { updatedAt: "desc" }], take: 40, include: { _count: { select: { deliverables: { where: { status: "APPROVED" } } } } } },
      orders: { orderBy: { createdAt: "desc" }, take: 20 },
      subscriptions: { orderBy: { createdAt: "desc" } },
      requests: { orderBy: { createdAt: "desc" }, take: 10 },
      activities: { orderBy: { createdAt: "desc" }, take: 20, include: { actor: true } },
      commissions: { orderBy: { createdAt: "desc" }, take: 20 },
      assignments: { orderBy: { createdAt: "desc" }, take: 20, include: { project: true } },
      vendorInvoices: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!account) notFound();
  const [staff, agencies, resellers, paid] = await Promise.all([
    staffOptions(),
    accountOptions(["AGENCY"]),
    accountOptions(["AGENCY"], true),
    prisma.payment.aggregate({ where: { accountId: id, status: "CAPTURED" }, _sum: { amountPaise: true } }),
  ]);
  const vendor = account.kind === "VENDOR";

  return (
    <>
      <PageHead
        kicker={ACCOUNT_KIND[account.kind]}
        title={account.name}
        sub={[account.parent && `Managed by ${account.parent.name}`, account.referredBy && `Referred by ${account.referredBy.name}`, `Lifetime paid ${money(paid._sum.amountPaise ?? 0)}`].filter(Boolean).join(" · ")}
      >
        <Status value={ACCOUNT_STATUS[account.status]} />
        {account.isReseller && <Badge tone="warn">Reseller · {account.commissionPercent}%</Badge>}
        {!vendor && <Link href={`/admin/quotes/new?account=${account.id}`} className="crm-btn crm-btn-secondary crm-btn-sm">New quote</Link>}
        {!vendor && <Link href={`/admin/quotes/new?account=${account.id}&kind=INFLUENCER_PLAN`} className="crm-btn crm-btn-secondary crm-btn-sm">Influencer plan</Link>}
      </PageHead>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          {!vendor && (
            <Card title="Projects" action={<span className="text-[0.8125rem] text-ash">{account.projects.filter((p) => p.status === "ACTIVE").length} active</span>}>
              {account.projects.length === 0 ? (
                <p className="text-ash">No projects yet.</p>
              ) : (
                <ul className="space-y-4">
                  {account.projects.map((p) => (
                    <li key={p.id}>
                      <Link href={`/admin/projects/${p.id}`} className="block">
                        <span className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-bone">{projectRef(p.number)} · {p.name}</span>
                          <span className="flex items-center gap-2 text-[0.8125rem] text-ash">
                            {DIVISION_LABEL[p.division]} · {p.quota ? `${p._count.deliverables}/${p.quota} delivered` : ""} <Status value={PROJECT_STATUS[p.status]} />
                          </span>
                        </span>
                        <span className="mt-1.5 block"><StageBar stages={stagesOf(p)} stage={p.stage} compact /></span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {can(viewer, "delivery") && (
                <details className="mt-5 border-t border-[var(--glass-border)] pt-4">
                  <summary className="cursor-pointer text-[0.9375rem] text-bone">＋ Open a project</summary>
                  <ActionForm action={createProject} submit="Open project" className="mt-3">
                    <input type="hidden" name="accountId" value={account.id} />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Name"><input name="name" required className="crm-input" placeholder="Diwali campaign · 6 reels" /></Field>
                      <Field label="Division"><Select name="division" required options={DIVISIONS.map((d) => [d, DIVISION_LABEL[d]] as const)} /></Field>
                      <Field label="Stages" hint="Blank = picked from the division."><Select name="template" placeholder="From the division" options={TEMPLATES.map((t) => [t.key, t.label] as const)} /></Field>
                      <Field label="Pieces included"><input name="quota" type="number" min={0} className="crm-input" /></Field>
                      <Field label="Due"><input name="dueDate" type="date" defaultValue={inDays(14)} className="crm-input" /></Field>
                      <Field label="Producer"><Select name="managerId" options={staff} /></Field>
                      <Field label="Drive folder"><input name="driveUrl" type="url" className="crm-input" /></Field>
                    </div>
                    <Field label="Brief"><textarea name="brief" className="crm-input" /></Field>
                  </ActionForm>
                </details>
              )}
            </Card>
          )}

          {!vendor && (
            <Card title="Orders, plans & payment links">
              {account.subscriptions.length > 0 && (
                <ul className="mb-4 space-y-2">
                  {account.subscriptions.map((s) => (
                    <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--hover-wash)] px-3 py-2">
                      <span className="text-bone">Plan · {money(s.amountPaise)} {s.billing === "quarterly" ? "every 3 months" : "a month"}{s.currentEnd ? ` · paid to ${date(s.currentEnd)}` : ""}</span>
                      <Status value={SUBSCRIPTION_STATUS[s.status]} />
                    </li>
                  ))}
                </ul>
              )}
              {account.orders.length === 0 ? (
                <p className="text-ash">No orders yet.</p>
              ) : (
                <ul className="divide-y divide-[var(--glass-border)]">
                  {account.orders.map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-2 py-2">
                      <Link href={`/admin/billing/${o.id}`} className="text-bone hover:underline">
                        {o.reference} · {money(o.totalPaise)} · {date(o.createdAt)}
                      </Link>
                      <Status value={ORDER_STATUS[o.status]} />
                    </li>
                  ))}
                </ul>
              )}
              <details className="mt-5 border-t border-[var(--glass-border)] pt-4">
                <summary className="cursor-pointer text-[0.9375rem] text-bone">＋ Send a payment link (custom quote, Influence campaign…)</summary>
                <ActionForm action={sendPaymentLink} submit="Create & send link" className="mt-3">
                  <input type="hidden" name="accountId" value={account.id} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="For"><input name="description" required className="crm-input" placeholder="Influencer campaign: 12 creators, Diwali" /></Field>
                    <Field label="Division"><Select name="division" required options={DIVISIONS.map((d) => [d, DIVISION_LABEL[d]] as const)} /></Field>
                    <Field label="Amount before GST (₹)"><input name="amount" required inputMode="decimal" className="crm-input" /></Field>
                    <Field label="Send to"><input name="email" type="email" defaultValue={account.email ?? ""} className="crm-input" /></Field>
                  </div>
                  <label className="flex items-center gap-2 text-[0.875rem] text-ash">
                    <input type="checkbox" name="gst" defaultChecked /> Add GST at 18%
                  </label>
                </ActionForm>
              </details>
            </Card>
          )}

          {vendor && (
            <Card title="Assignments & invoices">
              {account.assignments.length === 0 ? (
                <p className="text-ash">No work assigned yet. Assign from a project.</p>
              ) : (
                <ul className="divide-y divide-[var(--glass-border)]">
                  {account.assignments.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <Link href={`/admin/projects/${a.projectId}`} className="text-bone hover:underline">
                        {a.role} · {a.project.name}
                      </Link>
                      <span className="text-[0.8125rem] text-ash">{money(a.feePaise)} · {a.status.toLowerCase()}</span>
                    </li>
                  ))}
                </ul>
              )}
              {account.vendorInvoices.length > 0 && (
                <>
                  <h3 className="mt-5 text-[0.9375rem] text-bone">Invoices</h3>
                  <ul className="divide-y divide-[var(--glass-border)]">
                    {account.vendorInvoices.map((inv) => (
                      <li key={inv.id} className="flex justify-between py-2 text-[0.9375rem]">
                        <span>{inv.number} · {money(inv.amountPaise + inv.taxPaise)}</span>
                        <Link href="/admin/payouts" className="text-ash">{inv.status.toLowerCase()}</Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {account.payoutNote && can(viewer, "finance") && <p className="mt-4 text-[0.875rem] text-ash">Payout details: {account.payoutNote}</p>}
            </Card>
          )}

          {account.kind === "AGENCY" && (
            <Card title={`Brands ${account.name} manages`}>
              {account.brands.length === 0 ? (
                <p className="text-ash">None yet. Add a brand account and set &quot;Managed by agency&quot; to {account.name}; the agency&apos;s team sees it in their portal.</p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {account.brands.map((b) => (
                    <li key={b.id}><Link href={`/admin/accounts/${b.id}`} className="crm-btn crm-btn-secondary crm-btn-sm">{b.name}</Link></li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          {account.isReseller && (
            <Card title="Referrals & commission">
              {account.referralCode && (
                <p className="mb-3 text-[0.9375rem] text-ash">
                  Referral link: <span className="select-all font-mono text-bone">{appUrl(`/p/${account.referralCode}`)}</span>
                </p>
              )}
              <p className="text-ash">
                {account.referrals.length} referred account{account.referrals.length === 1 ? "" : "s"}: {account.referrals.map((r) => r.name).join(", ") || "none yet"}.
              </p>
              {account.commissions.length > 0 && (
                <div className="mt-3">
                  <Table head={["Date", "On", "Commission", "Status"]}>
                    {account.commissions.map((c) => (
                      <tr key={c.id}>
                        <td>{date(c.createdAt)}</td>
                        <td>{money(c.basePaise)} × {c.percent}%</td>
                        <td className="tabular-nums">{money(c.amountPaise)}</td>
                        <td>{c.status.toLowerCase()}</td>
                      </tr>
                    ))}
                  </Table>
                </div>
              )}
            </Card>
          )}

          {!vendor && account.requests.length > 0 && (
            <Card title="Recent requests">
              <ul className="divide-y divide-[var(--glass-border)]">
                {account.requests.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 py-2">
                    <Link href={`/admin/requests/${r.id}`} className="truncate text-bone hover:underline">
                      {requestRef(r.number)} · {REQUEST_KIND[r.kind]} · {r.title}
                    </Link>
                    <Status value={REQUEST_STATUS[r.status]} />
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card title="Details">
            <ActionForm action={updateAccount} submit="Save">
              <input type="hidden" name="id" value={account.id} />
              <AccountFields account={account} staff={staff} agencies={agencies.filter(([aid]) => aid !== account.id)} resellers={resellers.filter(([aid]) => aid !== account.id)} />
            </ActionForm>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Portal access">
            <ul className="mb-4 space-y-2">
              {account.members.map((m) => (
                <li key={m.userId} className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-bone">{m.user.name ?? m.user.email ?? m.user.phone} <span className="text-[0.75rem] text-faint">· {m.role.toLowerCase()}</span></span>
                  <form action={removeMember}>
                    <input type="hidden" name="accountId" value={account.id} />
                    <input type="hidden" name="userId" value={m.userId} />
                    <button className="text-[0.75rem] text-[#dc2626] hover:underline">Remove</button>
                  </form>
                </li>
              ))}
              {account.invites.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-ash">{i.email} <span className="text-[0.75rem] text-faint">· invited, not signed in yet</span></span>
                  <form action={removeMember}>
                    <input type="hidden" name="inviteId" value={i.id} />
                    <button className="text-[0.75rem] text-[#dc2626] hover:underline">Revoke</button>
                  </form>
                </li>
              ))}
              {account.members.length + account.invites.length === 0 && <li className="text-ash">Nobody has portal access yet.</li>}
            </ul>
            <ActionForm action={inviteMember} submit="Give access" reset>
              <input type="hidden" name="accountId" value={account.id} />
              <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
                <Field label="Email"><input name="email" type="email" required className="crm-input" /></Field>
                <Field label="Role"><Select name="role" required defaultValue="MEMBER" options={[["OWNER", "Owner"], ["MEMBER", "Member"], ["BILLING", "Billing"]]} /></Field>
              </div>
              <label className="flex items-center gap-2 text-[0.875rem] text-ash">
                <input type="checkbox" name="notify" defaultChecked /> Email them
              </label>
            </ActionForm>
          </Card>

          <Card title="Timeline">
            <ActionForm action={logActivity} submit="Add note" reset>
              <input type="hidden" name="accountId" value={account.id} />
              <textarea name="body" required className="crm-input !min-h-16" placeholder="Call notes, decisions, context…" />
            </ActionForm>
            <ol className="mt-4 space-y-3">
              {account.activities.map((a) => (
                <li key={a.id} className="border-l-2 border-[#ffc516]/60 pl-3">
                  <p className="text-[0.75rem] text-faint">{a.actor?.name ?? a.actor?.email ?? "Genesis"} · {dateTime(a.createdAt)}</p>
                  <p className="whitespace-pre-wrap text-bone">{a.body}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </>
  );
}
