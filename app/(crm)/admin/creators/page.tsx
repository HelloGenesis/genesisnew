import { redirect } from "next/navigation";
import { Upload } from "lucide-react";
import Link from "next/link";

import { ActionForm } from "@/components/crm/action-form";
import { CreatorFields, PLATFORMS } from "@/components/crm/creator-fields";
import { MultiSelect } from "@/components/crm/multi-select";
import { PickBar } from "@/components/crm/pick-bar";
import { AddPanel, Badge, Empty, PageHead, Table } from "@/components/crm/ui";
import { NICHES } from "@/lib/crm/niches";
import { getPrisma } from "@/lib/db";
import { isSuperAdmin, seesCreators, creatorAccess, creatorScope } from "@/lib/crm/scope";
import { Prisma } from "@/lib/generated/prisma/client";
import type { CreatorTier, Platform } from "@/lib/generated/prisma/enums";
import { CREATOR_TIER, money } from "@/lib/crm/catalog";
import { requireStaff } from "@/lib/crm/session";
import { EditCell } from "@/components/crm/edit-cell";
import { updateCreatorField } from "../actions/delivery";

const edit = (id: string, field: string) => updateCreatorField.bind(null, id, field);

import { saveCreator } from "../actions/delivery";

export const dynamic = "force-dynamic";
export const metadata = { title: "Influencer database" };

const compact = (n: number | null) => (n ? new Intl.NumberFormat("en-IN", { notation: "compact" }).format(n) : "—");

/**
 * GENESIS INFLUENCE'S CREATOR NETWORK. Every creator Genesis has worked with or
 * scouted, with reach, rates and campaign history — and every creator who
 * applies through the website's Influencer Onboarding form lands here too.
 */
type Params = { q?: string; platform?: string | string[]; tier?: string | string[]; niche?: string | string[]; city?: string | string[]; source?: string | string[]; min?: string; max?: string; limit?: string };
const many = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []).filter(Boolean);

/* A niche worth offering: words, not a number or a stray sentence from an imported sheet. */
const usableNiche = (n: string) => /^[A-Za-z][A-Za-z &/'+.-]{1,38}$/.test(n.trim()) && !/^\d/.test(n);

export default async function CreatorsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const viewer = await requireStaff();
  if (!seesCreators(viewer)) redirect("/admin/forbidden");
  const p = await searchParams;
  const platforms = many(p.platform).filter((x) => PLATFORMS.some(([v]) => v === x)) as Platform[];
  const tiers = many(p.tier).filter((x) => x in CREATOR_TIER) as CreatorTier[];
  const niches = many(p.niche);
  const cities = many(p.city);
  const sources = many(p.source);
  const min = Number(p.min) || 0;
  const max = Number(p.max) || 0;
  const limit = Math.min(Math.max(Number(p.limit) || 300, 300), 3000);
  const prisma = getPrisma();
  /* "Only what they add": their own entries, never the rest of the database (lib/crm/scope creatorAccess). */
  const own = creatorAccess(viewer) === "own";
  const mine = own ? Prisma.sql`and c.created_by_id = ${viewer.id}` : Prisma.empty;
  /*
   * A niche matches by its words, whatever the sheet called it: "Health &
   * Wellness" finds "Health", "holistic health", "Health&fitness" and
   * "Wellness"; "Skincare" finds "Skin Care".
   */
  const nicheWords = [...new Set(niches.flatMap((n) => n.toLowerCase().split(/\s*(?:&|\/|,|\band\b|\+)\s*/).map((w) => w.replace(/[^a-z0-9]/g, "")).filter((w) => w.length > 1)))];
  const nicheIds = nicheWords.length
    ? (await prisma.$queryRaw<{ id: string }[]>`select id from crm_creators c where exists (select 1 from unnest(c.niches) n where regexp_replace(lower(n), '[^a-z0-9]', '', 'g') like any (${nicheWords.map((w) => `%${w}%`)}::text[])) ${mine}`).map((r) => r.id)
    : null;
  /* Several values in one filter widen it (any of them); different filters narrow each other. */
  const where: Prisma.CreatorWhereInput = {
    AND: [
      creatorScope(viewer),
      p.q ? { OR: [{ name: { contains: p.q, mode: "insensitive" } }, { handle: { contains: p.q.replace(/^@/, ""), mode: "insensitive" } }] } : {},
      platforms.length ? { platform: { in: platforms } } : {},
      tiers.length ? { tier: { in: tiers } } : {},
      nicheIds ? { id: { in: nicheIds } } : {},
      cities.length ? { OR: cities.map((c) => ({ city: { contains: c, mode: "insensitive" as const } })) } : {},
      sources.length ? { source: { in: sources } } : {},
      min || max ? { followers: { ...(min ? { gte: min } : {}), ...(max ? { lte: max } : {}) } } : {},
    ],
  };
  const [creators, total, matching, nicheRows, cityRows, sourceRows] = await Promise.all([
    prisma.creator.findMany({ where, orderBy: { followers: "desc" }, take: limit, include: { _count: { select: { campaigns: true } } } }),
    prisma.creator.count({ where: creatorScope(viewer) }),
    prisma.creator.count({ where }),
    prisma.$queryRaw<{ niche: string; n: bigint }[]>`select trim(n) as niche, count(*) as n from crm_creators c, unnest(c.niches) n where true ${mine} group by 1 order by 2 desc limit 400`,
    prisma.$queryRaw<{ city: string; n: bigint }[]>`select trim(split_part(city, '-', 1)) as city, count(*) as n from crm_creators c where city is not null and city <> '' ${mine} group by 1 order by 2 desc limit 300`,
    prisma.$queryRaw<{ source: string; n: bigint }[]>`select source, count(*) as n from crm_creators c where source is not null and source <> '' ${mine} group by 1 order by 2 desc limit 200`,
  ]);
  const seen = new Set<string>();
  const nicheOptions = [...NICHES, ...nicheRows.map((n) => n.niche).filter(usableNiche)]
    .filter((n) => {
      const key = n.toLowerCase().replace(/[^a-z0-9]/g, "");
      return !seen.has(key) && Boolean(seen.add(key));
    })
    .map((n) => [n, n.charAt(0).toUpperCase() + n.slice(1)] as const);
  const cityOptions = [...new Set(cityRows.map((c) => c.city.replace(/\s+/g, " ")).filter((c) => /^[A-Za-z][A-Za-z .'-]{1,40}$/.test(c)).map((c) => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()))].map((c) => [c, c] as const);
  const filters = [
    p.q && `“${p.q}”`,
    ...platforms.map((x) => PLATFORMS.find(([v]) => v === x)?.[1] ?? x),
    ...tiers.map((x) => CREATOR_TIER[x]),
    ...niches,
    ...cities,
    ...sources,
    min && `≥ ${min.toLocaleString("en-IN")} followers`,
    max && `≤ ${max.toLocaleString("en-IN")} followers`,
  ].filter(Boolean) as string[];
  const more = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) for (const x of many(v as string | string[])) if (k !== "limit") more.append(k, x);
  more.set("limit", String(limit + 300));
  return (
    <>
      <PageHead kicker="Influence" title="Influencer database" sub={own ? `${total.toLocaleString("en-IN")} creators you’ve added · everything you add is saved to Genesis’s database` : `${total.toLocaleString("en-IN")} creators in the database`} exportKind={isSuperAdmin(viewer) ? "creators" : undefined}>
        <Link href="/admin/creators/import" className="crm-btn crm-btn-secondary crm-btn-sm">Import <Upload className="size-4" aria-hidden /></Link>
      </PageHead>
      <form action="/admin/creators" className="flex flex-wrap items-start gap-2">
        <input name="q" defaultValue={p.q} placeholder="Name or @handle" className="crm-input max-w-[13rem]" />
        <MultiSelect name="platform" label="Any platform" options={PLATFORMS} defaultValue={platforms} className="w-[10rem]" />
        <MultiSelect name="tier" label="Any tier" options={Object.entries(CREATOR_TIER)} defaultValue={tiers} className="w-[11rem]" />
        <MultiSelect name="niche" label="Any niche" options={nicheOptions} defaultValue={niches} className="w-[13rem]" />
        <MultiSelect name="city" label="Any city" options={cityOptions} defaultValue={cities} className="w-[12rem]" />
        {/* Where they came from: a Google Sheet, an Excel file, an agency… (Genesis, 22 Oct 2026). */}
        <MultiSelect name="source" label="Any source" options={sourceRows.map((r) => [r.source, `${r.source} (${Number(r.n).toLocaleString("en-IN")})`] as const)} defaultValue={sources} className="w-[13rem]" />
        <input name="min" defaultValue={p.min} placeholder="Min followers" inputMode="numeric" className="crm-input max-w-[8.5rem]" />
        <input name="max" defaultValue={p.max} placeholder="Max followers" inputMode="numeric" className="crm-input max-w-[8.5rem]" />
        <button className="crm-btn crm-btn-primary crm-btn-sm">Search</button>
        {(p.q || platforms.length || tiers.length || niches.length || cities.length || sources.length || min || max) ? <Link href="/admin/creators" className="crm-btn crm-btn-secondary crm-btn-sm">Clear all</Link> : null}
      </form>
      {/* The search's result, said plainly (Genesis, 13 Oct 2026: "show search results as well"). */}
      <p className="text-[0.9375rem] text-ash" role="status">
        <span className="text-[1.25rem] font-semibold tabular-nums text-bone">{matching.toLocaleString("en-IN")}</span> {matching === 1 ? "result" : "results"}
        {filters.length > 0 && <> for {filters.map((f, i) => <span key={i} className="ml-1 inline-block rounded-full border border-[var(--glass-border)] px-2 py-0.5 text-[0.8125rem] text-bone">{f}</span>)}</>}
        {creators.length < matching && <span className="text-faint"> · showing the top {creators.length} by followers</span>}
      </p>
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
            <Table head={["", "Tier", "Name", "Category", "IG link", "Followers", "Avg views", "ER", "1 IG Reel", "Story + LIB", "DL (1 month)", "Location", "Contact", "Agency & POC", "Source", "Campaigns"]}>
              {creators.map((c) => (
                <tr key={c.id} className={c.blacklisted ? "opacity-50" : ""}>
                  <td><input type="checkbox" name="creators" value={c.id} disabled={c.blacklisted} aria-label={`Select ${c.name}`} className="size-4 accent-[#ffc516]" /></td>
                  {/* Every cell edits in place (Genesis, 22 Oct 2026); the name still opens the full profile. */}
                  <td className="whitespace-nowrap text-[0.8125rem]"><EditCell value={c.tier} save={edit(c.id, "tier")} placeholder="Tier" options={Object.entries(CREATOR_TIER)}>{CREATOR_TIER[c.tier].split(" ")[0]}</EditCell></td>
                  <td>
                    <EditCell value={c.name} save={edit(c.id, "name")} placeholder="Name"><Link href={`/admin/creators/${c.id}`} className="text-bone hover:underline">{c.name}</Link></EditCell>
                    <span className="block text-[0.8125rem] text-ash"><EditCell value={c.handle} save={edit(c.id, "handle")} placeholder="Handle">@{c.handle}{c.platform !== "INSTAGRAM" ? ` · ${c.platform.toLowerCase()}` : ""}</EditCell></span>
                    <span className="flex flex-wrap gap-1">
                      {c.tags.map((t) => <Badge key={t} tone={t.startsWith("Applied") ? "info" : "muted"}>{t}</Badge>)}
                      {c.blacklisted && <Badge tone="bad">Do not use</Badge>}
                    </span>
                  </td>
                  <td className="max-w-[12rem] text-[0.875rem]"><EditCell value={c.niches.join(", ")} save={edit(c.id, "niches")} placeholder="Category, comma separated" wide>{c.niches.join(", ") || "—"}</EditCell></td>
                  <td>
                    <EditCell value={c.profileUrl ?? ""} save={edit(c.id, "profileUrl")} placeholder="Profile link" wide>
                      {c.profileUrl ? <a href={c.profileUrl} target="_blank" rel="noreferrer" className="crm-link text-[0.8125rem]">Profile ↗</a> : "—"}
                    </EditCell>
                    {c.youtubeUrl && <a href={c.youtubeUrl} target="_blank" rel="noreferrer" className="crm-link block text-[0.8125rem]">YouTube ↗</a>}
                  </td>
                  <td className="tabular-nums"><EditCell value={String(c.followers)} save={edit(c.id, "followers")} placeholder="Followers">{compact(c.followers)}</EditCell></td>
                  <td className="tabular-nums"><EditCell value={c.avgViews ? String(c.avgViews) : ""} save={edit(c.id, "avgViews")} placeholder="Avg views">{compact(c.avgViews)}</EditCell></td>
                  <td className="tabular-nums"><EditCell value={c.engagementRate ? String(c.engagementRate) : ""} save={edit(c.id, "engagementRate")} placeholder="ER %">{c.engagementRate ? `${c.engagementRate}%` : "—"}</EditCell></td>
                  <td className="tabular-nums"><EditCell value={c.reelRatePaise ? String(c.reelRatePaise / 100) : ""} save={edit(c.id, "reelRate")} placeholder="1 IG Reel ₹">{c.reelRatePaise ? money(c.reelRatePaise) : "—"}</EditCell></td>
                  <td className="tabular-nums"><EditCell value={c.storyRatePaise ? String(c.storyRatePaise / 100) : ""} save={edit(c.id, "storyRate")} placeholder="Story + LIB ₹">{c.storyRatePaise ? money(c.storyRatePaise) : "—"}</EditCell></td>
                  <td className="tabular-nums"><EditCell value={c.dlRatePaise ? String(c.dlRatePaise / 100) : ""} save={edit(c.id, "dlRate")} placeholder="DL (1 month) ₹">{c.dlRatePaise ? money(c.dlRatePaise) : "—"}</EditCell></td>
                  <td><EditCell value={c.city ?? ""} save={edit(c.id, "city")} placeholder="City">{c.city ?? "—"}</EditCell></td>
                  <td className="max-w-[14rem] space-y-0.5 text-[0.8125rem]">
                    <EditCell value={c.phone ?? ""} save={edit(c.id, "phone")} placeholder="Phone">{c.phone ?? <span className="text-faint">Phone</span>}</EditCell>
                    <EditCell value={c.email ?? ""} save={edit(c.id, "email")} placeholder="Email" wide><span className="break-all">{c.email ?? <span className="text-faint">Email</span>}</span></EditCell>
                  </td>
                  <td className="max-w-[14rem] space-y-0.5 text-[0.8125rem]">
                    <EditCell value={c.managedBy ?? ""} save={edit(c.id, "managedBy")} placeholder="Agency / manager" wide>{c.managedBy ?? <span className="text-faint">Agency</span>}</EditCell>
                    <EditCell value={c.pocName ?? ""} save={edit(c.id, "pocName")} placeholder="Agency POC" wide>{c.pocName ? <span className="text-bone">POC: {c.pocName}</span> : <span className="text-faint">POC</span>}</EditCell>
                    <EditCell value={c.pocContact ?? ""} save={edit(c.id, "pocContact")} placeholder="POC phone or email" wide><span className="break-all">{c.pocContact ?? <span className="text-faint">POC phone / email</span>}</span></EditCell>
                  </td>
                  <td className="max-w-[12rem] text-[0.8125rem]"><EditCell value={c.source ?? ""} save={edit(c.id, "source")} placeholder="Source" wide>{c.source ?? "—"}</EditCell></td>
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
          <PickBar formId="pick-creators" excel />
        </>
      )}
    </>
  );
}
