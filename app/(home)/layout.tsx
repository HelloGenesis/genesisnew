import { FilmRecovery } from "@/components/genesis/film-recovery";
import { GlassNav } from "@/components/genesis/glass-nav";
import { JsonLd } from "@/components/genesis/json-ld";
import { PageAtmosphere } from "@/components/genesis/page-atmosphere";
import { SmoothScroll } from "@/components/genesis/smooth-scroll";
import { QuickContact } from "@/components/genesis/quick-contact";
import { SiteFooter } from "@/components/genesis/site-footer";
import { WhatsappButton } from "@/components/genesis/whatsapp-button";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";

/**
 * Marketing shell. The floating nav is fixed-position and lives here rather
 * than in the root layout so it never appears over /insider, which has its
 * own authenticated chrome.
 */
export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/*
        WHO GENESIS IS, ON EVERY PAGE. Organization and WebSite, once, here —
        every page's own nodes (a Service, a case study's film) point back to
        these by @id rather than restating the company. See lib/seo.
      */}
      <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      <SmoothScroll />
      <GlassNav />
      {/*
        The page's light lives here, above every route, because a wash that
        belongs to a section gets clipped at that section's edge and draws a
        line across the page. See page-atmosphere.tsx.
      */}
      <PageAtmosphere>
        {children}
        {/*
          EVERY PAGE IN THE GROUP CLOSES THE SAME WAY. The footer used to be
          part of the homepage's closing section, so Careers, I'm a Creator and
          six other routes simply stopped at their last element. Rendered from
          the layout it is written once and cannot be forgotten on the next
          page added.

          Inside the atmosphere, not beside it: the footer is page content and
          wants the same light and grain over it as everything above.
        */}
        <SiteFooter />
      </PageAtmosphere>

      <QuickContact />
      {/* Film windows retry a film before settling for its preview. */}
      <FilmRecovery />
      <WhatsappButton />
    </>
  );
}
