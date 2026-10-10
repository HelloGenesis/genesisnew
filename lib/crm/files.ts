import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { getPrisma } from "@/lib/db";
import type { FileAudience } from "@/lib/generated/prisma/enums";

import { type Viewer, portalAccounts, staffAccess } from "./session";

/**
 * EACH PROJECT'S FILES, BY STAGE (Genesis, 10 Oct 2026: "raw files, edited
 * files, first cut, second cut … viewable for individuals from brands,
 * Genesis's admins, clients, vendors").
 *
 * Every file sits in one of these folders and has an audience. Genesis staff
 * see everything; a client sees what is for clients or everyone; a vendor on
 * the project sees what is for vendors or everyone. The folder sets the
 * default audience, and staff can change any file's.
 */

export type FolderKey = "brief" | "scripts" | "avatar" | "raw" | "edited" | "first-cut" | "second-cut" | "final" | "internal";
export type FileRole = "staff" | "client" | "vendor";

export const FOLDERS: readonly { key: FolderKey; label: string; audience: FileAudience; hint: string; upload: FileRole[] }[] = [
  { key: "brief", label: "Brief & assets", audience: "EVERYONE", hint: "Brand guidelines, logos, product photos, references", upload: ["staff", "client"] },
  { key: "scripts", label: "Ideation & scripts", audience: "EVERYONE", hint: "Concepts, hooks, scripts, storyboards", upload: ["staff"] },
  { key: "avatar", label: "Avatar & voice", audience: "TEAM_CLIENT", hint: "Reference photos, voice recordings, avatar tests", upload: ["staff", "client"] },
  { key: "raw", label: "Raw footage", audience: "TEAM_VENDOR", hint: "Camera files, creator drafts, AI renders", upload: ["staff", "vendor"] },
  { key: "edited", label: "Edited files", audience: "TEAM_VENDOR", hint: "Work in progress, project files", upload: ["staff", "vendor"] },
  { key: "first-cut", label: "First cut", audience: "TEAM_CLIENT", hint: "For AI: the image draft with music", upload: ["staff", "vendor"] },
  { key: "second-cut", label: "Second cut", audience: "TEAM_CLIENT", hint: "After the first round of feedback", upload: ["staff", "vendor"] },
  { key: "final", label: "Final delivery", audience: "EVERYONE", hint: "Approved finals, every format", upload: ["staff", "vendor"] },
  { key: "internal", label: "Internal", audience: "TEAM", hint: "Genesis only: costings, notes, anything not for outside eyes", upload: ["staff"] },
];

export const AUDIENCE_LABEL: Record<FileAudience, string> = {
  TEAM: "Genesis only",
  TEAM_VENDOR: "Genesis + vendors",
  TEAM_CLIENT: "Genesis + client",
  EVERYONE: "Everyone on the project",
};

export const folderOf = (key: string) => FOLDERS.find((f) => f.key === key);

const VISIBLE: Record<FileRole, FileAudience[]> = {
  staff: ["TEAM", "TEAM_VENDOR", "TEAM_CLIENT", "EVERYONE"],
  client: ["TEAM_CLIENT", "EVERYONE"],
  vendor: ["TEAM_VENDOR", "EVERYONE"],
};

export const visibleTo = (role: FileRole) => VISIBLE[role];

/** How this person relates to a project: Genesis staff, its client (or the client's agency), a vendor on it — or nothing. */
export async function projectRole(viewer: Viewer | null, projectId: string): Promise<FileRole | null> {
  if (!viewer) return null;
  if (staffAccess(viewer) === "granted") return "staff";
  const project = await getPrisma().project.findUnique({ where: { id: projectId }, select: { accountId: true } });
  if (!project) return null;
  const accounts = await portalAccounts(viewer);
  if (accounts.some((a) => a.id === project.accountId)) return "client";
  const vendorIds = accounts.filter((a) => a.kind === "VENDOR").map((a) => a.id);
  if (vendorIds.length) {
    const assigned = await getPrisma().vendorAssignment.count({ where: { projectId, vendorId: { in: vendorIds }, status: { notIn: ["DECLINED", "CANCELLED"] } } });
    if (assigned) return "vendor";
  }
  return null;
}

// --- Upload tickets ------------------------------------------------------------------
// The server decides where a file may go and signs it; the browser uploads to
// Drive and comes back with the ticket and the file id, and the server checks
// the file really landed in that folder before recording it.

export type UploadTicket = { projectId: string; folder: FolderKey; audience: FileAudience; parentId: string; userId: string; as: FileRole; exp: number };

const secret = () => process.env.AUTH0_SECRET || process.env.CRM_DEV_SECRET || "genesis-local-development-only";

export function signTicket(t: UploadTicket): string {
  const body = Buffer.from(JSON.stringify(t)).toString("base64url");
  return `${body}.${createHmac("sha256", secret()).update(`upload:${body}`).digest("hex")}`;
}

export function readTicket(value: string): UploadTicket | null {
  const [body, sig] = value.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret()).update(`upload:${body}`).digest("hex");
  if (expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  const t = JSON.parse(Buffer.from(body, "base64url").toString()) as UploadTicket;
  return t.exp > Date.now() ? t : null;
}
