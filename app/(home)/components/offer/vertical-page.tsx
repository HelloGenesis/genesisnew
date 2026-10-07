import type { ReactNode } from "react";

import { Atmosphere } from "@/components/genesis/atmosphere";
import { JsonLd } from "@/components/genesis/json-ld";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/seo";
import { serviceOffers, type ServicePage } from "@/lib/services";
import { verticalCard } from "@/lib/pricing";
import type { VerticalKey } from "@/lib/verticals/types";
import { JumpBar, MobileCta, type JumpLink } from "./page-aids";
import { WorkModeProvider } from "./work-mode";

/**
 * The frame every vertical page shares: schema, room for the fixed bar, and a visible-to-search h1 in the words people search for.
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
  hiddenTitle = false,
  children,
}: {
  page: ServicePage;
  current: VerticalKey;
  /** The page's sections, for the jump bar. */
  jump: JumpLink[];
  hiddenTitle?: boolean;
  children: ReactNode;
}) {
  const card = verticalCard(current);
  /*
    ONE PAY-PER-PROJECT / SUBSCRIPTIONS CHOICE FOR THE WHOLE PAGE, starting on
    Pay-per-project (Genesis, 2 Oct 2026), so the subscription details
    further down the page (SubscriptionOnly) and the jump bar follow it.
  */
  return (
    <WorkModeProvider initial="one-time">
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
            {card.name} {page.heading.lead} {page.heading.accent}
          </h1>
        )}
        {/*
          ROOM FOR THE FIXED BAR, AND THE PAGE'S TOP GLOW. The breadcrumb and
          the four division tabs used to sit here; Genesis took them out (2 Oct
          2026, "remove this") — the bar's own division menus do that job.
        */}
        <Atmosphere tone="brand" origin="top" intensity={0.18}>
          <div aria-hidden className="pt-20 sm:pt-24" />
        </Atmosphere>
        {children}
      </main>
      {/*
      OUTSIDE <main>, AND IT MATTERED. Every direct child of main used to get
      content-visibility: auto with a 900px intrinsic size (globals.css), so
      these two fixed bars, inside it, were given a 900px box while skipped —
      an invisible sheet over the page that could swallow taps on a phone.
    */}
      {/* "Book a call" slides down to the footer's calendar, where the time is picked (Genesis, 2 Oct 2026). */}
      <JumpBar links={jump} bookHref="#book-a-call" />
      <MobileCta primary={{ label: "View Pricing", href: "#pricing" }} bookHref="#book-a-call" />
    </WorkModeProvider>
  );
}
