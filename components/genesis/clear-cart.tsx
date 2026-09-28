"use client";

import { useEffect, useRef } from "react";

import { useCart } from "./cart";

/** Empties the cart once a paid order has been verified — see /cart/complete. */
export function ClearCart() {
  const { clear, ready } = useCart();
  const done = useRef(false);
  useEffect(() => {
    if (!ready || done.current) return;
    done.current = true;
    clear();
  }, [ready, clear]);
  return null;
}
