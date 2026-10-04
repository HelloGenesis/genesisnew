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
      <Reveal className="mx-auto flex max-w-2xl flex-col items-center text-center">
        {/* No "Our products" label (Genesis, 4 Oct 2026: "remove this"). */}
        <h2 id={id} className="text-balance text-h3 font-normal leading-[1.05] tracking-tight text-bone sm:text-h2">
          Two ways to work with us.
        </h2>
        <p className="mt-3 text-pretty text-body leading-relaxed text-ash sm:text-lead">
          Pay per project, or by subscription. Choose what your business needs right now.
        </p>
        <p className="mt-5 inline-flex items-center gap-2.5 rounded-full border border-[var(--glass-border)] bg-[var(--hover-wash)] py-1.5 pl-1.5 pr-4 text-small text-bone">
          <GlassIcon name="card" className="size-7 shrink-0" />
          All credit cards and card EMI options available.
        </p>
      </Reveal>
    </>
  );
}
