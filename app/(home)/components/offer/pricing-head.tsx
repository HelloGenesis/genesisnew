import { GlassIcon } from "@/components/genesis/glass-icon";
import { Reveal } from "@/components/genesis/reveal";

/**
 * THE HEAD OF EVERY DIVISION PAGE'S PRICING (Genesis, 2 Oct 2026): the label,
 * the heading and the line under it stacked and centred over the
 * Pay-per-project / Subscriptions switch ("align this up and below, not
 * sideways"), then a small box with the ways to pay. The four steps from
 * paying to publishing (BuySteps) sit under the cards, on each page. One copy for all four
 * pages, so they say the same thing in the same place.
 */
export function PricingHead({ id = "pricing-heading" }: { id?: string }) {
  return (
    <>
      <Reveal className="mx-auto flex max-w-4xl flex-col items-center text-center">
        {/* No "Our products" label (Genesis, 4 Oct 2026: "remove this"). */}
        {/*
          THE LINE IS THE HEADING (Genesis, 4 Oct 2026: "make this the hero,
          replacing 'Two ways to work with us'"), set as the site's headings
          are: the statement, then the turn in yellow italic.
        */}
        <h2 id={id} className="text-balance text-h3 font-normal leading-[1.15] tracking-tight text-bone max-sm:text-[min(1.5rem,5.6vw)] sm:text-h2">
          {/* Two lines, one sentence each (Genesis, 5 Oct 2026). */}
          <span className="block sm:whitespace-nowrap">Pay per project, or by subscription.</span>
          <span className="block font-serif font-normal italic text-brand-ink sm:whitespace-nowrap">Choose what your business needs right now.</span>
        </h2>
        {/* A small line, not a pill (Genesis, 4 Oct 2026: "taking too much space"). */}
        <p className="mt-3 inline-flex items-center gap-1.5 text-[0.8125rem] text-ash">
          <GlassIcon name="card" className="size-5 shrink-0" />
          All credit cards and card EMI options available.
        </p>
      </Reveal>
    </>
  );
}
