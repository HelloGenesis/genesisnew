import { redirect } from "next/navigation";

import { Card, Empty, PageHead, Stats, Table } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import { date, money } from "@/lib/crm/catalog";
import { appUrl } from "@/lib/crm/notify";
import { requirePortal } from "@/lib/crm/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Referrals & commission" };

/** A reseller's link, the clients it brought, and what Genesis owes and has paid. */
export default async function PortalReferrals() {
  const { account } = await requirePortal();
  if (!account.isReseller) redirect("/portal");
  const prisma = getPrisma();
  const [partner, referrals, commissions] = await Promise.all([
    prisma.account.findUniqueOrThrow({ where: { id: account.id }, select: { referralCode: true, commissionPercent: true } }),
    prisma.account.findMany({ where: { referredById: account.id }, orderBy: { createdAt: "desc" }, select: { id: true, name: true, status: true, createdAt: true } }),
    prisma.commission.findMany({ where: { partnerId: account.id }, orderBy: { createdAt: "desc" } }),
  ]);
  const owed = commissions.filter((c) => c.status === "DUE" || c.status === "APPROVED").reduce((s, c) => s + c.amountPaise, 0);
  const paid = commissions.filter((c) => c.status === "PAID").reduce((s, c) => s + c.amountPaise, 0);
  return (
    <>
      <PageHead kicker={account.name} title="Referrals & commission" sub={`You earn ${partner.commissionPercent}% of what your referred clients pay, before GST, including every renewal.`} />
      <Card title="Your referral link">
        {partner.referralCode ? (
          <>
            <p className="select-all break-all rounded-xl bg-[var(--hover-wash)] px-4 py-3 font-mono text-bone">{appUrl(`/p/${partner.referralCode}`)}</p>
            <p className="mt-2 text-[0.875rem] text-ash">Anyone who opens it and checks out on genesismedia.co within 60 days is credited to you. For a deal you&apos;re running yourself, add the brand under Brands and send its brief.</p>
          </>
        ) : (
          <p className="text-ash">Your link is being set up. Ask your Genesis contact.</p>
        )}
      </Card>
      <Stats items={[{ label: "Referred clients", value: referrals.length }, { label: "Commission owed", value: money(owed) }, { label: "Commission paid", value: money(paid) }]} />
      <section className="space-y-3">
        <h2 className="text-[1.125rem] text-bone">Commission</h2>
        {commissions.length === 0 ? <Empty>No commission yet. It appears when a referred client pays.</Empty> : (
          <Table head={["Date", "On", "Commission", "Status"]}>
            {commissions.map((c) => (
              <tr key={c.id}><td>{date(c.createdAt)}</td><td>{money(c.basePaise)} × {c.percent}%</td><td className="tabular-nums">{money(c.amountPaise)}</td><td>{c.status === "PAID" ? `Paid ${date(c.paidAt)}` : c.status.toLowerCase()}</td></tr>
            ))}
          </Table>
        )}
      </section>
      {referrals.length > 0 && (
        <Card title="Clients you referred">
          <ul className="divide-y divide-[var(--glass-border)]">{referrals.map((r) => <li key={r.id} className="flex justify-between py-2"><span className="text-bone">{r.name}</span><span className="text-[0.8125rem] text-ash">{r.status.toLowerCase()} · since {date(r.createdAt)}</span></li>)}</ul>
        </Card>
      )}
    </>
  );
}
