import { WORLD } from "@/lib/world-map";

/*
 * SESSIONS BY COUNTRY, ON A MAP (Genesis, 5 Nov 2026, after Wix's): each
 * country shaded by its sessions, the scale underneath, and the countries
 * listed beside it with their bars. Drawn on the server from a fixed outline
 * of the world (lib/world-map), so nothing loads in the browser.
 */
const names = new Intl.DisplayNames(["en"], { type: "region" });
export const countryName = (code: string | null) => {
  if (!code || code === "Unknown") return "Unknown";
  try {
    return names.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
};

export function CountryMap({ rows }: { rows: { code: string; n: number }[] }) {
  if (!rows.length) return <p className="text-[0.875rem] text-ash">No visits yet.</p>;
  const by = new Map(rows.map((r) => [r.code.toUpperCase(), r.n]));
  const max = Math.max(1, ...rows.map((r) => r.n));
  const min = Math.min(...rows.map((r) => r.n));
  /* Light to full brand yellow; at least a clear tint for a single session. */
  const shade = (n: number) => 0.28 + 0.72 * (max === min ? 1 : (n - min) / (max - min));
  const top = [...rows].filter((r) => r.code !== "Unknown").sort((a, b) => b.n - a.n).slice(0, 8);
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)] lg:items-start">
      <div>
        <svg viewBox={`0 0 ${WORLD.width} ${WORLD.height}`} className="h-auto w-full text-bone" role="img" aria-label="Sessions by country, on a world map">
          {WORLD.countries.map(([code, d], i) => {
            const n = by.get(code);
            return (
              <path key={`${code}-${i}`} d={d} fill={n ? "#ffc516" : "currentColor"} fillOpacity={n ? shade(n) : 0.09} stroke="var(--crm-panel, #141216)" strokeWidth={0.5}>
                <title>{`${countryName(code)}: ${n ?? 0} session${n === 1 ? "" : "s"}`}</title>
              </path>
            );
          })}
        </svg>
        <div className="mt-3 flex items-center gap-2 text-[0.75rem] text-ash" aria-hidden>
          <span className="tabular-nums">{min}</span>
          <span className="h-2 w-32 rounded-full" style={{ background: "linear-gradient(90deg, rgb(255 197 22 / 0.28), #ffc516)" }} />
          <span className="tabular-nums">{max}</span>
          <span className="ml-1">sessions</span>
        </div>
      </div>
      <div>
        <p className="mb-3 text-[0.8125rem] font-semibold text-bone">Countries</p>
        <ul className="space-y-3">
          {top.map((r) => (
            <li key={r.code}>
              <div className="flex items-baseline justify-between gap-3 text-[0.875rem]">
                <span className="min-w-0 truncate text-bone">{countryName(r.code)}</span>
                <span className="tabular-nums text-bone">{r.n}</span>
              </div>
              <span className="mt-1 block h-1.5 rounded-full bg-[var(--hover-wash)]"><span className="block h-1.5 rounded-full bg-[#ffc516]" style={{ width: `${(r.n / max) * 100}%` }} /></span>
            </li>
          ))}
        </ul>
        {rows.some((r) => r.code === "Unknown") && <p className="mt-3 text-[0.75rem] text-faint">{by.get("UNKNOWN")} with no country (local or private visits).</p>}
      </div>
    </div>
  );
}
