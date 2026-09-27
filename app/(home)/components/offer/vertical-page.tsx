import type { ReactNode } from "react";

import { Atmosphere } from "@/components/genesis/atmosphere";
import { JsonLd } from "@/components/genesis/json-ld";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/seo";
import { serviceOffers, type ServicePage } from "@/lib/services";
import { bookingHref, verticalCard } from "@/lib/pricing";
import type { VerticalKey } from "@/lib/verticals/types";
import { JumpBar, MobileCta, type JumpLink } from "./page-aids";
import { VerticalNav } from "./page-furniture";

/**
 * The frame every vertical page shares: schema, the centred breadcrumb and
 * vertical tabs, and a visible-to-search h1 in the words people search for.
 *
 * THE H1 IS VISIBLE WHERE THE PAGE HAS A HERO — AI Labs, Studios and Brand &
 * Design set their hero heading as the h1. Influence opens on the homepage's
 * own section, whose heading is the division's artwork, so there the h1 is
 * kept for crawlers and screen readers (`hiddenTitle`). Metadata, schema and
 * the services list still come from lib/services, which is what these URLs
 * rank on.
 *
 * Every page also gets the jump bar and, on a phone, the call-to-action bar
 * (see page-aids).
 */
export function VerticalPage({
  page,
  current,
  jump,
  primary,
  hiddenTitle = false,
  children,
}: {
  page: ServicePage;
  current: VerticalKey;
  /** The page's sections, for the jump bar. */
  jump: JumpLink[];
  /** The phone bar's main button — the page's first ask. */
  primary: { label: string; href: string };
  hiddenTitle?: boolean;
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
      {hiddenTitle && (
        <h1 className="sr-only">
          {card.name} — {page.heading.lead} {page.heading.accent}
        </h1>
      )}
      <Atmosphere tone="brand" origin="top" intensity={0.18}>
        <VerticalNav current={current} />
      </Atmosphere>
      {children}
      <JumpBar links={jump} />
      <MobileCta primary={primary} bookHref={bookingHref(card.name)} />
    </main>
  );
}
