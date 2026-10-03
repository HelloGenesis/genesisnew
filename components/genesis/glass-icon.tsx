import { useId, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * GENESIS GLASS ICONS (Genesis, 2 Oct 2026: "make these icons according to
 * our gradient colours and replace whatever icons we have on our website").
 *
 * The direction Genesis sent: two shapes per icon — one SOLID, behind, and
 * one FROSTED, in front, overlapping it — so the solid shape shows through
 * the glass, blurred. Here the solid shape wears the brand gradient (violet →
 * coral → amber) and the frosted one is a pale glass with the gradient
 * diffused inside it, a hairline edge and any white detail on top.
 *
 * Every icon is drawn on a 64-unit square: `back` (solid, painted with the
 * gradient passed in), `front` (one path — the glass), and an optional
 * `detail` in white over the glass.
 */

const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r},${y}h${w - 2 * r}a${r},${r} 0 0 1 ${r},${r}v${h - 2 * r}a${r},${r} 0 0 1 -${r},${r}h-${w - 2 * r}a${r},${r} 0 0 1 -${r},-${r}v-${h - 2 * r}a${r},${r} 0 0 1 ${r},-${r}z`;
const circ = (cx: number, cy: number, r: number) => `M${cx - r},${cy}a${r},${r} 0 1 0 ${2 * r},0a${r},${r} 0 1 0 -${2 * r},0z`;

type Design = {
  back: (paint: string) => ReactNode;
  front: string;
  detail?: ReactNode;
};

const W = { fill: "#fff" } as const;
const WS = { fill: "none", stroke: "#fff", strokeWidth: 3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const DESIGNS = {
  /* --- money, plans and payment --------------------------------------- */
  card: {
    back: (p) => <path d={rr(24, 12, 32, 22, 5)} fill={p} />,
    front: rr(8, 26, 38, 26, 6),
    detail: (
      <>
        <rect x="14" y="41" width="13" height="3.5" rx="1.75" {...W} />
        <circle cx="38" cy="34" r="3" {...W} />
      </>
    ),
  },
  emi: {
    back: (p) => (
      <>
        <path d={circ(45, 42, 12)} fill={p} />
        <path d={rr(17, 9, 5, 11, 2.5)} fill={p} />
        <path d={rr(31, 9, 5, 11, 2.5)} fill={p} />
      </>
    ),
    front: rr(9, 15, 36, 34, 8),
    detail: (
      <>
        {[17, 25, 33].flatMap((x) => [29, 37].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r="2" {...W} />))}
      </>
    ),
  },
  phone: {
    back: (p) => <path d={rr(30, 8, 22, 36, 6)} fill={p} />,
    front: rr(14, 16, 24, 42, 7),
    detail: <rect x="21" y="50" width="10" height="3" rx="1.5" {...W} />,
  },
  repeat: {
    back: (p) => <path d={circ(43, 32, 15)} fill={p} />,
    front: rr(6, 21, 44, 22, 11),
    detail: <path d="M14 32a6.5 6.5 0 1 1 3 5.5M14 36.5v-4.5h4.5" {...WS} strokeWidth={2.6} />,
  },
  shield: {
    back: (p) => <path d={circ(44, 20, 11)} fill={p} />,
    front: "M30 10l18 6v14c0 12-8 20-18 24c-10-4-18-12-18-24v-14z",
    detail: <path d="M22 32l6 6l10-11" {...WS} />,
  },
  pause: {
    back: (p) => <path d={circ(41, 25, 15)} fill={p} />,
    front: circ(27, 37, 17),
    detail: (
      <>
        <rect x="21" y="30" width="4" height="14" rx="2" {...W} />
        <rect x="29" y="30" width="4" height="14" rx="2" {...W} />
      </>
    ),
  },
  stop: {
    back: (p) => <path d={rr(30, 9, 24, 22, 6)} fill={p} />,
    front: rr(9, 17, 36, 36, 8),
    detail: <path d="M21 29l12 12M33 29l-12 12" {...WS} />,
  },
  receipt: {
    back: (p) => <path d={rr(30, 10, 22, 30, 6)} fill={p} />,
    front: "M14 14h26a4 4 0 0 1 4 4v36l-5-3l-5 3l-5-3l-5 3l-5-3l-5 3v-36a4 4 0 0 1 4-4z",
    detail: (
      <text x="27" y="40" textAnchor="middle" fontSize="17" fontWeight="600" fill="#fff" fontFamily="system-ui, sans-serif">
        ₹
      </text>
    ),
  },
  check: {
    back: (p) => <path d="M12 31l12 12l28-28" fill="none" stroke={p} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />,
    front: circ(24, 43, 10),
  },
  plus: {
    back: (p) => <path d={circ(42, 22, 13)} fill={p} />,
    front: rr(10, 20, 36, 36, 10),
    detail: <path d="M28 30v16M20 38h16" {...WS} />,
  },
  chat: {
    back: (p) => <path d={rr(28, 8, 28, 24, 8)} fill={p} />,
    front: "M17 20h22a9 9 0 0 1 9 9v12a9 9 0 0 1-9 9h-12l-9 7v-7a9 9 0 0 1-9-9v-12a9 9 0 0 1 9-9z",
    detail: (
      <>
        <circle cx="20" cy="35" r="2.4" {...W} />
        <circle cx="28" cy="35" r="2.4" {...W} />
        <circle cx="36" cy="35" r="2.4" {...W} />
      </>
    ),
  },

  /* --- the process ---------------------------------------------------- */
  idea: {
    back: (p) => <path d={rr(24, 47, 16, 10, 4)} fill={p} />,
    front: "M32 8a17 17 0 0 1 10 30.8v4.2a3 3 0 0 1-3 3h-14a3 3 0 0 1-3-3v-4.2a17 17 0 0 1 10-30.8z",
    detail: <path d="M26 28q3 5 6 0q3 5 6 0M32 30v10" {...WS} strokeWidth={2.4} />,
  },
  queue: {
    back: (p) => <path d={rr(30, 28, 24, 24, 7)} fill={p} />,
    front: rr(9, 12, 36, 32, 8),
    detail: (
      <>
        <rect x="16" y="21" width="20" height="3" rx="1.5" {...W} />
        <rect x="16" y="28" width="14" height="3" rx="1.5" {...W} />
        <rect x="16" y="35" width="17" height="3" rx="1.5" {...W} />
      </>
    ),
  },
  create: {
    back: (p) => <path d="M40 6l5 13l13 5l-13 5l-5 13l-5-13l-13-5l13-5z" fill={p} />,
    front: "M22 24l4.5 11l11 4.5l-11 4.5l-4.5 11l-4.5-11l-11-4.5l11-4.5z",
  },
  review: {
    back: (p) => <path d={circ(32, 32, 11)} fill={p} />,
    front: "M5 32c8-14 46-14 54 0c-8 14-46 14-54 0z",
    detail: <circle cx="36" cy="28" r="3" {...W} />,
  },
  calendar: {
    back: (p) => (
      <>
        <path d={rr(19, 8, 6, 12, 3)} fill={p} />
        <path d={rr(39, 8, 6, 12, 3)} fill={p} />
        <path d={circ(48, 46, 10)} fill={p} />
      </>
    ),
    front: rr(11, 15, 42, 40, 9),
    detail: (
      <text x="32" y="44" textAnchor="middle" fontSize="18" fontWeight="600" fill="#fff" fontFamily="system-ui, sans-serif">
        31
      </text>
    ),
  },
  clock: {
    back: (p) => <path d={circ(44, 20, 12)} fill={p} />,
    front: circ(29, 36, 19),
    detail: <path d="M29 26v10l7 5" {...WS} />,
  },
  delivery: {
    back: (p) => <path d={rr(10, 38, 44, 18, 7)} fill={p} />,
    front: circ(32, 25, 16),
    detail: <path d="M32 33v-15M25.5 24l6.5-6.5l6.5 6.5" {...WS} />,
  },
  check2: {
    back: (p) => <path d={circ(42, 24, 13)} fill={p} />,
    front: circ(28, 38, 16),
    detail: <path d="M21 38l5 5l9-10" {...WS} />,
  },

  /* --- the work ------------------------------------------------------- */
  brand: {
    back: (p) => <path d={rr(22, 8, 26, 22, 6)} fill={p} />,
    front: rr(10, 22, 42, 32, 9),
    detail: <path d="M22 38h18" {...WS} />,
  },
  avatar: {
    back: (p) => <path d="M8 56c0-13 10-21 24-21s24 8 24 21z" fill={p} />,
    front: circ(32, 22, 13),
  },
  users: {
    back: (p) => (
      <>
        <path d={circ(45, 21, 9)} fill={p} />
        <path d="M31 53c0-10 6-16 14-16s14 6 14 16z" fill={p} />
      </>
    ),
    front: `${circ(23, 24, 10)}M5 55c0-11 8-18 18-18s18 7 18 18z`,
  },
  voice: {
    back: (p) => <path d={circ(45, 22, 13)} fill={p} />,
    front: rr(8, 24, 46, 24, 12),
    detail: (
      <>
        {[18, 24, 30, 36, 42].map((x, i) => {
          const h = [6, 12, 16, 10, 6][i];
          return <rect key={x} x={x - 1.5} y={36 - h / 2} width="3" height={h} rx="1.5" {...W} />;
        })}
      </>
    ),
  },
  sound: {
    back: (p) => (
      <>
        <path d={rr(28, 10, 6, 34, 3)} fill={p} />
        <path d={rr(28, 10, 22, 9, 4)} fill={p} />
        <path d={circ(22, 46, 10)} fill={p} />
      </>
    ),
    front: circ(42, 40, 12),
  },
  motion: {
    back: (p) => <path d={circ(42, 24, 15)} fill={p} />,
    front: circ(27, 37, 18),
    detail: <path d="M23 29v16l13-8z" {...W} />,
  },
  video: {
    back: (p) => <path d="M40 30l16-10v24l-16-10z" fill={p} />,
    front: rr(6, 18, 40, 28, 8),
    detail: <circle cx="17" cy="27" r="3" {...W} />,
  },
  text: {
    back: (p) => <path d={rr(30, 8, 24, 24, 7)} fill={p} />,
    front: rr(9, 18, 36, 36, 9),
    detail: <path d="M18 28h18M27 28v18" {...WS} />,
  },
  palette: {
    back: (p) => <path d={circ(45, 22, 12)} fill={p} />,
    front: "M32 12c13 0 22 8 22 18c0 7-5 10-10 10h-4c-3 0-5 3-3 6c2 4-1 8-6 8c-12 0-21-10-21-21s10-21 22-21z",
    detail: (
      <>
        <circle cx="22" cy="28" r="3" {...W} />
        <circle cx="31" cy="21" r="3" {...W} />
        <circle cx="41" cy="25" r="3" {...W} />
      </>
    ),
  },
  script: {
    back: (p) => <path d={rr(30, 8, 22, 28, 6)} fill={p} />,
    front: rr(12, 16, 32, 40, 7),
    detail: (
      <>
        <rect x="19" y="27" width="18" height="3" rx="1.5" {...W} />
        <rect x="19" y="34" width="18" height="3" rx="1.5" {...W} />
        <rect x="19" y="41" width="11" height="3" rx="1.5" {...W} />
      </>
    ),
  },
  camera: {
    back: (p) => <path d={rr(20, 10, 24, 16, 5)} fill={p} />,
    front: rr(7, 19, 50, 34, 10),
    detail: <circle cx="32" cy="36" r="8" {...WS} />,
  },
  edit: {
    back: (p) => <path d={rr(12, 46, 34, 8, 4)} fill={p} />,
    front: "M41 9l12 12l-25 25h-12v-12z",
    detail: <path d="M35 15l12 12" {...WS} />,
  },
  images: {
    back: (p) => <path d={rr(26, 8, 30, 26, 7)} fill={p} />,
    front: rr(8, 20, 36, 34, 8),
    detail: (
      <>
        <circle cx="19" cy="31" r="3.5" {...W} />
        <path d="M14 48l9-9l6 6l5-5l6 8z" {...W} />
      </>
    ),
  },
  bolt: {
    back: (p) => <path d={circ(42, 24, 14)} fill={p} />,
    front: "M33 7l-18 29h14l-4 21l23-31h-14z",
  },
  layers: {
    back: (p) => <path d={rr(22, 8, 32, 26, 8)} fill={p} />,
    front: rr(10, 24, 36, 30, 8),
  },
  star: {
    back: (p) => <path d={circ(45, 19, 11)} fill={p} />,
    front: "M30 10l6.5 13.5l14.5 2l-10.5 10.2l2.5 14.4l-13-6.9l-13 6.9l2.5-14.4l-10.5-10.2l14.5-2z",
  },
  target: {
    back: (p) => <path d={circ(41, 29, 17)} fill={p} />,
    front: circ(25, 36, 17),
    detail: <circle cx="25" cy="36" r="4" {...W} />,
  },
  building: {
    back: (p) => <path d={rr(32, 20, 22, 34, 5)} fill={p} />,
    front: rr(10, 10, 30, 44, 6),
    detail: (
      <>
        {[18, 28].flatMap((x) => [19, 28, 37].map((y) => <rect key={`${x}${y}`} x={x} y={y} width="5" height="5" rx="1.2" {...W} />))}
      </>
    ),
  },
  heart: {
    back: (p) => <path d={circ(46, 20, 11)} fill={p} />,
    front: "M30 53c-21-13-24-27-15-34c6-4 12-2 15 3c3-5 9-7 15-3c9 7 6 21-15 34z",
  },
  home: {
    back: (p) => <path d="M5 32l27-22l27 22z" fill={p} />,
    front: rr(13, 27, 38, 28, 7),
    detail: <rect x="28" y="40" width="8" height="15" rx="3" {...W} />,
  },
  bag: {
    back: (p) => <path d="M23 25v-6a9 9 0 0 1 18 0v6" fill="none" stroke={p} strokeWidth={5} strokeLinecap="round" />,
    front: rr(11, 22, 42, 33, 9),
    detail: <circle cx="32" cy="38" r="3" {...W} />,
  },
  rocket: {
    back: (p) => (
      <>
        <path d="M21 35l-11 13h13zM43 35l11 13h-13z" fill={p} />
        <path d={circ(32, 53, 5)} fill={p} />
      </>
    ),
    front: "M32 6c12 8 14 24 8 40h-16c-6-16-4-32 8-40z",
    detail: <circle cx="32" cy="24" r="4.5" {...W} />,
  },
  megaphone: {
    back: (p) => <path d={circ(46, 32, 12)} fill={p} />,
    front: "M10 26l32-13v38l-32-13z",
    detail: <rect x="15" y="30" width="10" height="4" rx="2" {...W} />,
  },
  briefcase: {
    back: (p) => <path d={rr(22, 9, 20, 14, 5)} fill={p} />,
    front: rr(7, 18, 50, 36, 9),
    detail: <path d="M14 33h36" {...WS} strokeWidth={2.6} />,
  },
  language: {
    back: (p) => <path d={rr(30, 24, 26, 24, 7)} fill={p} />,
    front: rr(8, 12, 32, 28, 8),
    detail: (
      <text x="24" y="33" textAnchor="middle" fontSize="16" fontWeight="600" fill="#fff" fontFamily="system-ui, sans-serif">
        Aa
      </text>
    ),
  },
  presentation: {
    back: (p) => (
      <>
        <path d={rr(29, 38, 6, 16, 3)} fill={p} />
        <path d={rr(18, 50, 28, 6, 3)} fill={p} />
      </>
    ),
    front: rr(7, 9, 50, 33, 8),
    detail: (
      <>
        <rect x="18" y="26" width="5" height="9" rx="1.5" {...W} />
        <rect x="27" y="20" width="5" height="15" rx="1.5" {...W} />
        <rect x="36" y="23" width="5" height="12" rx="1.5" {...W} />
      </>
    ),
  },
  mail: {
    back: (p) => <path d="M6 22l26 17l26-17v-3a7 7 0 0 0-7-7h-38a7 7 0 0 0-7 7z" fill={p} />,
    front: rr(6, 22, 52, 32, 8),
    detail: <path d="M14 32l18 11l18-11" {...WS} strokeWidth={2.6} />,
  },
  grid: {
    back: (p) => (
      <>
        <path d={rr(35, 9, 20, 20, 6)} fill={p} />
        <path d={rr(9, 35, 20, 20, 6)} fill={p} />
      </>
    ),
    front: `${rr(9, 9, 20, 20, 6)}${rr(35, 35, 20, 20, 6)}`,
  },
  drone: {
    back: (p) => (
      <>
        <path d={circ(14, 16, 8)} fill={p} />
        <path d={circ(50, 16, 8)} fill={p} />
      </>
    ),
    front: rr(14, 22, 36, 22, 9),
    detail: <circle cx="32" cy="33" r="4" {...W} />,
  },
} satisfies Record<string, Design>;

export type GlassIconName = keyof typeof DESIGNS;

/* The site's older icon names, onto this set. */
const ALIASES: Record<string, GlassIconName> = {
  sparkles: "create",
  subscribe: "card",
  autopay: "repeat",
};

export function glassIconFor(name: string): GlassIconName | undefined {
  if (name in DESIGNS) return name as GlassIconName;
  return ALIASES[name];
}

const STOPS = ["#8b5cf6", "#c066d9", "#f2607e", "#f5923e"];

export function GlassIcon({ name, className }: { name: GlassIconName; className?: string }) {
  const id = useId().replace(/:/g, "");
  const design: Design = DESIGNS[name];
  const paint = `url(#gi-g-${id})`;
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={cn("size-10 shrink-0 overflow-visible", className)}>
      <defs>
        <linearGradient id={`gi-g-${id}`} x1="0" y1="0" x2="1" y2="1">
          {STOPS.map((stop, index) => (
            <stop key={stop} offset={`${(index / (STOPS.length - 1)) * 100}%`} stopColor={stop} />
          ))}
        </linearGradient>
        {/* The glass's own tint: the gradient's light end, as the reference's periwinkle glass. */}
        <linearGradient id={`gi-t-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c3adff" />
          <stop offset="100%" stopColor="#ffb3a8" />
        </linearGradient>
        <linearGradient id={`gi-f-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.12" />
        </linearGradient>
        <filter id={`gi-b-${id}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.2" />
        </filter>
        <clipPath id={`gi-c-${id}`}>
          <path d={design.front} />
        </clipPath>
      </defs>

      {/* The solid shape, behind. */}
      {design.back(paint)}

      {/* The glass: the solid shape seen blurred through it, then the frost over that. */}
      <g clipPath={`url(#gi-c-${id})`}>
        <path d={design.front} fill={`url(#gi-t-${id})`} fillOpacity="0.78" />
        <g filter={`url(#gi-b-${id})`}>
          {design.back(paint)}
        </g>
        <path d={design.front} fill={`url(#gi-f-${id})`} />
      </g>
      <path d={design.front} fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="0.8" />

      {design.detail && <g opacity="0.96">{design.detail}</g>}
    </svg>
  );
}
