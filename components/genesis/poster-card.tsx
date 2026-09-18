"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { useEdgeFade } from "./use-edge-fade";
import { useCallback, useEffect, useRef } from "react";
import { RailArrow } from "./work-grid";
import { useInViewPlayback } from "./use-in-view-playback";

import Link from "next/link";

import { cn, isPlainClick } from "@/lib/utils";
import { VIDEO_GUARD_CLIENT } from "@/lib/video-guard";

/**
 * Movie-poster card — the "Genesis Netflix" unit (img-025, img-026, img-013).
 *
 * Vertical 2:3 poster, category badge top-left, play affordance top-right,
 * title and meta over a bottom scrim. On hover it lifts and blooms brand,
 * matching the centre-focused treatment in the reference carousel.
 */

export type Poster = {
  id: string;
  title: string;
  /** e.g. "Brand Film", "Product Reel". */
  category: string;
  /** Further labels, drawn as pills after `category` ("two tabs"). */
  extraCategories?: string[];
  client?: string;
  meta?: string[];
  /** Optional real artwork. Falls back to a generated gradient. */
  image?: string;
  /**
   * A muted loop played on hover, with `image` as its still.
   *
   * These cards had a play control painted on them and nothing behind it —
   * four posters inviting a click that started nothing. Where the campaign has
   * footage in the catalogue, the control now means what it says.
   */
  clip?: string;
  /** Where the poster leads. A poster that opens nothing is a picture of
   *  work rather than a way into it. */
  href?: string;
  /**
   * The film's width over height (lib/clip-shape). Omitted means 9:16. A
   * landscape poster keeps the reels' height and grows wide instead.
   */
  ratio?: number;
};

/**
 * Deterministic placeholder artwork.
 *
 * Real poster images do not exist yet, and an empty <img> would render as a
 * broken frame. Hashing the id into a hue keeps each card visually distinct
 * and stable between server and client renders (no Math.random hydration
 * mismatch). Delete once real artwork is supplied.
 */
function placeholderArt(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 360;
  }
  // Constrained to the BRAND ARC, brand 350deg through brand 30deg, rather
  // than the full wheel. An unconstrained hash put three of the four live
  // portfolio ids at hue 92, 105 and 135 — lime and green billboards under the
  // names Aditya Birla Capital, HDFC and Mahindra Finance, on a site whose
  // whole palette is brand and brand. Saturation and lightness are pulled
  // back to graphite too: this is unphotographed work, and it should read as
  // restrained rather than as the loudest colour on the page.
  const hue = (350 + (hash % 41)) % 360;
  const partner = (hue + 14) % 360;
  return `radial-gradient(120% 90% at 30% 15%, hsl(${hue} 48% 26% / 0.9) 0%, transparent 60%),
          radial-gradient(90% 80% at 80% 90%, hsl(${partner} 40% 18% / 0.8) 0%, transparent 65%),
          linear-gradient(160deg, #1a1820 0%, #0c0b0f 100%)`;
}

/*
 * Type on a poster is type on a DARK OBJECT, not on the page. The card is a
 * billboard with a black gradient burned into its lower half, so its labels
 * use --color-scene, which is pinned light in both themes, rather than
 * --ink-strong, which flips. With text-bone the light theme rendered every
 * client name in near-black on near-black.
 *
 * The two .glass chips are the exception and deliberately still flip: glass
 * is a WHITE fill, so in the light theme it lightens the poster underneath
 * it and its label needs to go dark along with it. Which token a label wants
 * depends on what is directly behind it, not on which component it lives in.
 */
export function PosterCard({
  poster,
  className,
  onSelect,
  priority = false,
}: {
  poster: Poster;
  className?: string;
  /** Renders larger, as the focused card in a rail. */
  /** Opens the card in place instead of navigating. See the wrapper below. */
  onSelect?: (id: string) => void;
  priority?: boolean;
}) {
  /*
    THE POSTER PLAYS ITSELF, at Genesis's instruction — the rail's videos
    "will play directly within the gallery". It was hover-started, which on a
    rail of four cards meant a play glyph that did nothing until pointed at
    and nothing at all on a phone. The hook keeps the cost where it was: only
    the cards on screen hold a decoder. See useInViewPlayback.
  */
  const videoRef = useInViewPlayback<HTMLVideoElement>();
  const ratio = poster.ratio ?? 9 / 16;
  const reelWidth = priority
    ? "min(clamp(15rem,26vw,21rem),calc(60vh*9/16))"
    : "min(clamp(12rem,20vw,18rem),calc(54vh*9/16))";

  const card = (
    <motion.article
      whileHover={{ y: -10 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={cn(
        "group relative shrink-0 overflow-hidden rounded-panel border border-white/10",
        "shadow-[0_18px_50px_-18px_rgb(0_0_0/0.9)]",
        "transition-shadow duration-500 hover:shadow-[0_26px_70px_-16px_rgb(255_197_22/0.4)]",
        // Spec page 12 asks Portfolio for a "minimal Scroll section", and the
        // scroll IS the section. At the previous widths four posters plus
        // their gaps measured 1144px inside a 1104px container — the track was
        // the container width to the pixel, so `snap-x snap-mandatory` was
        // inert, `no-scrollbar` hid a scrollbar that could never appear, and
        // the negative right margin advertised a bleed that did not exist.
        /*
          REEL-SHAPED AT EVERY SIZE. The card was 2:3 with its height capped
          at 46vh, so on a laptop — width from vw, height from vh — the cap
          bit first and the poster came out wider than 2:3, nothing like the
          9:16 footage inside it. The cap is on the WIDTH now, as a share of
          the window's height, so the ratio below always holds.
        */
        className,
      )}
      /*
        A LANDSCAPE FILM KEEPS ITS SHAPE ("landscape hai toh landscape hi
        rakho"). The reel width is the unit; a landscape poster is as TALL as
        a reel (width x 16/9) and as wide as its own ratio makes that, so the
        rail's row stays level and the film is not cropped to a strip.
      */
      style={{
        width:
          ratio > 1
            ? `calc(${reelWidth} * 16 / 9 * ${ratio.toFixed(4)})`
            : reelWidth,
      }}
    >
      <div
        /*
          One ratio for every poster: 9:16, the footage's own, so a reel
          fills its card instead of being cropped to a print-poster shape.
          Arbitrary-value syntax: Tailwind v4 has no bare-fraction aspect.
        */
        className="relative w-full"
        style={{
          aspectRatio: ratio > 1 ? ratio : 9 / 16,
          ...(poster.image
            ? { backgroundImage: `url(${poster.image})`, backgroundSize: "cover" }
            : { backgroundImage: placeholderArt(poster.id) }),
        }}
      >
        {/*
          The footage, behind every scrim and control the card draws.

          Hover-played rather than autoplaying: a rail of four posters that all
          start on load is four decoders and four files pulled for a section a
          visitor may scroll straight past. play() rejects if the pointer
          leaves before the promise settles, which is ordinary.
        */}
        {poster.clip && (
          <video
            ref={videoRef}
            src={poster.clip}
            poster={poster.image}
            muted
            loop
            playsInline
            /* Loaded when it scrolls into view (useInViewPlayback), not on
               page load — the poster is already on screen. */
            preload="none"
            aria-hidden
            {...VIDEO_GUARD_CLIENT}
            className="absolute inset-0 size-full object-cover"
          />
        )}

        {/*
          With no artwork the client is the subject rather than a caption at
          the foot of an empty rectangle. Set large and centred, so the card
          reads as a deliberate typographic poster instead of a missing image.
        */}
        {!poster.image && (
          <div className="absolute inset-0 grid place-items-center px-5 pb-12">
            <p className="text-balance text-center text-h3 font-semibold leading-[1.1] tracking-tight text-scene/90">
              {/* Whichever field carries the recognisable name. Case studies
                  with no written story put the client in `title`; portfolio
                  entries carry both. */}
              {poster.client ?? poster.title}
            </p>
          </div>
        )}

        {/* The card's own chrome — pill, play control, caption. */}
        {(
          <>
        {/*
          Legibility scrims, and they RUN THE WHOLE CARD now.

          THIS WAS THE CUT ACROSS THE LOWER HALF. The diagonal scrim was
          `rgb(0 0 0/0.9) 0%, rgb(0 0 0/0.7) 32%, transparent 62%` — nearly
          flat black for its first third, then the entire remaining alpha
          dumped over the next thirty percent and finished by 62%. Two things
          go wrong with that. It reaches zero well before the top of the card,
          so the scrim has an END inside the artwork, and a gradient that
          stops mid-surface draws an edge exactly like a clip does. And the
          fall from 0.7 to 0 in thirty percent is steep enough to band, so
          that edge is not even soft. Four posters in a rail, four diagonal
          seams across their lower halves.

          The stops below are an eased falloff over the FULL height — closely
          spaced where the alpha is changing fastest, arriving at zero at
          100% rather than 62%. There is no point on the card where the scrim
          ends, so there is no line. The top scrim gets the same treatment.
        */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0.45)_0%,rgb(0_0_0/0.26)_12%,rgb(0_0_0/0.12)_24%,rgb(0_0_0/0.04)_36%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(var(--n-angle),rgb(0_0_0/0.92)_0%,rgb(0_0_0/0.86)_12%,rgb(0_0_0/0.74)_24%,rgb(0_0_0/0.58)_38%,rgb(0_0_0/0.4)_52%,rgb(0_0_0/0.24)_66%,rgb(0_0_0/0.12)_78%,rgb(0_0_0/0.04)_90%,transparent_100%)]" />

        {/* Room is left on the right for the play glyph. */}
        <div className="absolute left-3 right-14 top-3 flex flex-wrap gap-1.5">
          {[poster.category, ...(poster.extraCategories ?? [])].map((label) => (
            <span
              key={label}
              className="glass rounded-full px-3 py-1 text-micro font-medium tracking-wide text-bone"
            >
              {label}
            </span>
          ))}
        </div>

        {/*
          ONLY WHERE THERE IS FOOTAGE. The glyph was painted on all four cards
          including the two with no clip behind them — a play control that
          starts nothing is the same fault as a link to a page that does not
          exist. Now that the cards play themselves it reads as a label saying
          "this one is a film" rather than as a button.
        */}
        {poster.clip && (
          <span className="glass absolute right-3 top-3 grid size-8 place-items-center rounded-full text-bone opacity-80 transition-opacity duration-300 group-hover:opacity-100">
            <Play className="size-3.5 fill-current" aria-hidden />
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 p-4">
          {poster.client && poster.image && (
            <p className="micro-label mb-2 !text-micro !tracking-[0.22em] text-scene/70">
              {poster.client}
            </p>
          )}
          {!(!poster.image && !poster.client) && (
            <h3 className="text-balance text-small font-normal leading-tight text-scene">
              {poster.title}
            </h3>
          )}
          {poster.meta && poster.meta.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {poster.meta.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-white/10 px-2 py-0.5 text-micro text-scene/80"
                >
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>
          </>
        )}
      </div>
    </motion.article>
  );

  /*
    A BUTTON WHERE THE CALLER WANTS THE CARD TO OPEN SOMETHING IN PLACE.
    Genesis asked for the case-study posters to open over the page with the
    page blurred behind, which is a dialog rather than a destination — so
    where `onSelect` is given the poster becomes a real <button>, not a div
    with a click handler. That is what makes it reachable by Tab and operable
    with Space and Enter for free.
  */
  /*
    BOTH, WHERE THE POSTER HAS A PAGE AND THE CALLER A WINDOW. The case-study
    rail opens studies over the page, and every study now has a URL of its
    own. So the poster is a link to that URL — what a crawler, a cmd-click or
    a middle click follows — and a plain click opens the window instead.
  */
  if (onSelect && poster.href) {
    return (
      <Link
        href={poster.href}
        prefetch={false}
        onClick={(event) => {
          if (!isPlainClick(event)) return;
          event.preventDefault();
          onSelect(poster.id);
        }}
        aria-haspopup="dialog"
        aria-label={`${poster.client ?? poster.title}, ${poster.title}`}
        className="block shrink-0 rounded-panel text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
      >
        {card}
      </Link>
    );
  }

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={() => onSelect(poster.id)}
        aria-haspopup="dialog"
        aria-label={`${poster.client ?? poster.title}, ${poster.title}`}
        className="block shrink-0 rounded-panel text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
      >
        {card}
      </button>
    );
  }

  /*
    A LINK WRAPS THE CARD rather than sitting inside it. The whole poster is
    the target, and because it is an anchor rather than a click handler,
    cmd-click and middle-click open the project in a tab.
  */
  if (!poster.href) return card;
  return (
    <Link
      href={poster.href}
      aria-label={`${poster.client ?? poster.title}, ${poster.title}`}
      className="shrink-0 rounded-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
    >
      {card}
    </Link>
  );
}export function PosterRail({
  posters,
  onSelect,
  className,
}: {
  posters: Poster[];
  onSelect?: (id: string) => void;
  className?: string;
}) {
  const { ref: railRef, style: railStyle } = useEdgeFade<HTMLDivElement>();

  /*
    A SLIDER, NOT JUST A SCROLLER. With sixteen posters the rail runs well
    past the window, and a trackpad swipe is not something every visitor
    thinks to try. The arrows step one card at a time, measured from the
    first card so the step is right at every width; the wrap-around keeps
    the last arrow press from being a dead click.
  */
  const step = useCallback((direction: 1 | -1) => {
    const rail = railRef.current;
    const card = rail?.firstElementChild as HTMLElement | null;
    if (!rail || !card) return;
    const max = rail.scrollWidth - rail.clientWidth;
    const atEnd = direction === 1 && rail.scrollLeft >= max - 2;
    const atStart = direction === -1 && rail.scrollLeft <= 2;
    if (atEnd || atStart) {
      rail.scrollTo({ left: atEnd ? 0 : max, behavior: "smooth" });
      return;
    }
    rail.scrollBy({ left: direction * (card.offsetWidth + 16), behavior: "smooth" });
  }, [railRef]);

  /*
    IT SLIDES ON ITS OWN, continuously, and gives way to the reader. Pointing at the rail or focusing a card pauses it; a touch, a
    wheel or an arrow press holds it for a while so it does not yank the rail
    out from under someone who is browsing. It only runs while the rail is on
    screen and the tab is visible, and Reduce Motion gets a still rail.

    A DRIFT, as Genesis asked ("continuous slide"), driven by scrollLeft the
    same way the portfolio strips are, so swiping and the arrows still work
    on the same scroll position. At either end it turns and comes back.

    NO SCROLL-SNAP ON THIS RAIL any more. Snap re-aligns the position at the
    end of every scroll, and a rail creeping forward a fraction of a pixel a
    frame is one long run of scroll ends — snap kept pulling it back and it
    stuttered in place. The portfolio strips dropped snap for the same reason.
  */
  const box = useRef<HTMLDivElement>(null);
  const holdUntil = useRef(0);
  const hold = useCallback((ms: number) => {
    // Never shortens a longer hold already in place — leaving the rail
    // right after an arrow press must not cut that press's pause short.
    holdUntil.current = Math.max(holdUntil.current, Date.now() + ms);
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    /*
      ON A PHONE IT HAS TO KEEP GOING, which the first version did not.
      Tapping a card focused it, closing the dialog handed focus straight
      back, and a focused card meant "paused" until focus went somewhere else
      — which on a phone is usually never. So only a real MOUSE over the rail
      and KEYBOARD focus (:focus-visible) pause it; a finger just holds it
      for a few seconds, like the portfolio strips.
    */
    let hovering = false;
    let focused = false;
    const enter = (event: PointerEvent) => {
      if (event.pointerType === "mouse") hovering = true;
    };
    const leave = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      hovering = false;
      hold(1500);
    };
    const focusIn = (event: FocusEvent) => {
      focused = (event.target as Element).matches(":focus-visible");
    };
    const focusOut = () => {
      focused = false;
    };
    const touched = () => hold(4000);
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("focusin", focusIn);
    el.addEventListener("focusout", focusOut);
    el.addEventListener("pointerdown", touched, { passive: true });
    el.addEventListener("touchstart", touched, { passive: true });
    el.addEventListener("wheel", touched, { passive: true });

    const rail = railRef.current;
    if (!rail) return;
    const SPEED = 30; // px per second
    let direction = 1;
    // Kept as a float and only written while running: a browser may round
    // scrollLeft to whole pixels, and at 30px a second a frame's step is
    // under one — read back and re-added, it would round to nothing.
    let offset = rail.scrollLeft;
    let last = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const rect = el.getBoundingClientRect();
      const onScreen = rect.bottom > 0 && rect.top < window.innerHeight;
      // A dialog opened from a card is over the page; the rail should wait.
      const dialogOpen = document.querySelector("[role=dialog]") !== null;
      const max = rail.scrollWidth - rail.clientWidth;
      const running =
        !hovering &&
        !focused &&
        onScreen &&
        !dialogOpen &&
        !document.hidden &&
        Date.now() >= holdUntil.current &&
        max > 0;

      if (!running) {
        // Follow the reader's own scrolling, so the drift resumes from there.
        offset = rail.scrollLeft;
      } else {
        offset += direction * SPEED * dt;
        if (offset >= max) {
          offset = max;
          direction = -1;
        } else if (offset <= 0) {
          offset = 0;
          direction = 1;
        }
        rail.scrollLeft = offset;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("focusin", focusIn);
      el.removeEventListener("focusout", focusOut);
      el.removeEventListener("pointerdown", touched);
      el.removeEventListener("touchstart", touched);
      el.removeEventListener("wheel", touched);
    };
  }, [railRef, hold]);

  return (
    <div ref={box} className="relative">
      <div
        ref={railRef}
        // Retained as a hook; the camera turn that used to scrub this rail's
        // scrollLeft has been removed.
        data-poster-rail
        className={cn(
          /*
            ROOM ABOVE THE CARDS. A card lifts 10px on hover, and a
            sideways scroller clips vertically too — overflow-x: auto forces
            overflow-y off `visible` — so the lifted card's top was being
            sliced off at the rail's edge. The top padding is space for the
            lift to happen in; the bottom leaves room for the hover glow.
          */
          "no-scrollbar flex items-center gap-4 overflow-x-auto px-1 pt-5 pb-6",
          className,
        )}
        /*
          The rail ran to a hard edge, so the first and last cards were sliced
          mid-word by the viewport — "…hindra" — which reads as a rendering
          fault rather than as more content off-screen.

          A mask fades the ends into the page instead, and it SAYS there is more
          to the side, which a clean cut does not: a card dissolving is an
          invitation to scroll, a card guillotined is a bug. useEdgeFade sets
          each width from the rail's actual scroll position, so an end with
          nothing beyond it carries no fade and a rail that fits carries none
          at all.
        */
        style={railStyle}
      >
        {posters.map((poster, index) => (
          <div key={poster.id}>
            <PosterCard
              poster={poster}
              onSelect={onSelect}
              priority={index === Math.floor(posters.length / 2)}
            />
          </div>
        ))}
      </div>
      <RailArrow
        direction="left"
        label="Previous case study"
        onClick={() => {
          hold(8000);
          step(-1);
        }}
        className="!grid left-3 sm:left-6"
      />
      <RailArrow
        direction="right"
        label="Next case study"
        onClick={() => {
          hold(8000);
          step(1);
        }}
        className="!grid right-3 sm:right-6"
      />
    </div>
  );
}
