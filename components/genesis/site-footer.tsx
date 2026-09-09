import Image from "next/image";
import Link from "next/link";

import { Atmosphere } from "@/components/genesis/atmosphere";
import { GenesisMark } from "@/components/genesis/genesis-mark";
import { SocialStars } from "@/components/genesis/social-stars";
import { Reveal } from "@/components/genesis/reveal";
import { footerCta } from "@/lib/home-content";
import { footerNav, siteConfig } from "@/lib/site-config";

/**
 * The site footer — contact sheet, navigation, copyright, ghosted wordmark.
 *
 * IT LIVED INSIDE FooterCta, WHICH IS WHY EIGHT PAGES HAD NONE. FooterCta is
 * the homepage's closing pitch: a headline, a promise and the brand enquiry
 * form. The footer happened to be printed underneath it, so every route that
 * was not the homepage — Careers, I'm a Creator, Portfolio, Team, the Journal,
 * the four division pages — simply ended. Genesis reported it on the two they
 * were looking at; it was true of all eight.
 *
 * Split out, it renders once from the (home) layout and every page in the
 * group closes the same way. The pitch above it stays where it belongs, on
 * the page that makes it.
 */
export function SiteFooter() {
  return (
    <Atmosphere
      tone="brand"
      origin="bottom"
      intensity={0.24}
      className="relative overflow-hidden pt-14"
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        {/*
          Contact details + navigation, on a single sheet of liquid glass —
          the spec marks the footer "//liquid glass". Heavier blur and a lit
          top edge, so it reads as one pane the content sits inside rather
          than a row of boxes.
        */}
        <div className="glass glass-strong glass-lit grid gap-12 rounded-panel p-8 sm:grid-cols-2 sm:p-12 lg:grid-cols-4">
          <Reveal>
            <GenesisMark />
            {/*
              NO "ABOUT GENESIS" PARAGRAPH. Genesis asked for it off. It was
              siteConfig.description — "a Gen Z-led full-service agency where
              strategy, content and technology come together" — which is the
              page's own opening argument restated in four lines of small grey
              type at the bottom of it. The column keeps what a footer is
              actually for: the mark, the address, and the social accounts.
            */}
            <a
              href={`mailto:${footerCta.email}`}
              className="mt-6 inline-block text-small text-bone underline-offset-4 transition-colors hover:text-brand-ink hover:underline"
            >
              {footerCta.email}
            </a>

            {/* "Social Media Icons (like stars)" — the lockup's star, repeated. */}
            <SocialStars className="mt-6 -ml-3" />
          </Reveal>

          {footerNav.map((group, index) => (
            <Reveal key={group.heading} delay={0.05 * (index + 1)}>
              <p className="micro-label">{group.heading}</p>
              <ul className="mt-6 flex flex-col gap-3">
                {group.items.map((item) => (
                  /*
                    Keyed on the LABEL, not the href. Two entries in a nav
                    group can legitimately point at the same place — "Contact"
                    and "Start a Project" both go to /#contact — and keying on
                    the destination made React see them as the same child.
                  */
                  <li key={item.label}>
                    {/*
                      One link in this footer leaves the site — "Build Your AI
                      Avatar" opens WhatsApp — and next/link would try to
                      route it. An external item renders as a plain anchor
                      with the usual pair of rel tokens and its own tab, so a
                      visitor's session on the site is not replaced by
                      WhatsApp Web with the back button as their only way
                      back.
                    */}
                    {item.external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-small text-ash transition-colors hover:text-bone"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        className="text-small text-ash transition-colors hover:text-bone"
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 py-8 text-small text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          {/*
            LINKS NOW, NOT PRINTED WORDS. This read "Privacy · Terms" as plain
            text with nothing behind it, which is the one thing a footer must
            not do — a visitor looking for a policy found the word and no page.
            Both routes exist and are interim; see lib/legal.ts.

            TODO(legal): counsel-reviewed copy required before launch.
          */}
          <p className="flex items-center gap-2">
            <Link
              href="/privacy"
              className="transition-colors hover:text-bone"
            >
              Privacy
            </Link>
            <span aria-hidden>·</span>
            <Link href="/terms" className="transition-colors hover:text-bone">
              Terms
            </Link>
          </p>
        </div>
      </div>

      {/*
        THE REAL MARK, oversized, bleeding off the bottom edge.

        IT WAS THE WORD "GENESIS" SET IN THE UI TYPEFACE, outlined with
        -webkit-text-stroke. Genesis asked for the actual logo here, and they
        are right that it was the wrong thing: those are not the brand's
        letterforms — the wordmark's N carries a yellow wedge and its own
        drawing, neither of which a system font has.

        "JUST GENESIS", NOT "GENESIS MEDIA". The line it replaces said
        GENESIS, and the full lockup is already at the top of this same panel;
        printing it twice, once small and once enormous, is the stutter this
        codebase keeps having to fix. So the wordmark is cropped at the gap
        between the two words — see public/brand/genesis-only-*.png — which is
        the same composition the outlined text had, in the real letterforms.

        THE FIRST ATTEMPT AT THIS RENDERED NOTHING, and the reason is worth
        writing down. It reused <GenesisMark> with `h-auto w-full`. GenesisMark
        positions its two images with `fill`, so they are absolutely positioned
        and contribute NO height to their parent — `h-auto` therefore resolved
        to zero and the mark was a full-width box zero pixels tall. A `fill`
        image needs a box that is sized by something other than its contents,
        which is what the aspect ratio below is for. Genesis reported this as
        the footer having been deleted, and from the page that is exactly what
        it looked like.

        IT FOLLOWS THE THEME, like every other instance of the mark. The old
        outlined version was a white stroke at 8% in BOTH themes, so on the
        light theme it was white-on-white and genuinely invisible — a bug that
        was there before this and would have survived the swap unnoticed.
      */}
      {/*
        AIR ABOVE IT. Genesis asked for more space between the footer's
        content and the mark; it was sitting close under the copyright line.
      */}
      <div
        aria-hidden
        className="pointer-events-none relative mt-14 select-none overflow-hidden px-4 sm:mt-20 lg:mt-24"
      >
        {/*
          The ratio is the cropped artwork's own, 1025x200. Height follows
          width from it, so the mark spans the footer at every viewport and
          the box is never zero.
        */}
        <div className="relative aspect-[1025/200] w-full translate-y-[14%] opacity-[0.13]">
          <Image
            src="/brand/genesis-only-light.png"
            alt=""
            fill
            sizes="100vw"
            className="object-contain"
            style={{ opacity: "calc(1 - var(--logo-invert, 0))" }}
          />
          <Image
            src="/brand/genesis-only-dark.png"
            alt=""
            fill
            sizes="100vw"
            className="object-contain"
            style={{ opacity: "var(--logo-invert, 0)" }}
          />
        </div>
      </div>
    </Atmosphere>
  );
}
