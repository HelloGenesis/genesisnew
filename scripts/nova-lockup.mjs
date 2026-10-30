/* The NOVA by GENESIS lockup (Genesis, 31 Oct 2026: "Nova written in the gradient but bold, and the Genesis logo as it is"): NOVA in Mont Heavy with MEDIA's gradient, then "by" and the GENESIS letters from the master wordmark, small, on NOVA's baseline. */
/* Run: node scripts/nova-lockup.mjs public/brand/products  (writes nova-by-genesis-dark.png and -light.png) */
import fs from "node:fs";
import sharp from "sharp";
const og = await import(process.cwd() + "/node_modules/next/dist/compiled/@vercel/og/index.node.js");
const h = (await import("react")).default.createElement;
const STOPS = [["#ffaf18", 0], ["#ff8f1b", 24], ["#fe6c1e", 42], ["#f06144", 58], ["#e7655d", 66], ["#cb74aa", 84], ["#ac84fe", 100]];
const H = 216, TOP = 16, CAP = 168, BASE = TOP + CAP, SMALL = 0.4;
const outDir = process.argv[2];

/* A word's ink, cropped tight and scaled to `cap` pixels tall. */
async function ink(text, font, size, cap, color = "#000", track = 0) {
  const img = new og.ImageResponse(h("div", { style: { display: "flex", fontFamily: "f", fontSize: size, letterSpacing: track, color, lineHeight: 1, whiteSpace: "nowrap", paddingLeft: 20, paddingTop: 20 } }, text), { width: 2400, height: 420, fonts: [{ name: "f", data: fs.readFileSync(font), weight: 400, style: "normal" }] });
  const buf = Buffer.from(await img.arrayBuffer());
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  let x0 = 1e9, x1 = 0, y0 = 1e9, y1 = 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] > 128) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const w = Math.round(((x1 - x0 + 1) * cap) / (y1 - y0 + 1));
  return { png: await sharp(buf).extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 }).resize(w, cap).png().toBuffer(), w, raw: y1 - y0 + 1 };
}

const nova = await ink("NOVA", "app/fonts/Mont-HeavyDEMO.otf", 300, CAP, "#000", 6);
const grad = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${nova.w}" height="${CAP}"><defs><linearGradient id="g">${STOPS.map(([c, o]) => `<stop offset="${o}%" stop-color="${c}"/>`).join("")}</linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`);
const novaInk = await sharp(grad).composite([{ input: nova.png, blend: "dest-in" }]).png().toBuffer();

/* The GENESIS letters (ink rows 10–190 of the master), scaled so their cap height is SMALL of NOVA's. */
const gH = Math.round(CAP * SMALL * (181 / 168));
/* "by" sits with its b on the baseline and its y hanging below, like set type: sized by the b's height. */
const B = Math.round(CAP * SMALL * 1.06);
const [b1, by1] = [await ink("b", "app/fonts/CodecPro-Regular.ttf", 200, 100), await ink("by", "app/fonts/CodecPro-Regular.ttf", 200, 100)];
const byH = Math.round((B * by1.raw) / b1.raw);
for (const v of ["dark", "light"]) {
  const tone = v === "dark" ? "#2b2c2b" : "#ffffff";
  const by = await ink("by", "app/fonts/CodecPro-Regular.ttf", 200, byH, tone);
  const g = await sharp(`public/brand/genesis-wordmark-${v}.png`).extract({ left: 18, top: 10, width: 1002, height: 181 }).resize({ height: gH }).png().toBuffer();
  const gW = (await sharp(g).metadata()).width;
  const xBy = nova.w + 30, xG = xBy + by.w + 16;
  const W = xG + gW + 4;
  await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      { input: novaInk, left: 0, top: TOP },
      { input: by.png, left: xBy, top: BASE - B },
      { input: g, left: xG, top: BASE - gH + 1 },
    ])
    .png({ compressionLevel: 9 })
    .toFile(`${outDir}/nova-by-genesis-${v}.png`);
  console.log(v, W, H);
}
