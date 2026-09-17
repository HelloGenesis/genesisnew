"use client";

import type { WorkItem } from "@/lib/work";
import { Overlay, type OverlayPager } from "./overlay";
import { WorkDetail } from "./work-detail";

/**
 * A portfolio piece, opened over the landing page.
 *
 * It was a page of its own at /work/<slug>. Genesis asked for everything
 * except the two forms to stay on the landing page, so the same detail — the
 * lead film, the rest of the campaign's cuts, the write-up — opens here, and
 * the old URLs redirect to the portfolio section.
 */
export function WorkDialog({
  item,
  onClose,
  pager,
}: {
  item: WorkItem | null;
  onClose: () => void;
  pager?: OverlayPager;
}) {
  return (
    <Overlay
      open={item !== null}
      label={item ? `${item.client}, ${item.title}` : "Project"}
      onClose={onClose}
      className="max-w-5xl"
      pager={pager}
    >
      {item && <WorkDetail item={item} />}
    </Overlay>
  );
}
