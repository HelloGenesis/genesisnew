import { siteConfig, whatsappLink } from "@/lib/site-config";
import { cn } from "@/lib/utils";

/**
 * Social links.
 *
 * NO STARS ANY MORE, at Genesis's instruction, and the reason they were here
 * is gone too. The spec asked for "Social Media Icons (like stars)" and the
 * row drew a four-point star behind each mark because the old hand-drawn
 * lockup carried one — but that star was a placeholder invention that appears
 * nowhere in the 2026 identity, and it was removed from the wordmark itself
 * when the real artwork arrived. Three of them sitting under the footer were
 * the last place it survived: a shape from a logo the site no longer uses,
 * large enough to read as the content rather than as the frame around it.
 *
 * So the icons are the icons. The target stays generous — the star was doing
 * that job as well as decorating — and the hover moves the mark's own colour
 * rather than lighting a silhouette behind it.
 *
 * The marks are drawn inline. lucide-react removed its brand icons in v1, and
 * pulling in a whole icon package for three glyphs is not a trade worth
 * making.
 */

function InstagramMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Unused until Genesis has a channel. See the note on SOCIALS. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function YouTubeMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="2" y="5" width="20" height="14" rx="4.5" />
      <path d="M10.2 9.2 15 12l-4.8 2.8Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * WhatsApp, drawn rather than imported, like the other two.
 *
 * Genesis asked for "a small WhatsApp icon beside Instagram … keep it
 * subtle", and subtle is what decides the drawing: the brand's own glyph is a
 * white handset inside a filled green speech bubble, which in a row of two
 * hairline outlines would read as a button someone had pasted in. This is the
 * same handset and the same bubble as a 2px stroke in the row's own colour,
 * so it sits with its neighbours and takes the same hover.
 */
function WhatsAppMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      {/* The bubble, with its tail at the bottom-left, as the mark has it. */}
      <path
        d="M3.4 20.6l1.3-4.1A8.4 8.4 0 1 1 8 19.4l-4.6 1.2Z"
        strokeLinejoin="round"
      />
      {/*
        The handset. Drawn as the mark's own hooked stroke rather than as a
        telephone glyph — at 20px a receiver with a body and a cord is mud.
      */}
      <path
        d="M9 8.4c.3-.1.6 0 .8.3l.7 1.2c.1.3.1.6-.1.8l-.5.5a5 5 0 0 0 2.4 2.4l.5-.5c.2-.2.5-.2.8-.1l1.2.7c.3.2.4.5.3.8-.2.8-1 1.4-1.9 1.3a6.9 6.9 0 0 1-5.7-5.7c-.1-.9.5-1.6 1.3-1.8Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LinkedInMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M7.5 10.5v6" strokeLinecap="round" />
      <circle cx="7.5" cy="7.6" r="1.05" fill="currentColor" stroke="none" />
      <path d="M11.5 16.5v-3.4a2.1 2.1 0 0 1 4.2 0v3.4" strokeLinecap="round" />
    </svg>
  );
}

/*
  THE REAL ACCOUNTS, supplied by Genesis. YouTube is gone with the
  placeholders: the row pointed at youtube.com's front page, which is not a
  link to Genesis, and a third icon is not worth inventing a destination for.
  It comes back the day there is a channel to point it at — the mark below is
  kept for exactly that.
*/
const SOCIALS: {
  label: string;
  href: string | undefined;
  Mark: () => React.JSX.Element;
}[] = [
  {
    label: "Instagram",
    // From siteConfig, which the Organization schema's `sameAs` also reads.
    href: siteConfig.social.instagram,
    Mark: InstagramMark,
  },
  /*
    WHATSAPP SITS BESIDE INSTAGRAM, which is the order Genesis asked for and
    also the order of how people actually reach them: the feed first, then
    the conversation.

    IT CAN BE UNDEFINED, and the row handles that rather than rendering a
    dead icon. `whatsappLink` returns undefined when there is no number in
    siteConfig — the same switch the floating button and the footer's avatar
    link already honour — so emptying that field removes this icon instead of
    leaving one that opens a chat with nobody.
  */
  {
    label: "WhatsApp",
    href: whatsappLink(),
    Mark: WhatsAppMark,
  },
  {
    label: "LinkedIn",
    href: siteConfig.social.linkedin,
    Mark: LinkedInMark,
  },
];

export function SocialStars({ className }: { className?: string }) {
  return (
    <ul className={cn("flex items-center gap-2", className)}>
      {SOCIALS.filter((social) => social.href).map(({ label, href, Mark }) => (
        <li key={label} className="relative">
          <a
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={label}
            className={cn(
              "group grid size-11 place-items-center rounded-full",
              "text-ash transition-colors duration-300 hover:text-bone",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
            )}
          >
            {/*
              A wash on approach rather than a lit shape. It is round because
              nothing here is a star now, and it is barely there because the
              mark going from ash to bone is the actual signal.
            */}
            <span
              aria-hidden
              className="absolute inset-0 rounded-full bg-white/0 transition-colors duration-300 group-hover:bg-white/[0.06]"
            />
            {/*
              `relative`, not a z-index. The wash is absolutely positioned and
              would otherwise paint over the mark it is meant to sit behind;
              a negative z-index would fix that by sending it behind the
              footer's own ground as well, where it cannot be seen at all.
            */}
            <span className="relative size-5">
              <Mark />
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
