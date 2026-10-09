"use client";

import { useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Play, Plus } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore, type PointerEvent } from "react";

import { DivisionName } from "@/components/genesis/division-lockup";
import { GlassIcon } from "@/components/genesis/glass-icon";
import { pagerFor } from "@/components/genesis/overlay";
import { RailProgress } from "@/components/genesis/rail-progress";
import { useAutoAdvance } from "@/components/genesis/use-auto-advance";
import { inr } from "@/lib/money";
import { bookingHref, homePlans, verticalCard } from "@/lib/pricing";
import { products } from "@/lib/products";
import { productImages } from "@/lib/product-images";
import { posterSrc } from "@/lib/poster";
import { aiPlans, aiVideoTiers } from "@/lib/verticals/ai-labs";
import { designProducts } from "@/lib/verticals/brand-design";
import { campaignPricing } from "@/lib/verticals/influence";
import { studiosPlans } from "@/lib/verticals/studios";
import type { VerticalKey } from "@/lib/verticals/types";
import { cn } from "@/lib/utils";

import { OfferDialog } from "./offer-dialog";
import { VideoTiers } from "./offer/blocks";
import { PlanDetails } from "./offer/parts";
import { ONE_TIME_GRADIENT, PLANS_GRADIENT, tierGlow, tierGradient } from "./offer/tier-colors";

export type Mode = "membership" | "one-time";

/** "₹94,999", the price lists' "/-" dropped. */
const rupees = (value: number) => inr(value).replace(/\/-$/, "");

export type Tile = {
  key: string;
  vertical: VerticalKey;
  kind: Mode;
  /** The offer under the division's name: "AI Content Studio", "AI Video Pack". */
  name: string;
  /** "from" before the price, for a membership's entry plan. */
  from?: boolean;
  price: string;
  /** Only where the figure needs words to mean anything: "agency commission + creator fees". */
  unit?: string;
  /** What it does for the buyer: the problem it takes away. */
  benefit: string;
  /** "What's included": this offer's own section on /pricing. */
  details: string;
  /** The "Talk to Genesis" card that ends every row: a call about a brief that is not listed. */
  custom?: { href: string; anyDivision?: boolean };
  /** Pay-per-project only: what the pop-up lists in full, and how it is bought. */
  product?: { name: string; includes: readonly string[]; note?: string; inPerson?: boolean; buyable: boolean };
};

/*
  ONE CARD PER DIVISION (Genesis, 30 Sep 2026): its membership, the entry
  price as "from", and what it does for the buyer. No "per month" under the
  price (Genesis, 30 Sep 2026); the Membership tag on the card says it.
*/
const MEMBERSHIPS: Tile[] = [
  {
    key: "ai-labs",
    vertical: "ai-labs",
    kind: "membership",
    name: homePlans["ai-labs"].product,
    from: true,
    price: rupees(aiPlans.plans[0].rate - 1),
    benefit: "Always-on AI content without booking a shoot: avatars, AI video and campaign creatives, every month.",
    details: "/pricing?v=ai-labs#plans",
  },
  {
    key: "studios",
    vertical: "studios",
    kind: "membership",
    name: homePlans.studios.product,
    from: true,
    price: rupees(studiosPlans.plans[0].rate - 1),
    benefit: "A production team on call: we plan, shoot and edit your content every month, so you never hire for it.",
    details: "/pricing?v=studios#plans",
  },
  {
    key: "brand-design",
    vertical: "brand-design",
    kind: "membership",
    name: homePlans["brand-design"].product,
    price: rupees(designProducts.desk.rate - 1),
    benefit: "A design team on tap for everyday creatives, ads and decks, with no quote and no wait for every request.",
    details: "/pricing?v=brand-design#plans",
  },
  {
    key: "influence",
    vertical: "influence",
    kind: "membership",
    name: homePlans.influence.product,
    price: campaignPricing.figure,
    unit: `${campaignPricing.figureLabel.toLowerCase()} ${campaignPricing.figureSub}`,
    benefit: "We find, brief and manage the right creators, then report on what worked. You only approve.",
    details: "/pricing?v=influence#plans",
  },
];

/*
  A quoted price as figure + line: "15% Agency Commission + Creator Fees" is
  "15%" over "agency commission + creator fees". Set at price size, the
  whole sentence filled the card.
*/
function quoted(label = "On request"): { price: string; unit?: string; from?: boolean } {
  /* "From ₹1,49,999/- + GST" (Brand Build): "from", the figure, and "plus GST". */
  const from = label.match(/^From\s+(₹[\d,]+)(?:\/-)?\s*(\+\s*GST)?/i);
  if (from) return { from: true, price: from[1], unit: from[2] ? "plus GST" : undefined };
  const match = label.match(/^(\S*\d\S*)\s+(.+)$/);
  return match ? { price: match[1], unit: match[2].toLowerCase() } : { price: label };
}

/* Every one-time product, priced or quoted. */
const ONE_TIME: Tile[] = products.map((product) => ({
  key: `${product.vertical}.${product.name}`,
  vertical: product.vertical,
  kind: "one-time",
  name: product.name,
  ...(product.price !== undefined ? { price: rupees(product.price) } : quoted(product.priceLabel)),
  benefit: product.pitch,
  details: "/pricing#one-time",
  product: {
    name: product.name,
    includes: product.includes,
    note: product.note,
    inPerson: product.inPerson,
    buyable: product.cta === "buy" && product.price !== undefined,
  },
}));

/* A touch screen — no hover — where the card in view lights instead. */
const TOUCH = "(hover: none)";
const subscribeTouch = (onChange: () => void) => {
  const query = window.matchMedia(TOUCH);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useTouch = () =>
  useSyncExternalStore(
    subscribeTouch,
    () => window.matchMedia(TOUCH).matches,
    () => false,
  );

/*
  EACH DIVISION'S SUBSCRIPTION PLANS, for its own bar's "Subscriptions" side:
  AI Lab's and Studios' three plans each; Brand & Design's desk and
  Influence's managed campaigns, which are one offer each.
*/
const planTile = (vertical: VerticalKey, plan: { name: string; rate: number; tagline?: string; description: string }): Tile => ({
  key: `${vertical}.plan.${plan.name}`,
  vertical,
  kind: "membership",
  name: `${homePlans[vertical].product} · ${plan.name}`,
  price: rupees(plan.rate - 1),
  benefit: plan.description,
  details: `/pricing?v=${vertical}#plans`,
});
const PLANS: Record<VerticalKey, Tile[]> = {
  "ai-labs": aiPlans.plans.map((plan) => planTile("ai-labs", plan)),
  studios: studiosPlans.plans.map((plan) => planTile("studios", plan)),
  "brand-design": MEMBERSHIPS.filter((tile) => tile.vertical === "brand-design"),
  influence: MEMBERSHIPS.filter((tile) => tile.vertical === "influence"),
};

/*
  THE LAST CARD OF EVERY ROW: TALK TO GENESIS (Genesis, 2 Oct 2026: "add one
  more card to each: Talk to Genesis / custom brief"). For work that is not
  on the list, or a mix of it. It books the 15-minute call, the division
  named in the message, rather than opening a pop-up.
*/
function customTile(vertical: VerticalKey | undefined, kind: Mode): Tile {
  const division = vertical ? verticalCard(vertical).name.replace(/^Genesis\s+/, "") : undefined;
  return {
    key: `${vertical ?? "any"}.${kind}.custom`,
    vertical: vertical ?? "ai-labs",
    kind,
    name: "Custom brief",
    price: "Talk to Genesis",
    benefit: division
      ? `Need ${division} work that isn't listed, or a mix of it? Tell us the brief and we'll scope it with you on a 15-minute call.`
      : "Need something that isn't listed, or work across divisions? Tell us the brief and we'll scope it with you on a 15-minute call.",
    details: "",
    custom: {
      href: bookingHref(division ? `a custom ${division} brief` : "a custom brief"),
      anyDivision: !vertical,
    },
  };
}

/** Which card of a row is open in the pop-up, and the arrows through the rest. */
function useOpenOffer(tiles: Tile[]) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const open = tiles.find((tile) => tile.key === openKey) ?? null;
  /*
    THE ARROWS STEP BETWEEN DIFFERENT POP-UPS. Every plan of a division opens
    the same window (all its plans side by side), so a division's plans count
    once: Starter → Growth would otherwise show the same thing twice.
  */
  const sameWindow = (tile: Tile) => (tile.kind === "membership" ? `plans:${tile.vertical}` : tile.key);
  const windows = tiles.filter(
    (tile, i) => !tile.custom && tiles.findIndex((other) => sameWindow(other) === sameWindow(tile)) === i,
  );
  const index = open ? windows.findIndex((tile) => sameWindow(tile) === sameWindow(open)) : -1;
  const pager = pagerFor(windows, index, (tile) => setOpenKey(tile.key), (tile) =>
    tile.kind === "membership" ? homePlans[tile.vertical].product : tile.name,
  );
  const dialog = <OfferDialog tile={open} onClose={() => setOpenKey(null)} pager={pager} />;
  return { openOffer: (key: string) => setOpenKey(key), dialog };
}

/**
 * A DIVISION'S PAY-PER-PROJECT PRODUCTS AS POP-UPS, for the product cards on
 * /pricing and the division pages (Genesis, 2 Oct 2026: "PPP on each vertical
 * page should also open the pop-up window, make it universal"). The same
 * window as the homepage's cards, with its arrows through the division's
 * other products.
 */
export function useProductOffers(vertical: VerticalKey) {
  const { openOffer, dialog } = useOpenOffer(ONE_TIME.filter((tile) => tile.vertical === vertical));
  return { openProduct: (name: string) => openOffer(`${vertical}.${name}`), dialog };
}

/*
  The scrolling row and its cards, shared by the homepage slider and each
  division's bar. ON A PHONE ONE CARD FILLS THE ROW (Genesis, 4 Oct 2026:
  "cards a little bigger … fit on the phone screen"): the row reaches out to
  its box's edges and each card takes 92% of it, the next one peeking in.
*/
const RAIL =
  "-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-3 pt-2 [scrollbar-width:none] max-sm:-mx-5 max-sm:scroll-px-5 max-sm:px-5 [&::-webkit-scrollbar]:hidden";
const ITEM = "flex w-[16.5rem] shrink-0 snap-start [perspective:900px] max-sm:w-[92%] max-sm:snap-center";

/* The homepage's division order (Genesis, 2 Oct 2026), so the slider reads like the page. */
const DIVISION_ORDER: VerticalKey[] = ["influence", "ai-labs", "studios", "brand-design"];
const byDivision = (tiles: Tile[]) =>
  [...tiles].sort((a, b) => DIVISION_ORDER.indexOf(a.vertical) - DIVISION_ORDER.indexOf(b.vertical));
const MEMBERSHIPS_IN_ORDER = byDivision(MEMBERSHIPS);
const ONE_TIME_IN_ORDER = byDivision(ONE_TIME);

const OPTIONS: { value: Mode; label: string; gradient: string }[] = [
  /* Pay-per-project first, and chosen first (Genesis, 2 Oct 2026): the easiest way in. */
  { value: "one-time", label: "Pay-per-project", gradient: ONE_TIME_GRADIENT },
  { value: "membership", label: "Subscriptions", gradient: PLANS_GRADIENT },
];

/**
 * WHAT GENESIS SELLS, AT A GLANCE, on the homepage's memberships block
 * (Genesis, 30 Sep 2026). A switch between memberships (one card per
 * division) and one-time products (one card each).
 *
 * THE CARDS ANSWER BACK ("add hover and crazy effect … and some mobile
 * friendly interaction"):
 *  - On a laptop, a hovered card tilts toward the pointer, a light follows
 *    it across the face, and the gradient edge starts to run around it.
 *  - On a phone, the row snaps card by card; the card in the middle of the
 *    screen lights up with the same running edge, a pressed card gives under
 *    the thumb, and a progress bar with "2 / 15" says where you are.
 *  - Under Reduce Motion nothing tilts or runs; the edge simply lights.
 */
export function OfferSlider() {
  const [mode, setMode] = useState<Mode>("one-time");
  const [active, setActive] = useState(0);
  const rail = useRef<HTMLUListElement>(null);
  const touch = useTouch();
  const tiles = [...(mode === "membership" ? MEMBERSHIPS_IN_ORDER : ONE_TIME_IN_ORDER), customTile(undefined, mode)];
  const { openOffer, dialog } = useOpenOffer(tiles);

  const step = (direction: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    const card = el.querySelector("li");
    const by = card ? card.getBoundingClientRect().width + 12 : el.clientWidth * 0.8;
    el.scrollBy({ left: direction * by * 2, behavior: "smooth" });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ModeToggle
          mode={mode}
          onChange={(value) => {
            setMode(value);
            rail.current?.scrollTo({ left: 0 });
          }}
        />
        <div className="hidden gap-2 sm:flex">
          {([-1, 1] as const).map((direction) => (
            <button
              key={direction}
              type="button"
              onClick={() => step(direction)}
              aria-label={direction === 1 ? "Next" : "Previous"}
              className="grid size-9 place-items-center rounded-full border border-[var(--glass-border)] text-bone transition-[background-color,transform] hover:bg-[var(--hover-wash)] active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              {direction === 1 ? <ChevronRight className="size-4" aria-hidden /> : <ChevronLeft className="size-4" aria-hidden />}
            </button>
          ))}
        </div>
      </div>

      <ul
        ref={rail}
        data-lenis-prevent-horizontal
        aria-label={mode === "membership" ? "Subscriptions" : "Pay-per-project"}
        className={cn("mt-4", RAIL)}
      >
        {tiles.map((tile, index) => (
          <li key={tile.key} className={cn(ITEM, "sm:w-[17.5rem]")}>
            <OfferCard tile={tile} tier={index} lit={touch && index === active} onOpen={() => openOffer(tile.key)} />
          </li>
        ))}
      </ul>

      {/* Where you are in the row; it also tells the cards which one to light on a touch screen. */}
      <RailProgress rail={rail} onActive={setActive} className="mt-2" />
      {dialog}
    </div>
  );
}

/** Subscriptions | Pay-per-project, in each side's own gradient. */
function ModeToggle({ mode, onChange, track }: { mode: Mode; onChange: (mode: Mode) => void; track?: string }) {
  return (
    <div
      role="radiogroup"
      aria-label="Show subscriptions or pay-per-project work"
      className="flex w-fit gap-1 rounded-full border border-[var(--glass-border)] bg-[var(--hover-wash)] p-1"
    >
      {OPTIONS.map((option) => {
        const selected = option.value === mode;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            data-track={`${track ?? "home-offer-slider"}:${option.value}`}
            onClick={() => onChange(option.value)}
            className={cn(
              "min-h-9 whitespace-nowrap rounded-full px-3.5 text-[0.8125rem] font-medium transition-[color,transform] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:px-5",
              selected ? "text-white" : "text-ash hover:text-bone",
            )}
            style={selected ? { background: option.gradient } : undefined}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * ONE DIVISION'S OFFERS, inside its bar on the homepage (Genesis, 2 Oct
 * 2026: "add each particular vertical inside this box", then "add a toggle
 * bar on each section: Pay-per-project and Subscriptions"). Subscriptions
 * shows the division's plans; Pay-per-project its single products. The same
 * cards as the slider: the same hover, the same lit card on a phone, the
 * same progress bar.
 */
export function DivisionOffers({
  vertical,
  className,
  grid = false,
}: {
  vertical: VerticalKey;
  className?: string;
  /** Two cards in view at a time, sliding (the homepage plan box's left column, Genesis, 4 Oct 2026). */
  grid?: boolean;
}) {
  const rail = useRef<HTMLUListElement>(null);
  const touch = useTouch();
  const [mode, setMode] = useState<Mode>("one-time");
  const [active, setActive] = useState(0);
  const plans = PLANS[vertical];
  /* Influence's one-time "campaign management" is its subscription card again — left out. */
  const projects = ONE_TIME.filter(
    (tile) => tile.vertical === vertical && !plans.some((plan) => plan.price === tile.price),
  );
  const tiles = [...(mode === "membership" ? plans : projects), customTile(vertical, mode)];
  const { openOffer, dialog } = useOpenOffer(tiles);
  useAutoAdvance(rail);

  return (
    <div className={className}>
      {projects.length > 0 && (
        <ModeToggle
          mode={mode}
          track={`division-offers:${vertical}`}
          onChange={(value) => {
            setMode(value);
            rail.current?.scrollTo({ left: 0 });
          }}
        />
      )}
      <ul
        ref={rail}
        data-lenis-prevent-horizontal
        aria-label={`${verticalCard(vertical).short}: ${mode === "membership" ? "subscriptions" : "pay-per-project work"}`}
        className={cn("mt-3", RAIL)}
      >
        {tiles.map((tile, index) => (
          <li key={tile.key} className={grid ? "flex w-[calc((100%-0.75rem)/2)] shrink-0 snap-start [perspective:900px] max-sm:w-full" : ITEM}>
            <OfferCard tile={tile} tier={index} lit={touch && index === active} onOpen={() => openOffer(tile.key)} inBox />
          </li>
        ))}
      </ul>
      {/* Arrows beside the progress line (Genesis, 4 Oct 2026: "add arrow buttons here"). */}
      <div className="mt-2 flex items-center gap-3">
        <div className="flex shrink-0 gap-1.5">
          {([-1, 1] as const).map((dir) => (
            <button
              key={dir}
              type="button"
              aria-label={dir < 0 ? "Previous offers" : "More offers"}
              onClick={() => {
                const el = rail.current;
                const card = el?.querySelector("li");
                if (!el || !card) return;
                el.scrollBy({ left: dir * (card.getBoundingClientRect().width + 12), behavior: "smooth" });
              }}
              className="grid size-8 place-items-center rounded-full border border-white/20 text-bone transition-colors hover:border-white/40 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              {dir < 0 ? <ChevronLeft className="size-4" aria-hidden /> : <ChevronRight className="size-4" aria-hidden />}
            </button>
          ))}
        </div>
        <RailProgress rail={rail} onActive={setActive} className="min-w-0 flex-1" />
      </div>
      {/* Under the subscriptions, what Standard and Advanced videos are (Genesis, 5 Oct 2026). */}
      {mode === "membership" && vertical === "ai-labs" && (
        <PlanDetails id="division-video-types" title={aiVideoTiers.heading} className="mt-3">
          <VideoTiers data={aiVideoTiers} bare />
        </PlanDetails>
      )}
      {dialog}
    </div>
  );
}

/**
 * `inBox`: a card inside a division's own plan box on the homepage (Genesis,
 * 4 Oct 2026). The box already names the division, so the card does not;
 * the product's name leads, larger, and its line reads in full.
 */
function OfferCard({
  tile,
  tier,
  lit,
  onOpen,
  inBox = false,
}: {
  tile: Tile;
  tier: number;
  lit: boolean;
  onOpen: () => void;
  inBox?: boolean;
}) {
  const reduce = useReducedMotion();
  const face = useRef<HTMLElement>(null);
  const [hovered, setHovered] = useState(false);
  const gradient = tierGradient(tier);
  const card = verticalCard(tile.vertical);
  /* The custom card books a call; every other card opens its pop-up. */
  const open = tile.custom ? () => window.open(tile.custom!.href, "_blank", "noopener") : onOpen;

  /* Pointer position as CSS variables — the tilt and the light read them, without a re-render per frame. */
  const onMove = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse" || !face.current) return;
    const box = face.current.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    face.current.style.setProperty("--mx", `${x * 100}%`);
    face.current.style.setProperty("--my", `${y * 100}%`);
    if (!reduce) {
      face.current.style.setProperty("--rx", `${((0.5 - y) * 10).toFixed(2)}deg`);
      face.current.style.setProperty("--ry", `${((x - 0.5) * 12).toFixed(2)}deg`);
    }
  };
  const onLeave = () => {
    setHovered(false);
    face.current?.style.setProperty("--rx", "0deg");
    face.current?.style.setProperty("--ry", "0deg");
  };

  /* The running edge: on hover with a mouse, or as the card in view on a phone. */
  const running = hovered || lit;

  return (
    <article
      ref={face}
      onPointerEnter={(event) => event.pointerType === "mouse" && setHovered(true)}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      /* The whole card opens the offer; the button below is its keyboard and screen-reader way in. */
      onClick={open}
      className={cn(
        "group relative flex w-full cursor-pointer rounded-card p-px transition-[transform,box-shadow] duration-300 ease-out active:scale-[0.98]",
      )}
      style={{
        transform: hovered && !reduce ? "rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateY(-4px)" : undefined,
        boxShadow: running ? `0 22px 50px -22px ${tierGlow(tier)}, 0 0 0 1px rgb(255 255 255 / 0.04)` : undefined,
        background: gradient,
      }}
    >
      {/* The running edge, over the static one, while it is running. */}
      <span
        aria-hidden
        className={cn(
          "offer-edge pointer-events-none absolute inset-0 rounded-card transition-opacity duration-500",
          running ? "opacity-100" : "opacity-0",
        )}
      />

      {/* SHORTER (Genesis, 2 Oct 2026: "make these cards a little shorter"): tighter padding and gaps, and the custom card's icon beside its line rather than above it. */}
      <div className="relative flex w-full flex-col overflow-hidden rounded-card bg-ink p-4">
        {/* The tier's glow in the corner, brighter while running. */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute -right-16 -top-20 size-48 rounded-full blur-3xl transition-opacity duration-500",
            running ? "opacity-100" : "opacity-50",
          )}
          style={{ background: tierGlow(tier) }}
        />
        {/* The light that follows the pointer. */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 transition-opacity duration-300",
            hovered ? "opacity-100" : "opacity-0",
          )}
          style={{
            background: "radial-gradient(260px circle at var(--mx, 50%) var(--my, 0%), rgb(255 255 255 / 0.09), transparent 60%)",
          }}
        />

        <CardMedia tile={tile} />
        {/* In a box the switch above already says the kind; a card with pictures drops the tag to save the room (Genesis, 9 Oct 2026: fit one screen). */}
        {!(inBox && !tile.custom) && (
        <div className={cn("relative flex items-center gap-2", inBox ? "justify-end" : "justify-between")}>
          {inBox ? null : tile.custom?.anyDivision ? (
            <span className="bg-clip-text font-display text-lead leading-none text-transparent" style={{ backgroundImage: PLANS_GRADIENT }}>
              Any division
            </span>
          ) : (
            <DivisionName name={card.short} height={18} className="self-start" />
          )}
          <span
            className="shrink-0 whitespace-nowrap rounded-full border border-[var(--glass-border)] px-2 py-0.5 text-[0.6875rem] uppercase tracking-[0.1em] text-ash"
          >
            {tile.custom ? "Custom" : tile.kind === "membership" ? "Subscription" : "Pay-per-project"}
          </span>
        </div>
        )}

        <h4
          className={cn(
            "relative line-clamp-2 bg-clip-text font-display leading-tight text-transparent",
            inBox ? (tile.custom ? "mt-1 min-h-[2.3em] text-h3" : "text-[1.5rem]") : "mt-2 min-h-[2.5em] text-lead",
          )}
          style={{ backgroundImage: gradient }}
        >
          {tile.name}
        </h4>

        <p className={cn("relative mt-2 flex flex-wrap gap-x-1.5", tile.custom ? "items-center" : "items-baseline")}>
          {/* The custom card's mark: a conversation, in the Genesis glass set. */}
          {tile.custom && <GlassIcon name="chat" className="size-8 shrink-0" />}
          {tile.from && <span className="text-[0.75rem] text-ash">from</span>}
          <span className={cn("font-display leading-none text-bone", tile.custom ? "text-[1.5rem]" : "text-h3")}>
            {/* The "%" in the body face: the display face's own falls back to a heavy glyph. */}
            {tile.price.endsWith("%") ? (
              <>
                {tile.price.slice(0, -1)}
                <span className="font-sans text-lead font-light">%</span>
              </>
            ) : (
              tile.price
            )}
          </span>
          {tile.unit && <span className="w-full pt-1 text-[0.75rem] text-ash">{tile.unit}</span>}
        </p>

        <p className={cn("relative mt-3 border-t border-[var(--glass-border)] pt-3 text-pretty text-[0.8125rem] leading-snug text-bone", inBox ? "line-clamp-2" : "line-clamp-3")}>
          {tile.benefit}
        </p>

        {/*
          "＋ What's included" opens the offer in the pop-up (OfferDialog), with
          everything it includes. It turns into an arrow on hover.
        */}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            open();
          }}
          data-track={`home-offer:${tile.key}:included`}
          className="group/inc relative mt-auto inline-flex w-fit items-center gap-2 rounded-full pt-3 text-[0.8125rem] text-bone transition-colors hover:text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <span
            className="relative grid size-6 shrink-0 place-items-center overflow-hidden rounded-full text-white transition-transform duration-300 group-hover/inc:scale-110"
            style={{ background: gradient }}
          >
            <Plus
              className="size-3.5 transition-all duration-300 group-hover:-translate-y-5 group-hover:opacity-0"
              aria-hidden
            />
            <ArrowRight
              className="absolute size-3.5 translate-y-5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
              aria-hidden
            />
          </span>
          {tile.custom ? "Book a 15-min Call" : "What\u2019s included"}
        </button>
      </div>
    </article>
  );
}

/*
  THE CARD OPENS ON ITS PICTURES (Genesis, 9 Oct 2026: "one photo bigger and
  visible, the others small, with an auto slider; the image section above
  everything, then the name, price and description"). Up to four of the
  product's own images — no past work here, that is the pop-up's — the big
  one moving on every few seconds and holding while the pointer is
  over the card; a thumbnail picks one. A subscription card shows its
  division's first product. The card itself still opens the pop-up.
*/
const MEDIA_MS = 3200;

function CardMedia({ tile }: { tile: Tile }) {
  const pool = tile.custom
    ? []
    : tile.product
      ? productImages[tile.product.name] ?? []
      : products.filter((product) => product.vertical === tile.vertical).flatMap((product) => productImages[product.name] ?? []);
  /* Product pictures only on the cards (Genesis, 9 Oct 2026); the past work and videos live in the pop-up. */
  const items = pool.filter((image) => !image.work).slice(0, 4);
  const [index, setIndex] = useState(0);
  const [hold, setHold] = useState(false);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (items.length < 2 || hold || reduce) return;
    const timer = window.setInterval(() => setIndex((at) => (at + 1) % items.length), MEDIA_MS);
    return () => window.clearInterval(timer);
  }, [items.length, hold, reduce, index]);
  if (items.length === 0) return null;
  const current = items[index % items.length];

  return (
    <div
      className="relative mb-2.5"
      onPointerEnter={(event) => event.pointerType === "mouse" && setHold(true)}
      onPointerLeave={(event) => event.pointerType === "mouse" && setHold(false)}
    >
      <div className="relative aspect-[2/1] overflow-hidden rounded-[0.85rem] border border-white/10 bg-black sm:aspect-[16/9]">
        {items.map((item, i) => (
          // eslint-disable-next-line @next/next/no-img-element -- a card picture, through the image optimiser
          <img
            key={item.src}
            src={posterSrc(item.src, 828)}
            alt={i === index % items.length ? item.alt : ""}
            loading={i === 0 ? "eager" : "lazy"}
            className={cn(
              "absolute inset-0 size-full object-cover transition-opacity duration-700",
              i === index % items.length ? "opacity-100" : "opacity-0",
            )}
          />
        ))}
        {current.clip && (
          <span aria-hidden className="absolute inset-0 grid place-items-center">
            <span className="grid size-10 place-items-center rounded-full bg-white/85 text-[#141216] shadow-lg">
              <Play className="ml-0.5 size-4 fill-current" />
            </span>
          </span>
        )}
        <span className={cn("absolute left-2 top-2 rounded-full px-2 py-0.5 text-[0.625rem] uppercase tracking-[0.1em]", current.work ? "bg-brand text-on-brand" : "bg-black/55 text-white/85")}>
          {current.work ? "Our work" : "What you get"}
        </span>
      </div>
      {items.length > 1 && (
        <ul className="mt-1.5 flex gap-1.5">
          {items.map((item, i) => (
            <li key={item.src}>
              <button
                type="button"
                aria-label={`Show ${item.alt}`}
                aria-current={i === index % items.length}
                onClick={(event) => {
                  event.stopPropagation();
                  setIndex(i);
                }}
                className={cn(
                  "relative block size-8 overflow-hidden rounded-[0.45rem] border transition-[border-color,opacity] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                  i === index % items.length ? "border-brand opacity-100" : "border-white/12 opacity-60 hover:opacity-100",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- a thumbnail, through the image optimiser */}
                <img src={posterSrc(item.src, 384)} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
                {item.clip && (
                  <span aria-hidden className="absolute inset-0 grid place-items-center bg-black/30">
                    <Play className="size-3 fill-white text-white" />
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
