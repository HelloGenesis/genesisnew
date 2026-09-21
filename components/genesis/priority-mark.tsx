import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * The Genesis marker — a small N, for the things that lead.
 *
 * GENESIS ASKED FOR A STAR AND THIS IS AN N, which is worth explaining
 * because it is a deliberate substitution rather than a misreading. The
 * instruction is "add a subtle star / Genesis marker to important elements …
 * featured services, featured case studies, important CTAs, priority
 * capability labels", and the two halves of that phrase are not the same
 * thing here. A star WAS on this site: the old hand-drawn wordmark carried a
 * four-point star and the footer's social row drew one behind every icon. It
 * was removed — from the wordmark first, then from the footer — because it
 * appears nowhere in the 2026 identity. Putting it back as a priority marker
 * would reintroduce a shape the brand has retired, in the one role where it
 * would be seen most often.
 *
 * The N is the Genesis marker the brand actually has: it is the mark half of
 * the wordmark, it is already used on its own (the fluffy render in Brand &
 * Design, the floating button), and it carries the yellow wedge that is the
 * brand's only fixed accent. It reads as "Genesis" at 12px, which a star does
 * not read as anything at all.
 *
 * "DO NOT USE STARS EVERYWHERE. They should help establish hierarchy, not
 * become decoration." That is the whole design constraint, and it is enforced
 * by where this is CALLED rather than by anything in here — today, only on
 * the work Genesis has marked `featured`. Every new call site is a decision
 * to make something else less prominent by comparison, which is the only way
 * a marker like this keeps working.
 */
export function PriorityMark({
  className,
  label = "Featured",
}: {
  className?: string;
  /**
   * What it means HERE. It is announced to a screen reader, because a marker
   * that silently conveys priority conveys it to sighted readers only — and
   * the meaning is per-call-site: the same mark says "featured" on a work
   * tile and would say something else on a capability list.
   */
  label?: string;
}) {
  return (
    <span
      className={cn(
        "pointer-events-none inline-flex size-4 items-center justify-center",
        className,
      )}
    >
      <span className="sr-only">{label}</span>
      {/*
        ONE FILE, BOTH THEMES. The N is the brand yellow with a white counter
        and was checked over both grounds; there is no neutral ink in it to
        flip, so unlike the wordmark it needs no light/dark pair and no
        --logo-invert crossfade.

        `sizes` is declared because the default is a 120px figure and this
        renders at 16 — without it the browser reaches for a candidate many
        times the size it needs.
      */}
      <Image
        src="/brand/genesis-n.png"
        alt=""
        width={64}
        height={64}
        sizes="32px"
        className="size-full object-contain"
      />
    </span>
  );
}
