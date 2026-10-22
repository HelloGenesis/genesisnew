import "server-only";

import { existsSync } from "node:fs";

/**
 * A PAGE AS A PDF, ON THE SERVER (Genesis, 22 Oct 2026: "I hope the invoices
 * are saved to Google Drive too"). Headless Chromium prints the very page the
 * client sees (its print CSS: A4, 10mm margins), so the Drive copy and the
 * client's download are the same document.
 *
 * On Vercel: @sparticuz/chromium's build. On a Mac in development: the
 * installed Google Chrome (or CHROME_PATH).
 */
const LOCAL_CHROME = ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"];

export async function renderPdf(url: string): Promise<Buffer> {
  const puppeteer = (await import("puppeteer-core")).default;
  const local = process.env.CHROME_PATH || (process.env.VERCEL ? null : LOCAL_CHROME.find((p) => existsSync(p)));
  let launch: Parameters<typeof puppeteer.launch>[0];
  if (local) {
    launch = { executablePath: local, headless: true, args: ["--no-sandbox", "--disable-gpu"] };
  } else {
    const chromium = (await import("@sparticuz/chromium")).default;
    launch = { executablePath: await chromium.executablePath(), headless: true, args: chromium.args, defaultViewport: { width: 1240, height: 1754 } };
  }
  const browser = await puppeteer.launch(launch);
  try {
    const page = await browser.newPage();
    await page.emulateMediaType("print");
    await page.goto(url, { waitUntil: "networkidle0", timeout: 45_000 });
    const pdf = await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true });
    return Buffer.from(pdf);
  } finally {
    await browser.close().catch(() => undefined);
  }
}
