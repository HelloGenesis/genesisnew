import { Check } from "lucide-react";
import type { ReactNode } from "react";

import { Reveal } from "@/components/genesis/reveal";
import { SectionLabel } from "@/components/genesis/section-label";
import { cn } from "@/lib/utils";

/**
 * The small pieces every block on the vertical pages is made of.
 *
 * THE BRIEF'S MOCKUPS ARE A DIFFERENT SITE'S SKIN — light pages, a heavy
 * grotesque, flat white cards. What carries over is their structure: an
 * eyebrow, a two-line heading with the second line lit, a short standfirst to
 * the right, then the content. Everything here is set in the site's own
 * language instead: Mont at its ExtraLight weight with the accent in the
 * brand yellow italic, glass surfaces, the 4-based spacing scale.
 */

/** One block of a vertical page: the container and the rhythm between blocks. */
export function OfferSection({
  id,
  children,
  className,
  labelledBy,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn("mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-[var(--section-pad)]", className)}
    >
      {children}
    </section>
  );
}

/**
 * Eyebrow, heading, standfirst. `split` puts the standfirst beside the
 * heading from lg, the way every section head in the brief is drawn; `center`
 * stacks it all on the axis.
 */
export function SectionHead({
  id,
  label,
  heading,
  accent,
  body,
  as: Tag = "h2",
  align = "split",
  aside,
  className,
}: {
  id?: string;
  label?: string;
  heading: string;
  accent?: string;
  body?: readonly string[] | string;
  as?: "h1" | "h2";
  align?: "split" | "left" | "center";
  /** Anything that sits opposite the heading instead of the standfirst (a toggle, arrows). */
  aside?: ReactNode;
  className?: string;
}) {
  const lines = typeof body === "string" ? [body] : (body ?? []);
  const center = align === "center";
  return (
    <Reveal
      className={cn(
        align === "split" && "grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-12",
        center && "flex flex-col items-center text-center",
        className,
      )}
    >
      <div className={cn(center && "flex flex-col items-center")}>
        {label && (
          <SectionLabel dot tone="brand">
            {label}
          </SectionLabel>
        )}
        <Tag
          id={id}
          className={cn(
            "text-balance font-normal leading-[1.05] tracking-tight text-bone",
            label && "mt-5",
            Tag === "h1" ? "text-h2 sm:text-h1" : "text-h3 sm:text-h2",
          )}
        >
          {heading}
          {accent && (
            <>
              {" "}
              <span className="block font-serif italic text-brand-ink">{accent}</span>
            </>
          )}
        </Tag>
      </div>
      {(lines.length > 0 || aside) && (
        <div className={cn(align === "left" && "mt-5", center && "mt-5 max-w-2xl")}>
          {lines.map((line, index) => (
            <p
              key={line}
              className={cn("text-pretty text-body leading-relaxed text-ash", index > 0 && "mt-2")}
            >
              {line}
            </p>
          ))}
          {aside}
        </div>
      )}
    </Reveal>
  );
}

/** A tick and a line — the list inside every plan card. */
export function CheckList({
  items,
  className,
  tone = "brand",
}: {
  items: readonly string[];
  className?: string;
  tone?: "brand" | "muted";
}) {
  return (
    <ul className={cn("space-y-2.5", className)}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-small leading-snug text-ash sm:text-body">
          <span
            aria-hidden
            className={cn(
              "mt-0.5 grid size-[1.125rem] shrink-0 place-items-center rounded-full border",
              tone === "brand" ? "border-brand/50 text-brand-ink" : "border-white/20 text-ash",
            )}
          >
            <Check className="size-3" strokeWidth={2.4} />
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** A pill label — the category strips and "Built for" row. */
export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "glass-chip inline-flex h-10 items-center gap-2 rounded-full px-4 text-small text-bone",
        className,
      )}
    >
      {children}
    </span>
  );
}
