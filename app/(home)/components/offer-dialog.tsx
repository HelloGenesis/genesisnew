"use client";

import { ArrowUpRight, Check, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { DivisionName } from "@/components/genesis/division-lockup";
import { GlassButton } from "@/components/genesis/glass-button";
import { GlassIcon, type GlassIconName } from "@/components/genesis/glass-icon";
import { NoTransferPromise, PaymentOptions } from "@/components/genesis/payment-options";
import { WORD_GRADIENT } from "@/components/genesis/word-cycler";
import { Overlay, type OverlayPager } from "@/components/genesis/overlay";
import { RailProgress } from "@/components/genesis/rail-progress";
import { caseStudyList, leadClip } from "@/lib/case-studies";
import { caseStudyPath } from "@/lib/case-study-pages";
import type { LegalSection } from "@/lib/legal";
import { refunds, terms } from "@/lib/legal-commerce";
import { mediaUrl } from "@/lib/media-url";
import { inr } from "@/lib/money";
import { posterSrc } from "@/lib/poster";
import { avatarShowcase, productImages, type ProductImage } from "@/lib/product-images";
import { type OneTimeProduct, products } from "@/lib/products";
import { bookingHref, enquiryHref, homePlans, verticalCard } from "@/lib/pricing";
import { aiPlans, aiTurnaround, aiVideoTiers } from "@/lib/verticals/ai-labs";
import { designTurnaround } from "@/lib/verticals/brand-design";
import { campaignPricing } from "@/lib/verticals/influence";
import { studiosPlans, studiosTurnaround } from "@/lib/verticals/studios";
import type { VerticalKey } from "@/lib/verticals/types";
import { cn } from "@/lib/utils";
import { reelPoster } from "@/lib/work";

import { TurnaroundStrip, VideoTiers } from "./offer/blocks";
import { BuySteps } from "./offer/buy-steps";
import { ExtrasPicker } from "./offer/extras-picker";
import { NoteExplainer } from "./offer/note-explainer";
import { BuyBar, PopupNav, scrollToSection } from "./offer/popup-nav";
import { PlanDetails } from "./offer/parts";
import { PlanGrid, PlanTerms, ShootChip } from "./offer/plan-grid";
import { tierGradient } from "./offer/tier-colors";
import { aiTierDetail, DEFINES_VIDEO, VideoTierLine, withDefinitions } from "./offer/video-tier-line";
import type { Tile } from "./offer-slider";
import { ProductCards } from "./verticals/design-products";

/** Each division's typical turnaround, as /pricing shows it. Influence runs to a campaign's own plan. */
const TURNAROUND: Partial<Record<VerticalKey, typeof aiTurnaround>> = {
  "ai-labs": aiTurnaround,
  studios: studiosTurnaround,
  "brand-design": designTurnaround,
};

/** The case-study tag each division's work carries. */
const STUDY_TAG: Record<VerticalKey, string> = {
  "ai-labs": "AI Lab",
  studios: "Studios",
  "brand-design": "Brand & Design",
  influence: "Influence",
};

/** A division's case studies with a picture to show: the work behind the offer. */
function studiesFor(vertical: VerticalKey) {
  return caseStudyList
    .filter((study) => study.vertical === STUDY_TAG[vertical])
    .map((study) => {
      const clip = leadClip(study);
      const poster = study.heroPoster ?? (clip === undefined ? undefined : mediaUrl(reelPoster(clip)));
      return { study, poster, href: caseStudyPath(study.copy) };
    })
    .filter((entry) => entry.poster)
    .slice(0, 6);
}

/** The Terms and Refund sections that govern this kind of offer, quoted as the policies word them. */
/** The pay-per-project product behind a tile, with everything Genesis's sheet gives it. */
function productFor(tile: Tile): OneTimeProduct | undefined {
  return tile.product ? products.find((p) => p.vertical === tile.vertical && p.name === tile.product?.name) : undefined;
}

function termsFor(tile: Tile): LegalSection[] {
  const topic = tile.kind === "membership" ? "Subscriptions" : "Pay-per-project";
  const pick = (sections: LegalSection[], word: string) => sections.filter((section) => section.heading.includes(word));
  const shoots = tile.vertical === "studios" || tile.product?.inPerson;
  /* The product's own terms first (Genesis's sheet, 3 Oct 2026), then the policies'. */
  const own = productFor(tile)?.terms;
  return [
    ...(own?.length ? [{ heading: `${tile.name}: terms`, paragraphs: [...own] }] : []),
    ...pick(terms.sections, topic),
    /* AI work carries the AI section: consent, the approval workflow and what is chargeable. */
    ...(tile.vertical === "ai-labs" ? pick(terms.sections, "AI Content") : []),
    ...pick(refunds.sections, topic),
    ...(shoots ? [...pick(terms.sections, "Content Shoots"), ...pick(refunds.sections, "Content Shoots")] : []),
  ];
}

/**
 * AN OFFER, OPENED FROM THE HOMEPAGE (Genesis, 2 Oct 2026: "when clicked on
 * each plan from the homepage, show a pop-up window with all the information
 * … images … case studies of the brands … all the terms … an arrow button to
 * the others in the section"; "when clicked on Subscription, a pop-up with
 * the three pricing plans").
 *
 *  - A SUBSCRIPTION opens that division's plans, exactly as /pricing shows
 *    them: AI Lab and Studios their three plans with the billing switch and
 *    "View what's included"; Brand & Design its desk; Influence its campaign
 *    terms.
 *  - A PAY-PER-PROJECT product opens in full: the price, what it does, every
 *    line it includes, the shoot rule where one applies, and Buy Now / Add to
 *    Cart (or a call where the price depends on the brief).
 *  - Both carry the division's case studies, with pictures, and the Terms and
 *    Refund sections that apply, quoted.
 *  - The arrows step through the other cards of the same row.
 */
export function OfferDialog({ tile, onClose, pager }: { tile: Tile | null; onClose: () => void; pager?: OverlayPager }) {
  return (
    <Overlay open={tile !== null} label={tile ? `${tile.name}: details` : "Offer"} onClose={onClose} className="max-w-6xl" pager={pager}>
      {tile && <OfferDetail key={tile.key} tile={tile} />}
    </Overlay>
  );
}

function OfferDetail({ tile }: { tile: Tile }) {
  const card = verticalCard(tile.vertical);
  const division = card.name.replace(/^Genesis\s+/, "");
  /* The title wears the site's full sweep, violet to amber (Genesis, 3 Oct 2026). */
  const gradient = WORD_GRADIENT;
  const studies = studiesFor(tile.vertical);
  const sections = termsFor(tile);
  const full = productFor(tile);
  const subscription = tile.kind === "membership";
  const gallery = galleryFor(tile);
  /* The extras chosen in the price box: the price there and in the buy bar follow them. */
  const [extras, setExtras] = useState(0);
  const base = full?.price;
  const navSections = [
    { key: "overview", label: "Overview" },
    subscription ? { key: "plans", label: "Plans" } : { key: "included", label: "What’s included" },
    ...(subscription ? [] : [{ key: "customise", label: full?.cta === "call" ? "Price" : "Price & extras" }]),
    { key: "how", label: "How it works" },
    ...(studies.length > 0 ? [{ key: "work", label: "Work" }] : []),
    { key: "details", label: "Details & terms" },
  ];

  return (
    <div className="px-5 pb-0 pt-0 sm:px-8">
      <PopupNav sections={navSections} />
      {/*
        THE HEADER: whose it is, what it is — and, beside it, a gallery of the
        work (Genesis, 3 Oct 2026: "add a photo gallery section slider here
        … all across"). A product shows its own pictures; a subscription
        shows its division's.
      */}
      <div data-section="overview" className={cn(gallery.length > 0 && "grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr]")}>
      <div>
      <div className="flex flex-wrap items-center gap-3">
        <DivisionName name={card.short} height={22} />
        <span className="rounded-full border border-[var(--glass-border)] px-2.5 py-0.5 text-[0.6875rem] uppercase tracking-[0.12em] text-ash">
          {subscription ? "Subscription" : "Pay-per-project"}
        </span>
      </div>
      <h2
        /*
          THE POP-UP'S HERO HEADER (Genesis, 2 Oct 2026). Hero-sized, and
          `w-fit` so the gradient spans the words rather than the window: as a
          full-width block a short name only ever showed its first colour.
        */
        /*
          NOT THE DISPLAY FACE (Genesis, 3 Oct 2026: "looks a little thin"):
          Mont comes in ExtraLight and Heavy only, and ExtraLight in a
          gradient read as a hairline. Codec Pro at its regular weight holds
          the gradient at headline size.
        */
        className="mt-3 w-fit max-w-full text-balance bg-clip-text pe-[0.08em] font-sans text-h2 font-normal leading-[1.05] tracking-[-0.02em] text-transparent sm:text-h1"
        style={{ backgroundImage: gradient }}
      >
        {subscription ? homePlans[tile.vertical].product : tile.name}
      </h2>
      <p className="mt-4 max-w-2xl text-pretty text-body leading-relaxed text-bone sm:text-lead">{tile.benefit}</p>
      {full?.audienceTags?.length ? <AudiencePills tags={full.audienceTags} need={full.audienceNeed} /> : null}
      </div>
      {gallery.length > 0 && <HeroGallery key={tile.key} images={gallery} />}
      </div>

      {subscription ? (
        <div data-section="plans">
          <SubscriptionBody vertical={tile.vertical} />
        </div>
      ) : (
        <ProjectBody tile={tile} division={division} extras={extras} onExtrasChange={setExtras} />
      )}
      {/* The promise, under the offer and its price rather than in the header (Genesis, 3 Oct 2026: "move this below"). */}
      <NoTransferPromise className="mt-8" />

      {/*
        WHAT /PRICING SAYS AROUND THE PLANS, HERE TOO (Genesis, 2 Oct 2026:
        "add these terms wherever necessary on the new pop-up windows"): what
        the division's typical turnaround and the ways to pay. What the AI
        video tiers mean sits with the other dropdowns, near the foot.
      */}
      {/*
        HOW IT WORKS: a product's own four steps where Genesis wrote them
        (the sheet's "Website process"), the homepage's four otherwise.
      */}
      <section data-section="how" className="mt-10 scroll-mt-20">
        <h3 className="mb-4 font-sans text-lead text-bone">How it works</h3>
        {full?.process?.length ? <ProcessSteps steps={full.process} /> : <BuySteps />}
      </section>
      {/* A product shows its turnaround in its own column, beside the price (see ProjectBody). */}
      {subscription && TURNAROUND[tile.vertical] && (
        <section className="mt-10">
          <h3 className="mb-4 font-sans text-lead text-bone">Typical turnaround</h3>
          <TurnaroundStrip data={TURNAROUND[tile.vertical]!} />
        </section>
      )}
      <PaymentOptions className="mt-10" />

      {/* THE WORK BEHIND IT: the division's case studies, with pictures. */}
      {studies.length > 0 && (
        <section data-section="work" className="mt-10" aria-labelledby={`${tile.key}-studies`}>
          <div className="flex items-baseline justify-between gap-3">
            <h3 id={`${tile.key}-studies`} className="font-sans text-lead text-bone">
              {division} work for real brands
            </h3>
            <Link href="/#library" data-page-link className="text-small text-ash hover:text-brand-ink">
              All case studies
            </Link>
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {studies.map(({ study, poster, href }) => {
              const inner = (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- a poster at card size */}
                  <img
                    src={posterSrc(poster, 384)}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span aria-hidden className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 to-transparent" />
                  <span className="absolute inset-x-0 bottom-0 p-3">
                    <span className="block text-small leading-tight text-white">{study.client}</span>
                    {study.campaign && <span className="mt-0.5 block truncate text-[0.75rem] text-white/70">{study.campaign}</span>}
                  </span>
                </>
              );
              const box = "group relative block aspect-[4/5] overflow-hidden rounded-card border border-white/10 bg-ink";
              return (
                <li key={study.slug}>
                  {href ? (
                    <Link href={href} data-page-link className={box}>
                      {inner}
                      <ArrowUpRight className="absolute right-2 top-2 size-4 text-white/80" aria-hidden />
                    </Link>
                  ) : (
                    <div className={box}>{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/*
        THE DROPDOWNS, TOGETHER AT THE FOOT (Genesis, 3 Oct 2026: "move this
        below and align it properly"): what we need from you, the add-ons,
        what the AI video types mean and the terms — one design, one 12px
        gap between each, instead of scattered through the window.
      */}
      <div data-section="details" className="mt-10 [&>details:first-child]:mt-0">
        {/* WHAT GENESIS NEEDS, AND WHAT CAN BE ADDED — Genesis's sheet, 3 Oct 2026. */}
        {full?.requirements?.length ? (
          <PlanDetails title="What we’ll need from you" summary={full.requirementsIntro}>
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {full.requirements.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-small leading-snug text-bone">
                  <span aria-hidden className="mt-[0.45em] size-1.5 shrink-0 rounded-full bg-brand" />
                  {item}
                </li>
              ))}
            </ul>
          </PlanDetails>
        ) : null}
        {full?.addOns?.length ? (
          <PlanDetails title="Add-ons" summary="Add any of these to this project. Prices exclude GST.">
            <ul className="divide-y divide-[var(--glass-border)]">
              {full.addOns.map((item) => {
                /* "Label: ₹4,499/-" or "Label: quoted separately" — the price after the last such colon. */
            const [label, price] = item.split(/:\s+(?=₹|quoted|at actuals|subject|separate|based|TBD)/i);
                return (
                  <li key={item} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-2.5 text-small">
                    <span className="text-bone">{label}</span>
                    {price && <span className="text-ash">{price}</span>}
                  </li>
                );
              })}
            </ul>
          </PlanDetails>
        ) : null}
        {tile.vertical === "ai-labs" && (
          <PlanDetails id={`${tile.key}-video-types`} title={aiVideoTiers.heading}>
            <VideoTiers data={aiVideoTiers} bare />
          </PlanDetails>
        )}
        {sections.length > 0 && (
          <PlanDetails title="Terms, cancellation & refunds">
              <div className="space-y-5 text-small leading-relaxed text-ash">
                {sections.map((section) => (
                  <div key={section.heading}>
                    <p className="text-bone">{section.heading.replace(/^\d+\.\s*/, "")}</p>
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph} className="mt-1.5 text-pretty">
                        {paragraph}
                      </p>
                    ))}
                    {section.bullets && (
                      <ul className="mt-1.5 list-disc space-y-1 pl-5">
                        {section.bullets.map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                    )}
                    {section.after?.map((paragraph) => (
                      <p key={paragraph} className="mt-1.5 text-pretty">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ))}
                <p className="text-[0.75rem] text-faint">
                  Prices exclude GST. In full:{" "}
                  <Link href="/terms" data-page-link className="underline underline-offset-2 hover:text-bone">
                    Terms &amp; Conditions
                  </Link>{" "}
                  and{" "}
                  <Link href="/refund-policy" data-page-link className="underline underline-offset-2 hover:text-bone">
                    Cancellation &amp; Refund Policy
                  </Link>
                  .
                </p>
              </div>
          </PlanDetails>
        )}
      </div>

      {/* THE BUY BAR: what it is, what it comes to, and the way to the price box. */}
      <BuyBar
        name={subscription ? homePlans[tile.vertical].product : tile.name}
        price={
          subscription ? (
            <>
              {tile.from && <span className="text-small text-ash">from </span>}
              {tile.price}
              <span className="text-small text-ash"> {tile.unit ?? "per month"}</span>
            </>
          ) : extras > 0 && base !== undefined ? (
            <>
              {inr(base + extras).replace(/\/-$/, "")}
              <span className="text-small text-ash"> + GST, with your add-ons</span>
            </>
          ) : (
            <>
              {tile.price}
              <span className="text-small text-ash"> {tile.unit ?? "+ GST"}</span>
            </>
          )
        }
        action={subscription ? "Choose a plan" : full?.cta === "call" ? "Book a call" : "Customise & buy"}
        onAction={(from) => scrollToSection(from, subscription ? "plans" : "customise")}
      />
    </div>
  );
}

/** A subscription: the division's plans as /pricing shows them. */
function SubscriptionBody({ vertical }: { vertical: VerticalKey }) {
  if (vertical === "ai-labs" || vertical === "studios") {
    return (
      <div className="mt-8">
        <PlanGrid data={vertical === "ai-labs" ? aiPlans : studiosPlans} vertical={vertical} compact centered />
      </div>
    );
  }
  if (vertical === "brand-design") {
    return (
      <div className="mt-8">
        <ProductCards />
        {/* The desk is a subscription: its terms, as under every plan grid. */}
        <div className="mt-6">
          <PlanTerms />
        </div>
      </div>
    );
  }
  /* Influence: a managed campaign, priced as a commission. */
  return (
    <div className="mt-8">
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex items-center gap-6 rounded-panel border border-brand/40 bg-brand/[0.06] p-6">
          <p className="font-display text-[3.5rem] font-normal leading-none tracking-tight text-brand-ink">
            {campaignPricing.figure.replace("%", "")}
            <span className="font-sans text-h3 font-light">%</span>
          </p>
          <span aria-hidden className="h-14 w-px bg-brand/40" />
          <p>
            <span className="block text-lead text-bone">{campaignPricing.figureLabel}</span>
            <span className="mt-1 block text-small text-ash">{campaignPricing.figureSub}</span>
          </p>
        </div>
        <div className="glass-card rounded-panel p-6">
          <p className="micro-label !text-brand-ink">{campaignPricing.includesLabel}</p>
          <p className="mt-2 text-pretty text-body leading-relaxed text-bone">{campaignPricing.includes}</p>
        </div>
      </div>
      <p className="mt-3 text-small text-faint">{campaignPricing.example}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <GlassButton href={enquiryHref("an influencer campaign")} variant="brand" arrow>
          {campaignPricing.cta}
        </GlassButton>
        <GlassButton href={bookingHref("Genesis Influence")} variant="glass" arrow>
          Book a 15-min Call
        </GlassButton>
      </div>
    </div>
  );
}

/** A pay-per-project product, in full. */
function ProjectBody({
  tile,
  division,
  extras,
  onExtrasChange,
}: {
  tile: Tile;
  division: string;
  /** The extras' total, held by the pop-up so the buy bar shows it too. */
  extras: number;
  onExtrasChange: (total: number) => void;
}) {
  const product = tile.product;
  const base = productFor(tile)?.price;
  return (
    <>
    <div data-section="included" className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="glass-card rounded-panel p-5 sm:p-6">
        <p className="micro-label">What&rsquo;s included</p>
        {/*
          READABLE (Genesis, 3 Oct 2026: "make the font bigger and more UI/UX
          friendly"): one item to a row at body size with room between, the
          lines that only define a kind of video folded into its "What's in
          each video" dropdown, and the notes in a soft panel at a size that
          reads rather than in faint small type.
        */}
        <ul className="mt-4 space-y-3.5">
          {product?.includes
            .filter((item) => !DEFINES_VIDEO.test(item))
            .map((item) => (
              <li key={item} className="flex items-start gap-3 text-body leading-snug text-bone">
                <span aria-hidden className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand/20 text-brand-ink">
                  <Check className="size-3" strokeWidth={3} />
                </span>
                <VideoTierLine text={item} detail={withDefinitions(aiTierDetail(item), product.includes)} />
              </li>
            ))}
        </ul>
        {/* The note as a graphic: its workflow as steps, its other lines with icons (see NoteExplainer). */}
        {product?.note && <NoteExplainer note={product.note} part="notes" />}
        {/* Build Your AI Avatar Clone only: the avatars Genesis has already built. */}
        {product?.name === "Build Your AI Avatar Clone" && <AvatarShowcase />}
      </div>

      <div data-section="customise" className="flex flex-col gap-4 glass-card rounded-panel p-5 sm:p-6">
        <p className="micro-label">Price</p>
        <p className="flex flex-wrap items-baseline gap-x-2" aria-live="polite">
          <span className="font-display text-h2 font-normal leading-none tracking-tight text-bone">
            {extras > 0 && base !== undefined ? inr(base + extras).replace(/\/-$/, "") : tile.price}
          </span>
          <span className="text-small text-ash">{tile.unit ?? "per project, plus GST"}</span>
        </p>
        {extras > 0 && base !== undefined && (
          <p className="-mt-2 text-small text-ash">
            {/* Plain words for what the extra is (Genesis, 3 Oct 2026: "what is extras?"). */}
            {inr(base).replace(/\/-$/, "")} product + {inr(extras).replace(/\/-$/, "")} in add-ons you&rsquo;ve chosen below
          </p>
        )}
        {product?.inPerson && <ShootChip className="self-start" />}
        <ul className="space-y-2.5 text-small text-ash">
          {(
            [
              ["check2", "Buy once. No subscription."],
              ["card", "Pay by card, UPI or net banking, or in EMIs on eligible cards."],
              ["clock", "We confirm the details after your brief."],
            ] as const
          ).map(([icon, line]) => (
            <li key={line} className="flex items-center gap-3">
              <GlassIcon name={icon} className="size-8" />
              {line}
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-2">
          {product?.buyable ? (
            /* The extras — longer videos, adaptations, add-ons — then Buy Now / Add to Cart. */
            <ExtrasPicker vertical={tile.vertical} name={product.name} price={base ?? 0} onExtrasChange={onExtrasChange} />
          ) : (
            <GlassButton href={bookingHref(tile.name)} variant="brand" arrow className="w-full sm:w-auto">
              Book a 15-min Call
            </GlassButton>
          )}
        </div>
        <Link href={homePlans[tile.vertical].page} data-page-link className="inline-flex items-center gap-1 text-small text-ash hover:text-brand-ink">
          More about {division}
          <ArrowUpRight className="size-3.5" aria-hidden />
        </Link>
      </div>
    </div>

    {/*
      OUT OF THE BOX, FULL WIDTH (Genesis, 3 Oct 2026: "everything below this
      should be out of the box"): the approval workflow as one row of steps,
      then the typical turnaround as its own row of three.
    */}
    {product?.note && <NoteExplainer note={product.note} part="flow" />}
    {TURNAROUND[tile.vertical] && (
      <section className="mt-10">
        <h3 className="mb-4 font-sans text-lead text-bone">Typical turnaround</h3>
        <TurnaroundStrip data={TURNAROUND[tile.vertical]!} />
      </section>
    )}

    </>
  );
}

/** A product's own pictures; for a subscription, every picture of its division's products. */
function galleryFor(tile: Tile): ProductImage[] {
  if (tile.product) return productImages[tile.product.name] ?? [];
  const seen = new Set<string>();
  return products
    .filter((p) => p.vertical === tile.vertical)
    .flatMap((p) => productImages[p.name] ?? [])
    .filter((image) => (seen.has(image.src) ? false : (seen.add(image.src), true)))
    .slice(0, 12);
}

/**
 * THE POP-UP'S GALLERY: one large picture at a time with arrows and a count,
 * and the small ones under it to jump between. Swipe on a phone. Genesis's
 * own work of that kind until product shots exist (lib/product-images), and
 * it says so: "Previous work & case studies" (Genesis, 3 Oct 2026). A mark or logo sits whole on a light ground.
 */
function HeroGallery({ images }: { images: ProductImage[] }) {
  const [index, setIndex] = useState(0);
  const touch = useRef<number | null>(null);
  const go = (step: number) => setIndex((i) => (i + step + images.length) % images.length);
  const image = images[index];

  return (
    <section aria-label="Previous work and case studies" className="min-w-0">
      <div
        className={cn(
          "group/hero relative aspect-[4/3] overflow-hidden rounded-panel border border-white/10",
          image.contain ? "grid place-items-center bg-[#f4f1ea] p-[12%]" : "bg-ink",
        )}
        onTouchStart={(event) => (touch.current = event.touches[0].clientX)}
        onTouchEnd={(event) => {
          if (touch.current === null) return;
          const dx = event.changedTouches[0].clientX - touch.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          touch.current = null;
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- a picture at panel size, through the image optimiser */}
        <img
          key={image.src}
          src={posterSrc(image.src, 828)}
          alt={image.alt}
          className={cn(
            image.contain ? "max-h-full max-w-full object-contain" : "absolute inset-0 size-full object-cover",
          )}
        />
        <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[0.6875rem] uppercase tracking-[0.12em] text-white/85">
          Previous work &amp; case studies
        </span>
        {images.length > 1 && (
          <>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-[0.75rem] tabular-nums text-white/85">
              {index + 1} / {images.length}
            </span>
            {[-1, 1].map((step) => (
              <button
                key={step}
                type="button"
                aria-label={step < 0 ? "Previous picture" : "Next picture"}
                onClick={() => go(step)}
                className={cn(
                  "absolute top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                  step < 0 ? "left-3" : "right-3",
                )}
              >
                {step < 0 ? <ChevronLeft className="size-4" aria-hidden /> : <ChevronRight className="size-4" aria-hidden />}
              </button>
            ))}
          </>
        )}
      </div>
      {images.length > 1 && (
        <ul className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((thumb, i) => (
            <li key={thumb.src} className="shrink-0">
              <button
                type="button"
                aria-label={`Show ${thumb.alt}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={cn(
                  "relative block size-14 overflow-hidden rounded-[0.6rem] border transition-[border-color,opacity] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:size-16",
                  thumb.contain ? "grid place-items-center bg-[#f4f1ea] p-2" : "bg-ink",
                  i === index ? "border-brand opacity-100" : "border-white/10 opacity-60 hover:opacity-100",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- a thumbnail, through the image optimiser */}
                <img
                  src={posterSrc(thumb.src, 384)}
                  alt=""
                  loading="lazy"
                  className={thumb.contain ? "max-h-full max-w-full object-contain" : "absolute inset-0 size-full object-cover"}
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * A PRODUCT'S OWN FOUR STEPS (Genesis's sheet, "Website process"): numbered,
 * left to right, in the same cards as the homepage's steps.
 */
function ProcessSteps({ steps }: { steps: readonly string[] }) {
  return (
    <ol className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {steps.map((step, index) => (
        <li key={step} className="glass-card flex items-center gap-3 rounded-card p-3.5 sm:p-4">
          <span
            aria-hidden
            className="grid size-9 shrink-0 place-items-center rounded-full font-display text-small text-white"
            style={{ background: tierGradient(index) }}
          >
            {index + 1}
          </span>
          <span className="text-pretty font-sans text-small leading-snug text-bone">{step}</span>
        </li>
      ))}
    </ol>
  );
}

/*
  The pills (Genesis, 3 Oct 2026: "add our website gradient, and for the
  others make the outline gradient"): the site's sweep, in full, behind white
  type — each pill a different stretch of it, so a row still reads as one
  gradient — and an outline in the same sweep for the others.
*/
const PILL_FILLS = [
  "linear-gradient(115deg, #8b5cf6 0%, #c066d9 100%)",
  "linear-gradient(115deg, #c066d9 0%, #f2607e 100%)",
  "linear-gradient(115deg, #f2607e 0%, #f5923e 100%)",
];

/**
 * WHO IT IS FOR, AS PILLS (Genesis, 3 Oct 2026: "write this like [a stack of
 * word pills] but in our gradients, below the lines"). Each audience is a
 * pill — filled in a soft cut of the brand sweep, or outlined, alternating —
 * and the rest of the sentence, what they need, follows in plain type so
 * nothing from the original line is lost.
 */
function AudiencePills({ tags, need }: { tags: readonly string[]; need?: string }) {
  return (
    <div className="mt-6 max-w-2xl">
      <p className="micro-label">Made for</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {tags.map((tag, index) => {
          const filled = index % 3 !== 0;
          return (
            <li
              key={tag}
              className={cn(
                "rounded-full px-4 py-1.5 text-[0.75rem] font-medium uppercase tracking-[0.08em] sm:text-[0.8125rem]",
                filled ? "text-white shadow-[0_6px_18px_-8px_rgb(192_102_217/0.6)]" : "gradient-outline text-bone",
              )}
              style={filled ? { background: PILL_FILLS[index % PILL_FILLS.length] } : undefined}
            >
              {tag}
            </li>
          );
        })}
      </ul>
      {/* The rest of the sentence, carrying on from the pills: "…who want to stay visible…". */}
      {need && <p className="mt-3 text-pretty text-small leading-relaxed text-ash">&hellip;{need}</p>}
    </div>
  );
}

/**
 * AVATARS WE'VE BUILT (Genesis, 3 Oct 2026: "add 15–20 polished AI avatar
 * images in this section only, write copy accordingly"): a row of portraits
 * and stills, each named, to slide through, under what the Avatar Clone
 * includes. See avatarShowcase.
 */
function AvatarShowcase() {
  const rail = useRef<HTMLUListElement>(null);
  return (
    <section className="mt-8 border-t border-[var(--glass-border)] pt-6" aria-labelledby="avatar-showcase">
      <p id="avatar-showcase" className="micro-label">
        Avatars we&rsquo;ve built
      </p>
      <p className="mt-2 text-pretty text-body leading-relaxed text-bone">
        Founders, creators and brand characters, cloned by Genesis AI Labs and now presenting reels, founder
        updates and explainers. Yours joins them.
      </p>
      <ul
        ref={rail}
        data-lenis-prevent
        className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {avatarShowcase.map((shot) => (
          <li key={shot.src} className="relative aspect-[3/4] w-[9.5rem] shrink-0 snap-start overflow-hidden rounded-card border border-white/10 bg-ink sm:w-[11rem]">
            {/* eslint-disable-next-line @next/next/no-img-element -- a portrait at card size, through the image optimiser */}
            <img src={posterSrc(shot.src, 384)} alt={`${shot.name}, ${shot.line}: a Genesis AI avatar`} loading="lazy" className="absolute inset-0 size-full object-cover" />
            <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 to-transparent" />
            <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[0.625rem] uppercase tracking-[0.1em] text-white/85">
              {shot.kind}
            </span>
            <span className="absolute inset-x-0 bottom-0 p-3">
              <span className="block text-small leading-tight text-white">{shot.name}</span>
              <span className="mt-0.5 block truncate text-[0.75rem] text-white/70">{shot.line}</span>
            </span>
          </li>
        ))}
      </ul>
      <RailProgress rail={rail} className="mt-1" />

      {/*
        WHAT AN AVATAR CAN BE, AND WHAT WE NEED FOR IT (Genesis, 3 Oct 2026:
        "any setup, any product integration — background, clothes,
        accessories like a laptop or jewellery … what you need to provide:
        references of the setting, position, background or product, in a
        dropdown").
      */}
      <div className="mt-6">
        <p className="text-body text-bone">Your avatar, built to your vision</p>
        <p className="mt-1.5 text-pretty text-small leading-relaxed text-ash sm:text-body">
          Any setting, any look, any product. If you can picture it, we can create it, and change it whenever
          your content needs something new.
        </p>
        <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {AVATAR_CAN.map(([icon, title, line]) => (
            <li key={title} className="flex items-start gap-3 rounded-card bg-[var(--hover-wash)] p-3">
              <GlassIcon name={icon} className="size-8 shrink-0" />
              <span>
                <span className="block text-small text-bone">{title}</span>
                <span className="mt-0.5 block text-pretty text-[0.8125rem] leading-snug text-ash">{line}</span>
              </span>
            </li>
          ))}
        </ul>
        <PlanDetails
          title="What you’ll need to provide"
          summary="Send references for each look you want. The closer the reference, the closer the result."
          className="mt-4"
        >
          <ul className="space-y-2.5">
            {AVATAR_NEEDS.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-small leading-snug text-bone sm:text-body">
                <span aria-hidden className="mt-[0.5em] size-1.5 shrink-0 rounded-full bg-brand" />
                {item}
              </li>
            ))}
          </ul>
        </PlanDetails>
      </div>
    </section>
  );
}

/* What an avatar can be set up with — Genesis's own list, 3 Oct 2026. */
const AVATAR_CAN: [GlassIconName, string, string][] = [
  ["home", "Any setting", "A studio, an office, a stage, outdoors or a set built for your brand."],
  ["bag", "Your product, in shot", "Hold it, use it or present it. Any product can be integrated."],
  ["palette", "Clothes & styling", "Outfits, colours and looks to match your brand or each campaign."],
  ["star", "Accessories & props", "A laptop, jewellery, glasses or anything else the scene needs."],
];

/* What Genesis needs to build each look. */
const AVATAR_NEEDS = [
  "References for the setting you want",
  "The position or pose for the avatar (standing, seated, at a desk…)",
  "The background, or a reference for it",
  "The product to integrate: photos, packshots or the product itself",
  "Any clothes, styling or accessories you want included",
];
