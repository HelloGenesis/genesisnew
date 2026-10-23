import { redirect } from "next/navigation";

import { ActionForm } from "@/components/crm/action-form";
import { Card, Field, PageHead, Table } from "@/components/crm/ui";
import { date } from "@/lib/crm/catalog";
import { isSuperAdmin } from "@/lib/crm/scope";
import { requireStaff } from "@/lib/crm/session";
import { workspaceProfile } from "@/lib/crm/workspace";
import { getPrisma } from "@/lib/db";

import { addAgencyMember, removeAgencyMember, saveAgencyProfile } from "../actions/workspaces";

export const dynamic = "force-dynamic";
export const metadata = { title: "Team & company" };

/** An agency CRM's own team, and its details for its quotes and invoices (lib/crm/workspace). */
export default async function TeamPage() {
  const viewer = await requireStaff();
  const ws = viewer.ws;
  if (!ws || !(viewer.workspaceRole === "ADMIN" || isSuperAdmin(viewer))) redirect("/admin/forbidden");
  const [profile, team, pending] = await Promise.all([
    workspaceProfile(ws),
    getPrisma().user.findMany({ where: { workspaceId: ws }, orderBy: { createdAt: "asc" }, select: { id: true, name: true, email: true, workspaceRole: true, lastLoginAt: true } }),
    getPrisma().appSetting.findMany({ where: { key: { startsWith: "agency-invite:" } } }),
  ]);
  const invited = pending.map((p) => ({ email: p.key.slice("agency-invite:".length), ...(JSON.parse(p.value) as { ws: string; role: string }) })).filter((p) => p.ws === ws);
  const field = (name: keyof NonNullable<typeof profile>, label: string, hint?: string) => (
    <Field label={label} hint={hint}><input name={name} defaultValue={profile?.[name] ?? ""} className="crm-input" /></Field>
  );
  return (
    <>
      <PageHead kicker="Setup" title="Team & company" sub={`${profile?.name ?? "Your agency"}'s own CRM: your data stays yours.`} />
      <Card title="Add someone">
        <ActionForm action={addAgencyMember} submit="Add to the team" reset>
          <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
            <Field label="Email"><input name="email" type="email" required className="crm-input" /></Field>
            <Field label="Role">
              <select name="role" defaultValue="MEMBER" className="crm-input">
                <option value="MEMBER">Member: their own work</option>
                <option value="ADMIN">Admin: everything, and the team</option>
              </select>
            </Field>
          </div>
        </ActionForm>
      </Card>
      <Table head={["Person", "Role", "Last sign-in", ""]}>
        {team.map((u) => (
          <tr key={u.id}>
            <td className="text-bone">{u.name ?? u.email}<span className="block text-[0.8125rem] text-ash">{u.email}</span></td>
            <td>{u.workspaceRole === "ADMIN" ? "Admin" : "Member"}</td>
            <td>{date(u.lastLoginAt)}</td>
            <td>{u.id !== viewer.id && <form action={removeAgencyMember}><input type="hidden" name="userId" value={u.id} /><button className="text-[0.8125rem] text-ash hover:text-[#dc2626]">Remove</button></form>}</td>
          </tr>
        ))}
        {invited.map((i) => (
          <tr key={i.email}>
            <td className="text-ash">{i.email}<span className="block text-[0.75rem] text-faint">invited, not signed in yet</span></td>
            <td>{i.role === "ADMIN" ? "Admin" : "Member"}</td>
            <td>—</td>
            <td />
          </tr>
        ))}
      </Table>
      <Card title="Your company, on your quotes and invoices">
        <ActionForm action={saveAgencyProfile} submit="Save">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {field("name", "Name on documents")}
            {field("legalName", "Registered name")}
            {field("gstin", "GSTIN")}
            <Field label="Address" hint="One line per row, as it should print."><textarea name="address" defaultValue={profile?.address ?? ""} className="crm-input !min-h-20" /></Field>
            {field("phone", "Phone")}
            {field("email", "Email")}
            {field("website", "Website")}
            {field("logoUrl", "Logo link", "A link to your logo image (PNG or SVG).")}
            {field("invoicePrefix", "Invoice number prefix", "e.g. ABC/ → ABC/1, ABC/2…")}
            {field("payee", "Payee name")}
            {field("bank", "Bank")}
            {field("account", "Account number")}
            {field("ifsc", "IFSC")}
          </div>
        </ActionForm>
      </Card>
    </>
  );
}
