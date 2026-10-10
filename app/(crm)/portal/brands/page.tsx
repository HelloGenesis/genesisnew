import { redirect } from "next/navigation";

import { ActionForm } from "@/components/crm/action-form";
import { Card, Field, PageHead } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import { requirePortal } from "@/lib/crm/session";

import { addBrand, switchAccount } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Brands" };

/** An agency's brands: each its own projects, briefs and billing, one switch away. */
export default async function PortalBrands() {
  const { account } = await requirePortal();
  if (account.kind !== "AGENCY") redirect("/portal");
  const brands = await getPrisma().account.findMany({
    where: { parentId: account.id },
    orderBy: { name: "asc" },
    include: { _count: { select: { projects: { where: { status: "ACTIVE" } }, requests: { where: { status: { notIn: ["DONE", "DECLINED"] } } } } } },
  });
  return (
    <>
      <PageHead kicker={account.name} title="Brands" sub="The brands you buy Genesis work for. Open one to brief, review and pay for it." />
      {brands.length > 0 && (
        <ul className="grid gap-3 md:grid-cols-2">
          {brands.map((b) => (
            <li key={b.id} className="crm-card flex items-center justify-between gap-3 p-4">
              <span><span className="block text-bone">{b.name}</span><span className="text-[0.8125rem] text-ash">{b._count.projects} active projects · {b._count.requests} open requests</span></span>
              <form action={switchAccount}><input type="hidden" name="accountId" value={b.id} /><button className="crm-btn crm-btn-secondary crm-btn-sm">Open</button></form>
            </li>
          ))}
        </ul>
      )}
      <Card title="Add a brand">
        <ActionForm action={addBrand} submit="Add brand" reset>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Brand name"><input name="name" required className="crm-input" /></Field>
            <Field label="Website"><input name="website" className="crm-input" /></Field>
            <Field label="Industry"><input name="industry" className="crm-input" /></Field>
          </div>
        </ActionForm>
      </Card>
    </>
  );
}
