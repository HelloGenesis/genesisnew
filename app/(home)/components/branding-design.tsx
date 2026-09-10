import fs from "node:fs";
import path from "node:path";

import Image from "next/image";

import { GlassButton } from "@/components/genesis/glass-button";
import { Reveal } from "@/components/genesis/reveal";
import { branding, services } from "@/lib/home-content";
import { SectionShell } from "./section-shell";

/*
  ON A PHONE THE TWO CALLS TO ACTION SHARE ONE LINE, smaller: the same
  treatment Genesis asked for on Influence ("buttons on same line - reduce
  size"), for the same pair of buttons here. Larger screens are untouched.
*/
const MOBILE_CTA =
  "max-sm:h-10 max-sm:gap-1.5 max-sm:px-3 max-sm:text-[0.78125rem] max-sm:[&>svg:last-child]:hidden";

/**
 * Section 8 — Branding & Design.
 *
 * A bento arrangement (img-021, img-028): one tall statement tile beside the
 * capabilities. Deliberately quieter than the sections either side of it, so
 * the page has a trough between Influencer and the logo wall.
 *
 * QUIET IS NOT THE SAME AS UNLIT. This was the flattest thing on the page: a
 * `tone="neutral"` section with no light at all, next to a grid of six
 * identical grey rectangles carrying one 14px word each. Every other section
 * on this site is lit; this one just had the light switched off, which does
 * not read as restraint, it reads as unfinished.
 *
 * Two changes. The section gets an brand wash — the secondary accent, so it
 * stays quieter than the brand sections around it without being dark. And
 * the capabilities stop being a 3x2 grid of equal boxes: they are a LIST of
 * disciplines, not six things of equal weight, so they are set as a rule-
 * separated column with the count carried in the eyebrow, which is what the
 * editorial references do with a list.
 */
/**
 * The sketch phases and finished mark for one identity, if they are on disk.
 *
 * READ FROM THE FILESYSTEM RATHER THAN LISTED IN DATA, and that is the point.
 * A hard-coded list of five paths is a list that can be wrong in two
 * directions: name a file that is not there and the section renders broken
 * images at a client; add a sixth sketch and nothing shows it until someone
 * remembers to edit an array. Reading the folder means dropping files in IS
 * the deployment.
 *
 * This is a server component, so the walk happens once at build and never in a
 * browser.
 *
 * CONVENTION: /public/brand/<assets>/phase-1.png … phase-N.png for the route,
 * final.png for the mark it arrived at. Any image extension works.
 */
function identityRoute(assets: string): { phases: string[]; final?: string } {
  const dir = path.join(process.cwd(), "public", "brand", assets);
  let entries: string[];
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return { phases: [] };
  }

  const isImage = (f: string) => /\.(png|jpe?g|webp|svg)$/i.test(f);

  /*
    `1.png` COUNTS AS MUCH AS `phase-1.png`.

    The README asked for phase-1, phase-2… and Genesis dropped in 1, 2, 3, 4 —
    which is what anyone would do, and the strip stayed empty because a regex
    said no. A convention that only works when someone reads the README is not
    a convention, it is a trap; the number is the only part that matters, so
    any leading number is a phase.
  */
  /*
    A CHANGED FILE GETS A CHANGED URL, and this is the second time this project
    has been bitten by not doing it.

    While this feature was being built, `final.png` briefly held a stand-in —
    the Tripgate wordmark — and every layer that caches by URL went on serving
    it after the real Activ Health mark replaced it: the browser, and Next's
    dev-server image cache, which is why Genesis saw Tripgate's logo inside
    Activ Health's card on their own machine and not just on mine. The division
    lockups hit exactly this earlier and were fixed by moving them to a new
    path; that fix does not generalise, because here the FILENAMES are
    Genesis's to choose.

    So the URL carries the file's modification time. Replace an image and its
    URL changes with it, which no cache can get wrong. Same file, same URL,
    still cached — the point is not to defeat caching, it is to stop one URL
    ever meaning two different pictures.
  */
  const stamp = (file: string) => {
    try {
      return `?v=${Math.round(fs.statSync(path.join(dir, file)).mtimeMs)}`;
    } catch {
      return "";
    }
  };

  const numbered = entries
    .filter((f) => isImage(f) && /^(phase-)?\d+\./i.test(f))
    // Numeric, not lexical: 10 sorts after 9, not after 1.
    .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]));

  /*
    NO `final.` FILE? THE LAST NUMBER IS THE FINAL.

    The README asked for the finished mark to be called final.png, and Genesis
    renamed it 5.png — which is the obvious thing to do once the sketches are
    1 to 4, and it quietly turned the answer into a fifth sketch. A sequence
    ends where it ends; the last frame of a logo's route IS what it arrived at.

    An explicit final. file still wins, for the case where the finished mark
    is not the last thing that happened.
  */
  const named = entries.find((f) => isImage(f) && /^final\./i.test(f));
  const finalFile = named ?? numbered.at(-1);
  const phases = named ? numbered : numbered.slice(0, -1);

  const url = (f: string) => `/brand/${assets}/${f}${stamp(f)}`;
  return {
    phases: phases.map(url),
    final: finalFile ? url(finalFile) : undefined,
  };
}

export function BrandingDesign() {
  return (
    <SectionShell
      id="brand-design"
      division={{
        name: "Brand & Design",
        tagline: services.items[1].caption,
        ramp: services.items[1].ramp,
      }}
      /*
        NO `body` HERE — it is set below the tiles instead, at Genesis's
        request. Between the lockup and the work it was a third line of
        introduction before anything had been shown; underneath, it reads as
        the caption to what you have just looked at, which is the job that
        sentence is actually doing.
      */
      // Centred, like AI Lab and Studios: the mark is artwork and sits in the
      // middle of its section. See the note in ai-content.
      align="center"
      tone="brand"
      origin="top-left"
      intensity={0.16}
    >
      {/*
        THE IDENTITY COLUMN IS THE WIDER ONE NOW. It was the narrower half of
        a 1 : 1.1 split while it held two lines of text; it holds the actual
        marks today, and a logo squeezed under a capability list is the section
        showing everything except the work.
      */}
      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.9fr]">
        <Reveal>
          <div className="glass glass-lit relative flex h-full min-h-64 flex-col justify-end overflow-hidden rounded-panel p-8">
            {/* Hairline grid, the editorial device from img-058. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  "linear-gradient(rgb(255 255 255) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
              }}
            />
            <div className="relative">
              <p className="micro-label mb-6">Selected identity work</p>
              {/* Tripgate and the Activ Health App — see lib/home-content. */}
              <ul className="flex flex-col gap-4">
                {branding.work.map((item) => {
                  const route =
                    "assets" in item
                      ? identityRoute(item.assets)
                      : { phases: [], final: undefined };
                  const hasRoute = route.phases.length > 0 || route.final;

                  return (
                    <li
                      key={item.title}
                      className="border-b border-white/10 pb-6 last:border-0 last:pb-0"
                    >
                      <p className="text-h3 font-semibold tracking-tight text-bone">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-small text-ash">{item.caption}</p>

                      {/*
                        THE MARKS, AND THEY ARE THE POINT OF THIS TILE. Sketches
                        first, then what they arrived at — set large enough to
                        actually read, on white, because these are scans of
                        paper and the panel's glass would show through and grey
                        the pencil out.

                        The final mark is half again the size of a sketch and
                        sits behind a rule: it is the answer, not a fifth
                        attempt, and five equal squares read as five options.
                      */}
                      {hasRoute && (
                        /*
                          ONE LINE, ALWAYS. This was `flex-wrap` with fixed
                          72-80px squares, which on a phone broke Activ
                          Health's five marks into three and two — a route
                          from sketch to finished logo reads as a sequence,
                          and a sequence that wraps stops being one.

                          So the boxes are FRACTIONS OF THE ROW rather than
                          pixel sizes: each sketch takes an equal share, the
                          final mark takes 1.4 shares because it is the
                          answer, and `min-w-0` lets them all shrink below
                          their content on a narrow tile instead of forcing an
                          overflow. The max-widths keep them from ballooning
                          on a wide one, where four sketches would otherwise
                          stretch to 150px each.
                        */
                        <div className="mt-5 flex items-end gap-1.5 sm:gap-2.5">
                          {route.phases.map((src, index) => (
                            <div
                              key={src}
                              className="relative aspect-square min-w-0 flex-1 basis-0 overflow-hidden rounded-card border border-white/15 bg-white sm:max-w-20"
                            >
                              {/*
                                `unoptimized`, and it is the fix rather than a
                                shortcut. These are 15-50KB PNGs drawn at 80px;
                                the optimiser saves almost nothing on them and
                                IS the layer that served a stale stand-in under
                                a reused filename. Serving the file directly
                                means the ?v= stamp above is the whole cache
                                key, and it also sidesteps needing to open
                                images.localPatterns to arbitrary query strings
                                — which the Next docs warn lets anyone mint
                                unlimited optimiser cache entries.
                              */}
                              <Image
                                src={src}
                                alt={`${item.title} logo, sketch ${index + 1} of ${route.phases.length}`}
                                fill
                                unoptimized
                                className="object-contain p-1.5 sm:p-2"
                              />
                            </div>
                          ))}

                          {route.final && (
                            <>
                              {route.phases.length > 0 && (
                                <span
                                  aria-hidden
                                  className="h-10 w-px shrink-0 self-center bg-white/15 sm:h-16"
                                />
                              )}
                              <div className="relative aspect-square min-w-0 flex-[1.4] basis-0 overflow-hidden rounded-card border border-brand-ink/40 bg-white shadow-[0_10px_30px_-12px_rgb(0_0_0/0.6)] sm:max-w-28">
                                <Image
                                  src={route.final}
                                  alt={`${item.title}, the finished logo`}
                                  fill
                                  unoptimized
                                  className="object-contain p-2 sm:p-3"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/*
                        THE PALETTE AS ONE STRIP, not five labelled chips.

                        It was a row of swatches with the hex printed under each
                        in 9px, which read as a spreadsheet of colours and was
                        the loudest thing in the tile — louder than the work.
                        A locked palette is one object, so it is drawn as one:
                        a continuous band, no captions. The codes are still
                        there on hover, where somebody who actually needs to
                        copy one will look, and nowhere near the eye of someone
                        who does not.
                      */}
                      {/*
                        THE PALETTE, WITH ITS CODES BACK UNDER IT.

                        Three passes on this. Five chips with a hex caption each
                        read as a spreadsheet; one bare band with the codes
                        hidden on hover threw away the useful half — a hex you
                        cannot see is a hex you cannot copy, and somebody
                        rebuilding a deck needs to. So: one continuous band,
                        because a locked palette is one object, with the codes
                        set beneath each segment on the same grid. The
                        descriptor line that ran under it is gone at Genesis's
                        request.
                      */}
                      {"palette" in item && item.palette.length > 0 && (
                        <div className="mt-5 w-full max-w-sm">
                          <div className="flex h-8 overflow-hidden rounded-card border border-white/15">
                            {item.palette.map((hex) => (
                              <span
                                key={hex}
                                className="h-full flex-1"
                                style={{ backgroundColor: hex }}
                              />
                            ))}
                          </div>
                          {/*
                            One column per swatch, so each code sits under the
                            colour it names rather than in a sentence beside it.
                          */}
                          <div className="mt-1.5 flex">
                            {item.palette.map((hex) => (
                              <span
                                key={hex}
                                className="flex-1 text-center text-[0.5625rem] uppercase tracking-wide text-faint"
                              >
                                {hex}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </Reveal>

        {/*
          "WHAT WE MAKE" LEADS ON A PHONE ("woh wale section ko above the
          tripgate and activhealth app ka logos"). Stacked, the showcase came
          first and a reader met two client logos before being told what the
          division does. On desktop they sit side by side and order is moot.
        */}
        <Reveal delay={0.06} className="order-first lg:order-none">
          <div className="glass glass-lit relative flex h-full flex-col rounded-panel p-8">
            <p className="micro-label mb-6">
              {/* No count. Genesis asked for the "· 06" off this label. */}
              What we make
            </p>

            {/*
              A rule-separated list, numbered. Six equal boxes said these were
              six interchangeable things; a list says they are a set of
              disciplines with an order, and it lets the type carry the section
              instead of six rectangles carrying it.
            */}
            <ul className="flex flex-1 flex-col justify-between">
              {branding.capabilities.map((capability, index) => (
                <li
                  key={capability}
                  className="flex items-baseline gap-6 border-b border-white/10 py-4 last:border-0"
                >
                  <span className="micro-label shrink-0 !text-brand-ink/70">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-h3 font-medium leading-tight tracking-tight text-bone">
                    {capability}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        {/*
          The standfirst, moved down out of the header. lg:col-span-2 so it
          runs the full width under both tiles rather than being trapped in
          the left column, and centred to match the header above it.
        */}
        <Reveal delay={0.12} className="lg:col-span-2">
          <p className="mx-auto max-w-2xl text-pretty text-center text-body text-ash sm:text-lead">
            {branding.body}
          </p>
        </Reveal>

        {/*
          This division had no call to action at all — a reader could finish
          the section that describes identity work with nowhere to go.
        */}
        <Reveal delay={0.15} className="mt-2 flex flex-nowrap justify-center gap-2 sm:flex-wrap sm:gap-3 lg:col-span-2">
          <GlassButton
            href="/#contact"
            quickContact="brand-design:build-a-brand"
            variant="brand"
            arrow
            className={MOBILE_CTA}
          >
            Build a brand
          </GlassButton>
          <GlassButton href="/#library" variant="glass" arrow className={MOBILE_CTA}>
            View branding work
          </GlassButton>
        </Reveal>
      </div>
    </SectionShell>
  );
}
