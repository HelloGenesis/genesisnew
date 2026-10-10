import "server-only";

import { getPrisma } from "@/lib/db";

import { CATALOG, TERMS } from "./quote-templates";

/** What the quote builder needs from the server: the catalogue, the terms templates and the influencer pool. */
export async function builderData() {
  const pool = await getPrisma().creator.findMany({ where: { blacklisted: false }, orderBy: { followers: "desc" }, take: 1000 });
  return {
    catalog: CATALOG.map((c) => ({ ...c })),
    terms: TERMS.map((t) => ({ key: t.key, label: t.label, notes: t.notes, terms: [...t.terms] })),
    pool: pool.map((c) => ({ id: c.id, name: c.name, handle: c.handle, platform: c.platform, profileUrl: c.profileUrl, followers: c.followers, avgViews: c.avgViews, niches: c.niches, city: c.city, reel: c.reelRatePaise ? c.reelRatePaise / 100 : null })),
  };
}
