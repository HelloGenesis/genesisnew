import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * THE SITE'S TYPE SCALE, TAUGHT TO tailwind-merge.
 *
 * `cn` resolves conflicting classes by keeping the last one in each group, and
 * it decides the group from the class name. It knows Tailwind's own sizes —
 * text-sm, text-2xl — but this site names its scale in globals.css (h1, h2,
 * h3, lead, body, small, micro), and to tailwind-merge an unknown `text-*` is
 * a COLOUR. So "text-h2 text-bone" looked like two colours, the last one won,
 * and the size was silently deleted. On a phone that left section headings
 * such as "Our clients" at the browser default of 16px against the 40px they
 * were written at; on desktop an `sm:text-h1` survived and hid the bug.
 * Declaring the scale as font sizes puts them in the right group, so a size
 * and a colour no longer cancel each other out.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["h1", "h2", "h3", "lead", "body", "small", "micro"] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
