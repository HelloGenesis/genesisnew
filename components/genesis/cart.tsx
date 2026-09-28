"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { COMBO_PERCENT, type Billing, type CartLine, billingNote, findProduct, maxQty, priceCart, rupees, samePackage } from "@/lib/cart";
import { shootNote } from "@/lib/regions";
import { cn } from "@/lib/utils";

import { GlassButton } from "./glass-button";
import { getLenis } from "./smooth-scroll";

/* ------------------------------------------------------------------ state */

/*
  THE BASKET LIVES IN THIS BROWSER ONLY — ids, quantities and billing, never
  prices (lib/cart prices it, and the server prices it again at checkout).
  Storage can be missing or throw (private windows, blocked site data), so
  every read and write is guarded and the cart simply starts empty.
*/
const STORAGE_KEY = "genesis-cart-v1";

type CartContext = {
  lines: CartLine[];
  count: number;
  ready: boolean;
  add: (id: string, options?: { billing?: Billing; qty?: number; open?: boolean }) => void;
  setQty: (id: string, qty: number) => void;
  setBilling: (id: string, billing: Billing) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
  /** A plan in this cart from the same package as `id`, if any — one plan per package. */
  packageSibling: (id: string) => string | undefined;
  /** What the last add did, when it was more than adding — "Switched to Growth". */
  notice: string;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
};

const Context = createContext<CartContext | null>(null);

export function useCart() {
  const value = useContext(Context);
  if (!value) throw new Error("useCart outside CartProvider");
  return value;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]") as CartLine[];
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating from storage once, after mount
      setLines(Array.isArray(saved) ? saved.filter((line) => findProduct(line.id)) : []);
    } catch {
      /* no storage — start empty */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* no storage — the cart lasts as long as the tab */
    }
  }, [lines, ready]);

  const add = useCallback<CartContext["add"]>((id, options = {}) => {
    const product = findProduct(id);
    if (!product) return;
    setNotice("");
    setLines((before) => {
      /* ONE PLAN PER PACKAGE — a second plan from the same package replaces the first. */
      const replaced = before.filter((line) => {
        const other = findProduct(line.id);
        return other !== undefined && samePackage(product, other);
      });
      if (replaced.length) {
        const was = findProduct(replaced[0].id)!;
        setNotice(`Switched ${product.group} from ${was.name} to ${product.name} — one plan per package.`);
      }
      const current = before.filter((line) => !replaced.includes(line));
      const existing = current.find((line) => line.id === id);
      if (existing) {
        if (product.kind === "membership" || product.amount === undefined) {
          return current.map((line) => (line.id === id ? { ...line, billing: options.billing ?? line.billing } : line));
        }
        return current.map((line) => (line.id === id ? { ...line, qty: Math.min(maxQty(product), line.qty + (options.qty ?? 1)) } : line));
      }
      return [...current, { id, qty: options.qty ?? 1, billing: product.kind === "membership" ? (options.billing ?? "quarterly") : undefined }];
    });
    if (options.open !== false) setDrawerOpen(true);
  }, []);

  const value = useMemo<CartContext>(
    () => ({
      lines,
      count: lines.reduce((sum, line) => sum + line.qty, 0),
      ready,
      add,
      setQty: (id, qty) =>
        setLines((current) =>
          qty < 1
            ? current.filter((line) => line.id !== id)
            : current.map((line) => {
                if (line.id !== id) return line;
                const product = findProduct(id);
                return { ...line, qty: Math.min(product ? maxQty(product) : 99, qty) };
              }),
        ),
      setBilling: (id, billing) => setLines((current) => current.map((line) => (line.id === id ? { ...line, billing } : line))),
      remove: (id) => setLines((current) => current.filter((line) => line.id !== id)),
      clear: () => setLines([]),
      has: (id) => lines.some((line) => line.id === id),
      packageSibling: (id) => {
        const product = findProduct(id);
        if (!product) return undefined;
        return lines.find((line) => {
          const other = findProduct(line.id);
          return other !== undefined && samePackage(product, other);
        })?.id;
      },
      notice,
      drawerOpen,
      setDrawerOpen,
    }),
    [lines, ready, add, drawerOpen, notice],
  );

  return (
    <Context.Provider value={value}>
      {children}
      <CartDrawer />
    </Context.Provider>
  );
}

/* ------------------------------------------------------------ nav button */

export function CartButton({ className }: { className?: string }) {
  const { count, setDrawerOpen, ready } = useCart();
  return (
    <button
      type="button"
      onClick={() => setDrawerOpen(true)}
      aria-label={count ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Cart, empty"}
      data-track="nav:cart"
      className={cn(
        "relative grid size-9 place-items-center rounded-full border border-[var(--glass-border)] text-bone transition-colors hover:bg-[var(--hover-wash)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
        className,
      )}
    >
      <ShoppingBag className="size-4" aria-hidden />
      {ready && count > 0 && (
        <span
          aria-hidden
          className="absolute -right-1 -top-1 grid min-w-[1.125rem] place-items-center rounded-full bg-brand px-1 text-[0.625rem] font-semibold leading-[1.125rem] text-on-brand"
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}

/* ---------------------------------------------------------- add buttons */

/**
 * "ADD TO CART" AND "PURCHASE", for any product in lib/cart's catalogue.
 * Purchase adds it and goes straight to /cart; Add to cart opens the cart
 * panel so the visitor sees it land and can keep shopping.
 */
export function AddToCart({
  id,
  billing,
  purchase = false,
  size = "md",
  variant,
  className,
  label,
}: {
  id: string;
  billing?: Billing;
  /** Show "Purchase" (add and go to checkout) beside "Add to cart". */
  purchase?: boolean;
  size?: "sm" | "md";
  variant?: "brand" | "glass";
  className?: string;
  label?: string;
}) {
  const { add, has, packageSibling } = useCart();
  const router = useRouter();
  const product = findProduct(id);
  if (!product) return null;
  const inCart = has(id);
  const quoted = product.amount === undefined;
  /* Another plan from this package is in the cart: this button swaps to it. */
  const sibling = packageSibling(id);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)} data-track={`cart:${id}`}>
      {purchase && !quoted && (
        <GlassButton
          variant={variant ?? "brand"}
          size={size}
          arrow
          className="flex-1"
          onClick={() => {
            add(id, { billing, open: false });
            router.push("/cart");
          }}
        >
          {label ?? "Purchase"}
        </GlassButton>
      )}
      <GlassButton
        variant={purchase && !quoted ? "glass" : (variant ?? "glass")}
        size={size}
        className={cn(purchase && !quoted ? "flex-1" : undefined)}
        icon={inCart ? <Check className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
        onClick={() => add(id, { billing })}
      >
        {inCart && quoted
          ? "In cart"
          : quoted
            ? "Add to cart for a quote"
            : sibling && !inCart
              ? "Switch to this plan"
              : inCart
                ? "In cart"
                : "Add to cart"}
      </GlassButton>
    </div>
  );
}

/** A small round "+" for dense lists — an add-on row. */
export function AddToCartIcon({ id, className }: { id: string; className?: string }) {
  const { add, has } = useCart();
  const product = findProduct(id);
  if (!product) return null;
  const inCart = has(id);
  return (
    <button
      type="button"
      onClick={() => add(id)}
      aria-label={`Add ${product.name} to cart`}
      data-track={`cart:${id}`}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-small transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
        inCart ? "border-brand/60 bg-brand/10 text-bone" : "border-[var(--glass-border)] text-ash hover:border-brand/60 hover:text-bone",
        className,
      )}
    >
      {inCart ? <Check className="size-3.5 text-brand-ink" aria-hidden /> : <Plus className="size-3.5" aria-hidden />}
      <span>{inCart ? "Added" : "Add"}</span>
    </button>
  );
}

/* ----------------------------------------------------- what's included */

/**
 * "WHAT'S INCLUDED", OPENED ON DEMAND — on every one-time product tile and on
 * every line of the cart (Genesis, 28 Sep 2026: "mention in each card in the
 * collapse/dropdown what's included. While adding to the cart as well").
 */
export function IncludedList({ items, className }: { items?: readonly string[]; className?: string }) {
  if (!items?.length) return null;
  return (
    <details className={cn("group/inc", className)}>
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-[0.75rem] text-ash transition-colors hover:text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand [&::-webkit-details-marker]:hidden">
        What&rsquo;s included
        <ChevronDown aria-hidden className="size-3.5 transition-transform duration-300 group-open/inc:rotate-180" />
      </summary>
      <ul className="mt-2 space-y-1">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-[0.75rem] leading-snug text-bone/85">
            <Check aria-hidden className="mt-0.5 size-3 shrink-0 text-brand-ink" />
            {item}
          </li>
        ))}
      </ul>
    </details>
  );
}

/* ------------------------------------------------------------ the lines */

export function QtyStepper({ id, qty, unit, max = 99 }: { id: string; qty: number; unit?: string; max?: number }) {
  const { setQty } = useCart();
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-[var(--glass-border)] p-0.5">
      <button
        type="button"
        onClick={() => setQty(id, qty - 1)}
        aria-label="One fewer"
        className="grid size-7 place-items-center rounded-full text-ash hover:bg-[var(--hover-wash)] hover:text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <Minus className="size-3.5" aria-hidden />
      </button>
      <span className="min-w-6 text-center text-small tabular-nums text-bone" aria-live="polite">
        {qty}
        {unit && <span className="sr-only"> {unit}</span>}
      </span>
      <button
        type="button"
        onClick={() => setQty(id, qty + 1)}
        disabled={qty >= max}
        aria-label="One more"
        className="grid size-7 place-items-center rounded-full text-ash hover:bg-[var(--hover-wash)] hover:text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-30"
      >
        <Plus className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}

export function BillingSwitch({ id, billing }: { id: string; billing: Billing }) {
  const { setBilling } = useCart();
  return (
    <div role="radiogroup" aria-label="Billing" className="inline-flex rounded-full border border-[var(--glass-border)] p-0.5 text-[0.75rem]">
      {(["quarterly", "monthly"] as const).map((value) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={billing === value}
          onClick={() => setBilling(id, value)}
          className={cn(
            "rounded-full px-3 py-1 capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
            billing === value ? "bg-brand text-on-brand" : "text-ash hover:text-bone",
          )}
        >
          {value}
        </button>
      ))}
    </div>
  );
}

/** Every line of the cart, as rows — the panel and the /cart page share it. */
export function CartLines({ dense = false }: { dense?: boolean }) {
  const { lines, remove } = useCart();
  const totals = priceCart(lines);
  return (
    <ul className="divide-y divide-[var(--glass-border)]">
      {totals.lines.map((line) => (
        <li key={line.id} className={cn("flex gap-4", dense ? "py-4" : "py-5")}>
          <div className="min-w-0 flex-1">
            <p className="text-[0.6875rem] uppercase tracking-[0.14em] text-faint">
              {line.product.group}
              {line.product.kind === "membership" ? " · Membership" : line.product.kind === "add-on" ? " · Add-on" : " · One-time"}
            </p>
            <p className="mt-1 font-sans text-body leading-snug text-bone">{line.product.name}</p>
            {line.product.inPerson && (
              <p className="mt-1 text-[0.6875rem] uppercase tracking-[0.12em] text-brand-ink">Mumbai only, for now</p>
            )}
            <IncludedList items={line.product.includes} className="mt-1.5" />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {line.product.kind === "membership" ? (
                <BillingSwitch id={line.id} billing={line.billing ?? "quarterly"} />
              ) : line.quoted ? (
                <span className="text-small text-faint">{line.product.quote} · quoted after checkout</span>
              ) : (
                <QtyStepper id={line.id} qty={line.qty} unit={line.product.unit} max={maxQty(line.product)} />
              )}
              {!line.quoted && line.product.kind !== "membership" && line.product.unit && (
                <span className="text-[0.75rem] text-faint">{rupees(line.product.amount!)} {line.product.unit}</span>
              )}
            </div>
            {line.product.kind === "membership" && (
              <p className="mt-2 text-[0.75rem] text-faint">{billingNote(line.product, line.billing)}</p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end justify-between gap-2">
            <p className="text-body tabular-nums text-bone">{line.quoted ? "Quote" : rupees(line.charge)}</p>
            <button
              type="button"
              onClick={() => remove(line.id)}
              aria-label={`Remove ${line.product.name}`}
              className="grid size-8 place-items-center rounded-full text-faint transition-colors hover:bg-[var(--hover-wash)] hover:text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Subtotal, bundle saving, GST and total — and the nudge to the next saving. */
export function CartSummary({ country }: { country?: string }) {
  const { lines, notice, add } = useCart();
  const totals = priceCart(lines, { country });
  const row = "flex items-baseline justify-between gap-4 text-small";
  const suggest = totals.comboSuggest;
  return (
    <div className="space-y-2">
      {notice && (
        <p role="status" className="mb-3 rounded-card border border-[var(--glass-border)] bg-[var(--hover-wash)] px-4 py-3 text-small text-bone">
          {notice}
        </p>
      )}
      {/* The AI + Studios combo, offered when the cart holds only one of the two. */}
      {suggest && (
        <div
          className="mb-4 rounded-card p-px"
          style={{ background: "linear-gradient(115deg, #8b5cf6 0%, #f7788f 55%, #ffb35c 100%)" }}
        >
          <div className="rounded-card bg-ink px-4 py-3">
            <p className="text-small text-bone">
              AI content + a Studios shoot works magic for your brand.{" "}
              <span className="text-ash">
                {totals.comboUpgrade
                  ? `Move to a Studios plan with a monthly shoot and save ${COMBO_PERCENT}% on both plans — we capture the best on the day, and AI turns it into more.`
                  : suggest.vertical === "studios"
                    ? `Add a Studios plan with a monthly shoot and save ${COMBO_PERCENT}% on both plans — we capture the best on the day, and AI turns it into more.`
                    : `Add an AI plan and save ${COMBO_PERCENT}% on both plans — AI turns every shoot into more content.`}
              </span>
            </p>
            <button
              type="button"
              onClick={() => add(suggest.id, { open: false })}
              className="mt-2 inline-flex items-center gap-1.5 text-small text-brand-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <Plus className="size-3.5" aria-hidden />
              {totals.comboUpgrade ? "Upgrade to" : "Add"} {suggest.group} — {suggest.name} ({rupees(suggest.amount!)} per
              month)
            </button>
          </div>
        </div>
      )}
      {totals.nextTier && totals.bundleItems > 0 && (
        <p className="mb-4 rounded-card border border-brand/30 bg-brand/[0.06] px-4 py-3 text-small text-bone">
          Add {totals.nextTier.itemsToGo} more add-on{totals.nextTier.itemsToGo === 1 ? "" : "s"} or one-time product
          {totals.nextTier.itemsToGo === 1 ? "" : "s"} to save {totals.nextTier.percent}%.
        </p>
      )}
      <p className={row}>
        <span className="text-ash">Subtotal</span>
        <span className="tabular-nums text-bone">{rupees(totals.subtotal)}</span>
      </p>
      {totals.discount > 0 && (
        <p className={row}>
          <span className="text-brand-ink">Bundle saving ({totals.discountPercent}%)</span>
          <span className="tabular-nums text-brand-ink">−{rupees(totals.discount)}</span>
        </p>
      )}
      {totals.comboDiscount > 0 && (
        <p className={row}>
          <span className="text-brand-ink">AI + Studios combo ({COMBO_PERCENT}%)</span>
          <span className="tabular-nums text-brand-ink">−{rupees(totals.comboDiscount)}</span>
        </p>
      )}
      <p className={row}>
        <span className="text-ash">{totals.taxLabel}</span>
        <span className="tabular-nums text-bone">{rupees(totals.gst)}</span>
      </p>
      <p className="flex items-baseline justify-between gap-4 border-t border-[var(--glass-border)] pt-3">
        <span className="text-body text-bone">Total</span>
        <span className="font-display text-h3 font-normal leading-none tabular-nums text-bone">{rupees(totals.total)}</span>
      </p>
      {totals.inPerson && (
        <p className="pt-1 text-[0.75rem] leading-relaxed text-faint">{shootNote}</p>
      )}
      {totals.quoted.length > 0 && (
        <p className="pt-1 text-[0.75rem] leading-relaxed text-faint">
          {totals.quoted.length} item{totals.quoted.length === 1 ? " is" : "s are"} priced on request — Genesis
          quotes {totals.quoted.length === 1 ? "it" : "them"} after your order.
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ the panel */

function CartDrawer() {
  const { drawerOpen, setDrawerOpen, lines } = useCart();
  const [mounted, setMounted] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- portals need the DOM
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!drawerOpen) return;
    const lenis = getLenis();
    lenis?.stop();
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    panel.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      root.style.overflow = previous;
      lenis?.start();
    };
  }, [drawerOpen, setDrawerOpen]);

  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {drawerOpen && (
        <motion.div
          key="cart"
          className="fixed inset-0 z-[110]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Close cart"
            tabIndex={-1}
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 cursor-default bg-black/55 backdrop-blur-md"
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label="Your cart"
            tabIndex={-1}
            data-lenis-prevent
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="glass glass-strong absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-[var(--glass-border)] bg-ink focus:outline-none"
          >
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-6 py-5">
              <p className="font-sans text-lead text-bone">Your cart</p>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close cart"
                className="grid size-9 place-items-center rounded-full border border-[var(--glass-border)] text-bone hover:bg-[var(--hover-wash)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <ShoppingBag className="size-8 text-faint" aria-hidden />
                <p className="text-body text-ash">Your cart is empty.</p>
                <GlassButton href="/pricing" variant="glass" arrow onClick={() => setDrawerOpen(false)}>
                  Explore Memberships
                </GlassButton>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto overscroll-contain px-6">
                  <CartLines dense />
                </div>
                <div className="border-t border-[var(--glass-border)] px-6 pb-6 pt-5">
                  <CartSummary />
                  <div className="mt-5 grid gap-2">
                    <GlassButton href="/cart" variant="brand" arrow className="w-full" onClick={() => setDrawerOpen(false)}>
                      Checkout
                    </GlassButton>
                    <button
                      type="button"
                      onClick={() => setDrawerOpen(false)}
                      className="py-2 text-small text-ash hover:text-bone"
                    >
                      Keep browsing
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
