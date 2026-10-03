"use client";

import { Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { AddToCart, useCart } from "@/components/genesis/cart";
import { productId } from "@/lib/cart";
import {
  ADAPT_MAX,
  EXTEND_MAX_STEPS,
  EXTEND_STEP_SEC,
  extrasFor,
  priceExtras,
  type ExtrasChoice,
} from "@/lib/extras";
import { inr } from "@/lib/money";
import type { VerticalKey } from "@/lib/verticals/types";
import { cn } from "@/lib/utils";

const money = (value: number) => inr(value).replace(/\/-$/, "");

/**
 * MAKE IT YOURS — the extras on a pay-per-project product, chosen before it
 * goes in the cart (Genesis, 3 Oct 2026: the sheet's "+ Add adaptation" and
 * "duration extension slider", and the priced add-ons). A slider for longer
 * videos and how many of them, a counter for adaptations, the add-ons by
 * the tick or the piece, and the running total. Buy Now and Add to Cart
 * carry the choice; a product already in the cart opens with its own and
 * "Update cart" saves the change. See lib/extras for every price.
 */
export function ExtrasPicker({
  vertical,
  name,
  price,
  onExtrasChange,
}: {
  vertical: VerticalKey;
  name: string;
  price: number;
  /** The extras' running total, for the price at the top of the box to follow. */
  onExtrasChange?: (total: number) => void;
}) {
  const id = productId(vertical, "one-time", name);
  const { extrasOf } = useCart();
  const extras = extrasFor(name);
  const [choice, setChoice] = useState<ExtrasChoice>(() => extrasOf(id) ?? {});
  const steps = choice.extendSteps ?? 0;
  const videos = choice.extendVideos ?? extras?.count ?? 1;
  const lines = priceExtras(name, steps ? { ...choice, extendVideos: videos } : { ...choice, extendSteps: 0 });
  const extraTotal = lines.reduce((sum, line) => sum + line.amount, 0);
  useEffect(() => onExtrasChange?.(extraTotal), [extraTotal, onExtrasChange]);

  if (!extras) {
    return <AddToCart id={id} purchase label="Buy Now" variant="brand" />;
  }

  const set = (patch: Partial<ExtrasChoice>) => setChoice((before) => ({ ...before, ...patch }));
  const plural = (n: number) => `${extras.noun}${n === 1 ? "" : "s"}`;
  /* What goes to the cart: the choice as it stands, the video count filled in. */
  const chosen: ExtrasChoice = { ...choice, extendSteps: steps, extendVideos: steps ? videos : 0 };

  return (
    <div className="space-y-5">
      <div className="border-t border-[var(--glass-border)] pt-5">
        <p className="micro-label">Make it yours</p>

        {extras.extend && (
          <div className="mt-4">
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor={`${id}-extend`} className="text-small text-bone">
                Longer {plural(2)}
              </label>
              <span className="text-small tabular-nums text-brand-ink">
                {steps ? `+${steps * EXTEND_STEP_SEC} sec` : "Standard length"}
              </span>
            </div>
            <input
              id={`${id}-extend`}
              type="range"
              min={0}
              max={EXTEND_MAX_STEPS}
              step={1}
              value={steps}
              onChange={(event) => set({ extendSteps: Number(event.target.value) })}
              className="mt-2 w-full accent-[var(--color-brand)]"
              aria-valuetext={steps ? `${steps * EXTEND_STEP_SEC} seconds longer` : "Standard length"}
            />
            <div className="mt-1 flex justify-between text-[0.6875rem] text-faint" aria-hidden>
              {Array.from({ length: EXTEND_MAX_STEPS + 1 }, (_, step) => (
                <span key={step}>{step ? `+${step * EXTEND_STEP_SEC}s` : "0"}</span>
              ))}
            </div>
            {steps > 0 && extras.count > 1 && (
              <div className="mt-3 flex items-center justify-between gap-3 text-small text-ash">
                <span>On how many {plural(2)}?</span>
                <Counter
                  value={videos}
                  min={1}
                  max={extras.count}
                  onChange={(n) => set({ extendVideos: n })}
                  label={`${plural(2)} to extend`}
                  suffix={`of ${extras.count}`}
                />
              </div>
            )}
            <p className="mt-2 text-[0.75rem] text-faint">
              {money(extras.extend.price)} per +{EXTEND_STEP_SEC} sec, per {extras.noun}.
            </p>
          </div>
        )}

        <div className="mt-5 flex items-center justify-between gap-3">
          <span>
            <span className="block text-small text-bone">Adaptations</span>
            <span className="block text-[0.75rem] text-faint">
              {money(extras.adapt.price)} each · {extras.noun === "video" || extras.noun === "reel" || extras.noun === "film" ? "an alternate cut or aspect ratio" : "an extra size, format or version"}
            </span>
          </span>
          <Counter value={choice.adaptations ?? 0} min={0} max={ADAPT_MAX} onChange={(n) => set({ adaptations: n })} label="Adaptations" />
        </div>

        {extras.addOns.map((addOn) => {
          const n = choice.addOns?.[addOn.id] ?? 0;
          const setN = (value: number) => set({ addOns: { ...choice.addOns, [addOn.id]: value } });
          return (
            <div key={addOn.id} className="mt-4 flex items-center justify-between gap-3">
              <span>
                <span className="block text-small text-bone">{addOn.label}</span>
                <span className="block text-[0.75rem] text-faint">
                  {money(addOn.price)}
                  {addOn.per ? ` per ${addOn.per}` : ""}
                </span>
              </span>
              {addOn.max > 1 ? (
                <Counter value={n} min={0} max={addOn.max} onChange={setN} label={addOn.label} />
              ) : (
                <button
                  type="button"
                  role="switch"
                  aria-checked={n > 0}
                  aria-label={addOn.label}
                  onClick={() => setN(n ? 0 : 1)}
                  className={cn(
                    "relative h-6 w-11 shrink-0 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                    n ? "border-transparent bg-brand" : "border-[var(--glass-border)] bg-[var(--hover-wash)]",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-1/2 size-4 -translate-y-1/2 rounded-full bg-white shadow transition-[left] duration-200",
                      n ? "left-[1.4rem]" : "left-1",
                    )}
                  />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* THE TOTAL, as it will be charged — GST on top, at checkout. */}
      {extraTotal > 0 && (
        <div className="rounded-card bg-[var(--hover-wash)] p-4 text-small">
          <p className="flex justify-between gap-3 text-ash">
            <span>Product</span>
            <span className="tabular-nums">{money(price)}</span>
          </p>
          {lines.map((line) => (
            <p key={line.label} className="mt-1 flex justify-between gap-3 text-ash">
              <span>{line.label.startsWith("+") ? line.label : `+ ${line.label}`}</span>
              <span className="tabular-nums">{money(line.amount)}</span>
            </p>
          ))}
          <p className="mt-2 flex justify-between gap-3 border-t border-[var(--glass-border)] pt-2 text-bone">
            <span>Total</span>
            <span className="tabular-nums">{money(price + extraTotal)} + GST</span>
          </p>
        </div>
      )}

      <AddToCart id={id} purchase label="Buy Now" variant="brand" extras={chosen} />
    </div>
  );
}

function Counter({
  value,
  min,
  max,
  onChange,
  label,
  suffix,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  suffix?: string;
}) {
  const button =
    "grid size-8 place-items-center rounded-full text-ash transition-colors hover:bg-[var(--hover-wash)] hover:text-bone disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand";
  return (
    <div className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[var(--glass-border)] p-0.5">
      <button type="button" aria-label={`Fewer ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)} className={button}>
        <Minus className="size-3.5" aria-hidden />
      </button>
      <span className="min-w-[2.5rem] text-center text-small tabular-nums text-bone" aria-live="polite">
        {value}
        {suffix && <span className="text-faint"> {suffix}</span>}
      </span>
      <button type="button" aria-label={`More ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)} className={button}>
        <Plus className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
