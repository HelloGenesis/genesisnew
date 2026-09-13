import type { ReactNode } from "react";

import { Atmosphere } from "@/components/genesis/atmosphere";
import { Reveal } from "@/components/genesis/reveal";
import { DivisionLockup } from "@/components/genesis/division-lockup";
import { SectionLabel } from "@/components/genesis/section-label";
import { cn } from "@/lib/utils";

/**
 * Shared layout for every homepage section: consistent vertical rhythm,
 * container width, and the label → two-tone heading → body intro pattern that
 * runs through the reference designs.
 *
 * Defined once so all 13 sections share spacing and heading treatment rather
 * than each re-deciding it.
 */

export function SectionShell({
  id,
  label,
  heading,
  headingAs = "h2",
  division,
  headingAccent,
  body,
  children,
  tone = "brand",
  origin = "top-right",
  intensity,
  align = "left",
  className,
  contentClassName,
  bodyClassName,
  taglineClassName,
}: {
  id?: string;
  label?: string;
  heading?: string;
  /**
   * Which heading level the section title renders as.
   *
   * Sections are h2 by default, which is right for a section — but a page
   * built entirely from SectionShells then has no h1 at all, which is what
   * happened to the homepage once the Brain replaced the hero, and to
   * /influencer-campaigns. The LEAD section on a page passes "h1".
   */
  headingAs?: "h1" | "h2";
  /**
   * Renders the division's own lockup in place of the label and heading.
   *
   * A vertical announced by a 10px eyebrow reads as a subsection of the page;
   * announced by GENESIS.AI Lab over its own tagline it reads as a division
   * with a page of its own — which is what these are. Set as live text in the
   * division's ramp rather than the supplied PNG, so it can be selected,
   * searched, translated and read aloud, and stays sharp on any display.
   */
  division?: { name: string; tagline: string; ramp: string };
  /** Rendered in serif italic — the single accent word per headline. */
  headingAccent?: string;
  body?: string;
  children?: ReactNode;
  tone?: "brand" | "neutral";
  origin?: "top" | "top-right" | "top-left" | "center" | "bottom";
  intensity?: number;
  align?: "left" | "center" | "split";
  className?: string;
  contentClassName?: string;
  /** Extra classes on the body paragraph's wrapper. The client wall hides it on phones. */
  bodyClassName?: string;
  /** Passed to the division lockup's tagline. Brand & Design hides it. */
  taglineClassName?: string;
}) {
  const Heading = headingAs;
  return (
    <Atmosphere
      tone={tone}
      origin={origin}
      intensity={intensity}
      /*
        ONE SECTION, ONE SCREEN — and ONE RHYTHM, which is the newer half of
        this note. At py-24/32/40 the padding alone was 320px top and bottom
        on a large display, nearly three quarters of a 900px viewport spent on
        air before any content; py-16/20/24 fixed that.

        What it did not fix was that every section had its own idea. Measured
        across the homepage the tops ran 56, 64, 80, 96 and 128px — five
        different values, so the space between any two blocks depended on
        which pair they happened to be, and the client wall sat at 128/128
        with a faded wall above it, which is the 290px hole Genesis pointed
        at between the logos and the Influence lockup.

        48/56/64 now, and every section on the page uses it, this shell's
        four included. The gap between two blocks is the same gap everywhere.
      */
      /*
        TIGHTER AGAIN, 32/40/48 from 48/56/64. Genesis's test is that a
        section fits a screen on every device, and padding is the cheapest
        height on the page: four sections were over by less than the 64 top
        and bottom they were each spending on air.
      */
      /* --section-pad steps down with the window's HEIGHT — see globals. A
         width breakpoint cannot see the 13-inch laptop this is for. */
      className={cn("py-[var(--section-pad)]", className)}
    >
      <section id={id} className="mx-auto w-full max-w-6xl px-6">
        {/*
          `split` sets the heading left and the standfirst right, on a grid.
          Eleven sections were running the centred, boxed arrangement, which is
          the symmetric-SaaS-template tell the brief warns about — and several
          sections already hand-rolled a split header rather than use the shell,
          which is a sign the shell was missing the mode rather than that the
          sections were being wilful.
        */}
        {(division || label || heading || body) && (
          <header
            className={cn(
              align === "split"
                ? "grid items-end gap-x-12 gap-y-6 lg:grid-cols-[1.1fr_0.9fr]"
                : "flex flex-col",
              align === "center" && "items-center text-center",
            )}
          >
            {division ? (
              <Reveal className={align === "split" ? "lg:col-start-1" : undefined}>
                <DivisionLockup
                  name={division.name}
                  tagline={division.tagline}
                  ramp={division.ramp}
                  as={headingAs}
                  taglineClassName={taglineClassName}
                />
              </Reveal>
            ) : (
              <>
            {label && (
              <Reveal className={align === "split" ? "lg:col-start-1" : undefined}>
                <SectionLabel dot tone={tone === "neutral" ? "brand" : tone}>
                  {label}
                </SectionLabel>
              </Reveal>
            )}

            {heading && (
              <Reveal delay={0.05} className={align === "split" ? "lg:col-start-1" : undefined}>
                <Heading
                  className={cn(
                    "mt-6 text-balance text-h2 font-normal leading-[1.05] tracking-tight text-bone",
                    "sm:text-h1 lg:text-h1",
                  )}
                >
                  {heading}
                  {headingAccent && (
                    <>
                      {" "}
                      <span className="font-serif italic font-normal text-brand-ink">
                        {headingAccent}
                      </span>
                    </>
                  )}
                </Heading>
              </Reveal>
            )}

              </>
            )}

            {body && (
              <Reveal delay={0.1} className={cn(align === "split" && "lg:pb-2", bodyClassName)}>
                <p
                  className={cn(
                    "text-pretty text-body text-ash sm:text-lead",
                    align === "split" ? "max-w-md lg:mt-0" : "mt-6 max-w-2xl",
                    align === "center" && "mx-auto",
                  )}
                >
                  {body}
                </p>
              </Reveal>
            )}
          </header>
        )}

        {children && (
          <div className={cn("fit-window mt-[var(--block-gap)]", contentClassName)}>
            {children}
          </div>
        )}
      </section>
    </Atmosphere>
  );
}
