/**
 * THE BENTO PANEL round a homepage division's main block (Genesis, 4 Oct 2026:
 * "add a bento grid here … same for the other verticals on the homepage"): a
 * large glass card on the section's ground, holding the mark, the copy and the
 * work, with the niches and the plans outside it.
 */
export const BENTO =
  "rounded-[2rem] border border-[var(--glass-border)] bg-[var(--glass-fill)] p-4 shadow-[var(--shadow-panel)] backdrop-blur-[14px] sm:p-8 lg:p-10";

/** The same panel let out to the page's wider measure, for sections set in the 6xl column. */
export const BENTO_WIDE = `${BENTO} lg:-mx-16`;
