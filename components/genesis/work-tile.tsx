"use client";

import Image from "next/image";

import { type WorkItem } from "@/lib/work";
import { cn } from "@/lib/utils";
import { PriorityMark } from "./priority-mark";
import { VIDEO_GUARD_CLIENT } from "@/lib/video-guard";
import { useInViewPlayback } from "./use-in-view-playback";

/**
 * One piece of work as a tile, used by the masonry grid and by the browse
 * rails.
 *
 * IT WAS INSIDE work-grid.tsx, which is why it moved. The Portfolio grew a
 * second view — rows rather than a wall — and the choice was to copy a
 * hundred lines of tile or to lift them out. Two tiles would have disagreed
 * about hover playback within a week, and the placeholder bug below would
 * have had to be found twice.
 */

/**
 * Tile shape follows the FORMAT, which is the one honest source of variety
 * here: a reel is shot portrait and a film is not, so the grid is uneven
 * because the work is, rather than because a masonry algorithm decided so.
 *
 * The exception that used to live here is gone with the artwork that needed
 * it: ten 173x200 mockup cards with their own play button and caption painted
 * in, which had to keep their own shape or lose a letter off every client
 * name. They are removed, so every tile now takes the shape of its format.
 */
export function aspectFor(item: WorkItem): string {
  /*
    THE FOOTAGE WINS OVER THE LABEL. Every clip in Genesis's two Drive folders
    is 1080x1920 — forty-one of the forty-two, with only clip 31 landscape and
    it is not a lead — so a reel-backed piece is vertical whatever its format
    says. Mahindra Finance and Aditya Birla are tagged "Campaigns", which sent
    them to a 4:3 box, and object-cover then took a landscape slice out of the
    middle of a portrait video: heads cropped, captions gone. The format is a
    filing category, not a description of the frame.
  */
  if (item.reel?.length) return "aspect-[9/13]";
  /*
    The vertical formats. Renamed with the rest of the filter vocabulary —
    "UGC" is spelled out now — and "Shoots" is gone entirely, so the 4:3 case
    is down to the two that are genuinely shot wide. See CATEGORIES.
  */
  if (
    item.format === "Reels" ||
    item.format === "UGC"
  ) {
    return "aspect-[9/13]";
  }
  if (item.format === "Event Shoot" || item.format === "Photo Gallery") {
    return "aspect-[4/3]";
  }
  return "aspect-[4/5]";
}

export function WorkTile({
  item,
  /**
   * `grid` fills its column and takes its height from the aspect.
   * `rail` does the opposite — a FIXED HEIGHT with the width following the
   * aspect — so a row of mixed formats lines up top AND bottom. Netflix rows
   * are uniform; this catalogue is not, and letting the width vary is what
   * reconciles the two without cropping a portrait reel into a landscape box.
   * `fill` takes BOTH from its cell — the tile fills whatever box it is put
   * in and imposes no aspect of its own, because the library grid sets one
   * uniform 9:13 cell for every piece. See WorkGrid. (It was called `bento`
   * for the layout that briefly used it; the mechanism outlived the layout.)
   */
  variant = "grid",
  className,
  onOpen,
}: {
  item: WorkItem;
  variant?: "grid" | "rail" | "fill";
  className?: string;
  /**
   * Opens the piece over the landing page. There are no project pages any
   * more: Genesis asked for everything but the two forms to stay on the one
   * page, so a tile is a button that raises the piece's dialog.
   */
  onOpen?: () => void;
}) {
  /*
    THE TILE PLAYS ITSELF. This was hover-started and hover-stopped, which
    Genesis has asked to change: the work "will play directly within the
    gallery". Hover was hiding that these tiles are films at all, and on every
    touch screen — where there is no hover — the entire portfolio was stills.

    The cost that made it hover-only in the first place still stands, and the
    hook is where it is paid: only the tiles actually on screen ever get a
    decoder. See useInViewPlayback.
  */
  const videoRef = useInViewPlayback<HTMLVideoElement>();
  const hasArt = Boolean(item.clip || item.art);
  const rail = variant === "rail";
  const fill = variant === "fill";

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-label={`${item.client}, ${item.title}`}
      className={cn(
        "group relative block overflow-hidden rounded-card border border-[var(--glass-border)] bg-ink text-left",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        rail && "h-full w-auto shrink-0",
        // The cell is already the size it wants to be; the tile's job is to
        // fill it exactly, top to bottom.
        fill && "h-full w-full",
        className,
      )}
    >
      <div
        className={cn(
          "relative",
          rail && "h-full w-auto",
          fill && "size-full",
          !rail && !fill && "w-full",
          // The aspect is what SHAPES a grid tile and what SIZES a rail one.
          // A `fill` tile is shaped by its cell, so imposing one here would
          // fight the box the grid just gave it.
          !fill && aspectFor(item),
        )}
      >
        {item.clip ? (
          <video
            ref={videoRef}
            src={item.clip}
            poster={item.poster ?? item.art}
            muted
            loop
            playsInline
            // Nothing at all until the tile scrolls into view: the poster is
            // painted, and useInViewPlayback starts the load on arrival.
            // "metadata" fetched every tile's file on page load.
            preload="none"
            aria-hidden
            {...VIDEO_GUARD_CLIENT}
            className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.03]"
          />
        ) : item.art ? (
          <Image
            src={item.art}
            alt={`${item.client}, ${item.title}`}
            fill
            // Follows the column count on the grid: four on desktop, three on
            // tablet, two on a phone. Rails cap out around 320px.
            sizes={
              rail
                ? "320px"
                : "(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            }
            className="object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.03]"
          />
        ) : (
          /*
            NO ARTWORK YET, AND THIS IS THE TILE THAT WAS BROKEN.
            
            It used to centre the client's name at text-h3 in the middle of the
            box AND draw the standard caption block over the bottom of it. On a
            short name nothing collided; on "Aditya Birla Sun Life Insurance"
            the name wrapped to three lines, ran down into the caption, and the
            caption printed the same name again underneath itself with the
            format chip sitting on top of both. Genesis screenshotted it.
            
            Two faults, one cause: the placeholder and the caption were both
            saying the client's name, and neither knew the other was there. So
            a tile with no artwork now owns its whole frame — the name is set
            ONCE, as the tile's own content, in a flow layout with nothing
            absolutely positioned over it. It cannot overlap because there is
            no longer anything to overlap with.
            
            Pinned dark rather than following the theme. Every other tile is a
            photograph, so a light placeholder in the middle of them reads as a
            hole in the grid.
          */
          <div className="absolute inset-0 flex flex-col justify-between bg-[linear-gradient(150deg,#2f2b34_0%,#17151b_58%,#111014_100%)] p-4 sm:p-5">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "linear-gradient(rgb(255 255 255) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />
            <div className="relative flex max-w-full items-center gap-1.5">
              {item.featured && <PriorityMark className="shrink-0" />}
              <span className="glass-chip min-w-0 truncate rounded-full px-2.5 py-1 text-micro text-white/90">
                {item.format}
              </span>
            </div>
            <div className="relative">
              {/*
                Balanced and hyphenated, because the longest client on the list
                is thirty-one characters and a rail tile can be 180px wide.
                Without `hyphens` a word longer than the box overflows it
                rather than breaking.
              */}
              <p className="text-balance text-body font-medium leading-tight tracking-tight text-white/90 [hyphens:auto] sm:text-h3">
                {item.client}
              </p>
              <p className="mt-1 line-clamp-2 text-micro text-white/55">
                {item.title}
              </p>
            </div>
          </div>
        )}

        {/*
          Scrim and caption, unless there IS no artwork — in which case the
          block above is already the caption, and drawing a second one over it
          is the bug described there.
        */}
        {hasArt && (
          <>
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-2/3"
              style={{
                background:
                  "linear-gradient(0deg, rgb(0 0 0 / 0.86) 0%, rgb(0 0 0 / 0.35) 48%, transparent 100%)",
              }}
            />

            {/*
              THE FORMAT CHIP MOVED TO THE TOP, AND THAT IS A BUG FIX RATHER
              THAN A REARRANGEMENT.

              It used to sit at the bottom RIGHT, sharing one flex row with the
              client name and marked `shrink-0` — so the chip took whatever
              width it wanted and the name took the remainder. That was
              survivable while the longest format was "Campaigns". Renaming the
              vocabulary to Genesis's list made the longest "User-Generated
              Content (UGC)" at 24 characters, which on a 264px tile left about
              twenty pixels for the client: "Aditya Birla Capital Health
              Insurance" rendered as "A." over "C". Genesis screenshotted it.

              Two things had to change, not one. Moving the chip out of that
              row gives the name the full width — but a chip alone can still
              overrun a narrow tile, so it is capped at the tile's width and
              truncates. Top-left is also where Genesis's own reference cards
              put it.
            */}
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-1/4"
              style={{
                background:
                  "linear-gradient(180deg, rgb(0 0 0 / 0.5) 0%, transparent 100%)",
              }}
            />
            {/*
              THE MARKER SITS WITH THE CHIP, NOT OVER THE PICTURE. Genesis
              asked for a Genesis marker on featured work, and the two places
              it could go are the corner of the frame or beside the label
              already there. In the corner it is a badge floating on a
              photograph; in the row it reads as part of the same caption and
              takes the same scrim, which is the difference between hierarchy
              and decoration. See PriorityMark.
            */}
            <div className="absolute left-3 top-3 flex max-w-[calc(100%-1.5rem)] items-center gap-1.5">
              {item.featured && <PriorityMark className="shrink-0" />}
              <span className="glass-chip min-w-0 truncate rounded-full px-2.5 py-1 text-micro text-white/90">
                {item.format}
              </span>
            </div>

            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
              <p className="truncate text-small font-medium text-white">
                {item.client}
              </p>
              <p className="truncate text-micro text-white/70">{item.title}</p>
            </div>
          </>
        )}
      </div>
    </button>
  );
}
