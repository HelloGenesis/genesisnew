import type { Metadata } from "next";

import { GenesisForm } from "@/components/genesis/genesis-form";
import { Reveal } from "@/components/genesis/reveal";
import { SlideUp } from "@/components/genesis/slide-up";
import { creatorPage } from "@/lib/page-content";

export const metadata: Metadata = {
  title: "For Creators",
  description: creatorPage.body,
};

/**
 * /creator — the roster form, and nothing else.
 *
 * WHAT THIS PAGE USED TO BE: an eyebrow, a headline, a corner note, four
 * pinned benefit cards, a second corner note, then a section shell with its
 * own label, its own heading, its own standfirst, and finally the form. Nine
 * blocks of persuasion in front of one thing to fill in.
 *
 * Genesis cut it to the mark and the form, and they are right about who is on
 * this page. A creator arrives here from a nav item that says "I'm a Creator"
 * — they have already decided. Everything between that decision and the first
 * field is the site talking to itself. The offer still exists in full inside
 * the form's own fields, which is where someone who wants the detail will
 * meet it.
 *
 * THE SPOTLIGHT IS GONE TOO. I kept it on the argument that it was lighting
 * rather than copy; Genesis looked at it and said no, and they are right about
 * what it was doing. A hard cone falling from the top-right landed across the
 * form itself — it lit the fields, tinted half of them warmer than the other
 * half, and put a diagonal edge through a panel somebody is trying to read and
 * type into. Drama behind a headline is one thing; drama over an input is a
 * filter over the thing the page exists for.
 */
export default function CreatorPage() {
  return (
    <SlideUp>
      <main className="relative isolate min-h-dvh overflow-hidden pb-32 pt-32 sm:pt-40">
        {/*
          ONE COLUMN, so the headline sits on the same left edge as the first
          field rather than floating over a form centred beneath it.
        */}
        <div className="relative z-[2] mx-auto w-full max-w-2xl px-6">
          <Reveal>
            {/*
              THE PAGE'S OWN TITLE. It was the Genesis wordmark under "Work
              with"; Genesis asked for the form to name itself instead, so
              the mark comes off and the heading is words again.
            */}
            <h1 className="text-balance text-h2 font-normal leading-[1.05] tracking-tight text-bone sm:text-h1">
              {creatorPage.heading}
            </h1>
          </Reveal>

          <Reveal delay={0.08} className="mt-12 sm:mt-14">
            {/*
              `influencer` rather than `creator`: same audience, the field set
              Genesis actually runs — platforms, rates, and the permission to
              pitch on someone's behalf, which is a thing you must be asked for
              rather than assumed.

              `compact` drops the form's own heading, because the h1 above is
              the page's one title now.
            */}
            <GenesisForm kind="influencer" source="/creator" compact />
          </Reveal>
        </div>
      </main>
    </SlideUp>
  );
}
