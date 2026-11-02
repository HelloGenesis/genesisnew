"use client";

import { useEffect } from "react";

/**
 * Text boxes that grow with their text where the browser can't do it in CSS
 * (field-sizing, in app/(crm)/crm.css): Safari and Firefox. Typing, and text
 * set by a button (the writing tools, templates), both resize the box.
 */
export function AutoGrow() {
  useEffect(() => {
    if (typeof CSS !== "undefined" && CSS.supports("field-sizing", "content")) return;
    const fit = (t: HTMLTextAreaElement) => {
      if (t.classList.contains("crm-grow")) return;
      const max = window.innerHeight * 0.7;
      t.style.height = "auto";
      t.style.height = `${Math.min(max, t.scrollHeight + 2)}px`;
    };
    const all = () => document.querySelectorAll<HTMLTextAreaElement>("textarea.crm-input").forEach(fit);
    const onInput = (e: Event) => e.target instanceof HTMLTextAreaElement && e.target.classList.contains("crm-input") && fit(e.target);
    document.addEventListener("input", onInput, true);
    /* Text set without typing, and boxes that appear later. */
    const seen = new WeakMap<HTMLTextAreaElement, string>();
    const timer = window.setInterval(() => {
      document.querySelectorAll<HTMLTextAreaElement>("textarea.crm-input").forEach((t) => {
        if (seen.get(t) !== t.value) {
          seen.set(t, t.value);
          fit(t);
        }
      });
    }, 600);
    all();
    return () => {
      document.removeEventListener("input", onInput, true);
      window.clearInterval(timer);
    };
  }, []);
  return null;
}
