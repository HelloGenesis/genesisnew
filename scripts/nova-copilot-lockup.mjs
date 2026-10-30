/*
 * The NOVA COPILOT logo (Genesis, 31 Oct 2026: "Nova's final logo + the
 * existing gradient COPILOT, but sleek and cooler"): the NOVA lockup
 * (scripts/nova-lockup.mjs), then COPILOT in MEDIA's gradient, Codec Pro set
 * wide and small, on NOVA's baseline. -light for dark grounds, -dark for light.
 * Run after nova-lockup: node scripts/nova-copilot-lockup.mjs public/brand/products
 */
import fs from "node:fs";
import sharp from "sharp";
const og = await import(process.cwd() + "/node_modules/next/dist/compiled/@vercel/og/index.node.js");
const h = (await import("react")).default.createElement;
const FONT = fs.readFileSync("app/fonts/CodecPro-Regular.ttf");
const STOPS = "#ffaf18 0%, #ff8f1b 24%, #fe6c1e 42%, #f06144 58%, #e7655d 66%, #cb74aa 84%, #ac84fe 100%";
const outDir = process.argv[2];
/* The NOVA files: 290 high, letters from 25 to 265 (cap 240). */
const NOVA_TOP = 25, NOVA_CAP = 240, WORD_CAP = Math.round(NOVA_CAP * 0.42), GAP = Math.round(NOVA_CAP * 0.42), SIZE = 270, TRACK = 0.34;

const img = new og.ImageResponse(h("div", { style: { display: "flex", fontFamily: "codec", fontSize: SIZE, letterSpacing: TRACK * SIZE, color: "#000", lineHeight: 1, whiteSpace: "nowrap", paddingLeft: 20 } }, "COPILOT"), { width: 3200, height: 360, fonts: [{ name: "codec", data: FONT, weight: 400, style: "normal" }] });
const buf = Buffer.from(await img.arrayBuffer());
const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
let x0 = 1e9, x1 = 0, y0 = 1e9, y1 = 0;
for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] > 128) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
const w = Math.round((x1 - x0 + 1) * (WORD_CAP / (y1 - y0 + 1)));
const mask = await sharp(buf).extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 }).resize(w, WORD_CAP).png().toBuffer();
const grad = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${WORD_CAP}"><defs><linearGradient id="g">${STOPS.split(", ").map((s) => { const [c, o] = s.split(" "); return `<stop offset="${o}" stop-color="${c}"/>`; }).join("")}</linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`);
const word = await sharp(grad).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();

for (const v of ["light", "dark"]) {
  const nova = `public/brand/products/nova-by-genesis-${v}.png`;
  const { width: nw, height: nh } = await sharp(nova).metadata();
  const W = nw + GAP + w + 12;
  await sharp({ create: { width: W, height: nh, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: nova, left: 0, top: 0 }, { input: word, left: nw + GAP, top: NOVA_TOP + NOVA_CAP - WORD_CAP }])
    .png({ compressionLevel: 9 })
    .toFile(`${outDir}/nova-copilot-${v}.png`);
  console.log(v, W, nh);
}
