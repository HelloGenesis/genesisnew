import { GlassButton } from "@/components/genesis/glass-button";
import { bookingHref, findVertical, homeMemberships, joinHref } from "@/lib/pricing";
import { Reveal } from "@/components/genesis/reveal";
import { Spectrum } from "@/components/genesis/atmosphere";
import { DivisionLockup } from "@/components/genesis/division-lockup";
import { StudiosPipeline } from "@/components/genesis/studios-pipeline";
import { services } from "@/lib/home-content";

/*
  ONE LINE ON A PHONE, the same treatment Influence, AI Lab and Brand &
  Design already give their pairs. Wrapped, these two `lg` buttons stacked
  and cost the section 50 points — the last thing standing between Studios
  and the one-screen rule on a handset.
*/
const MOBILE_CTA =
  "max-sm:h-10 max-sm:gap-1.5 max-sm:px-3 max-sm:text-[0.78125rem] max-sm:[&>svg:last-child]:hidden";

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
export function Studios() {
  return (
    <section
      id="studios"
      className="scene-open grain relative isolate overflow-hidden py-[var(--section-pad)]"
    >
      <Spectrum className="seamless" />

      <div className="relative z-[2] mx-auto w-full max-w-6xl px-6">
        <div className="flex flex-col items-center text-center">
          <Reveal>
            <DivisionLockup
              name="Studios"
              tagline={services.items[2].caption}
              ramp={services.items[2].ramp}
            />
          </Reveal>
        </div>

        <div className="fit-window mt-[var(--block-gap)]">
          <StudiosPipeline />
        </div>

        <Reveal delay={0.14} className="mt-[var(--block-gap)] flex flex-nowrap justify-center gap-2 sm:flex-wrap sm:gap-3">
          {/*
            THE PRICING BRIEF'S THREE: "each vertical section's buttons will be
            changed, and they'll have their own CTA like View work. Book a Call.
            Join today (Razorpay link)". Join and Book read their links from
            lib/pricing, and open WhatsApp until Genesis sends the real ones.
          */}
          <GlassButton href={joinHref(findVertical("studios")!.membership)} variant="brand" arrow className={MOBILE_CTA}>
            {homeMemberships.sectionCtas.join}
          </GlassButton>
          <GlassButton href={bookingHref(findVertical("studios")!.division)} variant="glass" arrow className={MOBILE_CTA}>
            {homeMemberships.sectionCtas.book}
          </GlassButton>
          <GlassButton href="/#library" variant="ghost" arrow className={MOBILE_CTA}>
            {homeMemberships.sectionCtas.work}
          </GlassButton>
        </Reveal>
      </div>
    </section>
  );
}
