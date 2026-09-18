import type { JsonLdNode } from "@/lib/seo";

/**
 * Structured data for search engines, as one `@graph`.
 *
 * A NATIVE <script>, NOT next/script. JSON-LD is data, not code: nothing runs
 * it, so the loader's strategies and the CSP's script rules have nothing to
 * do here. It renders in the server HTML, which is where a crawler reads it.
 *
 * `<` IS ESCAPED because every string in here comes from copy — a case-study
 * headline containing "</script>" would otherwise end the tag early and turn
 * the rest into markup. `<` is the same character to a JSON parser.
 */
export function JsonLd({ data }: { data: JsonLdNode | JsonLdNode[] }) {
  const graph = Array.isArray(data) ? data : [data];
  const json = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": graph,
  }).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
