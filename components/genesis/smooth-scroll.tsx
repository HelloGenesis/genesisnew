"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { isContactHref } from "@/lib/site-config";

/**
 * Lenis smooth scrolling, wired directly into GSAP.
 *
 * The integration matters more than the smoothing. Lenis and ScrollTrigger
 * must share one clock and one scroll signal:
 *
 *   - `lenis.on("scroll", ScrollTrigger.update)` — ScrollTrigger reads scroll
 *     position from Lenis rather than waiting for native scroll events.
 *   - Lenis is stepped from `gsap.ticker` instead of its own
 *     requestAnimationFrame loop, so pinned/scrubbed timelines are evaluated
 *     on the same frame the scroll position changed.
 *   - `lagSmoothing(0)` stops GSAP from silently skipping ahead after a long
 *     frame, which desynchronises a scrub from the scrollbar.
 *
 * An earlier version ran Lenis on its own rAF and notified ScrollTrigger via a
 * custom window event. The pin installed correctly but never advanced — the
 * scrub sat at progress 0 for the entire pinned range. This is the fix.
 *
 * Smoothing is disabled for reduced-motion users and on coarse pointers,
 * where hijacking native momentum reliably feels worse. ScrollTrigger still
 * works in that mode via native scroll events.
 */
/**
 * How far below the viewport top a jumped-to section should land.
 *
 * The nav is fixed and roughly 64px tall sitting 16-24px off the top edge, so
 * a section scrolled to y=0 arrives with its label underneath the nav pill.
 */
const NAV_OFFSET = 96;

/**
 * Sends an in-page link through whichever scroller is actually running.
 *
 * This has to exist. Lenis takes over the scroll position, and a native anchor
 * jump sets scrollTop directly underneath it — the page lands in the right
 * place and then Lenis, which still believes it is somewhere else, eases back
 * toward its own idea of the position. The result is a jump followed by a
 * drift, on every anchor in the site, and the brief's central interaction is
 * clicking a vertical on the Brain to travel to its section.
 */
function installAnchorScrolling(lenis: Lenis | null): () => void {
  const resolve = (hash: string) => {
    if (!hash || hash === "#") return null;
    try {
      return document.querySelector(hash);
    } catch {
      return null; // a hash that is not a valid selector
    }
  };

  const go = (target: Element, smooth: boolean) => {
    if (lenis) {
      lenis.scrollTo(target as HTMLElement, {
        offset: -NAV_OFFSET,
        duration: smooth ? 1.2 : 0,
      });
      return;
    }
    const top =
      target.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
    window.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });
  };

  const onClick = (event: MouseEvent) => {
    // Let the browser handle anything that is not a plain left click.
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const anchor = (event.target as Element | null)?.closest?.("a");
    if (!anchor) return;

    /*
      A link that has opted into the quick-contact popup is not ours. Both
      handlers sit on document, this one is installed first, and it was
      calling preventDefault on the CTA's /#contact href — after which the
      popup's own listener saw defaultPrevented and stood down. The result
      was every contextual CTA scrolling to the contact form instead of
      opening the dialog it was built for.
    */
    if (anchor.hasAttribute("data-quick-contact")) return;

    const href = anchor.getAttribute("href");
    if (!href) return;
    /*
      A LINK TO A SECTION OF THE PAGE YOU ARE ON — "/pricing#one-time" from
      the nav while on /pricing. The route does not change, so nothing else
      would scroll for it; it is an in-page jump like "#one-time".
    */
    const here = window.location.pathname;
    if (here !== "/" && href.startsWith(`${here}#`)) {
      const sameTarget = resolve(href.slice(here.length));
      if (sameTarget) {
        event.preventDefault();
        event.stopPropagation();
        go(sameTarget, true);
        window.history.pushState(null, "", href);
        return;
      }
    }
    /*
      A LINK THAT MUST OPEN ITS PAGE. The Services menu names a division's
      services and Genesis wants each to open the division's own page — not to
      scroll the homepage to that division's section, which is what the
      division URLs below are turned into when clicked on the landing page.
    */
    if (anchor.hasAttribute("data-page-link")) return;
    /* Nor is any link to the enquiry form: every one of those opens
       WhatsApp now. See isContactHref. */
    if (isContactHref(href)) return;

    // Same-document hashes only: "#work" and "/#work" when already on "/".
    const onHome = window.location.pathname === "/";
    let hash = "";
    if (href.startsWith("#")) hash = href;
    else if (href.startsWith("/#") && onHome) hash = href.slice(1);
    /*
      A DIVISION PAGE ALWAYS OPENS ITS PAGE. Division links clicked on the
      homepage used to scroll to that division's section instead; Genesis
      (28 Sep 2026): "for each vertical, wherever clicked, it should go on
      their dedicated page". So the Brain, the footer and the menu all go to
      /ai-content-automation, /content-production, /brand-design and
      /influencer-marketing like any other link.
    */
    else return;

    const target = resolve(hash);
    if (!target) return;

    event.preventDefault();
    /*
      And stop it here. next/link's own handler would otherwise still see the
      click on its way down to the anchor; it bails on defaultPrevented, but
      only in the same tick — anything else listening between here and the
      element does not.
    */
    event.stopPropagation();
    go(target, true);
    // Keep the URL shareable without letting the browser do its own jump.
    window.history.pushState(null, "", hash);
  };

  /*
    CAPTURE PHASE, WHICH IS THE WHOLE FIX FOR THE NAV.

    This was registered on the bubble phase. React attaches its listeners to
    the root container, not to document, so a bubbling click reaches React
    FIRST and only afterwards reaches this handler on the way out. By then
    next/link has already read `defaultPrevented` as false — the
    preventDefault below had not happened yet — and pushed the route, which
    sets its own scroll position. Lenis then eased toward the target from
    wherever that push had landed, and the page came to rest a section past
    the one asked for: clicking Influence on the nav put you in Studios.

    Registered on capture, this runs before the click reaches React at all, so
    next/link sees a prevented event and stands down. One scroller, one target.
  */
  document.addEventListener("click", onClick, true);

  // Arriving with a hash already in the URL — from another page, or a shared
  // link. Deferred a frame so layout has settled before measuring.
  let raf = 0;
  if (window.location.hash) {
    raf = requestAnimationFrame(() => {
      const target = resolve(window.location.hash);
      if (target) go(target, false);
    });
  }

  return () => {
    document.removeEventListener("click", onClick, true);
    if (raf) cancelAnimationFrame(raf);
  };
}

/**
 * The live Lenis instance, so other client code can suspend it.
 *
 * A modal that only sets `overflow: hidden` does not stop Lenis — it drives
 * scroll from wheel and touch events rather than from the scrollbar, so the
 * page carries on moving behind the dialog. Anything that opens over the page
 * calls stop() and start() around itself.
 */
let instance: Lenis | null = null;
export function getLenis(): Lenis | null {
  return instance;
}

/**
 * LANDING ON A SECTION AFTER A PAGE CHANGE — /pricing#one-time from the nav.
 *
 * Sections below the fold are laid out at an estimated height until they
 * render (content-visibility), and images and fonts arrive after the first
 * frame, so a single jump measured a page that then changed shape: the nav's
 * "One-time Projects" landed on the footer. This re-aligns to the hash a few
 * times over the first two seconds after every route change — a full load or
 * a client-side one — and stops the moment the reader scrolls themselves.
 */
function useSettleOnHash() {
  const pathname = usePathname();
  useEffect(() => {
    if (!window.location.hash) return;
    let moved = false;
    const stop = () => {
      moved = true;
    };
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("keydown", stop);
    const align = () => {
      if (moved) return;
      let target: Element | null = null;
      try {
        target = document.querySelector(window.location.hash);
      } catch {
        return;
      }
      if (!target) return;
      const top = target.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
      else window.scrollTo({ top, behavior: "auto" });
    };
    const timers = [60, 300, 800, 1500, 2300].map((delay) => window.setTimeout(align, delay));
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("keydown", stop);
    };
  }, [pathname]);
}

export function SmoothScroll() {
  useSettleOnHash();
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;

    if (prefersReducedMotion || isTouch) {
      // Positions still need recomputing once fonts and images settle.
      const refresh = () => ScrollTrigger.refresh();
      window.addEventListener("load", refresh);
      // Anchors still need the nav offset even with no smooth scroller, or
      // every jumped-to heading lands underneath the nav pill.
      const teardown = installAnchorScrolling(null);
      return () => {
        window.removeEventListener("load", refresh);
        teardown();
      };
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    instance = lenis;
    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => {
      // gsap.ticker reports seconds; Lenis expects milliseconds.
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Trigger positions are measured at install time, before webfonts swap and
    // section reveals settle. Recompute once the page has fully loaded.
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);

    const teardownAnchors = installAnchorScrolling(lenis);

    return () => {
      teardownAnchors();
      window.removeEventListener("load", refresh);
      lenis.off("scroll", ScrollTrigger.update);
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      instance = null;
    };
  }, []);

  return null;
}
