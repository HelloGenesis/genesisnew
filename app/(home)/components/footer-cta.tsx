import { Atmosphere } from "@/components/genesis/atmosphere";
import { GenesisForm } from "@/components/genesis/genesis-form";
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
              <span className="font-serif font-normal italic text-brand-ink">
                {footerCta.headingAccent}
              </span>
            </h2>

            {/*
              NO BUTTON HERE ANY MORE. "Contact us" pointed at the form
              directly beneath it, and Genesis did not like a button to the
              form sitting on top of the form. The same button now closes the
              portfolio, where it has somewhere to take the reader.
            */}
            <p className="max-w-sm text-small leading-relaxed text-ash">
              {footerCta.body}
            </p>
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
          <GenesisForm kind="brand" source="/#contact" />
        </Reveal>
      </div>
    </Atmosphere>
  );
}
