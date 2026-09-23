"use client";

import { useEffect } from "react";

import { recoverFilm } from "@/lib/films";

/**
 * One listener for every film window on the page — see recoverFilm.
 *
 * A media element's `error` does not bubble, but it does pass through the
 * capture phase, so a single listener on the document hears every <video>
 * without each window having to wire its own (several are server
 * components, which cannot).
 */
export function FilmRecovery() {
  useEffect(() => {
    const onError = (event: Event) => {
      if (event.target instanceof HTMLVideoElement) recoverFilm(event.target);
    };
    document.addEventListener("error", onError, true);
    return () => document.removeEventListener("error", onError, true);
  }, []);
  return null;
}
