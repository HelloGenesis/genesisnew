import "server-only";

import { getPrisma } from "@/lib/db";

/**
 * THE WEBSITE ANALYTICS DASHBOARD'S NUMBERS (app/(crm)/admin/analytics). One
 * period and the one before it, for the change on every stat.
 */
export type Range = { days: number; from: Date; to: Date; prevFrom: Date };

export function rangeOf(days: number): Range {
  const to = new Date();
  const from = new Date(to.getTime() - days * 86400_000);
  return { days, from, to, prevFrom: new Date(from.getTime() - days * 86400_000) };
}

const pct = (now: number, before: number) => (before === 0 ? (now === 0 ? 0 : null) : Math.round(((now - before) / before) * 100));

async function stats(from: Date, to: Date) {
  const prisma = getPrisma();
  const where = { startedAt: { gte: from, lt: to } };
  const [sessions, visitors, agg, bounced, fresh] = await Promise.all([
    prisma.siteSession.count({ where }),
    prisma.siteSession.groupBy({ by: ["visitorId"], where }).then((r) => r.length),
    prisma.$queryRaw<{ dur: number | null; pages: number | null }[]>`
      select avg(least(extract(epoch from (last_at - started_at)), 7200))::float as dur, avg(pages)::float as pages
      from site_sessions where started_at >= ${from} and started_at < ${to}`,
    prisma.siteSession.count({ where: { ...where, pages: { lte: 1 } } }),
    prisma.siteSession.count({ where: { ...where, isNew: true } }),
  ]);
  return {
    sessions,
    visitors,
    duration: Math.round(agg[0]?.dur ?? 0),
    pages: Math.round((agg[0]?.pages ?? 0) * 10) / 10,
    bounce: sessions ? Math.round((bounced / sessions) * 1000) / 10 : 0,
    newVisitors: fresh,
    returning: sessions - fresh,
  };
}

export async function analytics(r: Range) {
  const prisma = getPrisma();
  const where = { startedAt: { gte: r.from, lt: r.to } };
  const prevWhere = { startedAt: { gte: r.prevFrom, lt: r.from } };
  const [now, before, daily, sources, prevSources, pages, countries, devices, clicks, flows, live, leads, prevLeads] = await Promise.all([
    stats(r.from, r.to),
    stats(r.prevFrom, r.from),
    prisma.$queryRaw<{ day: string; n: number }[]>`
      select to_char(date_trunc('day', started_at at time zone 'Asia/Kolkata'), 'YYYY-MM-DD') as day, count(*)::int as n
      from site_sessions where started_at >= ${r.from} and started_at < ${r.to} group by 1 order by 1`,
    prisma.siteSession.groupBy({ by: ["source"], where, _count: true, orderBy: { _count: { source: "desc" } }, take: 8 }),
    prisma.siteSession.groupBy({ by: ["source"], where: prevWhere, _count: true }),
    prisma.$queryRaw<{ path: string; views: number; avg_ms: number; exits: number }[]>`
      with v as (
        select pv.path, pv.duration_ms, pv.session_id, pv.position, s.pages
        from site_page_views pv join site_sessions s on s.id = pv.session_id
        where pv.at >= ${r.from} and pv.at < ${r.to}
      )
      select path, count(*)::int as views, coalesce(avg(nullif(duration_ms, 0)), 0)::float as avg_ms,
             count(*) filter (where position = pages)::int as exits
      from v group by path order by views desc limit 10`,
    prisma.siteSession.groupBy({ by: ["country"], where, _count: true, orderBy: { _count: { country: "desc" } }, take: 250 }),
    prisma.siteSession.groupBy({ by: ["device"], where, _count: true, orderBy: { _count: { device: "desc" } } }),
    prisma.siteEvent.groupBy({ by: ["label"], where: { at: { gte: r.from, lt: r.to }, kind: "click" }, _count: true, orderBy: { _count: { label: "desc" } }, take: 8 }),
    prisma.$queryRaw<{ landing: string; next: string | null; n: number }[]>`
      select s.landing, pv.path as next, count(*)::int as n
      from site_sessions s left join site_page_views pv on pv.session_id = s.id and pv.position = 2
      where s.started_at >= ${r.from} and s.started_at < ${r.to}
      group by 1, 2 order by n desc limit 8`,
    prisma.siteSession.count({ where: { lastAt: { gte: new Date(Date.now() - 5 * 60_000) } } }),
    prisma.lead.count({ where: { workspaceId: null, createdAt: { gte: r.from, lt: r.to }, source: { in: ["WEBSITE_FORM", "CHECKOUT", "CALENDAR_BOOKING"] } } }),
    prisma.lead.count({ where: { workspaceId: null, createdAt: { gte: r.prevFrom, lt: r.from }, source: { in: ["WEBSITE_FORM", "CHECKOUT", "CALENDAR_BOOKING"] } } }),
  ]);
  /* Every day in the range, zeros included, so the chart doesn't skip quiet days. */
  const byDay = new Map(daily.map((d) => [d.day, d.n]));
  const days = Array.from({ length: r.days }, (_, i) => {
    const d = new Date(r.from.getTime() + (i + 1) * 86400_000);
    const key = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
    return { day: key, n: byDay.get(key) ?? 0 };
  });
  const prevSource = new Map(prevSources.map((s) => [s.source, s._count]));
  return {
    now,
    change: {
      sessions: pct(now.sessions, before.sessions),
      visitors: pct(now.visitors, before.visitors),
      duration: pct(now.duration, before.duration),
      pages: pct(now.pages, before.pages),
      bounce: pct(now.bounce, before.bounce),
      leads: pct(leads, prevLeads),
    },
    leads,
    days,
    sources: sources.map((s) => ({ name: s.source, n: s._count, change: pct(s._count, prevSource.get(s.source) ?? 0) })),
    pages: pages.map((p) => ({ path: p.path, views: p.views, avg: Math.round(p.avg_ms / 1000), exit: p.views ? Math.round((p.exits / p.views) * 100) : 0 })),
    /* Every country, for the map; the list shows the top few (components/crm/country-map). */
    countries: countries.map((c) => ({ code: c.country ?? "Unknown", n: c._count })),
    devices: devices.map((d) => ({ name: d.device, n: d._count })),
    clicks: clicks.map((c) => ({ label: c.label, n: c._count })),
    flows: flows.map((f) => ({ landing: f.landing, next: f.next, n: f.n })),
    live,
  };
}

export type Analytics = Awaited<ReturnType<typeof analytics>>;
