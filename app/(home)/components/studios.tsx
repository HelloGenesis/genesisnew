import { Reveal } from "@/components/genesis/reveal";
import { BENTO_WIDE as BENTO } from "@/lib/bento";
import { Spectrum } from "@/components/genesis/atmosphere";
import { DivisionLockup } from "@/components/genesis/division-lockup";
import { StudiosPipeline } from "@/components/genesis/studios-pipeline";
import { services } from "@/lib/home-content";
import { PlanBar } from "./plan-bar";
import { DivisionCtas, PhoneDivisionCtas } from "./division-ctas";


/**
 * Genesis Studios — the production vertical.
 *
 * THIS IS THE SECTION REBUILT TO GENESIS'S OWN DESIGN, and most of what used
 * to be here is deliberately gone. What stood here was a drifting wall of
 * sixteen reels (doubled to thirty-two tiles for the loop), a paragraph under
 * it, and nine capability chips under that. Genesis supplied a replacement
 * layout — a production timeline, brief through delivery — and asked for the
 * old design and its content removed rather than kept alongside.
 *
 * That is the right call for two reasons beyond it being the instruction:
 *
 *   THE TWO WERE SAYING THE SAME THING TWICE. The chips listed "Scripting",
 *   "Editing", "Shooting", "Post-production" as nine loose items; the
 *   timeline says the same capability as an ORDER, which is the part a client
 *   actually wants to know. A list and a sequence of the same nine things is
 *   one of them too many.
 *
 *   THE WALL WAS THE MOST EXPENSIVE THING ON THE PAGE. Thirty-two tiles meant
 *   thirty-two video elements pulling thirty-two files, and it is the single
 *   biggest reason the homepage felt like it was still loading well after it
 *   had rendered. The timeline carries five clips. The full body of work is
 *   still one click away in the portfolio grid, which is where browsing
 *   belongs.
 */
/**
 * `onPage`: the section on its own division's page, under the page's hero
 * (Genesis, 2 Oct 2026). Without its header — the page's hero already names
 * the division — and without its plan bar: the page's own pricing section,
 * further down, is the one place to buy.
 */
export function Studios({ onPage = false }: { onPage?: boolean } = {}) {
  return (
    <section
      id="studios"
      className="scene-open grain relative isolate overflow-hidden py-[var(--section-pad)]"
    >
      <Spectrum className="seamless" />

      <div className="relative z-[2] mx-auto w-full max-w-6xl px-6">
        {/* The mark and the pipeline in one glass panel on the homepage (Genesis, 4 Oct 2026). */}
        <div className={onPage ? undefined : BENTO}>
        {!onPage && (
        <div className="flex flex-col items-center text-center">
          <Reveal>
            <DivisionLockup
              name="Studios"
              tagline=""
              ramp={services.items[2].ramp}
            />
          </Reveal>
        </div>
        )}

        <div className={onPage ? "fit-window" : "fit-window mt-[var(--block-gap)]"}>
          <StudiosPipeline />
          {/* "View Studios" under the process, out of the plan box (Genesis, 6 Oct 2026); a phone has its pair above the box. */}
          {!onPage && <DivisionCtas vertical="studios" size="sm" primaryOnly className="mt-8 justify-center max-sm:hidden" />}
        </div>
        </div>

        {!onPage && <PhoneDivisionCtas vertical="studios" className="mt-6" />}
        {!onPage && <PlanBar vertical="studios" className="lg:!-mx-16 lg:!w-auto" />}
      </div>
    </section>
  );
}
