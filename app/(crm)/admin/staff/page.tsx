import { ActionForm } from "@/components/crm/action-form";
import { Card, Field, PageHead, Select, Table } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import { STAFF_ROLE, date } from "@/lib/crm/catalog";
import { AREAS, CREATOR_ACCESS, creatorAccess, isSuperAdmin } from "@/lib/crm/scope";
import { requireStaff } from "@/lib/crm/session";

import { grantPortalAccess, inviteStaff, resetTwoFactor, revokeStaff, setGrants, setStaffProfile } from "../actions/finance";

export const dynamic = "force-dynamic";
export const metadata = { title: "Staff & roles" };

/**
 * Who works in the CRM and what they may do. Roles are never self-assigned:
 * an owner grants one to an email, and it is claimed only when that address
 * signs in VERIFIED (as genesis-coworking's staff invites).
 */
export default async function StaffPage() {
  const viewer = await requireStaff("staff");
  const prisma = getPrisma();
  const [roles, invites, clients] = await Promise.all([
    prisma.staffRole.findMany({ include: { user: { include: { staffTotp: true } } }, orderBy: { createdAt: "asc" } }),
    prisma.staffInvite.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.account.findMany({ where: { kind: { in: ["BRAND", "AGENCY"] } }, orderBy: { name: "asc" }, select: { id: true, name: true }, take: 1000 }),
  ]);
  const people = [...new Map(roles.map((r) => [r.userId, r.user])).values()];
  const accessOf = (u: (typeof people)[number]) => creatorAccess({ ...viewer, id: u.id, grants: u.grants, roles: roles.filter((r) => r.userId === u.id).map((r) => r.role) });
  const seesText = (grants: string[]) => (grants.some((g) => g in AREAS) ? grants.filter((g) => g in AREAS).map((g) => AREAS[g]).join(", ") : "Only their own");
  return (
    <>
      <PageHead kicker="Setup" title="Staff & roles" />
      <Card title="What each role can do">
        <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(STAFF_ROLE).map(([k, v]) => (
            <div key={k} className="rounded-xl bg-[var(--hover-wash)] px-3 py-2"><dt className="text-bone">{v.label}</dt><dd className="text-[0.8125rem] text-ash">{v.does}</dd></div>
          ))}
        </dl>
      </Card>
      <Card title="Add someone">
        <ActionForm action={inviteStaff} submit="Grant access" reset>
          <Field label="Email"><input name="email" type="email" required className="crm-input max-w-md" /></Field>
          {/* Several roles at once (Genesis, 22 Oct 2026: "add multiple section options"). */}
          <fieldset>
            <legend className="crm-label">Roles (tick any)</legend>
            <div className="flex flex-wrap gap-2">
              {Object.entries(STAFF_ROLE).filter(([k]) => k !== "OWNER" || isSuperAdmin(viewer)).map(([k, v]) => (
                <label key={k} className="flex cursor-pointer items-center gap-2 rounded-full border border-[var(--glass-border)] px-3 py-1.5 text-[0.875rem] text-ash has-[:checked]:border-[#ffc516] has-[:checked]:text-bone">
                  <input type="checkbox" name="role" value={k} className="accent-[#ffc516]" /> {v.label}
                </label>
              ))}
            </div>
          </fieldset>
        </ActionForm>
      </Card>
      <Card title="Portal access (their side only)">
        <div className="grid gap-6 lg:grid-cols-2">
          <ActionForm action={grantPortalAccess} submit="Give client access" reset>
            <input type="hidden" name="type" value="client" />
            <p className="text-[0.875rem] text-ash">A client sees only their own projects, approvals, briefs and invoices.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Their email"><input name="email" type="email" required className="crm-input" /></Field>
              <Field label="Client"><Select name="accountId" options={clients.map((a) => [a.id, a.name] as const)} placeholder="Pick a client" /></Field>
            </div>
          </ActionForm>
          <ActionForm action={grantPortalAccess} submit="Give influencer access" reset>
            <input type="hidden" name="type" value="influencer" />
            <p className="text-[0.875rem] text-ash">An influencer sees only their own profile and the campaigns they&apos;re on.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Their email"><input name="email" type="email" required className="crm-input" /></Field>
              <Field label="Instagram handle"><input name="handle" required placeholder="@handle" className="crm-input" /></Field>
            </div>
          </ActionForm>
        </div>
      </Card>
      <p className="text-[0.875rem] text-ash">
        <b className="text-bone">Owner = super admin</b>: sees everything, everyone&apos;s. Everyone else sees only their own leads, invoices, clients, projects and Gmail &amp; Drive finds,
        plus anything ticked under &ldquo;Can also see&rdquo;. The <b className="text-bone">influencer database</b> is private: owners, the influencer team, and people ticked for it.
      </p>
      <Table head={["Person", "Roles", "Can also see", "Two-factor app", "Last sign-in"]}>
        {people.map((u) => (
          <tr key={u.id}>
            <td className="text-bone">
              {u.name ?? u.email}
              <span className="block text-[0.8125rem] text-ash">{u.title ? `${u.title} · ` : ""}{u.email}</span>
              <details className="mt-1">
                <summary className="cursor-pointer text-[0.75rem] text-faint">Name & title</summary>
                <ActionForm action={setStaffProfile} submit="Save" inline className="mt-2">
                  <input type="hidden" name="userId" value={u.id} />
                  <input name="name" defaultValue={u.name ?? ""} placeholder="Name" className="crm-input w-36" />
                  <input name="title" defaultValue={u.title ?? ""} placeholder="Job title" className="crm-input w-44" />
                </ActionForm>
              </details>
            </td>
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
            <td>
              {roles.some((r) => r.userId === u.id && r.role === "OWNER") ? (
                <span className="text-[0.8125rem] text-ash">Everything (super admin)</span>
              ) : isSuperAdmin(viewer) ? (
                <details>
                  <summary className="cursor-pointer text-[0.8125rem] text-ash">{seesText(u.grants)}<span className="block text-faint">Influencer data: {CREATOR_ACCESS[accessOf(u)].split(" (")[0]}</span></summary>
                  <ActionForm action={setGrants} submit="Save" className="mt-2 min-w-[16rem]">
                    <input type="hidden" name="userId" value={u.id} />
                    {Object.entries(AREAS).map(([k, label]) => (
                      <label key={k} className="flex items-center gap-2 text-[0.8125rem] text-ash"><input type="checkbox" name="grants" value={k} defaultChecked={u.grants.includes(k)} /> {label}</label>
                    ))}
                    {/* Influencer data: one of three (Genesis, 22 Oct 2026). */}
                    <fieldset className="mt-2 space-y-1 border-t border-[var(--glass-border)] pt-2">
                      <legend className="text-[0.8125rem] text-bone">Influencer data</legend>
                      {(["none", "own", "all"] as const).map((k) => (
                        <label key={k} className="flex items-start gap-2 text-[0.8125rem] text-ash"><input type="radio" name="creatorAccess" value={k} defaultChecked={accessOf(u) === k} className="mt-0.5" /> {CREATOR_ACCESS[k]}</label>
                      ))}
                    </fieldset>
                  </ActionForm>
                </details>
              ) : (
                <span className="text-[0.8125rem] text-ash">{seesText(u.grants)}<span className="block text-faint">Influencer data: {CREATOR_ACCESS[accessOf(u)].split(" (")[0]}</span></span>
              )}
            </td>
            <td>
              {u.staffTotp?.confirmedAt ? `Set up ${date(u.staffTotp.confirmedAt)}` : "Not yet"}
              {u.staffTotp && (
                <form action={resetTwoFactor} className="mt-1">
                  <input type="hidden" name="userId" value={u.id} />
                  <button className="text-[0.75rem] text-ash hover:text-bone" title="Their next sign-in shows a new QR code to scan">Reset (new phone)</button>
                </form>
              )}
            </td>
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
            <td>—</td>
          </tr>
        ))}
      </Table>
    </>
  );
}
