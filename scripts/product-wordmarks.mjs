/* Product wordmarks in the GENESIS MEDIA style: the GENESIS letters from the master wordmark, then the name in Codec Pro with MEDIA's gradient. */
/* Run: node scripts/product-wordmarks.mjs public/brand/products "COPILOT,NOVA,ELITE AI,AI LAB" (names in capitals; files are named after them). */
import fs from "node:fs";
import sharp from "sharp";
const og = await import(process.cwd() + "/node_modules/next/dist/compiled/@vercel/og/index.node.js");
const h = (await import("react")).default.createElement;
const FONT = fs.readFileSync("app/fonts/CodecPro-Regular.ttf");
const CAP = 168, TOP = 16, X = 1058, H = 200, SIZE = 270, TRACK = Number(process.env.TRACK ?? -17);
const STOPS = "#ffaf18 0%, #ff8f1b 24%, #fe6c1e 42%, #f06144 58%, #e7655d 66%, #cb74aa 84%, #ac84fe 100%";
const outDir = process.argv[2];
const names = (process.argv[3] ?? "MEDIA").split(",");

async function nameMask(text) {
  const img = new og.ImageResponse(h("div", { style: { display: "flex", fontFamily: "codec", fontSize: SIZE, letterSpacing: TRACK * SIZE / 252, color: "#000", lineHeight: 1, whiteSpace: "nowrap", paddingLeft: 20 } }, text), { width: 2600, height: 360, fonts: [{ name: "codec", data: FONT, weight: 400, style: "normal" }] });
  const buf = Buffer.from(await img.arrayBuffer());
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  let x0 = 1e9, x1 = 0, y0 = 1e9, y1 = 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] > 128) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const k = CAP / (y1 - y0 + 1);
  const w = Math.round((x1 - x0 + 1) * k);
  const mask = await sharp(buf).extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 }).resize(w, CAP).png().toBuffer();
  return { mask, w };
}

for (const text of names) {
  const { mask, w } = await nameMask(text);
  const grad = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${CAP}"><defs><linearGradient id="g">${STOPS.split(", ").map((s) => { const [c, o] = s.split(" "); return `<stop offset="${o}" stop-color="${c}"/>`; }).join("")}</linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`);
  const word = await sharp(grad).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
  const W = X + w + 18;
  for (const v of ["dark", "light"]) {
    const genesis = await sharp(`public/brand/genesis-wordmark-${v}.png`).extract({ left: 0, top: 0, width: 1040, height: H }).png().toBuffer();
    const file = `${outDir}/${text.toLowerCase().replace(/\s+/g, "-")}-${v}.png`;
    await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([{ input: genesis, left: 0, top: 0 }, { input: word, left: X, top: TOP }]).png({ compressionLevel: 9 }).toFile(file);
    console.log(file, W, "name width", w);
  }
}
