import type { ReactNode } from "react";

import { AddToCart, AddToCartIcon, IncludedList } from "@/components/genesis/cart";
import { Reveal } from "@/components/genesis/reveal";
import { type Product, attachedAddOns, oneTimeAddOns, productId, rupees } from "@/lib/cart";
import { aiStarterPack } from "@/lib/verticals/ai-labs";
import type { VerticalKey } from "@/lib/verticals/types";

import { ONE_TIME_GRADIENT } from "./tier-colors";


/**
 * EVERY DIVISION'S ONE-TIME CARD — for the visitor who is not ready to
 * subscribe.
 *
 * ITS OWN IDENTITY, CLEARLY VISIBLE (Genesis, 28 Sep 2026: "these two look
 * similar, make sure it's differentiated properly … it should be clearly
 * visible and have its own identity"). The plans are yellow-ticked glass
 * cards in a row; this is one wide ticket in the orb's violet-to-coral — a
 * gradient edge, a gradient badge and name, its own dots — introduced by a
 * "Not ready to subscribe?" rule.
 *
 * THE DIVISION'S ADD-ONS ARE IN IT, AS PRODUCTS (Genesis, same day: "all the
 * add-on products should also be written below this in the card as one-time
 * products … making it easy for normal users to buy. Make the same changes
 * to all the verticals"). Each can go in the cart on its own; see
 * `oneTimeAddOns` for the few left out and why.
 */
export function OneTimeCard({
  vertical,
  name,
  pitch,
  note,
  hero,
}: {
  vertical: VerticalKey;
  name: string;
  pitch: string;
  note?: string;
  /** A headline product — its contents and its own price stub (the AI Content Starter). */
  hero?: { body: ReactNode; stub: ReactNode };
}) {
  const products = oneTimeAddOns(vertical);
  const attached = attachedAddOns(vertical);

  return (
    <Reveal className="mt-14">
      <div className="flex items-center gap-4" aria-hidden>
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#8b5cf6]/50" />
        <span className="text-small text-bone">Not ready to subscribe?</span>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#f7788f]/50" />
      </div>

      {/* The gradient edge: a 1px frame of the one-time colours around the ticket. */}
      <div
        className="mt-6 rounded-panel p-px shadow-[0_30px_80px_-30px_rgb(139_92_246/0.45)]"
        style={{ background: ONE_TIME_GRADIENT }}
      >
        <div className="relative overflow-hidden rounded-panel bg-ink">
          <span aria-hidden className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-[#8b5cf6]/25 blur-3xl" />
          <span aria-hidden className="pointer-events-none absolute -bottom-24 right-10 size-72 rounded-full bg-[#f7788f]/15 blur-3xl" />

          <div className={hero ? "relative grid lg:grid-cols-[1fr_1.3fr_0.95fr]" : "relative"}>
            {/* The offer, named. */}
            <div className="p-5 sm:p-7">
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
                {name}
              </h3>
              <p className="mt-2 max-w-xl text-body text-bone">{pitch}</p>
              {note && <p className="mt-2 text-small text-ash">{note}</p>}
            </div>

            {hero && (
              <>
                <div className="border-t border-dashed border-[var(--glass-border)] p-5 sm:p-7 lg:border-l lg:border-t-0">{hero.body}</div>
                <div className="flex flex-col justify-between gap-6 border-t border-dashed border-[var(--glass-border)] p-5 sm:p-7 lg:border-l lg:border-t-0">
                  {hero.stub}
                </div>
              </>
            )}
          </div>

          {/* The division's add-ons, each a product in its own right. */}
          {products.length > 0 && (
            <div className="relative border-t border-dashed border-[var(--glass-border)] p-5 sm:p-7">
              <p className="text-small text-ash">
                {hero ? "Also available one-time — on their own, or added to your Starter:" : "Buy any of these on their own:"}
              </p>
              <ul className="mt-4 grid items-start gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <li key={product.id} className="rounded-card border border-[var(--glass-border)] bg-[var(--hover-wash)] py-2.5 pl-4 pr-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block text-small leading-snug text-bone">{product.name}</span>
                        <span className="mt-0.5 block text-[0.75rem] text-ash">{priceLabel(product)}</span>
                      </span>
                      <AddToCartIcon id={product.id} />
                    </div>
                    <IncludedList items={product.includes} className="mt-1.5 pr-2" />
                  </li>
                ))}
              </ul>
              {attached.length > 0 && (
                <p className="mt-4 text-pretty text-[0.75rem] leading-relaxed text-faint">
                  {vertical === "studios" ? "With a shoot" : "With a membership"}:{" "}
                  {attached.map((product) => `${product.name} ${priceLabel(product)}`).join(" · ")}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Reveal>
  );
}

function priceLabel(product: Product) {
  return product.amount === undefined
    ? (product.quote ?? "")
    : `${rupees(product.amount)}${product.unit ? ` ${product.unit}` : ""}`;
}

/** Dots in the one-time colours, for a hero product's contents. */
function Contents({ items, excludes }: { items: readonly string[]; excludes?: readonly string[] }) {
  return (
    <>
      <ul className="grid gap-x-6 gap-y-2 text-small leading-snug text-bone sm:grid-cols-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5">
            <span aria-hidden className="mt-[0.4em] size-1.5 shrink-0 rounded-full" style={{ background: ONE_TIME_GRADIENT }} />
            {item}
          </li>
        ))}
      </ul>
      {excludes && (
        <p className="mt-4 text-pretty text-[0.75rem] leading-relaxed text-faint">Not included: {excludes.join(" · ")}</p>
      )}
    </>
  );
}

/** AI Labs: the AI Content Starter leads the card, the AI add-ons follow. */
export function StarterPack() {
  const pack = aiStarterPack;
  return (
    <OneTimeCard
      vertical="ai-labs"
      name={pack.name}
      pitch={pack.pitch}
      note={pack.limit}
      hero={{
        body: <Contents items={pack.includes} excludes={pack.excludes} />,
        stub: (
          <>
            <div>
              <p className="font-display text-h2 font-normal leading-none tracking-tight text-bone">
                {pack.price.replace(/\/-$/, "")}
                <span className="ml-0.5 text-lead text-ash">/-</span>
              </p>
              <p className="mt-2 text-small text-ash">One-time payment · + GST</p>
            </div>
            <div data-track="plan:AI Content Starter">
              <AddToCart
                id={productId("ai-labs", "one-time", pack.name)}
                purchase
                variant="glass"
                className="[&>*]:min-w-[8rem]"
              />
            </div>
          </>
        ),
      }}
    />
  );
}

/** Studios: its add-ons, one-time. */
export function StudiosOneTime() {
  return (
    <OneTimeCard
      vertical="studios"
      name="Studios, one piece at a time"
      pitch="Need one reel, one film or a single shoot extra? Buy just that — no membership needed."
    />
  );
}

/** Brand & Design: its add-ons, one-time. */
export function DesignOneTime() {
  return (
    <OneTimeCard
      vertical="brand-design"
      name="Design, one project at a time"
      pitch="A pitch deck, a landing page or a campaign concept — buy the one thing you need, no membership needed."
    />
  );
}
