"use client";

import Link from "next/link";

import { useCart } from "@/components/genesis/cart";
import { priceCart, rupees } from "@/lib/cart";

/** The cart on My account: what's in it and its total, or that it's empty. */
export function AccountCart() {
  const { lines, ready, remove } = useCart();
  if (!ready) return <p className="text-ash">Loading your cart…</p>;
  if (lines.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-ash">Your cart is empty.</p>
        <div className="flex flex-wrap gap-2">
          <Link href="/pricing" className="crm-btn crm-btn-primary crm-btn-sm">Browse plans & products</Link>
        </div>
      </div>
    );
  }
  const cart = priceCart(lines);
  return (
    <div className="space-y-3">
      <ul className="divide-y divide-[var(--glass-border)]">
        {cart.lines.map((line) => (
          <li key={line.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
            <span className="min-w-0">
              <span className="block text-bone">{line.product.name}{line.qty > 1 ? ` × ${line.qty}` : ""}</span>
              <span className="text-[0.8125rem] text-faint">{line.product.group}{line.product.kind === "membership" ? ` · ${line.billing === "monthly" ? "billed monthly" : "billed quarterly"}` : ""}</span>
            </span>
            <span className="flex items-center gap-3">
              <span className="tabular-nums text-bone">{line.quoted ? "Quoted" : rupees(line.charge + line.extrasCharge)}</span>
              <button type="button" onClick={() => remove(line.id)} className="text-[0.8125rem] text-faint underline-offset-2 hover:text-bone hover:underline">Remove</button>
            </span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-ash">Total with GST <span className="tabular-nums text-bone">{rupees(cart.total)}</span></span>
        <Link href="/cart" className="crm-btn crm-btn-primary crm-btn-sm">Go to checkout</Link>
      </div>
    </div>
  );
}
