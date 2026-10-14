/**
 * THE BENTO PANEL round a homepage division's main block (Genesis, 4 Oct 2026:
 * "add a bento grid here … same for the other verticals on the homepage"): a
 * large glass card on the section's ground, holding the mark, the copy and the
 * work, with the niches and the plans outside it.
 */
/* No panel on a phone (Genesis, 4 Oct 2026: "remove the bento for mobile"): the content sits on the page there, the glass starts at sm. */
export const BENTO =
  "sm:rounded-[2rem] sm:border sm:border-[var(--glass-border)] sm:bg-[var(--glass-fill)] sm:p-8 sm:shadow-[var(--shadow-panel)] sm:backdrop-blur-[14px] lg:p-10";

/**
 * The same panel let out to the page's wider measure, for sections set in the 6xl column.
 * From xl only: at 1024px the 6xl column already fills the screen, and letting it out
 * pushed the panel 40px past both edges (14 Oct 2026).
 */
export const BENTO_WIDE = `${BENTO} xl:-mx-16`;
