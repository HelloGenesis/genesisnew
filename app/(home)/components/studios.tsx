"use client";

import { GlassButton } from "@/components/genesis/glass-button";
import { Reveal } from "@/components/genesis/reveal";
import { Spectrum } from "@/components/genesis/atmosphere";
import { DivisionLockup } from "@/components/genesis/division-lockup";
import { services, studios } from "@/lib/home-content";
import { mediaUrl } from "@/lib/media-url";
import { VIDEO_GUARD_CLIENT } from "@/lib/video-guard";
import { useInViewPlayback } from "@/components/genesis/use-in-view-playback";

/**
 * Genesis Studios — the production vertical.
 *
 * IT WAS THE ONLY VERTICAL WITHOUT A SECTION. Influence, AI Labs and Brand &
 * Design each had one; Studios, the division whose entire argument is the
 * footage, had a link to another page. The brief is direct about it: show the
 * production capability rather than describing it.
 *
 * So the section leads with a wall of Genesis's own work and puts the
 * capability list underneath as a caption. Thirteen named services in a grid
 * is what this section would have been without the clips, and it would have
 * been the least convincing block on a page about making films.
 *
 * THE CLIPS RUN BY THEMSELVES, and only while they are on screen. Genesis
 * asked for the wall to be playing rather than waiting to be hovered, which
 * is right — a reel wall whose reels are still is a contact sheet, and it
 * asked every visitor to discover that the stills were films at all.
 *
 * The reason it was hover-only still stands, though: thirty-two tiles (the row
 * is doubled for the loop) autoplaying is thirty-two live decoders and
 * thirty-two files pulled on load. So each tile watches its own intersection
 * and plays only while it is actually in the viewport, pausing the moment it
 * leaves. Off-screen tiles cost their poster and nothing else, which is what
 * `preload="none"` bought before, and the handful on screen are the only
 * decoders alive at any time.
 *
 * THE WALL DRIFTS, IT DOES NOT SCROLL-JACK. Two rows moving in opposite
 * directions on a CSS transform animation — no JS, no scroll listener,
 * compositor-only. It pauses on hover so a tile can actually be watched, and
 * Reduce Motion stops it entirely and hands the rows back to the reader as
 * ordinary horizontal scrollers.
 */
export function Studios() {
  /*
    ONE ROW, NOT TWO. Two rows of tall tiles plus a header, a capability list
    and three buttons made this the longest section on the page — a scroll and
    a half for a division whose point is made in the first two seconds of
    looking at it. One row says the same thing in half the height.
  */
  const row = studios.reel;

  return (
    <section
      id="studios"
      className="scene-open grain relative isolate overflow-hidden py-12 sm:py-14 lg:py-16"
    >
      {/*
        Blends into the sections above and below, in the LIGHT theme only.
        This is one of only two chapters that pin themselves dark, and on a
        light page it butts straight into the neighbouring ground. The bands
        paint --chapter-blend, which is the PAGE's ground: white on light,
        transparent on dark, where the chapter is not an island at all and
        anything opaque here would itself cut the page-wide field.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-[3] h-16"
        style={{
          background:
            "linear-gradient(180deg, var(--chapter-blend) 0%, color-mix(in srgb, var(--chapter-blend) 40%, transparent) 55%, transparent 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-16"
        style={{
          background:
            "linear-gradient(0deg, var(--chapter-blend) 0%, color-mix(in srgb, var(--chapter-blend) 40%, transparent) 55%, transparent 100%)",
        }}
      />

      <Spectrum />

      <div className="relative z-[2] mx-auto w-full max-w-6xl px-6">
        {/*
          THE MARK IN THE MIDDLE, the reading under it — the same arrangement
          AI Lab and Brand & Design now use. This was the lockup ragged left
          with the copy pushed to the right edge, which read as two things
          that happened to share a row rather than as a title and its
          standfirst.
        */}
        <div className="flex flex-col items-center text-center">
          <Reveal>
            <DivisionLockup
              name="Studios"
              tagline={services.items[2].caption}
              ramp={services.items[2].ramp}
            />
          </Reveal>

        </div>
      </div>

      {/*
        Full-bleed, and clipped at both edges. A reel wall with air either
        side of it reads as a widget dropped into the section; running off
        both edges is what makes it read as more work than fits.
      */}
      <Reveal variant="scene" className="relative mt-10 sm:mt-12">
        <ReelRow clips={row} />

        {/* The wall fades out rather than being cut off by the viewport. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-28"
          style={{
            background:
              "linear-gradient(90deg, var(--surface-base) 0%, transparent 100%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-28"
          style={{
            background:
              "linear-gradient(270deg, var(--surface-base) 0%, transparent 100%)",
          }}
        />
      </Reveal>

      <div className="relative z-[2] mx-auto mt-10 w-full max-w-6xl px-6 sm:mt-12">
        {/*
          THE COPY UNDER THE WALL, above the buttons — the same order AI Lab
          uses, and for the same reason. Over the reel it was a description of
          footage the reader had not seen yet; under it, it is the caption on
          footage they just watched.
        */}
        <Reveal delay={0.05}>
          <p className="mx-auto max-w-2xl text-pretty text-center text-body leading-relaxed text-ash sm:text-lead">
            {studios.body}
          </p>
        </Reveal>

        {/*
          THE CAPABILITY LIST IS BACK, and it is a different list.

          It came off this section once, and the reason was sound at the time:
          thirteen OUTPUT names — "Brand films", "Corporate films", "Motion
          graphics" — set in a run-on line under a wall of footage was the
          section explaining in words what the footage was already showing.

          Genesis has since supplied their own nine, and they are not the same
          claim. These are the parts of the pipeline you can buy, and two of
          them are things no amount of watching the reel would tell you:
          Genesis rents studios and venues, and shoots founders. That is
          information, not a caption.

          Set as chips under their own heading rather than as a run-on line,
          so a reader scanning for the one service they came for finds it in a
          single pass — the same treatment Influence gives its niches.
        */}
        <Reveal delay={0.08} className="mt-10">
          <p className="micro-label text-center">
            {studios.capabilitiesHeading}
          </p>
          <ul className="mx-auto mt-4 flex max-w-3xl flex-wrap justify-center gap-2">
            {studios.capabilities.map((capability) => (
              <li
                key={capability}
                className="rounded-full border border-[var(--glass-border)] bg-[var(--hover-wash)] px-3 py-1 text-micro font-medium uppercase tracking-[0.1em] text-ash"
              >
                {capability}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.14} className="mt-8 flex flex-wrap justify-center gap-3">
          <GlassButton
            href="/#contact"
            quickContact="studios:plan-a-shoot"
            variant="brand"
            size="lg"
            arrow
          >
            Plan a shoot
          </GlassButton>
          <GlassButton href="/content-creation" variant="glass" size="lg" arrow>
            Explore Genesis Studios
          </GlassButton>
          {/*
            POINTS DOWN THE PAGE, NOT OFF IT. This said "View studio work" and
            went to /our-work — which is the third place the same catalogue was
            being shown, and it took a reader who had just started watching the
            reel wall away from the page entirely. The library is now the one
            browse on the homepage and it sits below the four verticals, so
            this scrolls to it.
          */}
          <GlassButton href="/#library" variant="ghost" size="lg" arrow>
            View the whole library
          </GlassButton>
        </Reveal>
      </div>
    </section>
  );
}

function ReelRow({ clips }: { clips: readonly number[] }) {
  // Doubled so the translate can loop seamlessly: at -50% the second copy
  // sits exactly where the first started.
  const doubled = [...clips, ...clips];

  return (
    <div
      className="group/row relative flex overflow-x-auto overflow-y-hidden motion-safe:overflow-hidden"
      // Reduce Motion turns the row into a plain scroller, so the work is
      // still reachable when the drift is switched off.
      role="list"
      aria-label="Selected production work"
    >
      <div
        className={[
          "flex shrink-0 gap-4 pl-4",
          "motion-safe:animate-[reel-drift_60s_linear_infinite]",
          "motion-safe:group-hover/row:[animation-play-state:paused]",
        ].join(" ")}
      >
        {doubled.map((n, index) => (
          <ReelTile key={`${n}-${index}`} n={n} duplicate={index >= clips.length} />
        ))}
      </div>
    </div>
  );
}

function ReelTile({ n, duplicate }: { n: number; duplicate: boolean }) {
  /*
    Plays while on screen, pauses off it — which is what keeps "they should all
    be running" from meaning "all thirty-two are decoding". This wall is where
    that behaviour was first written; it now lives in a hook, because the work
    tiles and the case-study posters have since been asked for the same thing
    and there is no version of it that should differ between the three.
  */
  const ref = useInViewPlayback<HTMLVideoElement>();

  return (
    <div
      role="listitem"
      // The second copy exists only to make the loop seamless; announcing
      // every clip twice is noise.
      aria-hidden={duplicate || undefined}
      /*
        BIGGER, at Genesis's request. 13vw put a tile at 187px on a 1440
        screen, which is smaller than the work grid's thumbnails on the same
        page — a wall whose whole job is showing footage should not have the
        smallest media on the page. 17vw is 245px, and the clamp's floor rises
        with it so a phone gets a usable tile rather than a stamp.
      */
      className="relative w-[clamp(10.5rem,17vw,15rem)] shrink-0 overflow-hidden rounded-card border border-[var(--glass-border)] bg-ink"
    >
      <video
        ref={ref}
        // Through mediaUrl like everything else, so the reel wall follows the
        // same switch as the catalogue rather than being the one place still
        // hardcoded to /public. See lib/media-url.ts.
        src={mediaUrl(`/work/clips/${n}.mp4`)}
        poster={mediaUrl(`/work/posters/${n}.jpg`)}
        muted
        loop
        playsInline
        /*
          `metadata`, not `none`. The observer calls play() the moment a tile
          nears the viewport, and with `none` the browser has not opened the
          file yet — so the first second of every clip was a poster holding
          still while the fetch started. It is also not `auto`: that pulls all
          thirty-two on load, which is the thing being avoided.
        */
        preload="metadata"
        {...VIDEO_GUARD_CLIENT}
        className="aspect-[9/13] w-full object-cover"
      />
    </div>
  );
}
