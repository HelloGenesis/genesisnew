import type { ReactNode } from "react";

import { Atmosphere } from "@/components/genesis/atmosphere";
import { JsonLd } from "@/components/genesis/json-ld";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/seo";
import { serviceOffers, type ServicePage } from "@/lib/services";
import { verticalCard } from "@/lib/pricing";
import type { VerticalKey } from "@/lib/verticals/types";
import { VerticalNav } from "./page-furniture";

/**
 * The frame every vertical page shares: schema, the centred breadcrumb and
 * vertical tabs, and a visible-to-search h1 in the words people search for.
 *
 * The pages' own designs open on the product, not on an SEO heading, so the
 * h1 is kept for crawlers and screen readers only; the page's lead heading is
 * the first thing a sighted reader meets. Metadata, schema and the services
 * list still come from lib/services, which is what these URLs rank on.
 */
export function VerticalPage({
  page,
  current,
  children,
}: {
  page: ServicePage;
  current: VerticalKey;
  children: ReactNode;
}) {
  const card = verticalCard(current);
  return (
    <main>
      <JsonLd
        data={[
          serviceJsonLd({
            name: page.schema.name,
            serviceType: page.schema.serviceType,
            description: page.seo.description,
            path: card.href,
            offers: serviceOffers(page),
          }),
          breadcrumbJsonLd([{ name: card.name, path: card.href }]),
        ]}
      />
      <h1 className="sr-only">
        {card.name} — {page.heading.lead} {page.heading.accent}
      </h1>
      <Atmosphere tone="brand" origin="top" intensity={0.18}>
        <VerticalNav current={current} />
      </Atmosphere>
      {children}
    </main>
  );
}
