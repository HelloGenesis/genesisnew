"use client";

import { type CaseStudy, disciplines, leadClip } from "@/lib/case-studies";
import { findCopy } from "@/lib/case-study-copy";
import { campaignFilms, caseStudyPath } from "@/lib/case-study-pages";
import { clipRatio } from "@/lib/clip-shape";
import { filmUrl } from "@/lib/films";
import { mediaUrl } from "@/lib/media-url";
import { reelClip, reelPoster } from "@/lib/work";
import { CaseStudyView } from "./case-study-view";
import { Overlay, type OverlayPager } from "./overlay";

/**
 * A case study, opened over the landing page with the page blurred behind it.
 *
 * Genesis asked for the posters to be interactive — click one, the page behind
 * blurs, the study appears — and for nothing but the two forms to change page.
 * The dialog mechanics (Escape, focus, the scroll lock, the blur) now live in
 * the shared Overlay, which the portfolio pieces and the AI avatars use too;
 * see that file for why each one is there. This is only the study itself.
 */
export function CaseStudyDialog({
  study,
  onClose,
  pager,
  startClip,
}: {
  study: CaseStudy | null;
  onClose: () => void;
  pager?: OverlayPager;
  /** Open on this film of the campaign rather than its lead. */
  startClip?: string;
}) {
  const clip = study ? leadClip(study) : undefined;
  const copy = study?.copy === undefined ? undefined : findCopy(study.copy);

  return (
    <Overlay
      open={study !== null}
      label={study ? `${study.client} case study` : "Case study"}
      onClose={onClose}
      className="max-w-6xl"
      pager={pager}
    >
      {study && (
        <CaseStudyView
          labels={disciplines(study)}
          headline={copy?.headline}
          subheadline={
            copy
              ? `${study.client} · ${copy.campaign}`
              : [study.client, study.campaign].filter(Boolean).join(" · ")
          }
          poster={clip === undefined ? undefined : mediaUrl(reelPoster(clip))}
          film={clip === undefined ? undefined : filmUrl(clip)}
          preview={clip === undefined ? undefined : mediaUrl(reelClip(clip))}
          copy={copy}
          ratio={clip === undefined ? undefined : clipRatio(clip)}
          /*
            EVERY FILM THE CAMPAIGN CAN CLAIM, lead first — Genesis asked for
            a study to show all of its videos rather than the one it leads
            with. `campaignClips` decides which those are; the note on it
            explains why that is not simply every reel of the engagement.
          */
          clips={campaignFilms(study)}
          startClip={startClip}
          pageHref={caseStudyPath(study.copy)}
          fallback={
            /*
              THE HONEST EMPTY STATE: a study with no write-up says so rather
              than showing an empty column.
            */
            <p className="text-pretty text-small leading-relaxed text-ash">
              The full write-up for this campaign is being prepared. More of
              the work is in the portfolio below.
            </p>
          }
        />
      )}
    </Overlay>
  );
}
