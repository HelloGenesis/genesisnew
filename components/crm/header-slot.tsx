"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const noSubscribe = () => () => {};

/** Draws its children into the CRM's top bar, beside the theme switch (app/(crm)/layout's #crm-header-slot). */
export function HeaderSlot({ children }: { children: React.ReactNode }) {
  const slot = useSyncExternalStore(noSubscribe, () => document.getElementById("crm-header-slot"), () => null);
  return slot ? createPortal(children, slot) : null;
}
