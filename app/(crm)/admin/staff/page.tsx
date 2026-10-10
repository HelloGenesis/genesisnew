import { ActionForm } from "@/components/crm/action-form";
import { Card, Field, PageHead, Select, Table } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import { STAFF_ROLE, date } from "@/lib/crm/catalog";
import { requireStaff } from "@/lib/crm/session";

import { inviteStaff, revokeStaff } from "../actions/finance";

export const dynamic = "force-dynamic";
export const metadata = { title: "Staff & roles" };

/**
 * Who works in the CRM and what they may do. Roles are never self-assigned:
 * an owner grants one to an email, and it is claimed only when that address
 * signs in VERIFIED (as genesis-coworking's staff invites).
 */
export default async function StaffPage() {
  await requireStaff("staff");
  const prisma = getPrisma();
  const [roles, invites] = await Promise.all([
    prisma.staffRole.findMany({ include: { user: { include: { staffTotp: true } } }, orderBy: { createdAt: "asc" } }),
    prisma.staffInvite.findMany({ orderBy: { createdAt: "desc" } }),
  ]);
  const people = [...new Map(roles.map((r) => [r.userId, r.user])).values()];
  return (
    <>
      <PageHead kicker="Setup" title="Staff & roles" />
      <Card title="What each role can do">
        <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {Object.entries(STAFF_ROLE).map(([k, v]) => (
            <div key={k} className="rounded-xl bg-[var(--hover-wash)] px-3 py-2"><dt className="text-bone">{v.label}</dt><dd className="text-[0.8125rem] text-ash">{v.does}</dd></div>
          ))}
        </dl>
      </Card>
      <Card title="Add someone">
        <ActionForm action={inviteStaff} submit="Grant role" reset>
          <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
            <Field label="Email"><input name="email" type="email" required className="crm-input" /></Field>
            <Field label="Role"><Select name="role" required defaultValue="PRODUCER" options={Object.entries(STAFF_ROLE).map(([k, v]) => [k, v.label] as const)} /></Field>
          </div>
        </ActionForm>
      </Card>
      <Table head={["Person", "Roles", "Two-factor app", "Last sign-in"]}>
        {people.map((u) => (
          <tr key={u.id}>
            <td className="text-bone">{u.name ?? u.email}<span className="block text-[0.8125rem] text-ash">{u.email}</span></td>
            <td>
              <span className="flex flex-wrap gap-2">
                {roles.filter((r) => r.userId === u.id).map((r) => (
                  <form key={r.role} action={revokeStaff} className="flex items-center gap-1 rounded-full bg-[var(--hover-wash)] px-2.5 py-0.5 text-[0.8125rem]">
                    <input type="hidden" name="userId" value={u.id} />
                    <input type="hidden" name="role" value={r.role} />
                    {STAFF_ROLE[r.role].label}
                    <button aria-label={`Remove ${STAFF_ROLE[r.role].label}`} className="text-faint hover:text-[#dc2626]">×</button>
                  </form>
                ))}
              </span>
            </td>
            <td>{u.staffTotp?.confirmedAt ? `Set up ${date(u.staffTotp.confirmedAt)}` : "Not yet"}</td>
            <td>{date(u.lastLoginAt)}</td>
          </tr>
        ))}
        {invites.map((i) => (
          <tr key={`${i.email}-${i.role}`}>
            <td className="text-ash">{i.email}<span className="block text-[0.75rem] text-faint">invited {date(i.createdAt)}, not signed in yet</span></td>
            <td>
              <form action={revokeStaff} className="inline-flex items-center gap-1 rounded-full bg-[var(--hover-wash)] px-2.5 py-0.5 text-[0.8125rem]">
                <input type="hidden" name="email" value={i.email} />
                <input type="hidden" name="role" value={i.role} />
                {STAFF_ROLE[i.role].label}
                <button aria-label="Revoke invite" className="text-faint hover:text-[#dc2626]">×</button>
              </form>
            </td>
            <td>—</td>
            <td>—</td>
          </tr>
        ))}
      </Table>
    </>
  );
}
