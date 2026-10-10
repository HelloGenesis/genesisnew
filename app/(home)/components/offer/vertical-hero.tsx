import Image from "next/image";
import type { ReactNode } from "react";

import { Reveal } from "@/components/genesis/reveal";
import { mediaUrl } from "@/lib/media-url";
import type { IconName } from "@/lib/verticals/types";
import { cn } from "@/lib/utils";
import { GlassIcon, type GlassIconName } from "@/components/genesis/glass-icon";
import { OfferIcon } from "./icons";
import { VerticalCtas } from "./vertical-ctas";

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
  heading,
  lead,
  body,
  strip,
  images,
  note,
  visual,
  fitPhone = false,
  extra,
}: {
  label: string;
  /** The heading's plain lines, before the lit one. */
  lines?: readonly string[];
  accent?: string;
  /** A headline of the page's own, in place of `lines` and `accent`. */
  heading?: ReactNode;
  lead?: string;
  body?: string;
  strip: readonly (string | { label: string; icon?: IconName })[];
  images: readonly { src: string; label?: string }[];
  /** The handwritten aside beside the collage — "Same you. More content." */
  note?: string;
  /** A composition of the page's own to stand in for the photo collage. */
  /** The right-hand picture; `false` for none — the words alone, one column. */
  visual?: ReactNode | false;
  /**
   * The whole opening on one phone screen (Genesis, 4 Oct 2026: "put these in
   * one page on phone … visible to the user across phone devices"): below lg
   * the section is the screen's height, a column, and the picture takes what
   * the headline, services and buttons leave. Only for a picture that can
   * shrink — the AI Lab diagram.
   */
  fitPhone?: boolean;
  /** Something under the services, above the buttons: the Influence page's 1,00,000+ card. */
  extra?: ReactNode;
}) {
  return (
    /*
      ONE SCREEN ON A DESKTOP (Genesis, 4 Oct 2026: "make this page fit on
      desktop"): from lg the opening is exactly the window, less the bar's
      room above it, with both columns centred in it.
    */
    <section
      className={cn(
        "mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)] items-center gap-0 px-6 pb-[var(--section-pad)] pt-10 lg:grid lg:min-h-[calc(100svh-6rem)] lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 lg:py-8 xl:max-w-7xl",
        visual === false && "lg:min-h-0 lg:grid-cols-1 lg:pb-[var(--section-pad)] lg:pt-16",
        /* Its own height, not a fixed screen, now the picture is the full diagram with its pieces (Genesis, 8 Oct 2026: they overlapped the services). */
        fitPhone && "max-lg:flex max-lg:items-stretch max-lg:flex-col max-lg:pb-5 max-lg:pt-4",
      )}
    >
      {/*
        ON A PHONE THE PICTURE COMES BETWEEN THE HEADLINE AND THE SERVICES
        (Genesis, 4 Oct 2026: "add this between AI visuals & films and
        whenever you need"). Below lg this column dissolves (`contents`) so
        its pieces and the picture are siblings in the grid and `order` can
        interleave them; from lg it is a real column again.
      */}
      <Reveal className="contents lg:block">
        {/* No eyebrow label (Genesis, 4 Oct 2026: "remove this") — the headline names the division. */}
        <span className="sr-only">{label}</span>
        <div className="order-1">
        {heading ?? (
          <h1 className="mt-5 text-balance text-h1 font-normal leading-[0.98] tracking-tight text-bone xl:text-[4rem]">
            {lines?.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
            <span className="block font-serif italic text-brand-ink">{accent}</span>
          </h1>
        )}
        {lead && <p className="mt-6 max-w-xl text-pretty text-lead leading-snug text-bone">{lead}</p>}
        {body && <p className="mt-3 max-w-xl text-pretty text-body leading-relaxed text-ash">{body}</p>}
        </div>
        {/*
          THE SERVICES, THEN THE BUTTONS (Genesis, 4 Oct 2026: "the buttons
          should be below the icons, increase the spacing there too").
        */}
        <ServiceStrip items={strip} className={cn("order-3 mt-10", fitPhone && "max-lg:mt-4 max-sm:grid max-sm:grid-cols-[repeat(2,auto)] max-sm:justify-between max-sm:gap-x-2 max-sm:gap-y-1.5 max-sm:[&>li]:gap-1.5 max-sm:[&>li]:whitespace-nowrap max-sm:[&>li]:text-[0.75rem] max-sm:[&_svg]:size-6")} />
        {extra && <div className="order-3 mt-8 max-w-xl">{extra}</div>}
        <VerticalCtas size="md" className={cn("order-4 mt-10", fitPhone && "max-lg:mt-5 max-sm:grid max-sm:grid-cols-2 max-sm:gap-2 max-sm:[&>*]:h-11 max-sm:[&>*]:w-full max-sm:[&_a]:w-full max-sm:[&>*]:justify-center max-sm:[&_a]:justify-center max-sm:[&>*]:px-3 max-sm:[&>*]:text-[0.8125rem] max-sm:[&_svg]:hidden")} />
      </Reveal>

      {visual === false ? null : visual ? (
        <Reveal
          variant="scene"
          className={cn(
            "relative order-2 mx-auto mt-10 w-full max-w-xl lg:order-none lg:mt-0 lg:max-w-none",
            fitPhone && "max-lg:mt-4",
          )}
        >
          {visual}
        </Reveal>
      ) : (
        <Reveal variant="scene" className="relative order-2 mx-auto mt-10 aspect-[5/4] w-full max-w-xl lg:order-none lg:mt-0">
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

/**
 * The division's services in one line of dots, under the hero's buttons —
 * and, on /influencer-marketing, under the homepage section it opens with.
 */
/*
  AN ICON FOR EACH DIVISION SERVICE (Genesis, 4 Oct 2026: "you can add icons
  here"), from the site's glass set — the four menus' twenty services.
*/
const SERVICE_ICONS: Record<string, GlassIconName> = {
  "AI visuals & films": "video",
  "Digital avatars": "avatar",
  "Voice & localisation": "voice",
  "AI automation": "bolt",
  "Interactive experiences": "grid",
  "Content strategy": "target",
  Scriptwriting: "script",
  "Video production": "camera",
  "Motion graphics": "motion",
  "Founder content": "briefcase",
  "Brand strategy": "idea",
  "Visual identity": "brand",
  "Campaign design": "palette",
  "Pitch decks": "presentation",
  "Brand guidelines": "layers",
  "Influencer campaigns": "megaphone",
  "Celebrity partnerships": "star",
  "UGC campaigns": "phone",
  "Creator activations": "rocket",
  "Regional campaigns": "language",
};

export function ServiceStrip({
  items,
  className,
}: {
  items: readonly (string | { label: string; icon?: IconName })[];
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-wrap gap-x-6 gap-y-3", className)}>
      {items.map((item) => {
        const entry = typeof item === "string" ? { label: item } : item;
        return (
          <li key={entry.label} className="flex items-center gap-2.5 text-small text-bone/90">
            {entry.icon ? (
              <OfferIcon name={entry.icon} className="size-4 text-brand-ink" />
            ) : SERVICE_ICONS[entry.label] ? (
              <GlassIcon name={SERVICE_ICONS[entry.label]} className="size-7 shrink-0" />
            ) : (
              <span aria-hidden className="size-1.5 rounded-full bg-brand" />
            )}
            {entry.label}
          </li>
        );
      })}
    </ul>
  );
}
