import Link from "next/link";

import { ActionForm } from "@/components/crm/action-form";
import { CreatorFields, PLATFORMS } from "@/components/crm/creator-fields";
import { PickBar } from "@/components/crm/pick-bar";
import { AddPanel, Badge, Empty, PageHead, Select, Table } from "@/components/crm/ui";
import { NICHES } from "@/lib/crm/niches";
import { getPrisma } from "@/lib/db";
import { isSuperAdmin } from "@/lib/crm/scope";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { CreatorTier, Platform } from "@/lib/generated/prisma/enums";
import { CREATOR_TIER, money } from "@/lib/crm/catalog";
import { requireStaff } from "@/lib/crm/session";

import { saveCreator } from "../actions/delivery";

export const dynamic = "force-dynamic";
export const metadata = { title: "Influencer database" };

const compact = (n: number | null) => (n ? new Intl.NumberFormat("en-IN", { notation: "compact" }).format(n) : "—");

/**
 * GENESIS INFLUENCE'S CREATOR NETWORK. Every creator Genesis has worked with or
 * scouted, with reach, rates and campaign history — and every creator who
 * applies through the website's Influencer Onboarding form lands here too.
 */
export default async function CreatorsPage({ searchParams }: { searchParams: Promise<{ q?: string; platform?: string; tier?: string; niche?: string; city?: string; min?: string }> }) {
  const viewer = await requireStaff();
  const p = await searchParams;
  const where: Prisma.CreatorWhereInput = {
    ...(p.q ? { OR: [{ name: { contains: p.q, mode: "insensitive" } }, { handle: { contains: p.q.replace(/^@/, ""), mode: "insensitive" } }] } : {}),
    ...(p.platform ? { platform: p.platform as Platform } : {}),
    ...(p.tier && p.tier in CREATOR_TIER ? { tier: p.tier as CreatorTier } : {}),
    ...(p.niche ? { niches: { has: p.niche } } : {}),
    ...(p.city ? { city: { contains: p.city, mode: "insensitive" } } : {}),
    ...(Number(p.min) > 0 ? { followers: { gte: Number(p.min) } } : {}),
  };
  const prisma = getPrisma();
  const [creators, total, nicheRows] = await Promise.all([
    prisma.creator.findMany({ where, orderBy: { followers: "desc" }, take: 300, include: { _count: { select: { campaigns: true } } } }),
    prisma.creator.count(),
    prisma.$queryRaw<{ niche: string }[]>`select distinct unnest(niches) as niche from crm_creators order by 1 limit 200`,
  ]);
  return (
    <>
      <PageHead kicker="Influence" title="Influencer database" sub={`${total} creators · ${creators.length} shown`} exportKind={isSuperAdmin(viewer) ? "creators" : undefined} />
      <form action="/admin/creators" className="flex flex-wrap items-end gap-2">
        <input name="q" defaultValue={p.q} placeholder="Name or @handle" className="crm-input max-w-[14rem]" />
        <Select name="platform" placeholder="Any platform" defaultValue={p.platform} options={PLATFORMS} className="max-w-[10rem]" />
        <Select name="tier" placeholder="Any tier" defaultValue={p.tier} options={CREATOR_TIER} className="max-w-[12rem]" />
        <Select name="niche" placeholder="Any niche" defaultValue={p.niche} options={[...new Set([...NICHES, ...nicheRows.map((n) => n.niche)])].map((n) => [n, n] as const)} className="max-w-[12rem]" />
        <input name="city" defaultValue={p.city} placeholder="City" className="crm-input max-w-[9rem]" />
        <input name="min" defaultValue={p.min} placeholder="Min followers" inputMode="numeric" className="crm-input max-w-[9rem]" />
        <button className="crm-btn crm-btn-secondary crm-btn-sm">Search</button>
      </form>
      <AddPanel label="Add a creator">
        <ActionForm action={saveCreator} submit="Add creator">
          <CreatorFields />
        </ActionForm>
      </AddPanel>
      {creators.length === 0 ? (
        <Empty>No creators match.</Empty>
      ) : (
        <>
          {/* IN THE PLAN'S OWN COLUMNS (Genesis, 12 Oct 2026, from the IndusInd Nippon plan), with a tick to put creators on a new plan. */}
          <form id="pick-creators" action="/admin/quotes/new" method="get">
            <input type="hidden" name="kind" value="INFLUENCER_PLAN" />
            <Table head={["", "Tier", "Name", "Category", "IG link", "Followers", "Avg views", "ER", "1 IG Reel", "Story + LIB", "DL (1 month)", "Location", "Contact", "Campaigns"]}>
              {creators.map((c) => (
                <tr key={c.id} className={c.blacklisted ? "opacity-50" : ""}>
                  <td><input type="checkbox" name="creators" value={c.id} disabled={c.blacklisted} aria-label={`Select ${c.name}`} className="size-4 accent-[#ffc516]" /></td>
                  <td className="whitespace-nowrap text-[0.8125rem]">{CREATOR_TIER[c.tier].split(" ")[0]}</td>
                  <td>
                    <Link href={`/admin/creators/${c.id}`} className="text-bone hover:underline">{c.name}</Link>
                    <span className="block text-[0.8125rem] text-ash">@{c.handle}{c.platform !== "INSTAGRAM" ? ` · ${c.platform.toLowerCase()}` : ""}</span>
                    <span className="flex flex-wrap gap-1">
                      {c.tags.map((t) => <Badge key={t} tone={t.startsWith("Applied") ? "info" : "muted"}>{t}</Badge>)}
                      {c.blacklisted && <Badge tone="bad">Do not use</Badge>}
                    </span>
                  </td>
                  <td className="max-w-[12rem] text-[0.875rem]">{c.niches.join(", ") || "—"}</td>
                  <td>{c.profileUrl ? <a href={c.profileUrl} target="_blank" rel="noreferrer" className="crm-link text-[0.8125rem]">Profile ↗</a> : "—"}{c.youtubeUrl && <a href={c.youtubeUrl} target="_blank" rel="noreferrer" className="crm-link block text-[0.8125rem]">YouTube ↗</a>}</td>
                  <td className="tabular-nums">{compact(c.followers)}</td>
                  <td className="tabular-nums">{compact(c.avgViews)}</td>
                  <td className="tabular-nums">{c.engagementRate ? `${c.engagementRate}%` : "—"}</td>
                  <td className="tabular-nums">{c.reelRatePaise ? money(c.reelRatePaise) : "—"}</td>
                  <td className="tabular-nums">{c.storyRatePaise ? money(c.storyRatePaise) : "—"}</td>
                  <td className="tabular-nums">{c.dlRatePaise ? money(c.dlRatePaise) : "—"}</td>
                  <td>{c.city ?? "—"}</td>
                  <td className="max-w-[12rem] text-[0.8125rem]">{[c.phone, c.email, c.managedBy].filter(Boolean).join(" · ") || "—"}</td>
                  <td className="tabular-nums">{c._count.campaigns}</td>
                </tr>
              ))}
            </Table>
          </form>
          <PickBar formId="pick-creators" />
        </>
      )}
    </>
  );
}
