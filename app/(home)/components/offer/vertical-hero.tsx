import Image from "next/image";
import type { ReactNode } from "react";

import { GlassButton } from "@/components/genesis/glass-button";
import { Reveal } from "@/components/genesis/reveal";
import { SectionLabel } from "@/components/genesis/section-label";
import { mediaUrl } from "@/lib/media-url";
import type { Cta, IconName } from "@/lib/verticals/types";
import { cn } from "@/lib/utils";
import { OfferIcon } from "./icons";

/**
 * The opening of the AI Labs, Studios and Brand & Design pages: the promise on
 * the left, a collage of the vertical's own work on the right, and the
 * category strip under the buttons.
 *
 * The mockups set this on white with a black grotesque. Here it is the site's
 * dark ground, Mont ExtraLight, and the accent line in brand-yellow italic —
 * the same register as every other opening on the site.
 */
export function VerticalHero({
  label,
  lines,
  accent,
  lead,
  body,
  primary,
  secondary,
  strip,
  images,
  note,
  visual,
}: {
  label: string;
  /** The heading's plain lines, before the lit one. */
  lines: readonly string[];
  accent: string;
  lead: string;
  body?: string;
  primary: Cta;
  secondary: Cta;
  strip: readonly (string | { label: string; icon?: IconName })[];
  images: readonly { src: string; label?: string }[];
  /** The handwritten aside beside the collage — "Same you. More content." */
  note?: string;
  /** A composition of the page's own to stand in for the photo collage. */
  visual?: ReactNode;
}) {
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 pb-[var(--section-pad)] pt-10 lg:grid-cols-[1fr_1fr] lg:pt-14">
      <Reveal>
        <SectionLabel dot tone="brand">
          {label}
        </SectionLabel>
        <h1 className="mt-5 text-balance text-h1 font-normal leading-[0.98] tracking-tight text-bone xl:text-[4rem]">
          {lines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
          <span className="block font-serif italic text-brand-ink">{accent}</span>
        </h1>
        <p className="mt-6 max-w-xl text-pretty text-lead leading-snug text-bone">{lead}</p>
        {body && <p className="mt-3 max-w-xl text-pretty text-body leading-relaxed text-ash">{body}</p>}
        <div className="mt-8 flex flex-wrap gap-3">
          <GlassButton href={primary.href} variant="brand" size="md" arrow magnetic>
            {primary.label}
          </GlassButton>
          <GlassButton href={secondary.href} variant="glass" size="md" arrow>
            {secondary.label}
          </GlassButton>
        </div>
        <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
          {strip.map((item) => {
            const entry = typeof item === "string" ? { label: item } : item;
            return (
              <li key={entry.label} className="flex items-center gap-2 text-small text-ash">
                {entry.icon ? (
                  <OfferIcon name={entry.icon} className="size-4 text-brand-ink" />
                ) : (
                  <span aria-hidden className="size-1.5 rounded-full bg-brand" />
                )}
                {entry.label}
              </li>
            );
          })}
        </ul>
      </Reveal>

      {visual ? (
        <Reveal variant="scene" className="relative mx-auto w-full max-w-xl">
          {visual}
        </Reveal>
      ) : (
        <Reveal variant="scene" className="relative mx-auto aspect-[5/4] w-full max-w-xl">
          <Collage images={images} />
          {note && (
            <p
              aria-hidden
              className="absolute -top-2 left-2 z-[3] -rotate-6 font-serif text-lead italic text-bone/80 sm:left-6"
            >
              {note}
            </p>
          )}
        </Reveal>
      )}
    </section>
  );
}

/*
  FOUR FRAMES AT MOST, laid like prints on a table: one large, three smaller,
  each a little off true. Positions are fixed rather than generated so the
  server and the browser draw the same thing.
*/
const FRAMES = [
  { left: "0%", top: "16%", width: "44%", rotate: "-3deg", z: 2 },
  { left: "41%", top: "0%", width: "31%", rotate: "2deg", z: 1 },
  { left: "71%", top: "12%", width: "28%", rotate: "5deg", z: 1 },
  { left: "40%", top: "57%", width: "44%", rotate: "-2deg", z: 3 },
];

function Collage({ images }: { images: readonly { src: string; label?: string }[] }) {
  return (
    <div className="absolute inset-0">
      <span aria-hidden className="absolute inset-[12%] rounded-full bg-brand/15 blur-3xl" />
      {images.slice(0, FRAMES.length).map((image, index) => {
        const frame = FRAMES[index];
        return (
          <figure
            key={image.src}
            className={cn(
              "absolute overflow-hidden rounded-panel border border-white/15 bg-ink shadow-[var(--shadow-float)]",
            )}
            style={{
              left: frame.left,
              top: frame.top,
              width: frame.width,
              aspectRatio: index === 3 ? "16 / 10" : "4 / 5",
              rotate: frame.rotate,
              zIndex: frame.z,
            }}
          >
            <Image
              src={mediaUrl(image.src)}
              alt={image.label ?? ""}
              fill
              priority={index === 0}
              sizes="(min-width: 1024px) 18rem, 45vw"
              className="object-cover"
            />
            {image.label && (
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 pb-2.5 pt-8 text-small text-white">
                {image.label}
              </figcaption>
            )}
          </figure>
        );
      })}
    </div>
  );
}
