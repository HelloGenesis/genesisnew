import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * /og — the homepage's share card, and the ONE card on the site that is a
 * photograph of the page rather than a drawing of it.
 *
 * WHY IT IS NOT THE GENERATED CARD ANY MORE. Every other page's card is drawn
 * by satori from the page's own copy (see lib/og and the catch-all beside
 * this), which is right for thirty-six case studies and four divisions: they
 * all differ, they change, and nobody is going to re-shoot forty pictures.
 * The homepage is the one page whose hero IS a picture — the orb with the
 * four divisions around it — and a typeset summary of that composition is a
 * worse advertisement for it than the composition. Genesis asked for the
 * homepage itself to be what shows up when a link is forwarded.
 *
 * HOW THE FILE IS MADE, so the next person can remake it. Headless Chrome, at
 * 1200x800 so the fixed chrome falls outside the crop, then the middle 630
 * rows:
 *
 *   chrome --headless=new --window-size=1200,800 --virtual-time-budget=9000 \
 *     --screenshot=shot.png http://localhost:3000/
 *   sips -c 630 1200 --cropOffset 95 0 shot.png --out og-home.png
 *   sips -s format jpeg -s formatOptions 90 og-home.png --out home.jpg
 *
 * The offset is what drops the floating navbar off the top and the WhatsApp
 * and back-to-top buttons off the bottom: in the card they read as interface
 * stuck to a picture, and a WhatsApp bubble inside a WhatsApp preview reads as
 * a mistake.
 *
 * JPEG, AND UNDER 150KB ON PURPOSE. WhatsApp only renders a preview thumbnail
 * when it can fetch the image quickly, and some clients give up on a few
 * hundred kilobytes; the PNG off the screenshot was 970KB. At quality 90 the
 * point cloud and the gradients hold with no visible banding.
 *
 * THE URL IS UNCHANGED. Every page still points at /og for the homepage, so
 * anything that cached the old address keeps working — only what comes back
 * is different.
 */
export const dynamic = "force-static";

export async function GET() {
  const file = await readFile(join(process.cwd(), "public/og/home.jpg"));
  return new Response(new Uint8Array(file), {
    headers: {
      "content-type": "image/jpeg",
      /* Immutable: a new card is a new build, and the build serves it. */
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
