import { whatsappLink } from "@/lib/site-config";

/**
 * Floating WhatsApp button.
 *
 * RENDERS NOTHING UNTIL THERE IS A NUMBER. `siteConfig.whatsapp` is empty
 * until someone fills it in, and a WhatsApp button that opens a chat with
 * nobody is worse than no button at all — it is a dead end presented as the
 * fastest way to reach Genesis, and it is the one control a visitor is most
 * likely to trust. One line in site-config turns it on.
 *
 * Bottom-right, above the page but below the nav, and small enough to ignore.
 * The brief asks for visible but unobtrusive, which mostly means it must not
 * grow a label, a bubble, or a "we're online!" prompt.
 */
export function WhatsappButton() {
  // Through the shared builder, so this and AI Lab's avatar CTA cannot
  // disagree about how a number becomes a link. See whatsappLink.
  const href = whatsappLink();
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      // noreferrer as well as noopener: this is an outbound link to a third
      // party and there is no reason to hand it the page it came from.
      rel="noopener noreferrer"
      aria-label="Chat with Genesis on WhatsApp"
      className="fixed bottom-5 right-5 z-40 grid size-12 place-items-center rounded-full bg-[#25D366] text-black shadow-[0_8px_30px_-6px_rgb(0_0_0/0.5)] transition-transform duration-200 ease-out hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-transparent motion-reduce:transition-none motion-reduce:hover:scale-100 sm:bottom-6 sm:right-6"
    >
      {/*
        WhatsApp's own glyph, inline. lucide has no WhatsApp icon, and pulling
        a brand-icon package in for one mark is not worth the bytes.
      */}
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        focusable="false"
        className="size-6"
        fill="currentColor"
      >
        <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.08-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35z" />
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm0 18.02h-.01c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.23 8.23z" />
      </svg>
    </a>
  );
}
