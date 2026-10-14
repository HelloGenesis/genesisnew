/**
 * Tells Bing (and through it ChatGPT search and Copilot), Yandex, Seznam and
 * Naver that the site's pages changed — IndexNow, https://www.indexnow.org.
 * Run after a deploy that changes public pages:  npm run indexnow
 *
 * The key is public by design: the file public/14e567f6580cd5f72c965a57bb9870e8.txt proves the site is ours.
 */
const KEY = "14e567f6580cd5f72c965a57bb9870e8";
const SITE = "https://www.genesismedia.co";

const xml = await (await fetch(`${SITE}/sitemap.xml`)).text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!).filter((u) => u.startsWith(SITE) && !/\.(mp4|jpe?g|png|webp)$/.test(u));
urls.push(`${SITE}/llms.txt`, `${SITE}/llms-full.txt`);
const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: new URL(SITE).host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: [...new Set(urls)] }),
});
console.log(`IndexNow: ${res.status} for ${new Set(urls).size} URLs`);
