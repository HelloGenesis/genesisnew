/*
 * The NOVA logo (Genesis, 31 Oct 2026: "N Ø V Λ … white, just the orb in the
 * gradient"). Nova's thin drawn capitals — the same lines as
 * components/genesis/nova-glyphs, kept in step by hand — with the Brain's orb
 * in its own colours as the O (public/brand/genesis-orb.png, a still of
 * components/genesis/neural-orb). White letters for dark grounds (-light),
 * near-black for light ones (-dark).
 * Also a small version for the site header and the CRM's top bar (nova-small-*):
 * the orb much brighter, so it still reads as an O at 20-odd pixels, and
 * "by GENESIS MEDIA" small under the word, flush with the A.
 * Run: node scripts/nova-lockup.mjs public/brand/products
 */
import fs from "node:fs";
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

/* THE SMALL VERSION. "by" in Codec Pro and the GENESIS MEDIA logo as it is (ink rows 10-190 of the 1760x200 master), BY units tall. */
const og = await import(process.cwd() + "/node_modules/next/dist/compiled/@vercel/og/index.node.js");
const h = (await import("react")).default.createElement;
const BY = 30, BYGAP = 12;
async function word(text, color, height) {
  const img = new og.ImageResponse(h("div", { style: { display: "flex", fontFamily: "f", fontSize: 200, color, lineHeight: 1, paddingLeft: 20, paddingTop: 20 } }, text), { width: 600, height: 320, fonts: [{ name: "f", data: fs.readFileSync("app/fonts/CodecPro-Regular.ttf"), weight: 400, style: "normal" }] });
  const buf = Buffer.from(await img.arrayBuffer());
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  let x0 = 1e9, x1 = 0, y0 = 1e9, y1 = 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] > 128) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return sharp(buf).extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 }).resize({ height }).png().toBuffer();
}
const bright = await sharp("public/brand/genesis-orb.png").resize(Math.round(ORB * SCALE)).modulate({ brightness: 2.1, saturation: 1.5 }).linear([1, 1, 1, 4.5], [0, 0, 0, 0]).png().toBuffer();
const HS = H + BYGAP + BY;
for (const [v, color] of [["light", "#ffffff"], ["dark", "#141216"]]) {
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W * SCALE}" height="${HS * SCALE}" viewBox="0 0 ${W} ${HS}">${glyph(GLYPHS.N, xN, top, color, "n")}${glyph(GLYPHS.V, xV, top, color, "v")}${glyph(GLYPHS.A, xA, top, color, "a")}</svg>`);
  /* "by" is x-height sized: its b sits on the line with the logo's caps. */
  const gH = Math.round(BY * SCALE);
  const g = await sharp(`public/brand/genesis-wordmark-${v}.png`).extract({ left: 9, top: 10, width: 1742, height: 181 }).resize({ height: gH }).png().toBuffer();
  const gW = (await sharp(g).metadata()).width;
  const by = await word("by", color, Math.round(gH * 1.02));
  const byW = (await sharp(by).metadata()).width;
  const right = Math.round((xA + GLYPHS.A.width) * SCALE), y = Math.round((H + BYGAP) * SCALE);
  await sharp(svg)
    .composite([
      { input: bright, left: Math.round(xO * SCALE), top: Math.round(PAD * SCALE) },
      { input: g, left: right - gW, top: y },
      { input: by, left: right - gW - Math.round(gH * 0.45) - byW, top: y - Math.round(gH * 0.02) },
    ])
    .png({ compressionLevel: 9 })
    .toFile(`${outDir}/nova-small-${v}.png`);
  console.log("small", v, Math.round(W * SCALE), Math.round(HS * SCALE));
}
