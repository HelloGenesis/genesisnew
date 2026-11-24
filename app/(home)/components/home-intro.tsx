import Link from "next/link";

import { BENTO_WIDE } from "@/lib/bento";

import { OfferSection } from "./offer/parts";

/*
 * WHAT GENESIS DOES, IN PLAIN WORDS, UNDER THE HERO (SEO review, 24 Nov 2026: "the homepage has no written
 * content for SEO targeting"). The page had plenty of words, but none of the phrases people search for:
 * "influencer marketing agency" and "video production" never appeared, while "AI avatar" appeared 81
 * times. Four short paragraphs, each naming its service and city and linking to its page, plus one clear
 * next step. Static and visible from the first paint: no reveal animation, so search engines, AI answer
 * engines and slow phones all read it straight away.
 */
const SERVICES = [
  {
    href: "/influencer-marketing",
    title: "Influencer marketing agency in Mumbai",
    body: "Influencer campaigns, celebrity partnerships and UGC across India, matched from a roster of 1,00,000+ creators. We plan, negotiate, manage and report every campaign. Agency commission 15% plus creator fees.",
  },
  {
    href: "/content-production",
    title: "Video and content production company",
    body: "Reels, brand films, founder and CEO videos, product explainers, podcasts and event films, with strategy, scripting, shoots and editing done in-house in Mumbai. Subscriptions from ₹84,999 a month, or one-off shoots.",
  },
  {
    href: "/ai-content-automation",
    title: "AI avatars, AI video and automation",
    body: "Realistic AI avatars and voice clones, multilingual AI videos and AI-powered automations, so brands publish more without a shoot behind every post. Subscriptions from ₹94,999 a month, or an avatar clone from ₹24,999.",
  },
  {
    href: "/brand-design",
    title: "Brand identity and design agency",
    body: "Brand positioning, logos and visual identities, brand guidelines, social media design, motion, pitch decks and collaterals. Subscriptions from ₹64,999 a month.",
  },
] as const;

export function HomeIntro() {
  return (
    <OfferSection id="what-we-do" labelledBy="what-we-do-heading">
      <div className={BENTO_WIDE}>
        <p className="micro-label !text-faint">What we do</p>
        <h2 id="what-we-do-heading" className="mt-3 max-w-3xl font-sans text-h2 text-bone">
          A creative agency in Mumbai for influencer marketing, video production, AI content and branding
        </h2>
        <p className="mt-4 max-w-3xl text-body text-ash">
          Genesis Media (Genesis Events and Media Group) works with brands across India, from Aditya Birla Health Insurance and Mahindra Finance to
          growing startups. One team covers the four things most marketing plans need, so a campaign moves from brief to published content
          without changing hands. Prices are in Indian rupees and exclude 18% GST.
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {SERVICES.map((s) => (
            <li key={s.href} className="rounded-2xl border border-white/10 p-5">
              <h3 className="font-sans text-[1.125rem] font-semibold text-bone">
                <Link href={s.href} className="hover:underline">{s.title}</Link>
              </h3>
              <p className="mt-2 text-small leading-relaxed text-ash">{s.body}</p>
            </li>
          ))}
        </ul>
        {/* ONE NEXT STEP, said plainly (the review's "unclear call to action"). */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="#book-a-call" className="inline-flex min-h-11 items-center rounded-full bg-brand px-6 font-medium text-black">Book a free 15-minute call</Link>
          <Link href="/pricing" className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-6 font-medium text-bone">See pricing</Link>
          <Link href="/case-studies" className="inline-flex min-h-11 items-center px-2 font-medium text-ash hover:text-bone">Case studies →</Link>
        </div>
      </div>
    </OfferSection>
  );
}
