"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { GenesisForm } from "./genesis-form";
import { FORMS } from "@/lib/forms";
import { ctaWhatsappLink } from "@/lib/site-config";
import { getLenis } from "./smooth-scroll";

/**
 * What a contextual CTA does — which is now open WhatsApp, and only falls
 * back to being the quick lead popup.
 *
 * GENESIS'S INSTRUCTION: "for every contact us type button open whatsapp …
 * jisko ek main form bharna hoga woh bharega, par waise me jo bhi hai direct
 * whatsapp karo." A popup form is three fields and a submit between a warm
 * lead and a conversation; a chat is one tap and lands in a thread somebody
 * actually answers. The long enquiry form at the foot of the homepage is
 * untouched, which is the "whoever needs to fill the form will" half.
 *
 * ONE EDIT, TWELVE BUTTONS, and that is the point of having done this with a
 * delegated listener in the first place. Every contextual CTA on the site —
 * Plan an Influencer Campaign, Build a brand, Contact Us on the case studies,
 * the hero button on each division page — already routes through here. None
 * of them needed touching to change where they go.
 *
 * THE POPUP IS STILL HERE, as the fallback when `siteConfig.whatsapp` is
 * empty. That is the same switch the floating button honours: a button that
 * opens a chat with nobody is worse than one that opens a form.
 *
 * OPENED BY A DATA ATTRIBUTE, not by a prop. Any control anywhere on the site
 * opts in by carrying `data-quick-contact` (optionally with a value naming the
 * CTA it came from), and one delegated listener on the document catches it.
 *
 * That matters because most of the CTAs on this site are rendered on the
 * server, inside server components. Threading an onClick down to them would
 * mean converting each of their sections into a client component — turning a
 * lead capture into a bundle-size decision. A delegated listener costs one
 * handler for the whole page and works from any depth, in any component,
 * including markup that does not exist yet.
 *
 * The CTA's own name rides along as the submission's `source`, so it is
 * possible to tell later which button actually produces business.
 */
export function QuickContact() {
  const [source, setSource] = useState<string | null>(null);
  const open = source !== null;
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => setSource(null), []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      /* The browser keeps anything that is not a plain left click: cmd-click,
         middle-click and shift-click all mean "open this somewhere else". */
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const trigger = (event.target as Element | null)?.closest?.(
        "[data-quick-contact]",
      );
      if (!(trigger instanceof HTMLElement)) return;

      event.preventDefault();
      /*
        AND STOP IT HERE. next/link's handler sits between this and the
        element; it stands down on defaultPrevented, but SmoothScroll's own
        capture handler deliberately returns for these triggers, so nothing
        else is going to stop the event on their behalf.
      */
      event.stopPropagation();
      const name = trigger.dataset.quickContact || "cta";

      /*
        STRAIGHT TO THE CHAT, with the division already named in the compose
        box — see ctaWhatsappLink, which reads the part of this CTA's name
        before the colon.

        `noopener` because a new tab handed a window.opener can navigate the
        page that opened it. WhatsApp will not, and the tab is opened from a
        string this code built rather than from anything a page supplied, so
        neither half of that is a live risk here — it is set because the cost
        is nothing and the habit is what stops the one case that matters.
      */
      const chat = ctaWhatsappLink(name);
      if (chat) {
        window.open(chat, "_blank", "noopener,noreferrer");
        return;
      }

      openerRef.current = trigger;
      setSource(name);
    };

    /*
      CAPTURE PHASE, AND IT IS THE WHOLE REASON THESE BUTTONS WORK AT ALL.

      This was on the bubble phase, where it never ran. The chain:
      SmoothScroll catches anchor clicks on document in CAPTURE and
      deliberately returns for anything carrying `data-quick-contact`, leaving
      them to this handler. But "leaving them" means the click then reaches
      React, whose listeners are bound to the ROOT CONTAINER — below document
      — so next/link handled it first, called preventDefault and pushed the
      hash. By the time the event bubbled back up to document, this handler's
      own `defaultPrevented` guard was true and it bailed every time.

      THE SYMPTOM WAS A BUTTON THAT LOOKED LIKE IT WORKED. Every contextual
      CTA on the site quietly scrolled to the enquiry form instead of doing
      its job: the page moves, something happens, nothing is logged. Genesis
      found it by clicking one and not getting WhatsApp.

      On capture this runs before next/link is reached, prevents the default
      and stops the event there.
    */
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const lenis = getLenis();
    lenis?.stop();
    const { overflow } = document.documentElement.style;
    document.documentElement.style.overflow = "hidden";

    panelRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = overflow;
      lenis?.start();
      // Focus goes back to the button that opened it, not the top of the page.
      openerRef.current?.focus?.();
    };
  }, [open, close]);

  if (!open) return null;

  const spec = FORMS.quick;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={spec.title}
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto overscroll-contain p-4 pt-20 sm:items-center sm:p-8 sm:pt-8"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={close}
        className="fixed inset-0 cursor-default bg-black/70 backdrop-blur-sm"
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        className="scene-dark glass glass-strong relative z-[1] w-full max-w-lg rounded-panel p-6 outline-none sm:p-8"
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full border border-[var(--glass-border)] text-bone transition-colors hover:bg-[var(--hover-wash)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <X className="size-4" />
        </button>

        <header className="mb-6 flex flex-col gap-2 pr-10">
          <h2 className="text-h3 font-normal tracking-tight text-bone">
            {spec.title}
          </h2>
          <p className="text-small leading-relaxed text-ash">{spec.blurb}</p>
        </header>

        <GenesisForm kind="quick" source={source} compact panel={false} />
      </div>
    </div>
  );
}
