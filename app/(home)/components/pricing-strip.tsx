import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { GlassButton } from "@/components/genesis/glass-button";
import { Reveal } from "@/components/genesis/reveal";
import { entryPrice, verticalCards } from "@/lib/pricing";

/**
 * HOW GENESIS CHARGES, IN ONE STRIP — after the four verticals, before the
 * portfolio.
 *
 * The first pricing brief's full Memberships section was taken off the
 * homepage at Genesis's request, and with it the only place the page said
 * how Genesis charges. The membership model is the differentiator, so it
 * comes back as a single line rather than a section: each vertical's
 * starting price, the entry price, and the way to /pricing. Each price
 * opens /pricing on that vertical's tab.
 */
export function PricingStrip() {
  return (
    <section aria-labelledby="pricing-strip-heading" className="mx-auto w-full max-w-6xl px-6 py-[calc(var(--section-pad)*0.6)]">
      <Reveal className="glass glass-lit flex flex-col gap-6 rounded-panel p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="shrink-0">
          <p className="micro-label">Pricing</p>
          <h2 id="pricing-strip-heading" className="mt-3 text-lead font-normal leading-snug text-bone">
            Start from <span className="text-brand-ink">{entryPrice}</span>
          </h2>
        </div>
        <ul className="grid flex-1 grid-cols-2 gap-2 md:grid-cols-4">
          {verticalCards.map((card) => (
            <li key={card.key}>
              <Link
                href={`/pricing?v=${card.key}#plans`}
                className="group flex h-full items-start justify-between gap-2 rounded-card border border-white/10 px-4 py-3 transition-colors hover:border-white/25 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <span>
                  <span className="block text-small text-bone">{card.key === "ai-labs" ? "AI Labs" : card.short}</span>
                  <span className="mt-1 block text-small text-ash">{card.from}</span>
                </span>
                <ArrowUpRight className="size-4 shrink-0 text-faint transition-colors group-hover:text-brand-ink" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
        <GlassButton href="/pricing" variant="brand" arrow className="self-start lg:self-auto">
          See pricing
        </GlassButton>
      </Reveal>
    </section>
  );
}
