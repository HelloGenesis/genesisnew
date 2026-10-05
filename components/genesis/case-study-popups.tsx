"use client";

import { useEffect, useState } from "react";

import { CaseStudyDialog } from "@/components/genesis/case-study-dialog";
import { pagerFor } from "@/components/genesis/overlay";
import { caseStudyList, type CaseStudy } from "@/lib/case-studies";
import { caseStudyForPageSlug, caseStudyPages } from "@/lib/case-study-pages";

/**
 * EVERY CASE STUDY OPENS IN ITS POP-UP, EVERYWHERE (Genesis, 4 Oct 2026: "all
 * the case studies should only open in their pop-up windows, even on the case
 * studies page — all across").
 *
 * One listener for the whole site, on the window and in the capture phase, so
 * it sees a click before the smooth scroller (which takes anchor clicks at the
 * document) or the router does. A plain click on any link to a study's page —
 * a plan box card, a product pop-up's work, the work window, a footer link —
 * opens that study's window where the reader is instead of leaving the page.
 * Links that already open their own window (they say so with
 * aria-haspopup="dialog" or data-popup) are left to it, so the rails keep
 * their own pagers. Cmd/ctrl/shift/middle clicks still go to the page, which
 * stays for search engines and shared links.
 */
const STUDY_PATH = /^\/case-studies\/([^/?#]+)\/?$/;

/** The study behind a page slug: its card where it has one, else one built from the page's own copy. */
function studyForSlug(slug: string): CaseStudy | undefined {
  const card = caseStudyForPageSlug(slug);
  if (card) return card;
  const page = caseStudyPages.find((entry) => entry.slug === slug);
  if (!page) return undefined;
  const copy = page.copy;
  return {
    slug: page.slug,
    client: copy.brand,
    campaign: copy.campaign,
    vertical: copy.division,
    discipline: page.labels.length ? page.labels : copy.service,
    copy: copy.n,
    heroClip: copy.films?.[0] ?? copy.clip,
  } as CaseStudy;
}

export function CaseStudyPopups() {
  const [study, setStudy] = useState<CaseStudy | null>(null);
  /* The film to open on, where the link names one (?clip=…), as the plan boxes' cards do (Genesis, 6 Oct 2026). */
  const [clip, setClip] = useState<string | undefined>(undefined);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank") return;
      if (link.closest('[aria-haspopup="dialog"], [data-popup]')) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const match = url.pathname.match(STUDY_PATH);
      if (!match) return;
      const found = studyForSlug(decodeURIComponent(match[1]));
      if (!found) return;
      event.preventDefault();
      event.stopPropagation();
      setClip(url.searchParams.get("clip") ?? undefined);
      setStudy(found);
    };
    window.addEventListener("click", onClick, true);
    return () => window.removeEventListener("click", onClick, true);
  }, []);

  const index = study ? caseStudyList.findIndex((entry) => entry.slug === study.slug) : -1;

  return (
    <CaseStudyDialog
      study={study}
      startClip={clip}
      onClose={() => {
        setStudy(null);
        setClip(undefined);
      }}
      pager={index >= 0 ? pagerFor(caseStudyList, index, (entry) => { setClip(undefined); setStudy(entry); }, (entry) => entry.client) : undefined}
    />
  );
}
