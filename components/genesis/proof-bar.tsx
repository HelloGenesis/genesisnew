import { Building2, Clapperboard, Eye, Globe, Target } from "lucide-react";

import { Reveal } from "@/components/genesis/reveal";
import { influencer, isPending } from "@/lib/home-content";
import { cn } from "@/lib/utils";

/**
 * The figures band — Genesis's scale, between the case studies and Influence.
 *
 * IT USED TO LIVE AT THE BOTTOM OF THE INFLUENCE SECTION, under the creator
 * constellation and above that section's two buttons. Genesis asked for it
 * above Influence, and then above the case studies' own "See the work" button
 * as well — so it closes the case-study section rather than opening the next
 * one. Pulling it out of Influence was right for a reason beyond placement:
 * two of these four figures are not Influence's.
 *
 *   50+ CAMPAIGNS and 30+ BRANDS come from the company's own journey board.
 *   50M+ REACH and 20+ PLATFORMS come from the Influence mockup.
 *
 * See lib/proof.ts, which records the provenance of each and the conflicts
 * between sources. Printed at the foot of Influence they read as claims about
 * the creator business specifically, and half of them are broader than that.
 * Directly under "Work that moved a number" they say what they actually are:
 * the size of the company, read straight off the evidence above them.
 *
 * IT CARRIES NO LAYOUT OF ITS OWN. No container, no measure, no vertical
 * margin — it renders the panel and nothing else, because its one caller
 * already sits inside the section's own container and adding a second
 * `max-w-6xl px-6` around it would inset the bar by a gutter it does not
 * want. The caller decides where it sits; this decides what it looks like.
 *
 * IT IS NOT A SECTION. No heading, no label, no atmosphere of its own — it is
 * a rule between two chapters that happens to have numbers on it. Given a
 * heading it would become a twelfth block on a page whose whole brief is one
 * question per section, and the question it answers ("how big is this?") is
 * one the case studies above have just raised.
 *
 * AN UNCONFIRMED FIGURE IS OMITTED, NEVER PRINTED AS A PLACEHOLDER — the rule
 * the whole site runs on. The bar draws whatever survives that filter, so it
 * is a four-up today and would be a three-up without complaint.
 */

/*
  ONE ICON PER FIGURE, IN THE ORDER lib/home-content LISTS THEM — views,
  videos, campaigns, brands. Positional, which is fragile enough to be worth
  saying out loud: reorder `influencer.stats` and these have to move with it,
  or the brands cell wears a clapperboard.
*/
const STAT_ICONS = [Eye, Clapperboard, Target, Building2];

export function ProofBar({ className }: { className?: string }) {
  const stats = influencer.stats.filter((stat) => !isPending(stat.value));
  if (stats.length === 0) return null;

  return (
    <Reveal className={className}>
        {/*
          ON PHONES TOO, WHICH REVERSES AN EARLIER INSTRUCTION AND SHOULD SAY
          SO. This block was `hidden sm:block` because Genesis asked for the
          bento off on mobile — "remove the bentogrid, only mobile" — and the
          reason recorded at the time was positional: below the constellation
          it was a fourth consecutive block of numbers, and the 1,00,000+ card
          already led the section.

          Neither clause is true any more. It is not below the constellation,
          and it is not competing with the 1,00,000+ card — it sits before the
          Influence lockup, with a section boundary between them. Hiding the
          company's scale on the device most visitors use would now be losing
          the point of promoting it. It stacks two-up on a phone and goes
          four-up from md.
        */}
        {/*
          THE GRADIENT BAR (Genesis, 29 Sep 2026): the palette's amber → coral
          → violet as the ground, white figures on it, frosted icon tiles and
          hairline dividers — a pill on a laptop, a rounded panel on a phone.
        */}
        <div
          className="rounded-panel px-5 py-5 text-white shadow-[0_24px_60px_-28px_rgb(217_102_79/0.6)] sm:px-7 md:rounded-[2rem]"
          style={{ background: "linear-gradient(100deg, #d9a441 0%, #d8744f 30%, #cf5f63 50%, #a85aa3 75%, #7b5cd8 100%)" }}
        >
          <div className="grid grid-cols-2 gap-y-5 md:grid-cols-4">
            {stats.map((stat, index) => {
              const Icon = STAT_ICONS[index] ?? Globe;

              return (
                <div
                  key={stat.label}
                  className={cn(
                    "group/stat flex items-center gap-4 px-1",
                    /*
                      HOVER, AND IT IS THE HIGHLIGHT MOVING RATHER THAN A NEW
                      EFFECT. Genesis asked for "hover features interaction
                      wale" on this bar, and the cheapest honest answer was
                      already sitting in it: the first cell wears the brand
                      treatment, so pointing at any cell gives that cell the
                      same treatment. Nothing new is invented, and a reader
                      learns what the accent means by moving the pointer.

                      The lift is 2px. A figures bar is furniture, not a
                      control, and anything further reads as a card asking to
                      be clicked — which it is not.
                    */
                    "transition-transform duration-300 ease-out motion-safe:hover:-translate-y-0.5",
                    /*
                      The rules divide the row only where the row IS a row.
                      Two-up on a phone, every cell would need a rule on a
                      different side depending on its column, which is four
                      conditionals to draw three hairlines nobody asked for.
                    */
                    index > 0 ? "md:border-l md:border-white/25 md:pl-6" : "",
                  )}
                >
                  <span
                    className="grid size-11 shrink-0 place-items-center rounded-card border border-white/30 bg-white/15 text-white transition-colors duration-300 ease-out group-hover/stat:bg-white/25"
                  >
                    <Icon className="size-5" aria-hidden />
                  </span>
                  {/*
                    PLAIN SPANS, NOT A DESCRIPTION LIST, and that is a
                    correction rather than a shortcut. A <dl> would tie each
                    figure to its label in the accessibility tree, which is
                    the better semantics — but only dt, dd, div, script and
                    template may be children of a dl, and each cell here needs
                    an icon and a text block side by side inside a flex row.
                    Fitting that into a valid dl means a wrapper div per pair
                    and the label before the value in source order, which
                    inverts the visual order and has to be undone with
                    `order-first`. Two structural workarounds to win a
                    relationship that the reading order already makes obvious
                    is a bad trade; the figure and its label are adjacent and
                    announced in that order.
                  */}
                  <span className="min-w-0">
                    <span className="block text-h3 font-medium leading-none tracking-tight text-white">
                      {stat.value}
                    </span>
                    <span className="mt-2 block text-small leading-tight text-white/85">
                      {stat.label}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
    </Reveal>
  );
}
