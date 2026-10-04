"use client";

import { Plus } from "lucide-react";
import { useRef } from "react";

import { AddToCart } from "@/components/genesis/cart";
import { GlassButton } from "@/components/genesis/glass-button";
import { RailProgress } from "@/components/genesis/rail-progress";
import { Reveal } from "@/components/genesis/reveal";
import { productId } from "@/lib/cart";
import { posterSrc } from "@/lib/poster";
import { productImages, type ProductImage } from "@/lib/product-images";
import { inr } from "@/lib/money";
import { bookingHref } from "@/lib/pricing";
import { type OneTimeProduct, productsFor } from "@/lib/products";
import type { VerticalKey } from "@/lib/verticals/types";
import { cn } from "@/lib/utils";

import { useProductOffers } from "../offer-slider";
import { ShootChip } from "./plan-grid";
import { aiTierDetail, DEFINES_VIDEO, VideoTierLine, withDefinitions } from "./video-tier-line";
import { ONE_TIME_GRADIENT, tierGlow, tierGradient } from "./tier-colors";

/** Each division's card: its name and the line under it. */
const HEADS: Record<VerticalKey, { name: string; pitch: string }> = {
  "ai-labs": {
    name: "AI content, one project at a time",
    pitch: "Build your avatar, or buy the AI videos and films you need. No subscription needed.",
  },
  studios: {
    name: "Studios, one production at a time",
    pitch: "Edit the footage you have, or book a single shoot. No subscription needed.",
  },
  "brand-design": {
    name: "Design, one project at a time",
    pitch: "A logo refresh, a campaign kit or a pitch deck. Buy the one thing you need, no subscription needed.",
  },
  influence: {
    name: "Influence, one campaign at a time",
    pitch: "Creator-style UGC ready to post, or a full influencer campaign run end to end.",
  },
};

/**
 * EVERY DIVISION'S ONE-TIME PRODUCTS — for the visitor who is not ready to
 * subscribe.
 *
 * DRAWN LIKE THE MEMBERSHIP PLANS (Genesis, 29 Sep 2026: "write one-time
 * products also like how membership product design and UI UX is"): each
 * product is its own gradient-edged card in the tier colours — the name in
 * its gradient, the price large, the headline points as the tier's dots —
 * then Buy Now + Add to Cart (or Book a 15-min Call where the price depends
 * on the brief).
 *
 * EVERY CARD OPENS ITS POP-UP (Genesis, 2 Oct 2026: "PPP on each vertical
 * page should also open the pop-up window, make it universal"): the card, its
 * name or "View full details" opens the homepage's window for the product —
 * pictures, everything included, turnaround, ways to pay, terms. The buttons
 * on the card still buy without opening it.
 *
 * THE PRODUCTS ARE GENESIS'S LISTING (lib/products).
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
  const { openProduct, dialog } = useProductOffers(vertical);
  const rail = useRef<HTMLUListElement>(null);
  if (items.length === 0) return null;
  const head = HEADS[vertical];

  return (
    <Reveal className={bare ? undefined : "mt-14"}>
      {!bare && (
        <div className="mb-6 flex items-center gap-4" aria-hidden>
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#8b5cf6]/50" />
          <span className="text-small text-bone">Not ready to subscribe?</span>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#f7788f]/50" />
        </div>
      )}

      <div id={`${vertical}-one-time`} className="scroll-mt-28">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <p
            className="inline-flex rounded-full px-3 py-1 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-white"
            style={{ background: ONE_TIME_GRADIENT }}
          >
            Pay-per-project · No subscription
          </p>
          <p className="text-pretty text-small text-ash">{head.pitch}</p>
        </div>

        {items.length > MAX_IN_ROW ? (
          /*
            MORE THAN FOUR: A SLIDER, NOT NARROWER CARDS (Genesis, 2 Oct 2026:
            "keep the size same as other pages, if there are extra cards add
            a slider"). Four in view at the four-across width, two on a
            tablet, one and a peek on a phone — with the site's progress bar.
          */
          <>
            <ul
              ref={rail}
              data-lenis-prevent
              className="-mx-1 mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {items.map((product, index) => (
                <li
                  key={product.name}
                  className="flex w-[86%] shrink-0 snap-start md:w-[calc((100%-1rem)/2)] xl:w-[calc((100%-3rem)/4)]"
                >
                  <ProductCard product={product} tier={index} onOpen={() => openProduct(product.name)} />
                </li>
              ))}
            </ul>
            <RailProgress rail={rail} className="mt-2" />
          </>
        ) : (
          <ul className={cn("mt-5 grid gap-4", COLUMNS[items.length])}>
            {items.map((product, index) => (
              <li key={product.name} className="flex">
                <ProductCard product={product} tier={index} onOpen={() => openProduct(product.name)} />
              </li>
            ))}
          </ul>
        )}
      </div>
      {dialog}
    </Reveal>
  );
}

/** The headline points on the card; the rest are in its pop-up. */
const HIGHLIGHTS = 3;

/** Small pictures under the hero one; the pop-up has them all. */
const THUMBS = 4;

/*
  ALL OF A DIVISION'S PRODUCTS IN ONE ROW (Genesis, 2 Oct 2026: "align PPP
  boxes in one section"): three across for three, four for four — two to a
  row on a tablet, one on a phone. More than four slide (see OneTimeProducts)
  rather than squeeze, so a card is the same size on every page.
*/
const MAX_IN_ROW = 4;
const COLUMNS: Record<number, string> = {
  1: "",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-2 xl:grid-cols-4",
};

/**
 * ONE PRODUCT (Genesis, 2 Oct 2026: "mention price and add 1 big hero image
 * and then smaller images of the product, showcased in our cards"): a large
 * picture of the work, a row of smaller ones under it, then the name, what
 * it does, the price set large, the headline points and the buttons. The
 * pictures are lib/product-images — Genesis's own work of that kind until
 * product shots exist — and a mark or logo sits whole on a light ground.
 */
function ProductCard({
  product,
  tier,
  onOpen,
}: {
  product: OneTimeProduct;
  tier: number;
  onOpen: () => void;
}) {
  const buyable = product.cta === "buy" && product.price !== undefined;
  const gradient = tierGradient(tier);
  const images = productImages[product.name] ?? [];
  const [hero, ...rest] = images;
  const thumbs = rest.slice(0, THUMBS);
  const more = rest.length - thumbs.length;

  return (
    <div
      className="flex w-full rounded-panel p-px shadow-[0_24px_60px_-36px_var(--tier-glow)]"
      style={{ background: gradient, ["--tier-glow" as string]: tierGlow(tier) }}
    >
      {/* The whole card opens the pop-up; its own buttons and links keep their jobs. */}
      <article
        onClick={(event) => {
          if (!(event.target as Element).closest("a, button, details")) onOpen();
        }}
        className="group/card relative flex w-full cursor-pointer flex-col overflow-hidden rounded-panel bg-ink"
      >
        {/* THE HERO PICTURE, with the product's number over it. */}
        {hero && (
          <div className="p-2 pb-0">
            <Picture image={hero} className="aspect-[4/3] w-full" width={828} zoom />
          </div>
        )}
        {/* THE SMALLER ONES, the last carrying "+n" when the pop-up has more. */}
        {thumbs.length > 0 && (
          <ul className="grid grid-cols-4 gap-1.5 px-2 pt-1.5" aria-hidden>
            {thumbs.map((image, index) => (
              <li key={image.src} className="relative">
                <Picture image={image} className="aspect-square w-full" width={384} />
                {index === thumbs.length - 1 && more > 0 && (
                  <span className="absolute inset-0 grid place-items-center rounded-[0.6rem] bg-black/55 text-small text-white">
                    +{more}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="relative flex flex-1 flex-col p-5">
          <span
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-10 size-48 rounded-full opacity-70 blur-3xl"
            style={{ background: tierGlow(tier) }}
          />
          <div className="relative flex items-start justify-between gap-3">
            <h4 className="font-display text-lead font-normal leading-snug tracking-tight sm:text-[1.375rem]">
              <button
                type="button"
                onClick={onOpen}
                className="min-h-8 bg-clip-text text-left text-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                style={{ backgroundImage: gradient }}
              >
                {product.name}
              </button>
            </h4>
            <span className="mt-1 font-display text-small text-faint">{product.index}</span>
          </div>
          {/* In full (Genesis, 3 Oct 2026: "this should be visible") — it was cut at two lines. */}
          <p className="relative mt-1.5 text-pretty text-small leading-snug text-ash">{product.pitch}</p>

          {/* THE PRICE, large — the first thing a buyer looks for. */}
          <div className="relative mt-4 border-t border-[var(--glass-border)] pt-4">
            {buyable ? (
              <p className="flex flex-wrap items-baseline gap-x-1.5">
                <span className="font-display text-h3 font-normal leading-none tracking-tight text-bone">
                  {inr(product.price!).replace(/\/-$/, "")}
                </span>
                <span className="text-body text-ash">/-</span>
                <span className="text-[0.75rem] text-ash">per project + GST</span>
              </p>
            ) : (
              <p
                className="bg-clip-text font-display text-lead font-normal leading-snug text-transparent"
                style={{ backgroundImage: gradient }}
              >
                {product.priceLabel}
              </p>
            )}
            {product.inPerson && <ShootChip className="mt-3" />}
          </div>

          <ul className="relative mt-4 space-y-2">
            {product.includes.filter((item) => !DEFINES_VIDEO.test(item)).slice(0, HIGHLIGHTS).map((item) => (
              <li key={item} className="flex gap-2.5 text-small leading-snug text-bone">
                <span aria-hidden className="mt-[0.45em] size-1.5 shrink-0 rounded-full" style={{ background: gradient }} />
                <VideoTierLine text={item} detail={withDefinitions(aiTierDetail(item), product.includes)} />
              </li>
            ))}
          </ul>

          {/* FULL DETAILS — the pop-up, where everything included is listed. */}
          <div className="relative mt-auto pt-5">
            <button
              type="button"
              onClick={onOpen}
              aria-haspopup="dialog"
              className="group/inc inline-flex min-h-8 items-center gap-2.5 rounded-full text-small text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <span
                className="grid size-6 shrink-0 place-items-center rounded-full text-white transition-transform duration-300 group-hover/inc:scale-110"
                style={{ background: gradient }}
              >
                <Plus className="size-3.5" aria-hidden />
              </span>
              View full details
            </button>
          </div>

          <div className="relative pt-4" data-track={`product:${product.name}`}>
            {buyable ? (
              <AddToCart
                id={productId(product.vertical, "one-time", product.name)}
                purchase
                label="Buy Now"
                variant={tier % 3 === 1 ? "brand" : "glass"}
                className="[&>*]:min-w-[7.5rem]"
              />
            ) : (
              <GlassButton href={bookingHref(product.name)} variant="brand" arrow className="w-full">
                Book a 15-min Call
              </GlassButton>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}

/** One picture of the work: cropped to fill, or a mark kept whole on a light ground. */
function Picture({
  image,
  className,
  width,
  zoom = false,
}: {
  image: ProductImage;
  className?: string;
  /** Which of the optimiser's widths to ask for. */
  width: 384 | 828;
  zoom?: boolean;
}) {
  return (
    <span
      className={cn(
        "relative block overflow-hidden rounded-[0.6rem] border border-white/10",
        image.contain ? "grid place-items-center bg-[#f4f1ea] p-[12%]" : "bg-[var(--surface-raised)]",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a picture at card size, through the image optimiser */}
      <img
        src={posterSrc(image.src, width)}
        alt={image.alt}
        loading="lazy"
        className={cn(
          image.contain ? "max-h-full max-w-full object-contain" : "absolute inset-0 size-full object-cover",
          zoom && "transition-transform duration-700 ease-out group-hover/card:scale-[1.04]",
        )}
      />
    </span>
  );
}
