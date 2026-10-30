import Link from "next/link";

import { novaAccess, prettyBytes, storageUsed } from "@/lib/crm/nova-pro";

import { ProBadge } from "./pro-badge";

/** An agency's storage: used of its allowance, and more with a plan (lib/crm/nova-pro). Nothing for Genesis's own team or an unlimited agency. */
export async function StorageMeter({ workspaceId, admin }: { workspaceId: string | null; admin: boolean }) {
  if (!workspaceId) return null;
  const access = await novaAccess(workspaceId);
  if (access.storageLimit === null) return null;
  const used = await storageUsed(workspaceId);
  const share = Math.min(1, used / access.storageLimit);
  return (
    <div className="crm-card flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3">
      <span className="text-[0.875rem] text-ash">Storage</span>
      <span className="h-2 min-w-40 flex-1 overflow-hidden rounded-full bg-[var(--hover-wash)]">
        <span className={`block h-full rounded-full ${share > 0.9 ? "bg-[#dc2626]" : "bg-[#ffc516]"}`} style={{ width: `${Math.max(2, share * 100)}%` }} />
      </span>
      <span className="text-[0.875rem] tabular-nums text-bone">{prettyBytes(used)} of {prettyBytes(access.storageLimit)}</span>
      {!access.pro && (
        <span className="flex items-center gap-2 text-[0.8125rem] text-ash">
          <ProBadge /> 10–200 GB with a plan{admin && <Link href="/admin/plan" className="crm-link">Choose a plan</Link>}
        </span>
      )}
    </div>
  );
}
