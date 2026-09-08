import type { Metadata } from "next";

import { Atmosphere } from "@/components/genesis/atmosphere";
import { GlassButton } from "@/components/genesis/glass-button";
import { Reveal } from "@/components/genesis/reveal";
import { SectionLabel } from "@/components/genesis/section-label";
import { academy } from "@/lib/page-content";

export const metadata: Metadata = {
  title: academy.title,
  description: academy.body,
  /*
    NOT INDEXED YET. A "coming soon" page that ranks is a page that sends
    people to a dead end from a search result — it comes out of robots the day
    there is a course to enrol in. The link from the footer still works, which
    is what Genesis asked for.
  */
  robots: { index: false, follow: true },
};

/**
 * /academy — Genesis Academy, before it exists.
 *
 * A PAGE RATHER THAN A POP-UP. Genesis asked for "a Coming Soon pop-up or
 * page", and between the two a page is the better half of that or: it has a
 * URL, so it can be sent to someone, and it does not require the reader to
 * already be on the site to see it. A dialog on the footer link would also
 * have been the one modal on a site that has just had its modals removed.
 *
 * NOT RouteStub, WHICH IS THE OTHER PLACEHOLDER ON THIS SITE. That one says
 * "this page is a placeholder, it is built out in Phase 4" — an internal note
 * about the project's own schedule, which is the wrong thing to show a
 * student who followed a link about their career. This one makes the
 * announcement Genesis wrote and offers the only two useful next steps.
 */
export default function AcademyPage() {
  return (
    <Atmosphere tone="brand" origin="top" intensity={0.2} className="min-h-dvh">
      <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center px-6 py-32">
        <Reveal>
          <SectionLabel dot tone="brand">
            {academy.label}
          </SectionLabel>

          <h1 className="mt-6 text-balance text-h2 font-normal leading-[1.02] tracking-tight text-bone sm:text-h1">
            {academy.headingLead}{" "}
            <span className="font-serif font-normal italic text-brand-ink">
              {academy.headingAccent}
            </span>
          </h1>
        </Reveal>

        <Reveal delay={0.08}>
          <p className="mt-6 max-w-xl text-pretty text-lead leading-relaxed text-ash">
            {academy.body}
          </p>
        </Reveal>

        <Reveal delay={0.16}>
          <div className="mt-10 flex flex-wrap gap-3">
            {/*
              THE ENQUIRY, NOT A MAILING LIST. A "notify me" box needs a list
              to write to and a promise about what lands in it, and neither
              exists — a form that collects addresses nothing will ever send
              to is worse than no form. The existing enquiry route reaches a
              person, which is what someone asking about a course wants.
            */}
            <GlassButton
              href="/#contact"
              quickContact="academy:register-interest"
              variant="brand"
              size="lg"
              arrow
            >
              Register your interest
            </GlassButton>
            <GlassButton href="/" variant="glass" size="lg" arrow>
              Back to Genesis
            </GlassButton>
          </div>
        </Reveal>
      </div>
    </Atmosphere>
  );
}
