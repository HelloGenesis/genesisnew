import { GlassButton } from "./glass-button";

/**
 * The two calls to action under "Automate the work behind your business."
 *
 * BOTH OPEN WHATSAPP NOW, and the form that used to sit behind the first one
 * is gone from this component entirely. Genesis: "for every contact us type
 * button open whatsapp … jisko ek main form bharna hoga woh bharega, par
 * waise me jo bhi hai direct whatsapp karo."
 *
 * WHAT WAS HERE. "Explore AI Automation" opened the full project brief — the
 * same form as the footer's, with the services question — in the site's
 * window-shaped Overlay; "Talk to Us" scrolled to that same form at the foot
 * of the page. So a reader who had just watched a diagram about removing
 * manual work was offered, as the next step, a form. Both now open a chat
 * with the division already named in the compose box.
 *
 * IT IS A SERVER COMPONENT AGAIN. The Overlay and its form were the only
 * reason this file was `"use client"` — it held one piece of open/closed
 * state and pulled Overlay, GenesisForm and the whole form spec into the
 * homepage's client bundle. Two links need none of that.
 *
 * `quickContact` IS WHAT ROUTES THEM. It reads as a form prop and is not one
 * any more: QuickContact intercepts these clicks and sends them to WhatsApp,
 * falling back to the popup only when no number is configured. The string is
 * still the CTA's own name, which is what picks the message — see
 * ctaWhatsappLink. The href is the enquiry form, which is where these land
 * with JavaScript off.
 */
export function AutomationCtas({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <GlassButton
          href="/#contact"
          quickContact="ai-labs:explore-automation"
          variant="brand"
          arrow
        >
          Explore AI Automation
        </GlassButton>
        <GlassButton
          href="/#contact"
          quickContact="ai-labs:talk-to-us"
          variant="glass"
          arrow
        >
          Talk to Us
        </GlassButton>
      </div>
    </div>
  );
}
