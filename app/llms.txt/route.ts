import { llmsText } from "@/lib/geo";

/** /llms.txt — the site in plain Markdown for AI assistants and answer engines (see lib/geo). */
export const dynamic = "force-static";

export function GET() {
  return new Response(llmsText(), { headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
