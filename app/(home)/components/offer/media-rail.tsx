"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, Play } from "lucide-react";
import { useRef, type ReactNode } from "react";

import { mediaUrl } from "@/lib/media-url";
import { cn } from "@/lib/utils";
import { RailProgress } from "@/components/genesis/rail-progress";

export type RailCard = {
  title: string;
  body?: string;
  image: string;
  /** Anything under the body — a price line, a link. */
  foot?: ReactNode;
  /** Makes the picture a button — it opens the card's work. */
  onSelect?: () => void;
  /** What the button says to assistive tech. */
  selectLabel?: string;
};

/**
 * A row of picture cards that slides sideways, with arrows — the "moving
 * visual carousel" and the one-time projects slider in the brief.
 *
 * NATIVE SCROLL, SNAPPED. The arrows only move the track by one card; a
 * trackpad, a finger or the keyboard all move it the same way without them,
 * and `data-lenis-prevent` stops the page's smooth scroll from swallowing the
 * sideways wheel.
 */
export function MediaRail({
  items,
  label,
  aspect = "4/5",
  cardClassName,
  arrowsClassName,
  headerSlot,
}: {
  items: readonly RailCard[];
  label: string;
  aspect?: "4/5" | "1/1" | "3/4";
  cardClassName?: string;
  arrowsClassName?: string;
  /** Rendered to the left of the arrows, on the same line. */
  headerSlot?: ReactNode;
}) {
  const track = useRef<HTMLUListElement>(null);

  const step = (direction: 1 | -1) => {
    const node = track.current;
    if (!node) return;
    const card = node.querySelector("li");
    const distance = card ? card.getBoundingClientRect().width + 16 : node.clientWidth * 0.8;
    node.scrollBy({ left: direction * distance, behavior: "smooth" });
  };

  return (
    <div>
      <div className={cn("flex items-end justify-between gap-6", arrowsClassName)}>
        <div className="min-w-0 flex-1">{headerSlot}</div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            aria-label={`Previous: ${label}`}
            onClick={() => step(-1)}
            className="grid size-10 place-items-center rounded-full border border-white/15 text-bone transition-colors hover:border-white/35 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <ArrowLeft className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            aria-label={`Next: ${label}`}
            onClick={() => step(1)}
            className="grid size-10 place-items-center rounded-full border border-white/15 text-bone transition-colors hover:border-white/35 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
      <ul
        ref={track}
        data-lenis-prevent
        aria-label={label}
        className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <li
            key={item.title}
            className={cn(
              "w-[68%] shrink-0 snap-start min-[480px]:w-[44%] md:w-[30%] lg:w-[calc((100%-5rem)/6)]",
              cardClassName,
            )}
          >
            <article className="group">
              {(() => {
                const picture = (
                  <>
                    <Image
                      src={mediaUrl(item.image)}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 12rem, (min-width: 768px) 30vw, 60vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
                    {item.onSelect && (
                      <span
                        aria-hidden
                        className="absolute bottom-3 left-3 grid size-10 place-items-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors group-hover:bg-brand group-hover:text-ink"
                      >
                        <Play className="size-4 translate-x-px" fill="currentColor" />
                      </span>
                    )}
                  </>
                );
                const frame =
                  "relative block w-full overflow-hidden rounded-card border border-[var(--glass-border)] bg-ink";
                const ratio = { aspectRatio: aspect.replace("/", " / ") };
                return item.onSelect ? (
                  <button
                    type="button"
                    onClick={item.onSelect}
                    aria-label={item.selectLabel ?? item.title}
                    className={cn(
                      frame,
                      "cursor-pointer transition-colors hover:border-brand/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                    )}
                    style={ratio}
                  >
                    {picture}
                  </button>
                ) : (
                  <div className={frame} style={ratio}>
                    {picture}
                  </div>
                );
              })()}
              <h3 className="font-sans mt-3 text-body leading-snug text-bone">{item.title}</h3>
              {item.body && <p className="mt-1 text-pretty text-small leading-relaxed text-ash">{item.body}</p>}
              {item.foot}
            </article>
          </li>
        ))}
      </ul>
      <RailProgress rail={track} className="mt-3" />
    </div>
  );
}
