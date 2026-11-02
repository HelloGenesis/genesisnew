import Link from "next/link";
import { redirect } from "next/navigation";

import { SessionsChart } from "@/components/crm/sessions-chart";
import { Card, PageHead } from "@/components/crm/ui";
import { analytics, type Analytics, rangeOf } from "@/lib/site-analytics-data";
import { isSuperAdmin } from "@/lib/crm/scope";
import { requireStaff } from "@/lib/crm/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Website analytics" };

const RANGES = [7, 30, 90] as const;
const time = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`);

/** The change since the period before: up green, down red; for bounce rate, down is good. */
function Change({ v, inverse = false }: { v: number | null; inverse?: boolean }) {
  if (v === null) return <span className="text-[0.75rem] text-faint">new</span>;
  if (v === 0) return <span className="text-[0.75rem] text-faint">no change</span>;
  const good = inverse ? v < 0 : v > 0;
  return <span className={`text-[0.75rem] font-medium ${good ? "text-[#22c55e]" : "text-[#ef4444]"}`}>{v > 0 ? "↑" : "↓"} {Math.abs(v)}%</span>;
}

function Bars({ rows, empty }: { rows: { name: string; n: number; change?: number | null; href?: string }[]; empty: string }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  if (!rows.length) return <p className="text-[0.875rem] text-ash">{empty}</p>;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.name}>
          <div className="flex items-baseline justify-between gap-3 text-[0.875rem]">
            <span className="min-w-0 truncate text-bone">{r.name}</span>
            <span className="flex shrink-0 items-center gap-2">
              {r.change !== undefined && <Change v={r.change} />}
              <span className="tabular-nums text-bone">{r.n}</span>
            </span>
          </div>
          <span className="mt-1 block h-1.5 rounded-full bg-[var(--hover-wash)]"><span className="block h-1.5 rounded-full bg-[#ffc516]" style={{ width: `${(r.n / max) * 100}%` }} /></span>
        </li>
      ))}
    </ul>
  );
}

/* What the numbers say, in a sentence each (Wix's "Insights"). */
function insights(a: Analytics) {
  const out: { tone: "good" | "warn"; text: string }[] = [];
  if (a.change.sessions !== null && a.change.sessions <= -20) out.push({ tone: "warn", text: `Visits fell ${Math.abs(a.change.sessions)}% on the period before.` });
  if (a.change.sessions !== null && a.change.sessions >= 20) out.push({ tone: "good", text: `Visits grew ${a.change.sessions}% on the period before.` });
  const top = a.sources[0];
  if (top) out.push({ tone: "good", text: `${top.name} brings the most visits: ${top.n} of ${a.now.sessions}.` });
  const rising = a.sources.find((s) => s.change !== null && s.change >= 50 && s.n >= 3);
  if (rising) out.push({ tone: "good", text: `${rising.name} is rising: ${rising.change}% more visits.` });
  const leaky = a.pages.find((p) => p.views >= 5 && p.exit >= 70);
  if (leaky) out.push({ tone: "warn", text: `${leaky.exit}% of visits on ${leaky.path} end there. Give it a clearer next step.` });
  if (a.now.sessions >= 10 && a.now.returning === 0) out.push({ tone: "warn", text: "No one came back this period: emails, WhatsApp and Instagram bring visitors back." });
  if (a.now.bounce >= 70 && a.now.sessions >= 10) out.push({ tone: "warn", text: `${a.now.bounce}% of visits see only one page.` });
  if (a.leads) out.push({ tone: "good", text: `The site brought ${a.leads} lead${a.leads === 1 ? "" : "s"} into the CRM.` });
  return out;
}

/**
 * WEBSITE ANALYTICS (Genesis, 31 Oct 2026: "a visitor analytics page and the
 * entire dashboard for the websites", after Wix's): visits, visitors, where
 * they came from, what they looked at and clicked, and the leads it brought,
 * from the site's own tracker (components/genesis/site-tracker). Owners only.
 */
export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const viewer = await requireStaff();
  if (!isSuperAdmin(viewer) || viewer.workspaceId) redirect("/admin/forbidden");
  const asked = (await searchParams).days;
  const days = RANGES.find((d) => String(d) === asked) ?? 30;
  const a = await analytics(rangeOf(days));
  const said = insights(a);
  return (
    <>
      <PageHead kicker="Home" title="Website analytics" sub={`genesismedia.co and its divisions · last ${days} days, compared with the ${days} before`}>
        <span className="flex items-center gap-2 rounded-full border border-[var(--glass-border)] px-3 py-1 text-[0.8125rem] text-ash">
          <span className={`size-2 rounded-full ${a.live ? "bg-[#22c55e]" : "bg-[var(--glass-border)]"}`} /> {a.live} live now
        </span>
        <nav className="flex gap-1">
          {RANGES.map((d) => (
            <Link key={d} href={`/admin/analytics?days=${d}`} aria-current={d === days ? "page" : undefined} className="crm-nav-link !min-h-9">{d} days</Link>
          ))}
        </nav>
      </PageHead>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {[
          ["Sessions", String(a.now.sessions), a.change.sessions, false],
          ["Unique visitors", String(a.now.visitors), a.change.visitors, false],
          ["Avg. session", time(a.now.duration), a.change.duration, false],
          ["Pages per session", String(a.now.pages), a.change.pages, false],
          ["Bounce rate", `${a.now.bounce}%`, a.change.bounce, true],
          ["Website leads", String(a.leads), a.change.leads, false],
        ].map(([label, value, change, inverse]) => (
          <div key={label as string} className="crm-card p-4">
            <p className="text-[0.8125rem] text-ash">{label as string}</p>
            <p className="mt-1 text-[1.75rem] font-semibold tabular-nums text-bone">{value as string}</p>
            <Change v={change as number | null} inverse={inverse as boolean} />
          </div>
        ))}
      </div>

      {a.now.sessions === 0 && (
        <p className="crm-notice">No visits recorded in this period yet. Visits are counted from the moment this page went live; check back after the site has had some traffic.</p>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card title="Sessions over time"><SessionsChart days={a.days} /></Card>
        <Card title="Traffic sources"><Bars rows={a.sources} empty="No visits yet." /></Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card title="Top pages">
          {a.pages.length ? (
            <table className="w-full text-left text-[0.875rem]">
              <thead className="text-[0.6875rem] uppercase tracking-[0.08em] text-faint">
                <tr><th className="pb-2 font-normal">Page</th><th className="pb-2 text-right font-normal">Views</th><th className="pb-2 text-right font-normal">Avg. time</th><th className="pb-2 text-right font-normal">Exit rate</th></tr>
              </thead>
              <tbody className="divide-y divide-[var(--glass-border)]">
                {a.pages.map((p) => (
                  <tr key={p.path}>
                    <td className="max-w-[18rem] truncate py-2 text-bone"><a href={p.path} target="_blank" rel="noopener noreferrer" className="hover:underline">{p.path}</a></td>
                    <td className="py-2 text-right tabular-nums text-bone">{p.views}</td>
                    <td className="py-2 text-right tabular-nums text-ash">{time(p.avg)}</td>
                    <td className="py-2 text-right tabular-nums text-ash">{p.exit}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="text-[0.875rem] text-ash">No page views yet.</p>}
        </Card>
        <Card title="Insights">
          {said.length ? (
            <ul className="space-y-3">
              {said.map((s) => (
                <li key={s.text} className="flex gap-2 text-[0.875rem] text-bone">
                  <span aria-hidden className={`mt-1.5 size-2 shrink-0 rounded-full ${s.tone === "good" ? "bg-[#22c55e]" : "bg-[#ffc516]"}`} />
                  {s.text}
                </li>
              ))}
            </ul>
          ) : <p className="text-[0.875rem] text-ash">Insights appear once there&apos;s a little traffic.</p>}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Countries"><Bars rows={a.countries} empty="No visits yet." /></Card>
        <Card title="Devices"><Bars rows={a.devices} empty="No visits yet." /></Card>
        <Card title="New vs returning">
          <Bars rows={[{ name: "New visitors", n: a.now.newVisitors }, { name: "Returning", n: a.now.returning }]} empty="No visits yet." />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Most clicked">
          <Bars rows={a.clicks.map((c) => ({ name: c.label, n: c.n }))} empty="No clicks yet." />
        </Card>
        <Card title="Where visits go next">
          {a.flows.length ? (
            <ul className="space-y-2 text-[0.875rem]">
              {a.flows.map((f) => (
                <li key={`${f.landing}>${f.next}`} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-bone">{f.landing} <span className="text-faint">→</span> {f.next ?? <span className="text-faint">left</span>}</span>
                  <span className="tabular-nums text-ash">{f.n}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-[0.875rem] text-ash">No visits yet.</p>}
        </Card>
      </div>
    </>
  );
}
