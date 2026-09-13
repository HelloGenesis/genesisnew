import fs from "node:fs";
import path from "node:path";

import Image from "next/image";
import Link from "next/link";

import { FolderPanel } from "@/components/genesis/folder-panel";
import { GlassButton } from "@/components/genesis/glass-button";
import { Reveal } from "@/components/genesis/reveal";
import { branding, services } from "@/lib/home-content";
import { cn } from "@/lib/utils";
import { SectionShell } from "./section-shell";

/*
  ON A PHONE THE TWO CALLS TO ACTION SHARE ONE LINE, smaller: the same
  treatment Genesis asked for on Influence ("buttons on same line - reduce
  size"), for the same pair of buttons here. Larger screens are untouched.
*/
const MOBILE_CTA =
  "max-sm:h-10 max-sm:gap-1.5 max-sm:px-3 max-sm:text-[0.78125rem] max-sm:[&>svg:last-child]:hidden";

/*
  THE REFERENCE'S TEXT COLOURS, and only its text ("i meant text ke
  colors"): the headline's orange into pink into violet, and the orange of
  the numbered list. Everything that is not type, the folder edges, the
  dots, the shape behind, stays in the brand's yellow and grey.
*/
const ORANGE = "#ff9a3c";
const HEADLINE_RAMP = "linear-gradient(95deg, #ffa33f 0%, #f7788f 55%, #c47bff 100%)";

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

/**
 * Brand & Design, laid out as the three-folder reference Genesis supplied:
 * the work on the left, the positioning in the middle, what the division
 * makes on the right, with a cursor reaching across.
 *
 * The text colours are the reference's; see ORANGE above.
 *
 * The case-study tiles. The reference fills them with stock work; these hold
 * Genesis's own, the Activ Health route from four sketches to the finished
 * mark and Tripgate's locked palette. Only real work goes in the folder, so
 * the grid is shaped around what exists rather than around the picture.
 *
 * Behind the middle folder is the Genesis N, blurred, standing in for the
 * reference's soft 3D shape ("background logo shd be blurred").
 */
export function BrandingDesign() {
  const tripgate = branding.work.find((w) => "palette" in w);
  const palette = tripgate && "palette" in tripgate ? tripgate.palette : [];
  const activ = branding.work.find((w) => "assets" in w);
  const route =
    activ && "assets" in activ ? identityRoute(activ.assets) : { phases: [] };
  const sketches = route.phases.slice(0, 4);

  return (
    <SectionShell
      id="brand-design"
      division={{
        name: "Brand & Design",
        tagline: services.items[1].caption,
        ramp: services.items[1].ramp,
      }}
      /* The tagline under the lockup is hidden: the middle folder says it,
         large, one scroll below. Printed twice it reads as a stutter. */
      taglineClassName="hidden"
      align="center"
      tone="brand"
      origin="top-left"
      intensity={0.16}
      contentClassName="sm:mt-12"
    >
      {/*
        THREE ACROSS FROM xl, where the reference's proportions fit. Below
        that the headline folder spans the row and the other two share the
        next; on a phone they stack headline, list, work, so the reader is
        told what the division does before being shown it.
      */}
      {/*
        A SWIPE RAIL BELOW xl, A ROW ABOVE IT.

        Stacked, these three folders are 1328 points on a phone and 1076 on a
        tablet — against Genesis's rule that a section fits the window on any
        device. Nothing here can come out: each folder is a different part of
        the division's argument, and shrinking all three to fit a phone
        screen would put the case-study tiles below legibility.

        So on a small screen they behave like the Studios timeline, which
        Genesis already reads as one section: one folder at a time, swiped,
        with the section standing as tall as the tallest of them instead of
        all three put together. From xl, where all three fit side by side,
        nothing changes.
      */}
      <div className="no-scrollbar -mx-6 flex snap-x snap-mandatory items-center gap-4 overflow-x-auto scroll-pl-6 px-6 pb-2 sm:gap-5 xl:mx-[-2.5rem] xl:grid xl:snap-none xl:grid-cols-[1fr_1.08fr_0.95fr] xl:gap-8 xl:overflow-visible xl:px-0">
        {/* ─── The work ─────────────────────────────────────────────── */}
        <Reveal className="relative z-10 order-3 w-[84vw] max-w-[26rem] shrink-0 snap-center sm:w-[64vw] xl:order-1 xl:w-auto xl:max-w-none">
          <FolderPanel tab={0.4} dots contentClassName="p-3 sm:p-5">
            <div className="flex items-center gap-2.5 pr-12">
              <Image
                src="/brand/genesis-n.png"
                alt=""
                width={306}
                height={500}
                className="h-6 w-auto"
              />
              <p className="leading-tight">
                <span className="block text-small font-medium text-scene">Genesis</span>
                <span className="block text-[0.6875rem] text-scene-dim">Brand &amp; Design</span>
              </p>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-2 sm:mt-5 sm:pt-3">
              <span className="text-[0.5625rem] uppercase tracking-[0.3em] text-scene-dim">
                Case studies
              </span>
              <span className="flex items-center gap-2 text-[0.5rem] uppercase tracking-[0.2em] text-scene-dim/70">
                <span aria-hidden className="h-px w-6 bg-white/20" />
                Brands · People · Impact
              </span>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-1.5 sm:gap-2">
              {route.final && (
                <Tile
                  n={1}
                  label={["Activ Health", "Logo redesign"]}
                  light
                  className="row-span-2"
                >
                  <Image
                    src={route.final}
                    alt="Activ Health, the finished logo"
                    fill
                    unoptimized
                    className="object-contain p-4"
                  />
                </Tile>
              )}
              {sketches.map((src, i) => (
                <Tile
                  key={src}
                  n={i + 2}
                  label={[`Sketch ${i + 1}`]}
                  light
                  className="aspect-[4/3]"
                >
                  <Image
                    src={src}
                    alt={`Activ Health logo, sketch ${i + 1} of ${sketches.length}`}
                    fill
                    unoptimized
                    className="object-contain p-2.5"
                  />
                </Tile>
              ))}

              {palette.length > 0 && (
                <Tile
                  n={sketches.length + 2}
                  label={["Tripgate", "Brand guidelines"]}
                  className="col-span-2"
                >
                  <div className="mx-2.5 mt-6 mb-7">
                    <div className="flex h-7 overflow-hidden rounded-md border border-white/15">
                      {palette.map((hex) => (
                        <span key={hex} className="flex-1" style={{ backgroundColor: hex }} />
                      ))}
                    </div>
                    <div className="mt-1 flex">
                      {palette.map((hex) => (
                        <span
                          key={hex}
                          className="flex-1 text-center text-[0.4375rem] uppercase tracking-wide text-scene-dim"
                        >
                          {hex}
                        </span>
                      ))}
                    </div>
                  </div>
                </Tile>
              )}

              <div className="relative flex flex-col justify-between rounded-[10px] border border-white/10 bg-white/[0.03] p-2.5">
                <span className="text-[0.5rem] tracking-[0.2em] text-scene-dim">
                  {String(sketches.length + 3).padStart(2, "0")}
                </span>
                <p className="mt-3 text-[0.8125rem] font-light italic leading-snug text-scene">
                  Strategic design
                  <br />
                  for what&rsquo;s next.
                </p>
                <ArrowCircle
                  href="/#contact"
                  quickContact="brand-design:strategic-design"
                  label="Talk to us about brand strategy"
                  className="mt-2 size-7 self-end"
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 sm:mt-4">
              {[
                ["Strategy", "driven design"],
                ["Brands that", "make an impact"],
              ].map(([a, b]) => (
                <span key={a} className="flex items-center gap-2">
                  <Bloom />
                  <span className="text-[0.5rem] uppercase leading-snug tracking-[0.2em] text-scene-dim">
                    {a}
                    <br />
                    {b}
                  </span>
                </span>
              ))}
            </div>
          </FolderPanel>

          <Pointer className="pointer-events-none absolute -right-12 -bottom-[4.75rem] z-20 hidden w-24 xl:block" />
        </Reveal>

        {/* ─── The positioning ──────────────────────────────────────── */}
        <Reveal
          delay={0.06}
          className="relative isolate order-1 w-[84vw] max-w-[26rem] shrink-0 snap-center sm:w-[64vw] xl:order-2 xl:w-auto xl:max-w-none"
        >
          {/* The Genesis N itself, in its own yellow, blurred just enough to
              sit behind the glass while still reading as the N. Showing
              above and below the folder, where the reference has its shape. */}
          <div
            aria-hidden
            /*
              SMALLER AND FAINTER ON A PHONE. At 132% the N stood half a card
              proud of the folder top and bottom; on a narrow screen that
              stops reading as a mark behind the headline and becomes a
              yellow slab leaking out from under it. Full size from sm, where
              there is room for it to be what it is.
            */
            className="pointer-events-none absolute top-1/2 left-1/2 -z-10 aspect-[306/500] h-[106%] -translate-x-[42%] -translate-y-1/2 opacity-65 sm:h-[132%] sm:opacity-100"
          >
            <Image
              src="/brand/genesis-n.png"
              alt=""
              fill
              sizes="340px"
              className="object-contain blur-[5px]"
            />
          </div>

          <FolderPanel
            tab={0.5}
            dots
            /*
              A PHONE DOES NOT NEED 20rem OF MINIMUM. The headline sets its
              own height in four lines; the floor was there to give the
              folder presence beside two others, which only happens from xl.
            */
            contentClassName="flex flex-col justify-center px-6 pt-8 pb-14 sm:min-h-[min(16rem,26vh)] sm:px-10 sm:pb-16 xl:min-h-[min(26rem,34vh)]"
          >
            <h3 className="text-[2rem] leading-[1.04] font-semibold tracking-tight text-scene md:text-[2.5rem] xl:text-[clamp(2.25rem,3.1vw,2.875rem)]">
              Branding
              <br />
              Positioning,
              <br />
              {/* `clone` so each line carries the whole ramp, orange at its
                  start and violet at its end, as both do in the reference. */}
              <span
                className="bg-clip-text text-transparent [-webkit-box-decoration-break:clone] [box-decoration-break:clone]"
                style={{ backgroundImage: HEADLINE_RAMP }}
              >
                Design &amp;
                <br />
                Collaterals
              </span>
            </h3>
            <ArrowCircle
              href="/#contact"
              quickContact="brand-design:build-a-brand"
              label="Build a brand with Genesis"
              className="absolute right-6 bottom-6 size-12 sm:right-8 sm:bottom-8"
            />
          </FolderPanel>
        </Reveal>

        {/* ─── What we make ─────────────────────────────────────────── */}
        <Reveal delay={0.1} className="order-2 w-[84vw] max-w-[26rem] shrink-0 snap-center sm:w-[64vw] xl:order-3 xl:w-auto xl:max-w-none">
          <FolderPanel tab={0} dots contentClassName="px-3 pt-9 pb-3 sm:pt-11 sm:px-4 sm:pb-4">
            <FolderPanel tab={0.34} tabHeight={20} radius={16} contentClassName="px-4 pt-3 pb-4 sm:px-5 sm:pt-4 sm:pb-5">
              <p className="text-[0.5625rem] uppercase tracking-[0.3em] text-scene-dim">
                What we make
              </p>
              <ul className="mt-3">
                {branding.capabilities.map((capability, index) => (
                  <li
                    key={capability}
                    className="flex items-baseline gap-5 border-b border-white/10 py-1.5 last:border-0 sm:py-2.5"
                  >
                    <span className="w-4 shrink-0 text-[0.625rem] tracking-[0.15em]" style={{ color: ORANGE }}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-body leading-snug text-scene">{capability}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-1 flex justify-end sm:mt-2">
                <ArrowCircle
                  href="/#contact"
                  quickContact="brand-design:what-we-make"
                  label="Start a brand project"
                  className="size-11"
                />
              </div>
            </FolderPanel>
          </FolderPanel>
        </Reveal>

      </div>

      <Reveal
        delay={0.15}
        className="mt-4 flex flex-nowrap justify-center gap-2 sm:flex-wrap sm:gap-3"
      >
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
    </SectionShell>
  );
}

/** One case-study tile: a number at the top, a caption at the bottom. */
function Tile({
  n,
  label,
  light = false,
  className,
  children,
}: {
  n: number;
  label: readonly string[];
  /** White ground, for the logo scans, which are pencil on paper. */
  light?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const ink = light ? "text-black/55" : "text-scene-dim";
  return (
    <div
      className={cn(
        "relative min-h-16 overflow-hidden rounded-[10px] border",
        light ? "border-white/20 bg-white" : "border-white/10 bg-white/[0.03]",
        className,
      )}
    >
      {children}
      <span
        className={cn(
          "absolute top-2 left-2.5 flex items-center gap-1.5 text-[0.5rem] tracking-[0.2em]",
          ink,
        )}
      >
        {String(n).padStart(2, "0")}
        <span aria-hidden className="h-px w-3 bg-current opacity-60" />
      </span>
      <span
        className={cn(
          "absolute bottom-2 left-2.5 text-[0.4375rem] uppercase leading-snug tracking-[0.18em]",
          ink,
        )}
      >
        {label.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </span>
    </div>
  );
}

/** The circled arrow in the corner of each folder. Opens the quick contact. */
function ArrowCircle({
  href,
  quickContact,
  label,
  className,
}: {
  href: string;
  quickContact: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      data-quick-contact={quickContact}
      aria-label={label}
      className={cn(
        "grid shrink-0 place-items-center rounded-full border border-white/25 bg-white/[0.04] text-scene transition-colors duration-300 hover:border-brand hover:bg-brand hover:text-black focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none",
        className,
      )}
    >
      <svg aria-hidden viewBox="0 0 24 24" className="size-[45%]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </Link>
  );
}

/**
 * The cursor reaching across from the work to the headline, as in the
 * reference: black, lit at the rim in the accent. Decoration only.
 */
function Pointer({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="-10 -10 80 104"
      className={cn("overflow-visible", className)}
      style={{ filter: "drop-shadow(0 0 10px rgb(255 197 22 / 0.55)) drop-shadow(0 18px 24px rgb(0 0 0 / 0.6))" }}
    >
      <defs>
        <linearGradient id="bd-pointer-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffc516" />
          <stop offset="100%" stopColor="#ffc516" />
        </linearGradient>
        <linearGradient id="bd-pointer-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#242426" />
          <stop offset="100%" stopColor="#000000" />
        </linearGradient>
      </defs>
      <path
        d="M0 0 L0 64 L16 49 L28 76 L41 70 L29 44 L51 44 Z"
        fill="url(#bd-pointer-body)"
        stroke="url(#bd-pointer-rim)"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The small four-petal mark beside each badge in the reference. */
function Bloom() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="size-5 shrink-0">
      {[0, 90, 180, 270].map((deg) => (
        <ellipse
          key={deg}
          cx="10"
          cy="5.5"
          rx="3.2"
          ry="4.5"
          fill="#ffc516"
          opacity="0.9"
          transform={`rotate(${deg} 10 10)`}
        />
      ))}
      <circle cx="10" cy="10" r="2.2" fill="#000" opacity="0.55" />
    </svg>
  );
}
