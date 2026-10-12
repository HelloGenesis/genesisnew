import Link from "next/link";

import { ActionForm } from "@/components/crm/action-form";
import { CreatorFields, PLATFORMS } from "@/components/crm/creator-fields";
import { MultiSelect } from "@/components/crm/multi-select";
import { PickBar } from "@/components/crm/pick-bar";
import { AddPanel, Badge, Empty, PageHead, Table } from "@/components/crm/ui";
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
type Params = { q?: string; platform?: string | string[]; tier?: string | string[]; niche?: string | string[]; city?: string | string[]; min?: string; max?: string; limit?: string };
const many = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []).filter(Boolean);

/* A niche worth offering: words, not a number or a stray sentence from an imported sheet. */
const usableNiche = (n: string) => /^[A-Za-z][A-Za-z &/'+.-]{1,38}$/.test(n.trim()) && !/^\d/.test(n);

export default async function CreatorsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const viewer = await requireStaff();
  const p = await searchParams;
  const platforms = many(p.platform).filter((x) => PLATFORMS.some(([v]) => v === x)) as Platform[];
  const tiers = many(p.tier).filter((x) => x in CREATOR_TIER) as CreatorTier[];
  const niches = many(p.niche);
  const cities = many(p.city);
  const min = Number(p.min) || 0;
  const max = Number(p.max) || 0;
  const limit = Math.min(Math.max(Number(p.limit) || 300, 300), 3000);
  /* Several values in one filter widen it (any of them); different filters narrow each other. */
  const where: Prisma.CreatorWhereInput = {
    AND: [
      p.q ? { OR: [{ name: { contains: p.q, mode: "insensitive" } }, { handle: { contains: p.q.replace(/^@/, ""), mode: "insensitive" } }] } : {},
      platforms.length ? { platform: { in: platforms } } : {},
      tiers.length ? { tier: { in: tiers } } : {},
      niches.length ? { niches: { hasSome: niches } } : {},
      cities.length ? { OR: cities.map((c) => ({ city: { contains: c, mode: "insensitive" as const } })) } : {},
      min || max ? { followers: { ...(min ? { gte: min } : {}), ...(max ? { lte: max } : {}) } } : {},
    ],
  };
  const prisma = getPrisma();
  const [creators, total, matching, nicheRows, cityRows] = await Promise.all([
    prisma.creator.findMany({ where, orderBy: { followers: "desc" }, take: limit, include: { _count: { select: { campaigns: true } } } }),
    prisma.creator.count(),
    prisma.creator.count({ where }),
    prisma.$queryRaw<{ niche: string; n: bigint }[]>`select trim(n) as niche, count(*) as n from crm_creators, unnest(niches) n group by 1 order by 2 desc limit 400`,
    prisma.$queryRaw<{ city: string; n: bigint }[]>`select trim(split_part(city, '-', 1)) as city, count(*) as n from crm_creators where city is not null and city <> '' group by 1 order by 2 desc limit 300`,
  ]);
  const nicheOptions = [...new Set([...NICHES, ...nicheRows.map((n) => n.niche).filter(usableNiche)])].map((n) => [n, n] as const);
  const cityOptions = [...new Set(cityRows.map((c) => c.city.replace(/\s+/g, " ")).filter((c) => /^[A-Za-z][A-Za-z .'-]{1,40}$/.test(c)).map((c) => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()))].map((c) => [c, c] as const);
  const more = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) for (const x of many(v as string | string[])) if (k !== "limit") more.append(k, x);
  more.set("limit", String(limit + 300));
  return (
    <>
      <PageHead kicker="Influence" title="Influencer database" sub={`${total} creators · ${matching} match · ${creators.length} shown`} exportKind={isSuperAdmin(viewer) ? "creators" : undefined} />
      <form action="/admin/creators" className="flex flex-wrap items-start gap-2">
        <input name="q" defaultValue={p.q} placeholder="Name or @handle" className="crm-input max-w-[13rem]" />
        <MultiSelect name="platform" label="Any platform" options={PLATFORMS} defaultValue={platforms} className="w-[10rem]" />
        <MultiSelect name="tier" label="Any tier" options={Object.entries(CREATOR_TIER)} defaultValue={tiers} className="w-[11rem]" />
        <MultiSelect name="niche" label="Any niche" options={nicheOptions} defaultValue={niches} className="w-[13rem]" />
        <MultiSelect name="city" label="Any city" options={cityOptions} defaultValue={cities} className="w-[12rem]" />
        <input name="min" defaultValue={p.min} placeholder="Min followers" inputMode="numeric" className="crm-input max-w-[8.5rem]" />
        <input name="max" defaultValue={p.max} placeholder="Max followers" inputMode="numeric" className="crm-input max-w-[8.5rem]" />
        <button className="crm-btn crm-btn-primary crm-btn-sm">Search</button>
        {(p.q || platforms.length || tiers.length || niches.length || cities.length || min || max) ? <Link href="/admin/creators" className="crm-btn crm-btn-secondary crm-btn-sm">Clear all</Link> : null}
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
          {matching > creators.length && (
            <p className="text-center text-[0.875rem] text-ash">
              Showing {creators.length} of {matching}. <Link href={`/admin/creators?${more}`} className="crm-link">Show 300 more</Link>
            </p>
          )}
          <PickBar formId="pick-creators" />
        </>
      )}
    </>
  );
}
