import { ActionForm } from "@/components/crm/action-form";
import { Card, Field, PageHead, Select } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import { requirePortal } from "@/lib/crm/session";

import { inviteTeammate, removeTeammate } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Team" };

export default async function PortalTeam() {
  const { viewer, account } = await requirePortal();
  const prisma = getPrisma();
  const [members, invites] = await Promise.all([
    prisma.accountMember.findMany({ where: { accountId: account.id }, include: { user: true }, orderBy: { createdAt: "asc" } }),
    prisma.accountInvite.findMany({ where: { accountId: account.id } }),
  ]);
  const owner = account.role === "OWNER";
  return (
    <>
      <PageHead kicker={account.name} title="Team" sub="Everyone here sees this account's projects, reviews and invoices." />
      <Card>
        <ul className="divide-y divide-[var(--glass-border)]">
          {members.map((m) => (
            <li key={m.userId} className="flex items-center justify-between gap-2 py-2.5">
              <span className="text-bone">{m.user.name ?? m.user.email ?? m.user.phone}{m.userId === viewer.id ? " (you)" : ""} <span className="text-[0.8125rem] text-faint">· {m.role.toLowerCase()}</span></span>
              {owner && m.userId !== viewer.id && (
                <form action={removeTeammate}><input type="hidden" name="userId" value={m.userId} /><button className="text-[0.8125rem] text-[#dc2626] hover:underline">Remove</button></form>
              )}
            </li>
          ))}
          {invites.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-2 py-2.5">
              <span className="text-ash">{i.email} <span className="text-[0.8125rem] text-faint">· invited, hasn&apos;t signed in yet</span></span>
              {owner && <form action={removeTeammate}><input type="hidden" name="inviteId" value={i.id} /><button className="text-[0.8125rem] text-[#dc2626] hover:underline">Revoke</button></form>}
            </li>
          ))}
        </ul>
      </Card>
      {owner ? (
        <Card title="Add a colleague">
          <ActionForm action={inviteTeammate} submit="Send invite" reset>
            <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
              <Field label="Work email"><input name="email" type="email" required className="crm-input" /></Field>
              <Field label="Role"><Select name="role" required defaultValue="MEMBER" options={[["MEMBER", "Member"], ["BILLING", "Billing"], ["OWNER", "Owner"]]} /></Field>
            </div>
          </ActionForm>
        </Card>
      ) : (
        <p className="text-[0.875rem] text-ash">Ask an owner of this account to add people.</p>
      )}
    </>
  );
}
