import Image from "next/image";

import { Atmosphere } from "@/components/genesis/atmosphere";
import { GenesisForm } from "@/components/genesis/genesis-form";
import { GlassButton } from "@/components/genesis/glass-button";
import { Reveal } from "@/components/genesis/reveal";
import { footerCta } from "@/lib/home-content";

/**
 * Section 13 — the closing pitch: a headline, a promise, and the brand
 * enquiry form.
 *
 * THE FOOTER ITSELF MOVED OUT, to components/genesis/site-footer.tsx. It was
 * printed underneath this block, which meant it only existed on the one page
 * that makes this pitch — see the note there.
 */
export function FooterCta() {
  return (
    <Atmosphere
      tone="brand"
      origin="bottom"
      intensity={0.24}
      className="relative overflow-hidden pb-4 pt-12 sm:pt-14 lg:pt-16"
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        <Reveal>
          <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="max-w-2xl text-balance text-h2 font-normal leading-[1.05] tracking-tight text-bone sm:text-h1 lg:text-h1">
              {footerCta.heading}{" "}
              <span className="gm-ramp-text font-serif font-normal italic">
                {footerCta.headingAccent}
              </span>
            </h2>

            <div className="flex flex-col items-start gap-4">
              <p className="max-w-sm text-small leading-relaxed text-ash">
                {footerCta.body}
              </p>
              <GlassButton
                href={footerCta.primaryCta.href}
                variant="brand"
                size="lg"
                arrow
                magnetic
              >
                {footerCta.primaryCta.label}
              </GlassButton>
            </div>
          </div>
        </Reveal>

        {/* The spec asks for the form to sit last, after the pitch. */}
        {/*
          TWO BLOCKS ON ONE LINE. Genesis asked to see the form that way. It
          was capped at max-w-2xl, which is 672px — the fields already sit in
          a two-column grid at sm and up, so at that width each column was
          about 300px and the pair read as one narrow stack rather than as two
          blocks. Given the container's full width the same grid becomes what
          was asked for, and the long fields (the brief, the consent) still
          span both columns because they are marked `half: false`.
        */}
        <Reveal delay={0.1} className="mt-4" id="contact">
          {/*
            THE DEVICE: A TICKET. Brand & Design is a set of folders; the close
            is the ticket you fill in to get on board — the form is the ticket
            itself, the stub is torn along a perforation with a bite out of
            each edge, and it reads ADMIT ONE for the brand filling it in.
          */}
          <div
            className="gm-ticket gm-rim grid overflow-hidden rounded-panel shadow-[0_40px_90px_-40px_rgb(255_197_22/0.4)] lg:grid-cols-[1fr_15rem]"
            style={{ "--stub": "15rem" } as React.CSSProperties}
          >
            <GenesisForm kind="brand" source="/#contact" panel={false} className="p-5 sm:p-7" />

            <aside
              aria-hidden
              className="relative flex items-center justify-between gap-4 border-t-2 border-dashed border-white/20 bg-[linear-gradient(160deg,rgb(255_197_22/0.16),rgb(232_102_58/0.1)_45%,rgb(164_139_224/0.16))] px-5 py-4 lg:flex-col lg:items-stretch lg:justify-between lg:border-l-2 lg:border-t-0 lg:px-6 lg:py-7"
            >
              <div>
                <p className="font-mono text-[0.625rem] uppercase tracking-[0.3em] text-faint">Genesis Media</p>
                <p className="gm-ramp-text gm-ramp-text--full mt-2 text-h3 font-semibold leading-none tracking-tight lg:text-[2.4rem]">
                  Admit one
                </p>
                <p className="mt-2 text-small text-ash">Your brand &times; Genesis</p>
              </div>

              <dl className="hidden grid-cols-2 gap-x-3 gap-y-3 font-mono text-[0.625rem] uppercase tracking-[0.18em] sm:grid">
                {[
                  ["Gate", "G-01"],
                  ["Class", "First"],
                  ["Seat", "Iconic"],
                  ["From", "Brief"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-faint">{k}</dt>
                    <dd className="mt-0.5 text-bone">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="flex items-end gap-3">
                <Image src="/brand/genesis-n.png" alt="" width={306} height={500} className="h-10 w-auto" />
                <span className="h-10 flex-1 bg-[repeating-linear-gradient(90deg,var(--ink-strong)_0_2px,transparent_2px_4px,var(--ink-strong)_4px_5px,transparent_5px_8px,var(--ink-strong)_8px_11px,transparent_11px_13px)] opacity-70 max-lg:w-24" />
              </div>
            </aside>
          </div>
        </Reveal>
      </div>
    </Atmosphere>
  );
}
