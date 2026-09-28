import { AddToCart } from "@/components/genesis/cart";
import { GlassButton } from "@/components/genesis/glass-button";
import { Reveal } from "@/components/genesis/reveal";
import { productId } from "@/lib/cart";
import { inr } from "@/lib/money";
import { bookingHref } from "@/lib/pricing";
import { type OneTimeProduct, productsFor } from "@/lib/products";
import type { VerticalKey } from "@/lib/verticals/types";
import { cn } from "@/lib/utils";

import { ShootChip } from "./plan-grid";
import { ONE_TIME_GRADIENT } from "./tier-colors";

/** Each division's card: its name and the line under it. */
const HEADS: Record<VerticalKey, { name: string; pitch: string }> = {
  "ai-labs": {
    name: "AI content, one project at a time",
    pitch: "Build your avatar, or buy the AI videos and films you need — no membership needed.",
  },
  studios: {
    name: "Studios, one production at a time",
    pitch: "Edit the footage you have, or book a single shoot — no membership needed.",
  },
  "brand-design": {
    name: "Design, one project at a time",
    pitch: "A logo refresh, a campaign kit or a pitch deck — buy the one thing you need, no membership needed.",
  },
  influence: {
    name: "Influence, one campaign at a time",
    pitch: "Creator-style UGC ready to post, or a full influencer campaign run end to end.",
  },
};

/**
 * EVERY DIVISION'S ONE-TIME PRODUCTS, IN ONE CARD — for the visitor who is
 * not ready to subscribe.
 *
 * ITS OWN IDENTITY, CLEARLY VISIBLE (Genesis, 28 Sep 2026): the plans are
 * gradient-edged cards in the tier colours; this is one wide ticket in the
 * orb's violet-to-coral — a gradient edge, a gradient badge and name —
 * introduced by a "Not ready to subscribe?" rule.
 *
 * THE PRODUCTS ARE GENESIS'S LISTING (lib/products), and replace every
 * add-on and earlier one-time product. Each is a tile: number, name, price,
 * the line under it, everything it includes, and — where the price is fixed
 * — "Buy Now" and "+ Add to Cart"; where it depends on the campaign, "Book a
 * 15-min Call".
 */
export function OneTimeProducts({
  vertical,
  bare = false,
}: {
  vertical: VerticalKey;
  /** Without the "Not ready to subscribe?" rule — where a switch already frames it (/pricing). */
  bare?: boolean;
}) {
  const items = productsFor(vertical);
  if (items.length === 0) return null;
  const head = HEADS[vertical];

  return (
    <Reveal className={bare ? undefined : "mt-14"}>
      {!bare && (
        <div className="flex items-center gap-4" aria-hidden>
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#8b5cf6]/50" />
          <span className="text-small text-bone">Not ready to subscribe?</span>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#f7788f]/50" />
        </div>
      )}

      {/* The gradient edge: a 1px frame of the one-time colours around the ticket. */}
      <div
        id={`${vertical}-one-time`}
        className={cn(
          "scroll-mt-28 rounded-panel p-px shadow-[0_30px_80px_-30px_rgb(139_92_246/0.45)]",
          !bare && "mt-6",
        )}
        style={{ background: ONE_TIME_GRADIENT }}
      >
        <div className="relative overflow-hidden rounded-panel bg-ink">
          <span aria-hidden className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-[#8b5cf6]/25 blur-3xl" />
          <span aria-hidden className="pointer-events-none absolute -bottom-24 right-10 size-72 rounded-full bg-[#f7788f]/15 blur-3xl" />

          <div className="relative p-5 sm:p-7">
            <p
              className="inline-flex rounded-full px-3 py-1 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-white"
              style={{ background: ONE_TIME_GRADIENT }}
            >
              One-time · No subscription
            </p>
            <h3
              className="mt-4 bg-clip-text font-display text-h3 font-normal leading-tight tracking-tight text-transparent"
              style={{ backgroundImage: ONE_TIME_GRADIENT }}
            >
              {head.name}
            </h3>
            <p className="mt-2 max-w-2xl text-body text-bone">{head.pitch}</p>
          </div>

          <ul
            className={cn(
              "relative grid gap-3 border-t border-dashed border-[var(--glass-border)] p-5 sm:p-7 md:grid-cols-2",
              items.length === 3 && "lg:grid-cols-3",
            )}
          >
            {items.map((product) => (
              <ProductTile key={product.name} product={product} />
            ))}
          </ul>
        </div>
      </div>
    </Reveal>
  );
}

function ProductTile({ product }: { product: OneTimeProduct }) {
  const buyable = product.cta === "buy" && product.price !== undefined;
  return (
    <li className="flex flex-col rounded-card border border-[var(--glass-border)] bg-[var(--hover-wash)] p-5">
      <p className="font-display text-small text-ash">{product.index}</p>
      <h4 className="mt-1 font-sans text-lead leading-snug text-bone">{product.name}</h4>
      <p className="mt-3 flex flex-wrap items-baseline gap-x-2">
        {buyable ? (
          <>
            <span className="font-display text-h3 font-normal leading-none tracking-tight text-bone">
              {inr(product.price!).replace(/\/-$/, "")}
            </span>
            <span className="-ml-1.5 text-body text-ash">/-</span>
            <span className="text-small text-ash">one-time</span>
          </>
        ) : (
          <span
            className="bg-clip-text font-display text-lead font-normal leading-snug text-transparent"
            style={{ backgroundImage: ONE_TIME_GRADIENT }}
          >
            {product.priceLabel}
          </span>
        )}
      </p>
      {product.inPerson && <ShootChip className="mt-3 self-start" />}
      <p className="mt-3 text-pretty text-small leading-relaxed text-bone">{product.pitch}</p>

      <p className="micro-label mt-5">Includes</p>
      <ul className="mt-3 grid gap-x-5 gap-y-1.5 text-small leading-snug text-ash sm:grid-cols-2">
        {product.includes.map((item) => (
          <li key={item} className="flex gap-2.5">
            <span aria-hidden className="mt-[0.45em] size-1.5 shrink-0 rounded-full" style={{ background: ONE_TIME_GRADIENT }} />
            {item}
          </li>
        ))}
      </ul>
      {product.note && <p className="mt-4 text-pretty text-[0.75rem] leading-relaxed text-faint">{product.note}</p>}

      <div className="mt-auto pt-6" data-track={`product:${product.name}`}>
        {buyable ? (
          <AddToCart
            id={productId(product.vertical, "one-time", product.name)}
            purchase
            label="Buy Now"
            variant="brand"
            className="[&>*]:min-w-[8.5rem]"
          />
        ) : (
          <GlassButton href={bookingHref(product.name)} variant="brand" arrow className="w-full sm:w-auto">
            Book a 15-min Call
          </GlassButton>
        )}
      </div>
    </li>
  );
}
