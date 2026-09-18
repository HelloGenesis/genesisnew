import type { ReactNode } from "react";

import { Reveal } from "@/components/genesis/reveal";
import { SectionLabel } from "@/components/genesis/section-label";
import { LEGAL_EMAIL, type LegalDocument } from "@/lib/legal";

/**
 * The shell the privacy policy renders into.
 *
 * ONE COLUMN AND NOTHING ELSE. A policy is read, not browsed: no cards, no
 * light, no reveal on every paragraph. The measure is capped near 65
 * characters because that is what a wall of body copy needs and the rest of
 * the site's max-w-6xl grid does not give it.
 *
 * THE INTERIM NOTICE IS GONE with the interim copy: the document is
 * Genesis's own now, and says when it was last updated instead.
 */
export function LegalPage({ doc }: { doc: LegalDocument }) {
  return (
    <main className="relative min-h-dvh pb-24 pt-32 sm:pt-40">
      <div className="mx-auto w-full max-w-2xl px-6">
        <Reveal>
          <SectionLabel dot tone="brand">
            Legal
          </SectionLabel>
          <h1 className="mt-6 text-balance text-h2 font-normal leading-[1.05] tracking-tight text-bone">
            {doc.title}
          </h1>
          <p className="mt-4 text-small text-faint">Last Updated: {doc.updated}</p>

          <div className="mt-8 flex flex-col gap-4">
            {doc.intro.map((paragraph) => (
              <p key={paragraph.slice(0, 40)} className="text-body leading-relaxed text-ash">
                {withEmailLinks(paragraph)}
              </p>
            ))}
          </div>
        </Reveal>

        <div className="mt-12 flex flex-col gap-10">
          {doc.sections.map((section) => (
            <Reveal key={section.heading}>
              <h2 className="text-h3 font-semibold tracking-tight text-bone">
                {section.heading}
              </h2>
              <div className="mt-4 flex flex-col gap-4">
                {section.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 40)}
                    // pre-line: the postal address is one entry of lines.
                    className="whitespace-pre-line text-body leading-relaxed text-ash"
                  >
                    {withEmailLinks(paragraph)}
                  </p>
                ))}
                {section.bullets && (
                  <ul className="flex list-disc flex-col gap-2 pl-5 text-body leading-relaxed text-ash marker:text-brand">
                    {section.bullets.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
                {section.after?.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)} className="text-body leading-relaxed text-ash">
                    {withEmailLinks(paragraph)}
                  </p>
                ))}
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <p className="mt-12 border-t border-white/10 pt-8 text-small text-faint">
            Genesis Events &amp; Media Group ·{" "}
            <a
              href={`mailto:${LEGAL_EMAIL}`}
              className="text-ash underline-offset-4 transition-colors hover:text-bone hover:underline"
            >
              {LEGAL_EMAIL}
            </a>
          </p>
        </Reveal>
      </div>
    </main>
  );
}

/** The contact address, wherever the copy names it, as a mail link. */
function withEmailLinks(text: string): ReactNode {
  const parts = text.split(LEGAL_EMAIL);
  if (parts.length === 1) return text;
  return parts.flatMap((part, index) =>
    index === 0
      ? [part]
      : [
          <a
            key={index}
            href={`mailto:${LEGAL_EMAIL}`}
            className="text-brand-ink underline-offset-4 hover:underline"
          >
            {LEGAL_EMAIL}
          </a>,
          part,
        ],
  );
}
