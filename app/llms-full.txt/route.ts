import { llmsText } from "@/lib/geo";

/** /llms-full.txt — /llms.txt plus every FAQ and case-study summary (see lib/geo). */
export const dynamic = "force-static";

export function GET() {
  return new Response(llmsText(true), { headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
