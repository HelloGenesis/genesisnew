import "server-only";

import { getPrisma } from "@/lib/db";

import { trialOf } from "./nova-trial";

/**
 * NOVA'S PRO LOCKS (Genesis, 31 Oct 2026: "don't give full access to all
 * features for the free trial: keep GST locked and add a Pro icon; limit the
 * storage to a minimum, with premium plans to use more"). Pro is a chosen
 * plan: a trial is Pro once its card is added (the plan is chosen then); an
 * agency Genesis set up by hand, with no trial, has everything. Genesis's own
 * team is never limited.
 */

/* Decimal, as the file lists show sizes. */
const MB = 1000 ** 2;
const GB = 1000 ** 3;
export const TRIAL_STORAGE = 500 * MB;
const PLAN_STORAGE: Record<string, number> = { Starter: 10 * GB, Growth: 50 * GB, Scale: 200 * GB };

export type NovaAccess = { pro: boolean; plan: string | null; storageLimit: number | null };

/** What this CRM may use. Null workspace (Genesis's own): everything. */
export async function novaAccess(workspaceId: string | null | undefined): Promise<NovaAccess> {
  if (!workspaceId) return { pro: true, plan: null, storageLimit: null };
  const trial = await trialOf(workspaceId);
  if (!trial) return { pro: true, plan: null, storageLimit: null };
  const pro = trial.state === "CARD_ADDED" || trial.state === "ACTIVE";
  return { pro, plan: trial.plan, storageLimit: pro && trial.plan ? (PLAN_STORAGE[trial.plan] ?? TRIAL_STORAGE) : TRIAL_STORAGE };
}

/** Bytes of files on this agency's projects. */
export async function storageUsed(workspaceId: string) {
  const sum = await getPrisma().driveFile.aggregate({ where: { project: { workspaceId } }, _sum: { sizeBytes: true } });
  return Number(sum._sum.sizeBytes ?? 0);
}

export const prettyBytes = (n: number) => (n >= GB ? `${(n / GB).toFixed(n >= 10 * GB ? 0 : 1)} GB` : `${Math.max(0, Math.round(n / MB))} MB`);

/** Why an upload of `size` bytes can't go into this agency's CRM, or null when it can. */
export async function storageProblem(workspaceId: string | null | undefined, size: number) {
  if (!workspaceId) return null;
  const { storageLimit, pro } = await novaAccess(workspaceId);
  if (storageLimit === null) return null;
  const used = await storageUsed(workspaceId);
  if (used + size <= storageLimit) return null;
  return pro
    ? `This would go over your plan's ${prettyBytes(storageLimit)} of storage (${prettyBytes(used)} used). A bigger plan has more: see Plan & billing.`
    : `Your free trial includes ${prettyBytes(storageLimit)} of storage (${prettyBytes(used)} used). Choose a plan in Plan & billing for more: 10 GB on Starter, 50 GB on Growth, 200 GB on Scale.`;
}
