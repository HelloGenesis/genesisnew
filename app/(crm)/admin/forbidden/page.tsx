import Link from "next/link";

import { getViewer } from "@/lib/crm/session";

export const dynamic = "force-dynamic";

export default async function ForbiddenPage() {
  const viewer = await getViewer();
  return (
    <div className="mx-auto max-w-lg py-10">
      <div className="crm-card crm-pad space-y-3">
        <h1 className="text-[1.75rem] font-normal text-bone">No access to this</h1>
        <p className="text-ash">
          {viewer ? `${viewer.email ?? viewer.phone} is signed in, but` : "This account"} doesn&apos;t have a staff role for this part of the CRM. An owner can grant one in Staff & roles.
        </p>
        <div className="flex gap-3">
          {viewer?.memberships.length ? (
            <Link className="crm-btn crm-btn-primary" href="/portal">
              Go to your portal
            </Link>
          ) : null}
          <Link className="crm-btn crm-btn-secondary" href="/signout">
            Sign out
          </Link>
        </div>
      </div>
    </div>
  );
}
