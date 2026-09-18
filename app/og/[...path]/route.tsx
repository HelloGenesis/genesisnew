import { findOgCard, ogCards, renderOgCard } from "@/lib/og";

/**
 * /og/<path> — the share card for the page at /<path>. One per indexable
 * page, all drawn at build time; anything else is a 404, never a render on
 * demand. See lib/og.
 */
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return ogCards
    .filter((card) => card.path !== "/")
    .map((card) => ({ path: card.path.slice(1).split("/") }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const card = findOgCard(`/${path.join("/")}`);
  if (!card) return new Response("Not found", { status: 404 });
  return renderOgCard(card);
}
