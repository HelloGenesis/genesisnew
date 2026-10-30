import { Check } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ProBadge } from "@/components/crm/pro-badge";
import { Card, PageHead, Stats, Table } from "@/components/crm/ui";
import { money, todayIst } from "@/lib/crm/catalog";
import { novaAccess } from "@/lib/crm/nova-pro";
import { requireStaff } from "@/lib/crm/session";
import { getPrisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "GST" };

const monthName = (ym: string) => new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${ym}-01T00:00:00Z`));
const due = (ym: string, day: number) => {
  const [y, m] = ym.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y!, m!, day)));
};

/**
 * AN AGENCY'S GST (lib/crm/nova-pro: a Pro feature, locked in the free
 * trial). Worked out from the agency's own GST invoices only: each month's
 * taxable value and the CGST, SGST and IGST on it, with the GSTR-1 and
 * GSTR-3B due dates. Genesis's own GST page is /admin/expenses/gst.
 */
export default async function AgencyGstPage() {
  const viewer = await requireStaff();
  if (!viewer.workspaceId) redirect("/admin/expenses/gst");
  const access = await novaAccess(viewer.workspaceId);

  if (!access.pro)
    return (
      <>
        <PageHead kicker="Money" title="GST" sub="Your GST month by month, from your own invoices." />
        <Card>
          <div className="flex flex-col items-start gap-4 py-2">
            <ProBadge className="!text-[0.75rem]" />
            <h2 className="font-sans text-[1.5rem] text-bone">GST comes with a plan</h2>
            <p className="max-w-xl text-ash">Your free trial already makes GST tax invoices, with CGST and SGST or IGST worked out. Choose a plan to see your GST in one place:</p>
            <ul className="space-y-2">
              {["Each month's taxable value, CGST, SGST and IGST, from your invoices", "GSTR-1 and GSTR-3B due dates, month by month", "What's outstanding, so filing day has no surprises"].map((x) => (
                <li key={x} className="flex gap-2 text-[0.9375rem] text-bone"><Check className="mt-1 size-4 shrink-0 text-[#ffc516]" aria-hidden /> {x}</li>
              ))}
            </ul>
            {viewer.workspaceRole === "ADMIN" && !viewer.demo ? (
              <Link href="/admin/plan" className="crm-btn crm-btn-primary">Choose a plan · ₹0 today</Link>
            ) : (
              <p className="text-[0.8125rem] text-faint">{viewer.demo ? "Not in the demo. Start a free trial, then choose a plan." : "Ask your agency's admin to choose a plan."}</p>
            )}
          </div>
        </Card>
      </>
    );

  /* The last six months of this agency's issued invoices (never a draft or a cancelled one). */
  const today = todayIst();
  const months = Array.from({ length: 6 }, (_, i) => new Date(Date.UTC(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1 - i, 1)).toISOString().slice(0, 7));
  const from = new Date(`${months.at(-1)}-01T00:00:00Z`);
  const invoices = await getPrisma().invoice.findMany({
    where: { workspaceId: viewer.workspaceId, status: { in: ["SENT", "PAID"] }, issueDate: { gte: from } },
    select: { issueDate: true, subtotalPaise: true, discountPaise: true, cgstPaise: true, sgstPaise: true, igstPaise: true, totalPaise: true, status: true },
  });
  const rows = months.map((ym) => {
    const of = invoices.filter((i) => i.issueDate.toISOString().slice(0, 7) === ym);
    const s = (k: "subtotalPaise" | "discountPaise" | "cgstPaise" | "sgstPaise" | "igstPaise" | "totalPaise") => of.reduce((n, i) => n + i[k], 0);
    return { ym, count: of.length, taxable: s("subtotalPaise") - s("discountPaise"), cgst: s("cgstPaise"), sgst: s("sgstPaise"), igst: s("igstPaise"), unpaid: of.filter((i) => i.status === "SENT").reduce((n, i) => n + i.totalPaise, 0) };
  });
  const last = rows[1]!;
  return (
    <>
      <PageHead kicker="Money" title="GST" sub="Your GST month by month, from your own invoices (drafts and cancelled ones left out)." />
      <Stats
        items={[
          { label: `Output GST, ${monthName(last.ym)}`, value: money(last.cgst + last.sgst + last.igst), hint: `on ${money(last.taxable)} invoiced` },
          { label: "GSTR-1 due", value: due(last.ym, 11), hint: `for ${monthName(last.ym)}` },
          { label: "GSTR-3B due", value: due(last.ym, 20), hint: `for ${monthName(last.ym)}` },
          { label: "Unpaid invoices this month", value: money(rows[0]!.unpaid), tone: rows[0]!.unpaid ? "warn" : undefined, href: "/admin/invoices" },
        ]}
      />
      <Card title="Month by month">
        <Table head={["Month", "Invoices", "Taxable", "CGST", "SGST", "IGST", "GSTR-1 / 3B due"]}>
          {rows.map((r) => (
            <tr key={r.ym}>
              <td className="whitespace-nowrap text-bone">{monthName(r.ym)}</td>
              <td className="tabular-nums">{r.count}</td>
              <td className="tabular-nums">{money(r.taxable)}</td>
              <td className="tabular-nums">{money(r.cgst)}</td>
              <td className="tabular-nums">{money(r.sgst)}</td>
              <td className="tabular-nums">{money(r.igst)}</td>
              <td className="whitespace-nowrap text-[0.8125rem] text-ash">{due(r.ym, 11)} · {due(r.ym, 20)}</td>
            </tr>
          ))}
        </Table>
        <p className="mt-3 text-[0.8125rem] text-faint">Due dates are the usual monthly ones; quarterly (QRMP) filers file on their own dates. Your accountant files the returns.</p>
      </Card>
    </>
  );
}
