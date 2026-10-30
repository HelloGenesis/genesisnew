/*
 * The NOVA logo (Genesis, 31 Oct 2026: "N Ø V Λ … white, just the orb in the
 * gradient"). Nova's thin drawn capitals — the same lines as
 * components/genesis/nova-glyphs, kept in step by hand — with the Brain's orb
 * in its own colours as the O (public/brand/genesis-orb.png, a still of
 * components/genesis/neural-orb). White letters for dark grounds (-light),
 * near-black for light ones (-dark).
 * Run: node scripts/nova-lockup.mjs public/brand/products
 */
import sharp from "sharp";

const STROKE = 7;
const GLYPHS = {
  N: { width: 82, lines: [[4, 0, 4, 100], [4, 0, 78, 100], [78, 0, 78, 100]] },
  V: { width: 96, lines: [[5, 0, 48, 100], [91, 0, 48, 100]] },
  A: { width: 96, lines: [[5, 100, 48, 0], [91, 100, 48, 0]] },
};
/* In cap-height units, as the hero: letters 0.66em, orb box 0.86em (its sphere ~83% of that), gaps 0.2em. */
const CAP = 100, ORB = Math.round((0.86 / 0.66) * CAP * 0.84), GAP = Math.round((0.2 / 0.66) * CAP * 0.92), SCALE = 2.4, PAD = 6;
const outDir = process.argv[2];

function long([x1, y1, x2, y2]) {
  const dx = x2 - x1, dy = y2 - y1, k = 20 / Math.hypot(dx, dy);
  return [x1 - dx * k, y1 - dy * k, x2 + dx * k, y2 + dy * k];
}
const glyph = (g, x, y, color, id) =>
  `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${g.width}" height="${CAP}"/></clipPath><g clip-path="url(#${id})" stroke="${color}" stroke-width="${STROKE}">${g.lines
    .map((l) => long(l))
    .map(([a, b, c, d]) => `<line x1="${x + a}" y1="${y + b}" x2="${x + c}" y2="${y + d}"/>`)
    .join("")}</g>`;

const H = ORB + PAD * 2, top = PAD + (ORB - CAP) / 2;
const xN = PAD, xO = xN + GLYPHS.N.width + GAP, xV = xO + ORB + GAP, xA = xV + GLYPHS.V.width + GAP;
const W = xA + GLYPHS.A.width + PAD;
const orb = await sharp("public/brand/genesis-orb.png").resize(Math.round(ORB * SCALE)).modulate({ brightness: 1.2, saturation: 1.15 }).linear([1, 1, 1, 1.6], [0, 0, 0, 0]).png().toBuffer();
for (const [v, color] of [["light", "#ffffff"], ["dark", "#141216"]]) {
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W * SCALE}" height="${H * SCALE}" viewBox="0 0 ${W} ${H}">${glyph(GLYPHS.N, xN, top, color, "n")}${glyph(GLYPHS.V, xV, top, color, "v")}${glyph(GLYPHS.A, xA, top, color, "a")}</svg>`);
  await sharp(svg)
    .composite([{ input: orb, left: Math.round(xO * SCALE), top: Math.round(PAD * SCALE) }])
    .png({ compressionLevel: 9 })
    .toFile(`${outDir}/nova-by-genesis-${v}.png`);
  console.log(v, Math.round(W * SCALE), Math.round(H * SCALE));
}
