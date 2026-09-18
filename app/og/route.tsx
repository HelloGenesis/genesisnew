import { findOgCard, renderOgCard } from "@/lib/og";

/**
 * /og — the homepage's share card. Every other page's is /og/<its path>,
 * from the catch-all beside this; see lib/og for what they look like and
 * lib/seo's pageMetadata for how each page points at its own.
 *
 * Drawn once at build time and served as a static file.
 */
export const dynamic = "force-static";

export async function GET() {
  const card = findOgCard("/");
  if (!card) return new Response("Not found", { status: 404 });
  return renderOgCard(card);
}
