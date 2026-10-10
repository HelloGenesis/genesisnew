import { type Row, compact, metrics, pct, rupees } from "@/lib/crm/report";

/**
 * A CAMPAIGN REPORT — the same page for Genesis and the client: headline
 * numbers, then every creator's post with its metrics, then the summary.
 * Prints cleanly to PDF.
 */
export function CampaignReport({ title, client, rows, summary, showFees = true, heading = true }: { title: string; client: string; rows: Row[]; summary: string | null; showFees?: boolean; heading?: boolean }) {
  const t = metrics(rows);
  const tiles: [string, string][] = [
    ["Creators", String(t.creators)],
    ["Live posts", String(t.live)],
    ["Views", compact(t.views)],
    ["Reach", compact(t.reach)],
    ["Likes", compact(t.likes)],
    ["Comments", compact(t.comments)],
    ["Shares", compact(t.shares)],
    ["Saves", compact(t.saves)],
    ["Engagement rate", pct(t.engagementRate)],
    ...(showFees ? ([["Spend", rupees(t.spend)], ["Cost per view", t.cpv === null ? "—" : rupees(Math.round(t.cpv * 100) / 100)], ["Cost per engagement", t.cpe === null ? "—" : rupees(Math.round(t.cpe))]] as [string, string][]) : []),
  ];
  return (
    <section className="space-y-5">
      {heading && (
        <header>
          <p className="micro-label">Campaign report · {client}</p>
          <h2 className="mt-1 text-[1.5rem] font-normal text-bone">{title}</h2>
        </header>
      )}
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-6">
        {tiles.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-[var(--hover-wash)] px-3 py-2.5">
            <dt className="text-[0.75rem] text-ash">{label}</dt>
            <dd className="text-[1.25rem] font-semibold tabular-nums text-bone">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="crm-card overflow-x-auto">
        <table className="crm-table">
          <thead>
            <tr><th>Creator</th><th>Status</th><th>Posted</th><th>Views</th><th>Reach</th><th>Likes</th><th>Comments</th><th>Shares</th><th>Saves</th><th>ER</th>{showFees && <th>Fee</th>}<th>Notes</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const m = metrics([r]);
              return (
                <tr key={r.id}>
                  <td className="text-bone">
                    {r.name}
                    <span className="block text-[0.75rem] text-ash">@{r.handle} · {compact(r.followers)}{r.deliverables ? ` · ${r.deliverables}` : ""}</span>
                    {r.postUrl && <a href={r.postUrl} target="_blank" rel="noopener noreferrer" className="crm-link text-[0.75rem]">View post ↗</a>}
                  </td>
                  <td className="text-[0.8125rem]">{r.status.toLowerCase().replace("_", " ")}</td>
                  <td className="text-[0.8125rem]">{r.postedAt ? r.postedAt.toISOString().slice(0, 10) : "—"}</td>
                  <td className="tabular-nums">{compact(r.views)}</td>
                  <td className="tabular-nums">{compact(r.reach)}</td>
                  <td className="tabular-nums">{compact(r.likes)}</td>
                  <td className="tabular-nums">{compact(r.comments)}</td>
                  <td className="tabular-nums">{compact(r.shares)}</td>
                  <td className="tabular-nums">{compact(r.saves)}</td>
                  <td className="tabular-nums">{pct(m.engagementRate)}</td>
                  {showFees && <td className="tabular-nums">{rupees(r.feePaise)}</td>}
                  <td className="max-w-[16rem] text-[0.8125rem] text-ash">{r.notes ?? ""}</td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={12} className="py-6 text-center text-ash">No creators on this campaign yet.</td></tr>}
          </tbody>
        </table>
      </div>
      {summary && (
        <div className="crm-card crm-pad">
          <h3 className="mb-2 text-[1rem] text-bone">Summary</h3>
          <p className="whitespace-pre-wrap text-pretty text-ash">{summary}</p>
        </div>
      )}
    </section>
  );
}
