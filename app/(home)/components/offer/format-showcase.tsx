"use client";

import { useMemo, useState, type ReactNode } from "react";

import { CaseStudyDialog } from "@/components/genesis/case-study-dialog";
import type { OverlayPager } from "@/components/genesis/overlay";
import { VideoDialog } from "@/components/genesis/video-dialog";
import { caseStudyForClip, caseStudyForPageSlug } from "@/lib/case-study-pages";
import { mediaUrl } from "@/lib/media-url";
import { posterSrc } from "@/lib/poster";
import { reelPoster } from "@/lib/work";
import { cn } from "@/lib/utils";

import { MediaRail } from "./media-rail";
import type { RailVideo } from "./video-rail";

type Format = { title: string; body: string; image: string; work: readonly RailVideo[] };

/**
 * "SEE WHAT YOU CAN CREATE", WITH THE WORK BEHIND EACH FORMAT.
 *
 * Each card opens its first piece — the written case study where there is
 * one, the film alone where there is not (the site's rule). Inside the
 * window, "More like this" shows the rest of that format, and the arrows walk
 * every piece of every format in order, so a reader can keep going without
 * closing anything.
 */
export function FormatShowcase({
  label,
  items,
  headerSlot,
}: {
  label: string;
  items: readonly Format[];
  headerSlot?: ReactNode;
}) {
  /* One flat list — format by format — which is what the arrows walk. */
  const entries = useMemo(
    () =>
      items.flatMap((format) =>
        format.work.map((video) => ({
          ...video,
          format: format.title,
          caseStudy: caseStudyForClip(video.id) ?? (video.study ? caseStudyForPageSlug(video.study) : undefined),
        })),
      ),
    [items],
  );
  const [open, setOpen] = useState<number | null>(null);
  const opened = open === null ? null : entries[open];

  const siblings = opened ? entries.filter((entry) => entry.format === opened.format) : [];
  const place = opened ? siblings.indexOf(opened) : -1;
  const at = (index: number) => entries[(index + entries.length) % entries.length];
  const pager: OverlayPager | undefined =
    open === null
      ? undefined
      : {
          onPrevious: () => setOpen((open - 1 + entries.length) % entries.length),
          onNext: () => setOpen((open + 1) % entries.length),
          previousLabel: `Previous: ${at(open - 1).format} · ${at(open - 1).title}`,
          nextLabel: `Next: ${at(open + 1).format} · ${at(open + 1).title}`,
          position: `${opened!.format} · ${place + 1} / ${siblings.length}`,
        };

  const more =
    opened && siblings.length > 1 ? (
      <section aria-label={`More ${opened.format}`} className="mt-8 border-t border-white/10 pt-6">
        <p className="micro-label">More {opened.format}</p>
        <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {siblings.map((entry) => {
            const current = entry === opened;
            return (
              <li key={`${String(entry.id)}-${entry.title}`}>
                <button
                  type="button"
                  onClick={() => setOpen(entries.indexOf(entry))}
                  aria-current={current || undefined}
                  aria-label={`${entry.eyebrow}: ${entry.title}`}
                  className={cn(
                    "group relative block aspect-[9/14] w-full overflow-hidden rounded-card border bg-ink text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                    current ? "border-brand/70" : "border-white/15 opacity-80 hover:opacity-100",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- a small poster; next/image adds nothing a lazy <img> does not */}
                  <img
                    src={posterSrc(mediaUrl(reelPoster(entry.id)), 384)}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
                  <span className="absolute inset-x-0 bottom-0 p-2 text-[0.6875rem] leading-tight text-white">
                    {entry.title}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    ) : undefined;

  return (
    <>
      <MediaRail
        label={label}
        headerSlot={headerSlot}
        items={items.map((format) => ({
          title: format.title,
          body: format.body,
          image: format.image,
          selectLabel: `${format.title}: see the work`,
          onSelect: () => setOpen(entries.findIndex((entry) => entry.format === format.title)),
        }))}
      />
      <CaseStudyDialog
        study={opened?.caseStudy ?? null}
        startClip={opened ? String(opened.id) : undefined}
        onClose={() => setOpen(null)}
        pager={pager}
        more={more}
      />
      <VideoDialog
        video={opened && !opened.caseStudy ? { id: opened.id, label: `${opened.eyebrow} · ${opened.title}` } : null}
        onClose={() => setOpen(null)}
        pager={pager}
        more={more}
      />
    </>
  );
}
