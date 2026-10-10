import "server-only";

import { getPrisma } from "@/lib/db";

/**
 * THE NUMBERS BEHIND A CAMPAIGN REPORT: per creator and in total — views,
 * likes, comments, shares, saves, reach — and what they cost: engagement rate
 * (engagements ÷ views, or ÷ reach when views aren't in), cost per view and
 * cost per engagement on the fees paid.
 */

export type Row = {
  id: string;
  name: string;
  handle: string;
  platform: string;
  followers: number;
  status: string;
  deliverables: string | null;
  postUrl: string | null;
  postedAt: Date | null;
  feePaise: number | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  reach: number | null;
  notes: string | null;
  clientVisible: boolean;
};

const n = (x: number | null) => x ?? 0;

export function metrics(rows: Pick<Row, "views" | "likes" | "comments" | "shares" | "saves" | "reach" | "feePaise" | "postUrl" | "status">[]) {
  const live = rows.filter((r) => r.postUrl || r.status === "POSTED" || r.status === "PAID");
  const views = rows.reduce((s, r) => s + n(r.views), 0);
  const likes = rows.reduce((s, r) => s + n(r.likes), 0);
  const comments = rows.reduce((s, r) => s + n(r.comments), 0);
  const shares = rows.reduce((s, r) => s + n(r.shares), 0);
  const saves = rows.reduce((s, r) => s + n(r.saves), 0);
  const reach = rows.reduce((s, r) => s + n(r.reach), 0);
  const spend = rows.filter((r) => r.status !== "DROPPED").reduce((s, r) => s + n(r.feePaise), 0);
  const engagements = likes + comments + shares + saves;
  const base = views || reach;
  return {
    creators: rows.filter((r) => r.status !== "DROPPED").length,
    live: live.length,
    views,
    likes,
    comments,
    shares,
    saves,
    reach,
    engagements,
    spend,
    engagementRate: base ? (engagements / base) * 100 : null,
    cpv: views ? spend / views : null,
    cpe: engagements ? spend / engagements : null,
  };
}

/** A campaign (an Influence project's creators), for the report. `clientOnly` keeps to what the client may see. */
export async function campaign(projectId: string, clientOnly = false) {
  const project = await getPrisma().project.findUnique({
    where: { id: projectId },
    include: {
      account: true,
      creators: {
        where: clientOnly ? { clientVisible: true, status: { in: ["CONFIRMED", "CONTENT_RECEIVED", "APPROVED", "POSTED", "PAID"] } } : {},
        orderBy: [{ postedAt: { sort: "desc", nulls: "last" } }, { createdAt: "asc" }],
        include: { creator: true },
      },
    },
  });
  if (!project) return null;
  const rows: Row[] = project.creators.map((c) => ({
    id: c.id,
    name: c.creator.name,
    handle: c.creator.handle,
    platform: c.creator.platform,
    followers: c.creator.followers,
    status: c.status,
    deliverables: c.deliverables,
    postUrl: c.postUrl,
    postedAt: c.postedAt,
    feePaise: c.feePaise,
    views: c.views,
    likes: c.likes,
    comments: c.comments,
    shares: c.shares,
    saves: c.saves,
    reach: c.reach,
    notes: c.notes,
    clientVisible: c.clientVisible,
  }));
  return { project, rows, totals: metrics(rows) };
}

export const compact = (x: number | null | undefined) => (x === null || x === undefined ? "—" : new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(x));
export const pct = (x: number | null) => (x === null ? "—" : `${x.toFixed(2)}%`);
export const rupees = (paise: number | null) => (paise === null ? "—" : `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`);
