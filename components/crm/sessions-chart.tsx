"use client";

import { useState } from "react";

/**
 * SESSIONS PER DAY (app/(crm)/admin/analytics): one series, so no legend; the
 * title names it. Thin bars with rounded tops on a recessive baseline, a
 * tooltip on hover, and the numbers as a table for screen readers.
 */
export function SessionsChart({ days }: { days: { day: string; n: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...days.map((d) => d.n));
  const nice = max <= 4 ? max : Math.ceil(max / 4) * 4;
  const W = 720, H = 200, pad = { l: 28, r: 8, t: 8, b: 22 };
  const bw = (W - pad.l - pad.r) / days.length;
  const y = (n: number) => pad.t + (H - pad.t - pad.b) * (1 - n / nice);
  const label = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const every = Math.ceil(days.length / 7);
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Sessions per day" onMouseLeave={() => setHover(null)}>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={pad.l} x2={W - pad.r} y1={y(nice * f)} y2={y(nice * f)} stroke="var(--glass-border)" strokeWidth={1} />
            <text x={pad.l - 6} y={y(nice * f) + 3} textAnchor="end" fontSize="10" fill="var(--text-faint, #8a857c)">{Math.round(nice * f)}</text>
          </g>
        ))}
        {days.map((d, i) => {
          const x = pad.l + i * bw;
          const h = H - pad.b - y(d.n);
          return (
            <g key={d.day} onMouseEnter={() => setHover(i)}>
              {/* The hit area is the whole column, wider than the bar. */}
              <rect x={x} y={pad.t} width={bw} height={H - pad.t - pad.b} fill="transparent" />
              {d.n > 0 && <rect x={x + bw * 0.2} y={y(d.n)} width={Math.max(2, bw * 0.6)} height={Math.max(2, h)} rx={Math.min(4, bw * 0.3)} fill={hover === i ? "#ffd75a" : "#ffc516"} />}
              {i % every === 0 && <text x={x + bw / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--text-faint, #8a857c)">{label(d.day)}</text>}
            </g>
          );
        })}
      </svg>
      {hover !== null && days[hover] && (
        <div className="pointer-events-none absolute top-0 rounded-lg border border-[var(--glass-border)] bg-[var(--surface-float)] px-2.5 py-1.5 text-[0.75rem] shadow-lg" style={{ left: `${((pad.l + (hover + 0.5) * bw) / W) * 100}%`, transform: "translateX(-50%)" }}>
          <span className="text-ash">{label(days[hover]!.day)}</span> · <span className="font-semibold text-bone">{days[hover]!.n} session{days[hover]!.n === 1 ? "" : "s"}</span>
        </div>
      )}
      <table className="sr-only">
        <tbody>{days.map((d) => <tr key={d.day}><td>{d.day}</td><td>{d.n}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
