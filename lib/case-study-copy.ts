import type { ReelId, Vertical } from "./work";

/**
 * THE CASE-STUDY COPY, from Genesis's "SEO Case Study Blog Master 2026".
 *
 * GENERATED FROM THE PDF, then held to the document's own publishing rules
 * rather than pasted whole. Three things were done to it on the way in:
 *
 *   - EDITOR NOTES ARE OUT. The "verified result" lines are mostly
 *     instructions to the publisher ("Add platform performance when…",
 *     "validate before headline use"). None of that is copy; it is removed
 *     sentence by sentence.
 *   - FIGURES ARE HAND-KEPT. `highlight` is written from the PDF's numbers
 *     only where the document supports them, and it is EMPTY for every study
 *     the PDF marks "Editorial note — verify this reported headline figure"
 *     (`flagged`): its guide says those figures stay out of the hero until
 *     the platform export confirms them. Unvalidated claims — Shubh Utsav's
 *     20M+, Activ Yuva's 17M+, the 150-vs-200 creator count — are not used,
 *     and Shubh Utsav's headline drops its "120+" for the same reason.
 *   - `clip` IS OURS. The PDF names campaigns, not files; each is matched to
 *     the portfolio clip it describes (Bombay Running and Matcha are both
 *     All For Health — its brief lists running and cooking).
 */
export type CaseStudyCopy = {
  /** The PDF's own number, 1-40. */
  n: number;
  division: Vertical;
  headline: string;
  brand: string;
  industry: string;
  service: string;
  campaign: string;
  /** The verified figure, or null where there is none to state. */
  highlight: string | null;
  /** The PDF marks this study's figures as still to be verified. */
  flagged: boolean;
  brief: string[];
  approach: string[];
  execution: string[];
  executionNote: string;
  results: string[];
  takeaway: string;
  slug: string;
  keyword: string;
  clip: ReelId;
};

export const caseStudyCopy: CaseStudyCopy[] = [
  {
    "n": 1,
    "division": "Influence",
    "headline": "How ABHI Turned Jump For Health Into a Creator-Led Social Impact Campaign",
    "brand": "Aditya Birla Health Insurance",
    "industry": "Health insurance and wellness",
    "service": "Influencer marketing, creator strategy and social content",
    "campaign": "ABHI Jump For Health 2023",
    "highlight": "60,324 jumps, 806,736 views, 54,877 likes, 2,099 comments and 2,687 shares — supporting six prosthetic-leg donations.",
    "flagged": false,
    "brief": [
      "Genesis turned a simple jumping challenge into a community action linked to prosthetic-leg donations. Creator-led videos explained the mechanic, demonstrated the action and invited audiences to participate.",
      "The work had to feel native to creator feeds while protecting the campaign's central message. That meant building a brief with enough structure for consistency and enough freedom for creators to remain credible with their own audiences."
    ],
    "approach": [
      "The strategic choice was to make \"participation that created measurable social impact\" the organising idea. Instead of treating creators as media placements, Genesis used their familiar formats, communities and storytelling habits to make the campaign easier to understand and more likely to be shared.",
      "The approach worked because the brand message entered formats audiences already understood. A repeatable creative device made the campaign recognisable, while creator variation prevented the work from feeling mass-produced."
    ],
    "execution": [
      "Campaign idea and creator-content framework",
      "Creator briefing, coordination and approval management",
      "Social-first video production and platform-ready delivery"
    ],
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "results": [
      "For marketing teams, this shows how Genesis can connect creator selection, creative direction and campaign operations inside one accountable influencer-marketing workflow."
    ],
    "takeaway": "ABHI Jump For Health 2023 demonstrates how Genesis Media can translate a clear marketing objective into a practical content system—combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "slug": "abhi-jump-for-health-2023",
    "keyword": "healthcare influencer marketing",
    "clip": 1
  },
  {
    "n": 2,
    "division": "Influence",
    "headline": "How ABHI Scaled Jump For Health Through Creators and UGC",
    "brand": "Aditya Birla Health Insurance",
    "industry": "Health insurance and wellness",
    "service": "Influencer marketing, creator strategy and social content",
    "campaign": "ABHI Jump For Health 2024",
    "highlight": null,
    "flagged": true,
    "brief": [
      "The next wave used lead creators to establish a recognisable participation format, then expanded it through a broad UGC network. Different creator styles made the same action feel native across many feeds while retaining one campaign identity.",
      "The work had to feel native to creator feeds while protecting the campaign's central message. That meant building a brief with enough structure for consistency and enough freedom for creators to remain credible with their own audiences."
    ],
    "approach": [
      "The strategic choice was to make \"scaling a health movement through creators and ugc\" the organising idea. Instead of treating creators as media placements, Genesis used their familiar formats, communities and storytelling habits to make the campaign easier to understand and more likely to be shared.",
      "The approach worked because the brand message entered formats audiences already understood. A repeatable creative device made the campaign recognisable, while creator variation prevented the work from feeling mass-produced."
    ],
    "execution": [
      "Campaign idea and creator-content framework",
      "Creator briefing, coordination and approval management",
      "Social-first video production and platform-ready delivery"
    ],
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "results": [
      "For marketing teams, this shows how Genesis can connect creator selection, creative direction and campaign operations inside one accountable influencer-marketing workflow."
    ],
    "takeaway": "ABHI Jump For Health 2024 demonstrates how Genesis Media can translate a clear marketing objective into a practical content system—combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "slug": "abhi-jump-for-health-2024",
    "keyword": "healthcare influencer marketing",
    "clip": 8
  },
  {
    "n": 3,
    "division": "Influence",
    "headline": "How ABHI Extended Activ One With Social-First BTS Content Featuring Vikrant Massey",
    "brand": "Aditya Birla Health Insurance",
    "industry": "Health insurance and wellness",
    "service": "Influencer marketing, creator strategy and social content",
    "campaign": "Activ One — BTS with Vikrant Massey",
    "highlight": null,
    "flagged": false,
    "brief": [
      "Genesis shaped behind-the-scenes access around Vikrant Massey, the pace of the set and the people behind the campaign. Tight filming and editing transformed production footage into a standalone digital story instead of a conventional making-of.",
      "The work had to feel native to creator feeds while protecting the campaign's central message. That meant building a brief with enough structure for consistency and enough freedom for creators to remain credible with their own audiences."
    ],
    "approach": [
      "The strategic choice was to make \"on-set access turned into a social-first brand asset\" the organising idea. Instead of treating creators as media placements, Genesis used their familiar formats, communities and storytelling habits to make the campaign easier to understand and more likely to be shared.",
      "The approach worked because the brand message entered formats audiences already understood. A repeatable creative device made the campaign recognisable, while creator variation prevented the work from feeling mass-produced."
    ],
    "execution": [
      "Campaign idea and creator-content framework",
      "Creator briefing, coordination and approval management",
      "Social-first video production and platform-ready delivery"
    ],
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "results": [
      "For marketing teams, this shows how Genesis can connect creator selection, creative direction and campaign operations inside one accountable influencer-marketing workflow."
    ],
    "takeaway": "Activ One — BTS with Vikrant Massey demonstrates how Genesis Media can translate a clear marketing objective into a practical content system—combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "slug": "activ-one-bts-with-vikrant-massey",
    "keyword": "healthcare influencer marketing",
    "clip": 2
  },
  {
    "n": 4,
    "division": "Influence",
    "headline": "How ABHI Used Unexpected Creators to Make Heart Health Social",
    "brand": "Aditya Birla Health Insurance",
    "industry": "Health insurance and wellness",
    "service": "Influencer marketing, creator strategy and social content",
    "campaign": "ABHI Let's Face It",
    "highlight": null,
    "flagged": true,
    "brief": [
      "For World Heart Day, Genesis moved beyond conventional medical voices and used comedy, skincare and fitness creators to make an Activ Health App face scan culturally relevant. Familiar creator formats made a serious health action easy to notice and share.",
      "The work had to feel native to creator feeds while protecting the campaign's central message. That meant building a brief with enough structure for consistency and enough freedom for creators to remain credible with their own audiences."
    ],
    "approach": [
      "The strategic choice was to make \"heart health through unexpected creator categories\" the organising idea. Instead of treating creators as media placements, Genesis used their familiar formats, communities and storytelling habits to make the campaign easier to understand and more likely to be shared.",
      "The approach worked because the brand message entered formats audiences already understood. A repeatable creative device made the campaign recognisable, while creator variation prevented the work from feeling mass-produced."
    ],
    "execution": [
      "Campaign idea and creator-content framework",
      "Creator briefing, coordination and approval management",
      "Social-first video production and platform-ready delivery"
    ],
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "results": [
      "For marketing teams, this shows how Genesis can connect creator selection, creative direction and campaign operations inside one accountable influencer-marketing workflow."
    ],
    "takeaway": "ABHI Let's Face It demonstrates how Genesis Media can translate a clear marketing objective into a practical content system—combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "slug": "abhi-lets-face-it",
    "keyword": "healthcare influencer marketing",
    "clip": 3
  },
  {
    "n": 5,
    "division": "Influence",
    "headline": "How ABHI Built a Seven-Day Wellness Story With Yoga Creator Kamya Sidana",
    "brand": "Aditya Birla Health Insurance",
    "industry": "Health insurance and wellness",
    "service": "Influencer marketing, creator strategy and social content",
    "campaign": "ABHI YogaBAE",
    "highlight": "61,200 views, 1,146 likes, 27 comments and 66 shares across the two principal videos.",
    "flagged": false,
    "brief": [
      "Genesis partnered with yoga expert Kamya Sidana to turn International Yoga Day into a useful seven-day narrative. The content connected accessible practice, personal reflection and traffic to the Activ Living community.",
      "The work had to feel native to creator feeds while protecting the campaign's central message. That meant building a brief with enough structure for consistency and enough freedom for creators to remain credible with their own audiences."
    ],
    "approach": [
      "The strategic choice was to make \"a week-long wellness journey with kamya sidana\" the organising idea. Instead of treating creators as media placements, Genesis used their familiar formats, communities and storytelling habits to make the campaign easier to understand and more likely to be shared.",
      "The approach worked because the brand message entered formats audiences already understood. A repeatable creative device made the campaign recognisable, while creator variation prevented the work from feeling mass-produced."
    ],
    "execution": [
      "Campaign idea and creator-content framework",
      "Creator briefing, coordination and approval management",
      "Social-first video production and platform-ready delivery"
    ],
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "results": [
      "For marketing teams, this shows how Genesis can connect creator selection, creative direction and campaign operations inside one accountable influencer-marketing workflow."
    ],
    "takeaway": "ABHI YogaBAE demonstrates how Genesis Media can translate a clear marketing objective into a practical content system—combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "slug": "abhi-yogabae",
    "keyword": "healthcare influencer marketing",
    "clip": 5
  },
  {
    "n": 6,
    "division": "Influence",
    "headline": "How ABHI Showed Wellness Through Real Creator Communities",
    "brand": "Aditya Birla Health Insurance",
    "industry": "Health insurance and wellness",
    "service": "Influencer marketing, creator strategy and social content",
    "campaign": "ABHI All For Health",
    "highlight": null,
    "flagged": false,
    "brief": [
      "Genesis broadened the meaning of wellness through running, basketball, aerial yoga, cooking and other community-led disciplines. Each video used the creator's real practice as the narrative, giving the umbrella initiative variety without losing cohesion.",
      "The work had to feel native to creator feeds while protecting the campaign's central message. That meant building a brief with enough structure for consistency and enough freedom for creators to remain credible with their own audiences."
    ],
    "approach": [
      "The strategic choice was to make \"wellness shown through real communities\" the organising idea. Instead of treating creators as media placements, Genesis used their familiar formats, communities and storytelling habits to make the campaign easier to understand and more likely to be shared. The approach worked because the brand message entered formats audiences already understood. A repeatable creative device made the campaign recognisable, while creator variation prevented the work from feeling mass-produced."
    ],
    "execution": [
      "Campaign idea and creator-content framework",
      "Creator briefing, coordination and approval management",
      "Social-first video production and platform-ready delivery"
    ],
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "results": [
      "For marketing teams, this shows how Genesis can connect creator selection, creative direction and campaign operations inside one accountable influencer-marketing workflow."
    ],
    "takeaway": "ABHI All For Health demonstrates how Genesis Media can translate a clear marketing objective into a practical content system—combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "slug": "abhi-all-for-health",
    "keyword": "healthcare influencer marketing",
    "clip": 10
  },
  {
    "n": 7,
    "division": "Influence",
    "headline": "How ABSLI Made Insurance Language Social Through Creator-Led Wordplay",
    "brand": "Aditya Birla Sun Life Insurance",
    "industry": "BFSI and financial services",
    "service": "Influencer marketing, creator strategy and social content",
    "campaign": "ABSLI Pun Se Policy Tak",
    "highlight": null,
    "flagged": false,
    "brief": [
      "Genesis used wordplay and creator-led delivery to make formal insurance terminology lighter and easier to remember. A consistent format helped each message stand alone while building recognition across the series.",
      "The work had to feel native to creator feeds while protecting the campaign's central message. That meant building a brief with enough structure for consistency and enough freedom for creators to remain credible with their own audiences."
    ],
    "approach": [
      "The strategic choice was to make \"insurance language made social and memorable\" the organising idea. Instead of treating creators as media placements, Genesis used their familiar formats, communities and storytelling habits to make the campaign easier to understand and more likely to be shared.",
      "The approach worked because the brand message entered formats audiences already understood. A repeatable creative device made the campaign recognisable, while creator variation prevented the work from feeling mass-produced."
    ],
    "execution": [
      "Campaign idea and creator-content framework",
      "Creator briefing, coordination and approval management",
      "Social-first video production and platform-ready delivery"
    ],
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "results": [
      "For marketing teams, this shows how Genesis can connect creator selection, creative direction and campaign operations inside one accountable influencer-marketing workflow."
    ],
    "takeaway": "ABSLI Pun Se Policy Tak demonstrates how Genesis Media can translate a clear marketing objective into a practical content system—combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "slug": "absli-pun-se-policy-tak",
    "keyword": "BFSI influencer marketing campaign",
    "clip": 7
  },
  {
    "n": 8,
    "division": "Influence",
    "headline": "How Mahindra Finance Activated Creators at Scale for Shubh Utsav",
    "brand": "Mahindra Finance",
    "industry": "BFSI and financial services",
    "service": "UGC strategy, creator activation and campaign operations",
    "campaign": "Mahindra Finance Shubh Utsav",
    "highlight": null,
    "flagged": true,
    "brief": [
      "Genesis built a UGC-led festive activation around an easy selfie mechanic, coordinated creators and approvals, and concentrated publishing to create a visible surge rather than isolated posts. The work had to feel native to creator feeds while protecting the campaign's central message. That meant building a brief with enough structure for consistency and enough freedom for creators to remain credible with their own audiences."
    ],
    "approach": [
      "The strategic choice was to make \"a festive creator surge delivered at speed\" the organising idea. Instead of treating creators as media placements, Genesis used their familiar formats, communities and storytelling habits to make the campaign easier to understand and more likely to be shared. The approach worked because the brand message entered formats audiences already understood. A repeatable creative device made the campaign recognisable, while creator variation prevented the work from feeling mass-produced."
    ],
    "execution": [
      "Campaign idea and creator-content framework",
      "High-volume creator coordination and simultaneous publishing",
      "Social-first video production and platform-ready delivery"
    ],
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "results": [
      "For marketing teams, this shows how Genesis can connect creator selection, creative direction and campaign operations inside one accountable influencer-marketing workflow."
    ],
    "takeaway": "Mahindra Finance Shubh Utsav demonstrates how Genesis Media can translate a clear marketing objective into a practical content system—combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "slug": "mahindra-finance-shubh-utsav",
    "keyword": "UGC agency India",
    "clip": 16
  },
  {
    "n": 9,
    "division": "Influence",
    "headline": "How The WorldGrad Made Study-Abroad Guidance Social With 25 Creators",
    "brand": "The WorldGrad",
    "industry": "Education and study abroad",
    "service": "Influencer marketing, creator strategy and social content",
    "campaign": "The WorldGrad",
    "highlight": "25 creators, 500K+ reach and 50K+ engagement, with followers growing from 400 to 5,000.",
    "flagged": false,
    "brief": [
      "Genesis selected education and travel-relevant creators to turn real student anxieties into trend-aware, useful social content. Topics focused on decisions students genuinely face, including application risks and studying abroad.",
      "The work had to feel native to creator feeds while protecting the campaign's central message. That meant building a brief with enough structure for consistency and enough freedom for creators to remain credible with their own audiences."
    ],
    "approach": [
      "The strategic choice was to make \"study-abroad guidance made practical and social\" the organising idea. Instead of treating creators as media placements, Genesis used their familiar formats, communities and storytelling habits to make the campaign easier to understand and more likely to be shared.",
      "The approach worked because the brand message entered formats audiences already understood. A repeatable creative device made the campaign recognisable, while creator variation prevented the work from feeling mass-produced."
    ],
    "execution": [
      "Campaign idea and creator-content framework",
      "Creator briefing, coordination and approval management",
      "Social-first video production and platform-ready delivery"
    ],
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "results": [
      "For marketing teams, this shows how Genesis can connect creator selection, creative direction and campaign operations inside one accountable influencer-marketing workflow."
    ],
    "takeaway": "The WorldGrad demonstrates how Genesis Media can translate a clear marketing objective into a practical content system—combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "slug": "the-worldgrad",
    "keyword": "education influencer marketing campaign",
    "clip": 21
  },
  {
    "n": 14,
    "division": "Influence",
    "headline": "How Genesis Media Turned Everyday Care Into a Relatable Mother's Day Story",
    "brand": "Mother's Day Creator Film",
    "industry": "Marketing and communications",
    "service": "Influencer marketing, creator strategy and social content",
    "campaign": "Mother's Day Creator Film",
    "highlight": null,
    "flagged": false,
    "brief": [
      "Genesis used a mother-and-child social format to make the campaign message warm, recognisable and platform-native. The creative begins with human behaviour rather than product explanation, creating an emotional route into the brand story.",
      "The work had to feel native to creator feeds while protecting the campaign's central message. That meant building a brief with enough structure for consistency and enough freedom for creators to remain credible with their own audiences."
    ],
    "approach": [
      "The strategic choice was to make \"care translated into a relatable family story\" the organising idea. Instead of treating creators as media placements, Genesis used their familiar formats, communities and storytelling habits to make the campaign easier to understand and more likely to be shared. The approach worked because the brand message entered formats audiences already understood. A repeatable creative device made the campaign recognisable, while creator variation prevented the work from feeling mass-produced."
    ],
    "execution": [
      "Campaign idea and creator-content framework",
      "Creator briefing, coordination and approval management",
      "Social-first video production and platform-ready delivery"
    ],
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "results": [
      "Performance data was not included in the approved campaign material, so this case focuses on the confirmed strategy, production system and delivered output. For marketing teams, this shows how Genesis can connect creator selection, creative direction and campaign operations inside one accountable influencer-marketing workflow."
    ],
    "takeaway": "Mother's Day Creator Film demonstrates how Genesis Media can translate a clear marketing objective into a practical content system—combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "slug": "mothers-day-creator-film",
    "keyword": "influencer marketing campaign",
    "clip": 4
  },
  {
    "n": 15,
    "division": "AI Lab",
    "headline": "Inside Genesis Media's AI Content Production for ABHI Activ Yuva — Adi & Diya",
    "brand": "Aditya Birla Health Insurance",
    "industry": "Health insurance and wellness",
    "service": "AI content production, avatar development and motion design",
    "campaign": "ABHI Activ Yuva — Adi & Diya",
    "highlight": null,
    "flagged": true,
    "brief": [
      "Genesis created realistic avatars Adi and Diya and built a modular storytelling system around a youth-focused, app-led insurance product. The framework supports product explainers, HealthReturns, OPD, maternity, travel and short feature films across formats.",
      "The content also needed to scale beyond a single hero film. Character, setting and visual language had to remain recognisable across new scripts, aspect ratios and product stories without making the output feel mechanically repeated."
    ],
    "approach": [
      "Genesis organised the work around a modular production system, with \"a repeatable ai-avatar content system for insurance\" as the creative rule. This allowed individual assets to feel connected while supporting faster experimentation across characters, settings, feature messages and formats. The approach was effective because AI was used as a production system, not as a visual gimmick. Consistent creative direction helped the work support scale, versioning and new narratives while retaining a coherent brand world."
    ],
    "execution": [
      "Visual direction and repeatable generation system",
      "AI character or environment production with continuity checks",
      "Motion design, compositing and format adaptations"
    ],
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "results": [
      "For brands exploring generative production, this shows how Genesis can create a controlled AI content system that remains usable across real campaign requirements."
    ],
    "takeaway": "ABHI Activ Yuva — Adi & Diya demonstrates how Genesis Media can translate a clear marketing objective into a practical content system—combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "slug": "abhi-activ-yuva-adi-and-diya",
    "keyword": "AI avatar content",
    "clip": 29
  },
  {
    "n": 16,
    "division": "AI Lab",
    "headline": "Inside Genesis Media's AI Content Production for SINet Seervi Township",
    "brand": "SINet Seervi Township",
    "industry": "Real estate",
    "service": "AI video production and real-estate visualisation",
    "campaign": "SINet Seervi Township",
    "highlight": null,
    "flagged": false,
    "brief": [
      "Genesis generated more than 70 visual clips and assembled them into a coherent township story without relying on a conventional property shoot. Iteration across landscape, architecture, lifestyle and movement created a flexible pre-visualisation and film workflow.",
      "The content also needed to scale beyond a single hero film. Character, setting and visual language had to remain recognisable across new scripts, aspect ratios and product stories without making the output feel mechanically repeated."
    ],
    "approach": [
      "Genesis organised the work around a modular production system, with \"a complete real-estate world built with ai\" as the creative rule. This allowed individual assets to feel connected while supporting faster experimentation across characters, settings, feature messages and formats.",
      "The approach was effective because AI was used as a production system, not as a visual gimmick. Consistent creative direction helped the work support scale, versioning and new narratives while retaining a coherent brand world."
    ],
    "execution": [
      "Visual direction and repeatable generation system",
      "AI character or environment production with continuity checks",
      "Motion design, compositing and format adaptations"
    ],
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "results": [
      "For brands exploring generative production, this shows how Genesis can create a controlled AI content system that remains usable across real campaign requirements."
    ],
    "takeaway": "SINet Seervi Township demonstrates how Genesis Media can translate a clear marketing objective into a practical content system—combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "slug": "sinet-seervi-township",
    "keyword": "AI real estate marketing",
    "clip": "ai-lab-sinet-english-v004"
  },
  {
    "n": 17,
    "division": "AI Lab",
    "headline": "Inside Genesis Media's AI Content Production for House of Hiranandani — Maitri Park",
    "brand": "House of Hiranandani",
    "industry": "Real estate",
    "service": "AI video production and real-estate visualisation",
    "campaign": "House of Hiranandani — Maitri Park",
    "highlight": null,
    "flagged": false,
    "brief": [
      "Genesis used AI-led architectural and lifestyle visualisation to express the project's neo-classical character, natural light, cross ventilation, landscaped setting and long-term value in a cinematic social format.",
      "The content also needed to scale beyond a single hero film. Character, setting and visual language had to remain recognisable across new scripts, aspect ratios and product stories without making the output feel mechanically repeated."
    ],
    "approach": [
      "Genesis organised the work around a modular production system, with \"premium property storytelling before the physical experience\" as the creative rule. This allowed individual assets to feel connected while supporting faster experimentation across characters, settings, feature messages and formats. The approach was effective because AI was used as a production system, not as a visual gimmick. Consistent creative direction helped the work support scale, versioning and new narratives while retaining a coherent brand world."
    ],
    "execution": [
      "Visual direction and repeatable generation system",
      "AI character or environment production with continuity checks",
      "Motion design, compositing and format adaptations"
    ],
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "results": [
      "For brands exploring generative production, this shows how Genesis can create a controlled AI content system that remains usable across real campaign requirements."
    ],
    "takeaway": "House of Hiranandani — Maitri Park demonstrates how Genesis Media can translate a clear marketing objective into a practical content system—combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "slug": "house-of-hiranandani-maitri-park",
    "keyword": "AI real estate marketing",
    "clip": 32
  },
  {
    "n": 18,
    "division": "AI Lab",
    "headline": "Inside Genesis Media's AI Content Production for Advocate Bharat",
    "brand": "Advocate Bharat",
    "industry": "Legal education",
    "service": "AI content production, avatar development and motion design",
    "campaign": "Advocate Bharat",
    "highlight": null,
    "flagged": false,
    "brief": [
      "Genesis developed a front-facing AI avatar for Advocate Bharat, combining a realistic professional environment, calibrated voice direction and lip-sync performance for concise legal-awareness videos. The content also needed to scale beyond a single hero film. Character, setting and visual language had to remain recognisable across new scripts, aspect ratios and product stories without making the output feel mechanically repeated."
    ],
    "approach": [
      "Genesis organised the work around a modular production system, with \"a credible ai legal expert for short-form education\" as the creative rule. This allowed individual assets to feel connected while supporting faster experimentation across characters, settings, feature messages and formats. The approach was effective because AI was used as a production system, not as a visual gimmick. Consistent creative direction helped the work support scale, versioning and new narratives while retaining a coherent brand world."
    ],
    "execution": [
      "Visual direction and repeatable generation system",
      "AI character or environment production with continuity checks",
      "Motion design, compositing and format adaptations"
    ],
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "results": [
      "Performance data was not included in the approved campaign material, so this case focuses on the confirmed strategy, production system and delivered output. For brands exploring generative production, this shows how Genesis can create a controlled AI content system that remains usable across real campaign requirements."
    ],
    "takeaway": "Advocate Bharat demonstrates how Genesis Media can translate a clear marketing objective into a practical content system—combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "slug": "advocate-bharat",
    "keyword": "AI avatar content",
    "clip": "ai-lab-bharat-bharat"
  },
  {
    "n": 19,
    "division": "AI Lab",
    "headline": "Inside Genesis Media's AI Content Production for Custom AI Avatar Prototypes",
    "brand": "Genesis Media",
    "industry": "Marketing and communications",
    "service": "AI content production, avatar development and motion design",
    "campaign": "Custom AI Avatar Prototypes",
    "highlight": null,
    "flagged": false,
    "brief": [
      "Genesis tested custom avatar workflows with real team references, exploring image preparation, motion, lip-sync and short-form presenter formats. The prototypes demonstrate a scalable route for explainers, internal communications and personalised outreach.",
      "The content also needed to scale beyond a single hero film. Character, setting and visual language had to remain recognisable across new scripts, aspect ratios and product stories without making the output feel mechanically repeated."
    ],
    "approach": [
      "Genesis organised the work around a modular production system, with \"turning team members into reusable digital presenters\" as the creative rule. This allowed individual assets to feel connected while supporting faster experimentation across characters, settings, feature messages and formats. The approach was effective because AI was used as a production system, not as a visual gimmick. Consistent creative direction helped the work support scale, versioning and new narratives while retaining a coherent brand world."
    ],
    "execution": [
      "Visual direction and repeatable generation system",
      "AI character or environment production with continuity checks",
      "Motion design, compositing and format adaptations"
    ],
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "results": [
      "Performance data was not included in the approved campaign material, so this case focuses on the confirmed strategy, production system and delivered output. For brands exploring generative production, this shows how Genesis can create a controlled AI content system that remains usable across real campaign requirements."
    ],
    "takeaway": "Custom AI Avatar Prototypes demonstrates how Genesis Media can translate a clear marketing objective into a practical content system—combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "slug": "custom-ai-avatar-prototypes",
    "keyword": "AI avatar content",
    "clip": "ai-lab-tanvi-uiiui"
  },
  {
    "n": 20,
    "division": "Studios",
    "headline": "Inside Genesis Media's Video Production for ABHI Sales Pro",
    "brand": "Aditya Birla Health Insurance",
    "industry": "Health insurance and wellness",
    "service": "Video production, motion design and content adaptation",
    "campaign": "ABHI Sales Pro",
    "highlight": null,
    "flagged": false,
    "brief": [
      "Genesis created a concise sales-facing video identity that gives product communication a dedicated, recognisable format. The film is designed for quick internal circulation and repeatable use across business periods.",
      "The film needed to communicate quickly across digital and presentation environments. Genesis therefore had to balance information, visual pace and brand accuracy while planning for multiple versions and attention spans."
    ],
    "approach": [
      "Genesis built the narrative around one clear promise: a focused internal product film for sales enablement. The information was sequenced into short story steps so viewers could follow the message without the film becoming a list of disconnected claims or event moments.",
      "The approach was effective because it reduced the message to a clear viewing journey. Strong information hierarchy and planned versioning made the content useful beyond a single placement or moment."
    ],
    "execution": [
      "Script and narrative structure",
      "Production, editing and motion-graphics treatment",
      "Primary master and channel-specific adaptations"
    ],
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "results": [
      "For brand and marketing teams, this shows how Genesis can turn complex information or live production moments into clear, reusable video content."
    ],
    "takeaway": "ABHI Sales Pro demonstrates how Genesis Media can translate a clear marketing objective into a practical content system—combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "slug": "abhi-sales-pro",
    "keyword": "BFSI video production",
    "clip": "studios-wo-vo-sales-pro"
  },
  {
    "n": 21,
    "division": "Studios",
    "headline": "Inside Genesis Media's Video Production for TripGate",
    "brand": "TripGate",
    "industry": "Travel and hospitality",
    "service": "Video production, motion design and content adaptation",
    "campaign": "TripGate",
    "highlight": null,
    "flagged": false,
    "brief": [
      "Genesis translated TripGate's luxury positioning into a fast, aspirational destination film using premium travel imagery, refined typography and a consistent brand world.",
      "The film needed to communicate quickly across digital and presentation environments. Genesis therefore had to balance information, visual pace and brand accuracy while planning for multiple versions and attention spans."
    ],
    "approach": [
      "Genesis built the narrative around one clear promise: a premium travel brand expressed through cinematic destinations. The information was sequenced into short story steps so viewers could follow the message without the film becoming a list of disconnected claims or event moments.",
      "The approach was effective because it reduced the message to a clear viewing journey. Strong information hierarchy and planned versioning made the content useful beyond a single placement or moment."
    ],
    "execution": [
      "Script and narrative structure",
      "Production, editing and motion-graphics treatment",
      "Primary master and channel-specific adaptations"
    ],
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "results": [
      "For brand and marketing teams, this shows how Genesis can turn complex information or live production moments into clear, reusable video content."
    ],
    "takeaway": "TripGate demonstrates how Genesis Media can translate a clear marketing objective into a practical content system—combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "slug": "tripgate",
    "keyword": "video production agency Mumbai",
    "clip": "studios-tripagetet"
  },
  {
    "n": 22,
    "division": "Studios",
    "headline": "Inside Genesis Media's Video Production for ABHI Service Requests",
    "brand": "Aditya Birla Health Insurance",
    "industry": "Health insurance and wellness",
    "service": "Video production, motion design and content adaptation",
    "campaign": "ABHI Service Requests",
    "highlight": null,
    "flagged": false,
    "brief": [
      "Genesis turned the process of raising a service request into a clear, presenter-led video with direct steps and mobile-first visual hierarchy.",
      "The film needed to communicate quickly across digital and presentation environments. Genesis therefore had to balance information, visual pace and brand accuracy while planning for multiple versions and attention spans."
    ],
    "approach": [
      "Genesis built the narrative around one clear promise: a service journey simplified for mobile viewing. The information was sequenced into short story steps so viewers could follow the message without the film becoming a list of disconnected claims or event moments.",
      "The approach was effective because it reduced the message to a clear viewing journey. Strong information hierarchy and planned versioning made the content useful beyond a single placement or moment."
    ],
    "execution": [
      "Script and narrative structure",
      "Production, editing and motion-graphics treatment",
      "Primary master and channel-specific adaptations"
    ],
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "results": [
      "For brand and marketing teams, this shows how Genesis can turn complex information or live production moments into clear, reusable video content."
    ],
    "takeaway": "ABHI Service Requests demonstrates how Genesis Media can translate a clear marketing objective into a practical content system—combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "slug": "abhi-service-requests",
    "keyword": "video production agency Mumbai",
    "clip": "studios-ddddd"
  },
  {
    "n": 23,
    "division": "Studios",
    "headline": "Inside Genesis Media's Video Production for ABHI Women's Day",
    "brand": "Aditya Birla Health Insurance",
    "industry": "Health insurance and wellness",
    "service": "Video production, motion design and content adaptation",
    "campaign": "ABHI Women's Day",
    "highlight": null,
    "flagged": false,
    "brief": [
      "Genesis combined AI-led motion with real customer milestones to celebrate women through evidence of progress rather than a generic calendar message. A leadership version extended the message. The film needed to communicate quickly across digital and presentation environments. Genesis therefore had to balance information, visual pace and brand accuracy while planning for multiple versions and attention spans."
    ],
    "approach": [
      "Genesis built the narrative around one clear promise: ai motion grounded in real customer progress. The information was sequenced into short story steps so viewers could follow the message without the film becoming a list of disconnected claims or event moments.",
      "The approach was effective because it reduced the message to a clear viewing journey. Strong information hierarchy and planned versioning made the content useful beyond a single placement or moment."
    ],
    "execution": [
      "Script and narrative structure",
      "Production, editing and motion-graphics treatment",
      "Primary master and channel-specific adaptations"
    ],
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "results": [
      "For brand and marketing teams, this shows how Genesis can turn complex information or live production moments into clear, reusable video content."
    ],
    "takeaway": "ABHI Women's Day demonstrates how Genesis Media can translate a clear marketing objective into a practical content system—combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "slug": "abhi-womens-day",
    "keyword": "video production agency Mumbai",
    "clip": "studios-women-s-day-abhi"
  },
  {
    "n": 24,
    "division": "Studios",
    "headline": "Inside Genesis Media's Video Production for ABHI Claims Education",
    "brand": "Aditya Birla Health Insurance",
    "industry": "Health insurance and wellness",
    "service": "Video production, motion design and content adaptation",
    "campaign": "ABHI Claims Education",
    "highlight": "A six-film delivery library.",
    "flagged": false,
    "brief": [
      "Genesis broke claims communication into modular films covering tracking, queries, network hospitals, app and website submissions, and common mistakes. Clear screen-led sequences reduce cognitive load for customers under pressure.",
      "The film needed to communicate quickly across digital and presentation environments. Genesis therefore had to balance information, visual pace and brand accuracy while planning for multiple versions and attention spans."
    ],
    "approach": [
      "Genesis built the narrative around one clear promise: six focused journeys instead of one overloaded explainer. The information was sequenced into short story steps so viewers could follow the message without the film becoming a list of disconnected claims or event moments.",
      "The approach was effective because it reduced the message to a clear viewing journey. Strong information hierarchy and planned versioning made the content useful beyond a single placement or moment."
    ],
    "execution": [
      "Script and narrative structure",
      "Production, editing and motion-graphics treatment",
      "Primary master and channel-specific adaptations"
    ],
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "results": [
      "For brand and marketing teams, this shows how Genesis can turn complex information or live production moments into clear, reusable video content."
    ],
    "takeaway": "ABHI Claims Education demonstrates how Genesis Media can translate a clear marketing objective into a practical content system—combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "slug": "abhi-claims-education",
    "keyword": "BFSI video production",
    "clip": "studios-6-common-mistakes"
  },
  {
    "n": 25,
    "division": "Studios",
    "headline": "Inside Genesis Media's Video Production for ABHI Leadership Communications",
    "brand": "Aditya Birla Health Insurance",
    "industry": "Health insurance and wellness",
    "service": "Leadership communications and video production",
    "campaign": "ABHI Leadership Communications",
    "highlight": null,
    "flagged": false,
    "brief": [
      "Genesis supported scripting, production, edit structure and versioning across CEO messages, gratitude films, executive communications, Utsav and Power of Ten. The system preserves individual voices while keeping brand continuity.",
      "The film needed to communicate quickly across digital and presentation environments. Genesis therefore had to balance information, visual pace and brand accuracy while planning for multiple versions and attention spans."
    ],
    "approach": [
      "Genesis built the narrative around one clear promise: one coherent system across critical leadership moments. The information was sequenced into short story steps so viewers could follow the message without the film becoming a list of disconnected claims or event moments.",
      "The approach was effective because it reduced the message to a clear viewing journey. Strong information hierarchy and planned versioning made the content useful beyond a single placement or moment."
    ],
    "execution": [
      "Script and narrative structure",
      "Production, editing and motion-graphics treatment",
      "Primary master and channel-specific adaptations"
    ],
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "results": [
      "For brand and marketing teams, this shows how Genesis can turn complex information or live production moments into clear, reusable video content."
    ],
    "takeaway": "ABHI Leadership Communications demonstrates how Genesis Media can translate a clear marketing objective into a practical content system—combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "slug": "abhi-leadership-communications",
    "keyword": "BFSI video production",
    "clip": "studios-mr-mayank-bathwal-ceo-aditya-birla-health-insurance"
  },
  {
    "n": 26,
    "division": "Studios",
    "headline": "Inside Genesis Media's Video Production for Fraud-Proof Your Insurance",
    "brand": "Aditya Birla Health Insurance",
    "industry": "Health insurance and wellness",
    "service": "Video production, motion design and content adaptation",
    "campaign": "Fraud-Proof Your Insurance",
    "highlight": null,
    "flagged": false,
    "brief": [
      "Genesis used a direct presenter-led format and bold on-screen framing to make insurance fraud prevention understandable without creating fear or visual overload.",
      "The film needed to communicate quickly across digital and presentation environments. Genesis therefore had to balance information, visual pace and brand accuracy while planning for multiple versions and attention spans."
    ],
    "approach": [
      "Genesis built the narrative around one clear promise: a cautionary subject turned into a clear social explainer. The information was sequenced into short story steps so viewers could follow the message without the film becoming a list of disconnected claims or event moments.",
      "The approach was effective because it reduced the message to a clear viewing journey. Strong information hierarchy and planned versioning made the content useful beyond a single placement or moment."
    ],
    "execution": [
      "Script and narrative structure",
      "Production, editing and motion-graphics treatment",
      "Primary master and channel-specific adaptations"
    ],
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "results": [
      "For brand and marketing teams, this shows how Genesis can turn complex information or live production moments into clear, reusable video content."
    ],
    "takeaway": "Fraud-Proof Your Insurance demonstrates how Genesis Media can translate a clear marketing objective into a practical content system—combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "slug": "fraud-proof-your-insurance",
    "keyword": "BFSI video production",
    "clip": "studios-dfv"
  },
  {
    "n": 27,
    "division": "Studios",
    "headline": "Inside Genesis Media's Video Production for ABHI Ka Star",
    "brand": "Aditya Birla Health Insurance",
    "industry": "Health insurance and wellness",
    "service": "Video production, motion design and content adaptation",
    "campaign": "ABHI Ka Star",
    "highlight": null,
    "flagged": false,
    "brief": [
      "Genesis developed a high-energy recognition format using a cinematic stage world, marquee typography and award-show pacing to celebrate internal performance.",
      "The film needed to communicate quickly across digital and presentation environments. Genesis therefore had to balance information, visual pace and brand accuracy while planning for multiple versions and attention spans."
    ],
    "approach": [
      "Genesis built the narrative around one clear promise: internal recognition treated like entertainment. The information was sequenced into short story steps so viewers could follow the message without the film becoming a list of disconnected claims or event moments.",
      "The approach was effective because it reduced the message to a clear viewing journey. Strong information hierarchy and planned versioning made the content useful beyond a single placement or moment."
    ],
    "execution": [
      "Script and narrative structure",
      "Production, editing and motion-graphics treatment",
      "Primary master and channel-specific adaptations"
    ],
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "results": [
      "For brand and marketing teams, this shows how Genesis can turn complex information or live production moments into clear, reusable video content."
    ],
    "takeaway": "ABHI Ka Star demonstrates how Genesis Media can translate a clear marketing objective into a practical content system—combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "slug": "abhi-ka-star",
    "keyword": "video production agency Mumbai",
    "clip": "studios-abhi-ka-star"
  },
  {
    "n": 28,
    "division": "Studios",
    "headline": "Inside Genesis Media's Video Production for ABHI World Menopause Day",
    "brand": "Aditya Birla Health Insurance",
    "industry": "Health insurance and wellness",
    "service": "Video production, motion design and content adaptation",
    "campaign": "ABHI World Menopause Day",
    "highlight": null,
    "flagged": true,
    "brief": [
      "Genesis worked with gynaecologist Dr Ameya Kanakiya to create medically grounded, approachable content around menopause. Myth-busting and practical guidance were designed for long-form and social edits.",
      "The film needed to communicate quickly across digital and presentation environments. Genesis therefore had to balance information, visual pace and brand accuracy while planning for multiple versions and attention spans."
    ],
    "approach": [
      "Genesis built the narrative around one clear promise: medical authority without the lecture. The information was sequenced into short story steps so viewers could follow the message without the film becoming a list of disconnected claims or event moments.",
      "The approach was effective because it reduced the message to a clear viewing journey. Strong information hierarchy and planned versioning made the content useful beyond a single placement or moment."
    ],
    "execution": [
      "Script and narrative structure",
      "Production, editing and motion-graphics treatment",
      "Primary master and channel-specific adaptations"
    ],
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "results": [
      "For brand and marketing teams, this shows how Genesis can turn complex information or live production moments into clear, reusable video content."
    ],
    "takeaway": "ABHI World Menopause Day demonstrates how Genesis Media can translate a clear marketing objective into a practical content system—combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "slug": "abhi-world-menopause-day",
    "keyword": "video production agency Mumbai",
    "clip": "studios-final-menopause-abhi-02"
  },
  {
    "n": 29,
    "division": "Studios",
    "headline": "Inside Genesis Media's Video Production for ABHI Activ Travel",
    "brand": "Aditya Birla Health Insurance",
    "industry": "Health insurance and wellness",
    "service": "Video production, motion design and content adaptation",
    "campaign": "ABHI Activ Travel",
    "highlight": null,
    "flagged": false,
    "brief": [
      "Genesis combined real performances with AI environments to cover leisure, honeymoon, senior and other traveller needs without a conventional multi-country shoot. Each plan has its own narrative while sharing one production language.",
      "The film needed to communicate quickly across digital and presentation environments. Genesis therefore had to balance information, visual pace and brand accuracy while planning for multiple versions and attention spans."
    ],
    "approach": [
      "Genesis built the narrative around one clear promise: creator performance meets ai-generated travel worlds. The information was sequenced into short story steps so viewers could follow the message without the film becoming a list of disconnected claims or event moments.",
      "The approach was effective because it reduced the message to a clear viewing journey. Strong information hierarchy and planned versioning made the content useful beyond a single placement or moment."
    ],
    "execution": [
      "Script and narrative structure",
      "Production, editing and motion-graphics treatment",
      "Primary master and channel-specific adaptations"
    ],
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "results": [
      "For brand and marketing teams, this shows how Genesis can turn complex information or live production moments into clear, reusable video content."
    ],
    "takeaway": "ABHI Activ Travel demonstrates how Genesis Media can translate a clear marketing objective into a practical content system—combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "slug": "abhi-activ-travel",
    "keyword": "video production agency Mumbai",
    "clip": "studios-activ-travel-leisure-plan-finalhd-1"
  },
  {
    "n": 30,
    "division": "Studios",
    "headline": "Inside Genesis Media's Video Production for Mpower Minds x ABHI",
    "brand": "Aditya Birla Health Insurance",
    "industry": "Health insurance and wellness",
    "service": "Video production, motion design and content adaptation",
    "campaign": "Mpower Minds x ABHI",
    "highlight": "20K+ views, 1K+ likes and 50+ shares.",
    "flagged": false,
    "brief": [
      "Genesis developed four focused films with psychologist Dr Reet Patel, pairing one useful question per video with a warm on-camera tone and adaptations for landscape and vertical formats.",
      "The film needed to communicate quickly across digital and presentation environments. Genesis therefore had to balance information, visual pace and brand accuracy while planning for multiple versions and attention spans."
    ],
    "approach": [
      "Genesis built the narrative around one clear promise: mental-health expertise made human. The information was sequenced into short story steps so viewers could follow the message without the film becoming a list of disconnected claims or event moments.",
      "The approach was effective because it reduced the message to a clear viewing journey. Strong information hierarchy and planned versioning made the content useful beyond a single placement or moment."
    ],
    "execution": [
      "Script and narrative structure",
      "Production, editing and motion-graphics treatment",
      "Primary master and channel-specific adaptations"
    ],
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "results": [
      "For brand and marketing teams, this shows how Genesis can turn complex information or live production moments into clear, reusable video content."
    ],
    "takeaway": "Mpower Minds x ABHI demonstrates how Genesis Media can translate a clear marketing objective into a practical content system—combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "slug": "mpower-minds-x-abhi",
    "keyword": "video production agency Mumbai",
    "clip": "studios-1x1"
  },
  {
    "n": 31,
    "division": "Studios",
    "headline": "Inside Genesis Media's Video Production for ABHI Diabetes Awareness",
    "brand": "Aditya Birla Health Insurance",
    "industry": "Health insurance and wellness",
    "service": "Video production, motion design and content adaptation",
    "campaign": "ABHI Diabetes Awareness",
    "highlight": "123K views, 3K likes and 107 comments.",
    "flagged": false,
    "brief": [
      "Genesis used a recognisable social scenario and comedy to hold attention before landing the importance of diabetes awareness and health protection.",
      "The film needed to communicate quickly across digital and presentation environments. Genesis therefore had to balance information, visual pace and brand accuracy while planning for multiple versions and attention spans."
    ],
    "approach": [
      "Genesis built the narrative around one clear promise: humour opens a serious health conversation. The information was sequenced into short story steps so viewers could follow the message without the film becoming a list of disconnected claims or event moments.",
      "The approach was effective because it reduced the message to a clear viewing journey. Strong information hierarchy and planned versioning made the content useful beyond a single placement or moment."
    ],
    "execution": [
      "Script and narrative structure",
      "Production, editing and motion-graphics treatment",
      "Primary master and channel-specific adaptations"
    ],
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "results": [
      "For brand and marketing teams, this shows how Genesis can turn complex information or live production moments into clear, reusable video content."
    ],
    "takeaway": "ABHI Diabetes Awareness demonstrates how Genesis Media can translate a clear marketing objective into a practical content system—combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "slug": "abhi-diabetes-awareness",
    "keyword": "video production agency Mumbai",
    "clip": "studios-b1"
  },
  {
    "n": 32,
    "division": "Studios",
    "headline": "Inside Genesis Media's Video Production for DHA Face Scan",
    "brand": "Aditya Birla Health Insurance",
    "industry": "Health insurance and wellness",
    "service": "Video production, motion design and content adaptation",
    "campaign": "DHA Face Scan",
    "highlight": null,
    "flagged": false,
    "brief": [
      "Genesis created a presenter-led explainer around the Digital Health Assessment face scan, pairing a human guide with concise visual cues so users can understand the action quickly.",
      "The film needed to communicate quickly across digital and presentation environments. Genesis therefore had to balance information, visual pace and brand accuracy while planning for multiple versions and attention spans."
    ],
    "approach": [
      "Genesis built the narrative around one clear promise: a health assessment made easy to understand. The information was sequenced into short story steps so viewers could follow the message without the film becoming a list of disconnected claims or event moments.",
      "The approach was effective because it reduced the message to a clear viewing journey. Strong information hierarchy and planned versioning made the content useful beyond a single placement or moment."
    ],
    "execution": [
      "Script and narrative structure",
      "Production, editing and motion-graphics treatment",
      "Primary master and channel-specific adaptations"
    ],
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "results": [
      "For brand and marketing teams, this shows how Genesis can turn complex information or live production moments into clear, reusable video content."
    ],
    "takeaway": "DHA Face Scan demonstrates how Genesis Media can translate a clear marketing objective into a practical content system—combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "slug": "dha-face-scan",
    "keyword": "video production agency Mumbai",
    "clip": "studios-dha-1"
  },
  {
    "n": 33,
    "division": "Studios",
    "headline": "Inside Genesis Media's Video Production for Income Protect Cover",
    "brand": "Aditya Birla Health Insurance",
    "industry": "Health insurance and wellness",
    "service": "Video production, motion design and content adaptation",
    "campaign": "Income Protect Cover",
    "highlight": null,
    "flagged": false,
    "brief": [
      "Genesis visualised eligibility, continuous hospitalisation and the distinction between income protection and hospital bills using a clear AI-led narrative built for social viewing.",
      "The film needed to communicate quickly across digital and presentation environments. Genesis therefore had to balance information, visual pace and brand accuracy while planning for multiple versions and attention spans."
    ],
    "approach": [
      "Genesis built the narrative around one clear promise: complex insurance logic simplified through ai storytelling. The information was sequenced into short story steps so viewers could follow the message without the film becoming a list of disconnected claims or event moments.",
      "The approach was effective because it reduced the message to a clear viewing journey. Strong information hierarchy and planned versioning made the content useful beyond a single placement or moment."
    ],
    "execution": [
      "Script and narrative structure",
      "Production, editing and motion-graphics treatment",
      "Primary master and channel-specific adaptations"
    ],
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "results": [
      "For brand and marketing teams, this shows how Genesis can turn complex information or live production moments into clear, reusable video content."
    ],
    "takeaway": "Income Protect Cover demonstrates how Genesis Media can translate a clear marketing objective into a practical content system—combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "slug": "income-protect-cover",
    "keyword": "BFSI video production",
    "clip": "studios-7-draft6-income-protect"
  },
  {
    "n": 34,
    "division": "Studios",
    "headline": "Inside Genesis Media's Video Production for Eat Move Heal",
    "brand": "Aditya Birla Health Insurance",
    "industry": "Health insurance and wellness",
    "service": "Video production, motion design and content adaptation",
    "campaign": "Eat Move Heal",
    "highlight": null,
    "flagged": false,
    "brief": [
      "Genesis used playful motion and game-inspired visual language to connect nutrition, movement and recovery into a memorable health journey.",
      "The film needed to communicate quickly across digital and presentation environments. Genesis therefore had to balance information, visual pace and brand accuracy while planning for multiple versions and attention spans."
    ],
    "approach": [
      "Genesis built the narrative around one clear promise: wellness behaviours connected in one energetic system. The information was sequenced into short story steps so viewers could follow the message without the film becoming a list of disconnected claims or event moments.",
      "The approach was effective because it reduced the message to a clear viewing journey. Strong information hierarchy and planned versioning made the content useful beyond a single placement or moment."
    ],
    "execution": [
      "Script and narrative structure",
      "Production, editing and motion-graphics treatment",
      "Primary master and channel-specific adaptations"
    ],
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "results": [
      "For brand and marketing teams, this shows how Genesis can turn complex information or live production moments into clear, reusable video content."
    ],
    "takeaway": "Eat Move Heal demonstrates how Genesis Media can translate a clear marketing objective into a practical content system—combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "slug": "eat-move-heal",
    "keyword": "video production agency Mumbai",
    "clip": "studios-1-draft-9-eat-move-heal"
  },
  {
    "n": 35,
    "division": "Studios",
    "headline": "Inside Genesis Media's Video Production for Mahindra Finance Founders' Day 2025",
    "brand": "Mahindra Finance",
    "industry": "BFSI and financial services",
    "service": "Event content production and social-first editing",
    "campaign": "Mahindra Finance Founders' Day 2025",
    "highlight": null,
    "flagged": false,
    "brief": [
      "Genesis shaped leadership and team moments into an event film that records the occasion while retaining the warmth of a people-led culture story.",
      "The film needed to communicate quickly across digital and presentation environments. Genesis therefore had to balance information, visual pace and brand accuracy while planning for multiple versions and attention spans."
    ],
    "approach": [
      "Genesis built the narrative around one clear promise: a milestone film built around people and legacy. The information was sequenced into short story steps so viewers could follow the message without the film becoming a list of disconnected claims or event moments.",
      "The approach was effective because it reduced the message to a clear viewing journey. Strong information hierarchy and planned versioning made the content useful beyond a single placement or moment."
    ],
    "execution": [
      "Event coverage plan and story beats",
      "Multi-zone production and rapid editorial workflow",
      "Vertical, landscape and social-first deliverables"
    ],
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "results": [
      "For brand and marketing teams, this shows how Genesis can turn complex information or live production moments into clear, reusable video content."
    ],
    "takeaway": "Mahindra Finance Founders' Day 2025 demonstrates how Genesis Media can translate a clear marketing objective into a practical content system—combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "slug": "mahindra-finance-founders-day-2025",
    "keyword": "event content production",
    "clip": "studios-mahindra-cut-44"
  },
  {
    "n": 36,
    "division": "Studios",
    "headline": "Inside Genesis Media's Video Production for ABHI Utsav Milestone",
    "brand": "Aditya Birla Health Insurance",
    "industry": "Health insurance and wellness",
    "service": "Event content production and social-first editing",
    "campaign": "ABHI Utsav Milestone",
    "highlight": null,
    "flagged": true,
    "brief": [
      "Genesis captured leadership moments and programme highlights, then shaped them into a social-first aftermovie rather than a chronological event record.",
      "The film needed to communicate quickly across digital and presentation environments. Genesis therefore had to balance information, visual pace and brand accuracy while planning for multiple versions and attention spans."
    ],
    "approach": [
      "Genesis built the narrative around one clear promise: leadership and event content designed for digital life. The information was sequenced into short story steps so viewers could follow the message without the film becoming a list of disconnected claims or event moments.",
      "The approach was effective because it reduced the message to a clear viewing journey. Strong information hierarchy and planned versioning made the content useful beyond a single placement or moment."
    ],
    "execution": [
      "Event coverage plan and story beats",
      "Multi-zone production and rapid editorial workflow",
      "Vertical, landscape and social-first deliverables"
    ],
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "results": [
      "For brand and marketing teams, this shows how Genesis can turn complex information or live production moments into clear, reusable video content."
    ],
    "takeaway": "ABHI Utsav Milestone demonstrates how Genesis Media can translate a clear marketing objective into a practical content system—combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "slug": "abhi-utsav-milestone",
    "keyword": "event content production",
    "clip": "studios-utsav-aftermovie"
  },
  {
    "n": 37,
    "division": "Studios",
    "headline": "Inside Genesis Media's Video Production for HDFC Bank x ABHI",
    "brand": "HDFC Bank and Aditya Birla Health Insurance",
    "industry": "Health insurance and wellness",
    "service": "Video production, motion design and content adaptation",
    "campaign": "HDFC Bank x ABHI",
    "highlight": null,
    "flagged": false,
    "brief": [
      "Genesis reorganised detailed insurance information into clear steps, visual supers and motion-led explanations. Versioning supported partner and product contexts without rebuilding the complete narrative.",
      "The film needed to communicate quickly across digital and presentation environments. Genesis therefore had to balance information, visual pace and brand accuracy while planning for multiple versions and attention spans."
    ],
    "approach": [
      "Genesis built the narrative around one clear promise: insurance explainers people can follow. The information was sequenced into short story steps so viewers could follow the message without the film becoming a list of disconnected claims or event moments.",
      "The approach was effective because it reduced the message to a clear viewing journey. Strong information hierarchy and planned versioning made the content useful beyond a single placement or moment."
    ],
    "execution": [
      "Script and narrative structure",
      "Production, editing and motion-graphics treatment",
      "Primary master and channel-specific adaptations"
    ],
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "results": [
      "For brand and marketing teams, this shows how Genesis can turn complex information or live production moments into clear, reusable video content."
    ],
    "takeaway": "HDFC Bank x ABHI demonstrates how Genesis Media can translate a clear marketing objective into a practical content system—combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "slug": "hdfc-bank-x-abhi",
    "keyword": "BFSI video production",
    "clip": "studios-hdfc-x-abhi-sampoorna2-0"
  },
  {
    "n": 38,
    "division": "Studios",
    "headline": "Inside Genesis Media's Video Production for Unveiling Activ One",
    "brand": "Aditya Birla Health Insurance",
    "industry": "Health insurance and wellness",
    "service": "Event content production and social-first editing",
    "campaign": "Unveiling Activ One",
    "highlight": null,
    "flagged": false,
    "brief": [
      "Genesis planned dynamic coverage, brand-led story beats and pace-focused editing so the launch film communicated the character of Activ One and continued to work as an evergreen digital asset. The film needed to communicate quickly across digital and presentation environments. Genesis therefore had to balance information, visual pace and brand accuracy while planning for multiple versions and attention spans."
    ],
    "approach": [
      "Genesis built the narrative around one clear promise: a launch event built to live beyond the room. The information was sequenced into short story steps so viewers could follow the message without the film becoming a list of disconnected claims or event moments.",
      "The approach was effective because it reduced the message to a clear viewing journey. Strong information hierarchy and planned versioning made the content useful beyond a single placement or moment."
    ],
    "execution": [
      "Event coverage plan and story beats",
      "Multi-zone production and rapid editorial workflow",
      "Vertical, landscape and social-first deliverables"
    ],
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "results": [
      "For brand and marketing teams, this shows how Genesis can turn complex information or live production moments into clear, reusable video content."
    ],
    "takeaway": "Unveiling Activ One demonstrates how Genesis Media can translate a clear marketing objective into a practical content system—combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "slug": "unveiling-activ-one",
    "keyword": "event content production",
    "clip": "studios-on-dec-1-2023-we-ushered-in-a-new-era-of-100-health-and-100-health-insurance"
  },
  {
    "n": 39,
    "division": "Studios",
    "headline": "Inside Genesis Media's Video Production for UMANG 2024",
    "brand": "Aditya Birla Health Insurance",
    "industry": "Health insurance and wellness",
    "service": "Event content production and social-first editing",
    "campaign": "UMANG 2024",
    "highlight": "29 videos completed within one week.",
    "flagged": false,
    "brief": [
      "Genesis coordinated creative direction, production, videography and editing across multiple zones, stages, leadership moments and performances, producing both vertical and landscape assets in a compressed window.",
      "The film needed to communicate quickly across digital and presentation environments. Genesis therefore had to balance information, visual pace and brand accuracy while planning for multiple versions and attention spans."
    ],
    "approach": [
      "Genesis built the narrative around one clear promise: high-volume event content delivered at speed. The information was sequenced into short story steps so viewers could follow the message without the film becoming a list of disconnected claims or event moments.",
      "The approach was effective because it reduced the message to a clear viewing journey. Strong information hierarchy and planned versioning made the content useful beyond a single placement or moment."
    ],
    "execution": [
      "Event coverage plan and story beats",
      "Multi-zone production and rapid editorial workflow",
      "Vertical, landscape and social-first deliverables"
    ],
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "results": [
      "For brand and marketing teams, this shows how Genesis can turn complex information or live production moments into clear, reusable video content."
    ],
    "takeaway": "UMANG 2024 demonstrates how Genesis Media can translate a clear marketing objective into a practical content system—combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "slug": "umang-2024",
    "keyword": "event content production",
    "clip": "studios-umang-2024"
  },
  {
    "n": 40,
    "division": "Studios",
    "headline": "Inside Genesis Media's Video Production for Manthan — Power of Ten",
    "brand": "Aditya Birla Health Insurance",
    "industry": "Health insurance and wellness",
    "service": "Event content production and social-first editing",
    "campaign": "Manthan — Power of Ten",
    "highlight": "Two high-resolution LED films.",
    "flagged": false,
    "brief": [
      "Genesis created high-resolution films for a live LED environment, using bold composition, legible messaging and event-ready mastering to communicate ABHI's scale and ambition.",
      "The film needed to communicate quickly across digital and presentation environments. Genesis therefore had to balance information, visual pace and brand accuracy while planning for multiple versions and attention spans."
    ],
    "approach": [
      "Genesis built the narrative around one clear promise: a strategic milestone designed for large screens. The information was sequenced into short story steps so viewers could follow the message without the film becoming a list of disconnected claims or event moments.",
      "The approach was effective because it reduced the message to a clear viewing journey. Strong information hierarchy and planned versioning made the content useful beyond a single placement or moment."
    ],
    "execution": [
      "Script and narrative structure",
      "Production, editing and motion-graphics treatment",
      "Primary master and channel-specific adaptations"
    ],
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "results": [
      "For brand and marketing teams, this shows how Genesis can turn complex information or live production moments into clear, reusable video content."
    ],
    "takeaway": "Manthan — Power of Ten demonstrates how Genesis Media can translate a clear marketing objective into a practical content system—combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "slug": "manthan-power-of-ten",
    "keyword": "event content production",
    "clip": "studios-abhi-ex-coms"
  }
];

/**
 * FILM ONLY, NO WRITE-UP. Genesis asked for FOY, Dove, L'Oréal Professionnel
 * and the Arjun Rampal & Gabriella Demetriades x HT Brunch piece to keep
 * their videos on /case-studies without a case study beside them, so their
 * copy is removed from this file rather than hidden. `n` keeps each in the
 * master document's position; `brand` is only the video's accessible name.
 */
export const videoOnlyStudies: { n: number; brand: string; clip: ReelId }[] = [
  {
    "n": 10,
    "brand": "FOY",
    "clip": 22
  },
  {
    "n": 11,
    "brand": "Dove",
    "clip": 27
  },
  {
    "n": 12,
    "brand": "L'Oréal Professionnel",
    "clip": 28
  },
  {
    "n": 13,
    "brand": "HT Brunch",
    "clip": 26
  }
];

export function findCopy(n: number): CaseStudyCopy | undefined {
  return caseStudyCopy.find((entry) => entry.n === n);
}
