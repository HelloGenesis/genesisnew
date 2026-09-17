"use client";

import { type CaseStudy, disciplines, isPublished, leadClip } from "@/lib/case-studies";
import { findCopy } from "@/lib/case-study-copy";
import { filmUrl } from "@/lib/films";
import { CaseStudyBody } from "./case-study-body";
import { mediaUrl } from "@/lib/media-url";
import { reelClip, reelPoster } from "@/lib/work";
import { VIDEO_GUARD_CLIENT } from "@/lib/video-guard";
import { Overlay } from "./overlay";

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
}: {
  study: CaseStudy | null;
  onClose: () => void;
}) {
  const published = study ? isPublished(study) : false;
  const clip = study ? leadClip(study) : undefined;
  const copy = study?.copy === undefined ? undefined : findCopy(study.copy);
  const sections = study && !copy
    ? [
        { label: "The problem", body: study.problem },
        { label: "The strategy", body: study.strategy },
        { label: "The execution", body: study.execution },
      ].filter((s) => s.body && !s.body.startsWith("TODO"))
    : [];

  return (
    <Overlay
      open={study !== null}
      label={study ? `${study.client} case study` : "Case study"}
      onClose={onClose}
    >
      {study && (
        <>
          <p className="micro-label !text-brand">{disciplines(study).join(" · ")}</p>
          {/*
            THE HEADLINE LEADS where the study has one — the client and
            campaign become the line above it. Without one, the client is
            the title, as before.
          */}
          {study.headline && !study.headline.startsWith("TODO") ? (
            <>
              <p className="mt-3 text-small text-ash">
                {study.client}
                {copy ? ` · ${copy.campaign}` : study.campaign ? ` · ${study.campaign}` : ""}
              </p>
              <h2 className="mt-2 text-balance text-h3 font-normal leading-[1.1] tracking-tight text-bone sm:text-h2">
                {study.headline}
              </h2>
            </>
          ) : (
            <>
              <h2 className="mt-3 text-balance text-h3 font-normal leading-[1.08] tracking-tight text-bone sm:text-h2">
                {study.client}
              </h2>
              {study.campaign && (
                <p className="mt-2 text-lead leading-relaxed text-bone/80">{study.campaign}</p>
              )}
            </>
          )}

          {/*
            THE FILM THE POSTER WAS PLAYING, at full length where Drive serves
            it and as the preview where it does not. Portrait, like the
            footage, and capped by the window's height so a 9:16 video never
            pushes the rest of the study off screen.
          */}
          {!study.hero && clip !== undefined && (
            <div className="mt-6 flex justify-center overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-ink">
              <video
                key={String(clip)}
                poster={mediaUrl(reelPoster(clip))}
                controls
                autoPlay
                playsInline
                preload="metadata"
                {...VIDEO_GUARD_CLIENT}
                className="max-h-[70vh] w-full object-contain"
              >
                {filmUrl(clip) && <source src={filmUrl(clip)} type="video/mp4" />}
                <source src={mediaUrl(reelClip(clip))} type="video/mp4" />
              </video>
            </div>
          )}

          {study.hero && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-ink">
              {study.hero.endsWith(".mp4") ? (
                <video
                  src={study.hero}
                  controls
                  playsInline
                  preload="metadata"
                  {...VIDEO_GUARD_CLIENT}
                  className="aspect-video w-full object-cover"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={study.hero} alt="" className="aspect-video w-full object-cover" />
              )}
            </div>
          )}

          {/* The master document's write-up, where this card has one. */}
          {copy && <CaseStudyBody copy={copy} className="mt-8" />}

          {study.results && study.results.length > 0 && (
            <ul className="mt-7 grid gap-4 sm:grid-cols-3">
              {study.results.map((metric) => (
                <li
                  key={metric.label}
                  className="rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-wash)] p-4"
                >
                  <p className="text-h3 font-normal leading-none text-brand-ink">{metric.value}</p>
                  <p className="mt-2 text-micro uppercase tracking-[0.12em] text-ash">{metric.label}</p>
                </li>
              ))}
            </ul>
          )}

          {sections.length > 0 && (
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {sections.map((section) => (
                <div key={section.label}>
                  <p className="micro-label">{section.label}</p>
                  <p className="mt-2 text-pretty text-small leading-relaxed text-ash">{section.body}</p>
                </div>
              ))}
            </div>
          )}

          {/*
            THE HONEST EMPTY STATE. Two of the four studies have no copy yet;
            opening one to a blank panel would read as a broken dialog, so it
            says what is true rather than showing furniture with nothing in it.
          */}
          {!published && sections.length === 0 && (
            <p className="mt-8 text-pretty text-small leading-relaxed text-ash">
              The full write-up for this campaign is being prepared. More of
              the work is in the portfolio below.
            </p>
          )}
        </>
      )}
    </Overlay>
  );
}
