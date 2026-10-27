"use client";

import { useSyncExternalStore } from "react";

/*
 * A YES/NO KEPT IN THIS BROWSER (a folded card, a hidden panel), the same in
 * every open tab, read without a flash on load (useSyncExternalStore; the
 * server renders the fallback). Where storage is blocked (a private window),
 * the page remembers it until it's closed.
 */
const EVENT = "crm-pref";
const memory = new Map<string, boolean>();

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
}

function read(key: string, fallback: boolean) {
  try {
    const v = localStorage.getItem(key);
    if (v !== null) return v === "1";
  } catch {}
  return memory.get(key) ?? fallback;
}

export function setPref(key: string, value: boolean) {
  memory.set(key, value);
  try {
    localStorage.setItem(key, value ? "1" : "0");
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function usePref(key: string, fallback: boolean): [boolean, (value: boolean) => void] {
  const value = useSyncExternalStore(subscribe, () => read(key, fallback), () => fallback);
  return [value, (v: boolean) => setPref(key, v)];
}
