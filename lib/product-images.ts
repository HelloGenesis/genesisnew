/**
 * PICTURES FOR EACH PAY-PER-PROJECT PRODUCT, in its homepage pop-up (Genesis,
 * 2 Oct 2026: "add a photo slider here for product images … for all the pay
 * per project").
 *
 * There are no product photographs yet, so each product shows Genesis's own
 * work of that kind — the avatar portraits for Build Your AI Avatar, the
 * explainer films for AI Product Explainer, the CEO films for Founder / CEO
 * Video Shoot — and the gallery says so ("Previous work & case studies"). Swap in real
 * product shots here, one list per product, by its name in lib/products.
 *
 * `contain` is for a mark or logo that must not be cropped: it sits whole on
 * a light ground, as the Brand & Design section shows the same art.
 */
export type ProductImage = {
  src: string;
  alt: string;
  contain?: boolean;
  /** What this picture shows the buyer gets, on the picture (Genesis, 9 Oct 2026). */
  title?: string;
  caption?: string;
  /** Genesis's own past work, not a product shot: plays this film where there is one. */
  work?: boolean;
  clip?: string;
};

const WORK = (id: string, label: string): ProductImage => ({
  src: `/work/posters/${id}.jpg`,
  clip: `/work/clips/${id}.mp4`,
  alt: label,
  title: label,
  work: true,
});
const STILL = (src: string, label: string): ProductImage => ({ src, alt: label, title: label, work: true, contain: true });

/*
  GENESIS'S OWN PRODUCT IMAGES (9 Oct 2026, from the "Product Images" Drive
  folder), each carrying a line on what the buyer gets, then a few pieces
  of Genesis's own past work of that kind, playing, so a buyer sees the
  output as well as the offer ("merge a few case studies or previous
  work right there"). Files under public/products/<product>.
*/
export const productImages: Record<string, ProductImage[]> = {
  "Build Your AI Avatar Clone": [
    { src: "/products/build-your-ai-avatar-clone/1.jpg", alt: "Build Your AI Avatar Clone: Your digital twin", title: "Your digital twin", caption: "A realistic AI avatar of you, built once from a short training session." },
    { src: "/products/build-your-ai-avatar-clone/2.jpg", alt: "Build Your AI Avatar Clone: Your voice, cloned", title: "Your voice, cloned", caption: "A standard AI voice clone, so your avatar sounds like you." },
    { src: "/products/build-your-ai-avatar-clone/3.jpg", alt: "Build Your AI Avatar Clone: 3 videos to start", title: "3 videos to start", caption: "Three standard AI videos featuring your avatar, delivered in 1080p." },
    { src: "/products/build-your-ai-avatar-clone/4.jpg", alt: "Build Your AI Avatar Clone: Any setting, any look", title: "Any setting, any look", caption: "Studio, office or stage, with your products in shot." },
    { src: "/products/build-your-ai-avatar-clone/5.jpg", alt: "Build Your AI Avatar Clone: Reuse it for months", title: "Reuse it for months", caption: "New founder-led, social and explainer videos, without a fresh shoot." },
    WORK("ai-lab-tanvi-uiiui", "Tanvi's AI avatar in a brand reel"),
    WORK("ai-lab-shivam-sh1", "Shivam's AI avatar, founder update"),
    WORK("ai-lab-bharat-bharat", "Advocate Bharat's AI avatar"),
  ],
  "AI Video Campaign Content Pack": [
    { src: "/products/ai-video-campaign-content-pack/1.jpg", alt: "AI Video Campaign Content Pack: Idea to script", title: "Idea to script", caption: "We write the concept and scripts for all 4 videos." },
    { src: "/products/ai-video-campaign-content-pack/2.jpg", alt: "AI Video Campaign Content Pack: AI visuals, made for you", title: "AI visuals, made for you", caption: "AI-generated scenes, stock B-roll and your product, styled to your brand." },
    { src: "/products/ai-video-campaign-content-pack/3.jpg", alt: "AI Video Campaign Content Pack: Voice, music, captions", title: "Voice, music, captions", caption: "AI voiceover, background music and captions on every video." },
    { src: "/products/ai-video-campaign-content-pack/4.jpg", alt: "AI Video Campaign Content Pack: Ready to publish", title: "Ready to publish", caption: "4 videos up to 30 sec each, in 9:16 or 16:9, at 1080p." },
    WORK("ai-lab-tanvi-b2813828", "AI video with Tanvi"),
    WORK("29", "AI content reel"),
    WORK("33", "AI property film"),
  ],
  "AI Product Explainer + Advance Motion Graphics": [
    { src: "/products/ai-product-explainer-advance-motion-graphics/1.jpg", alt: "AI Product Explainer + Advance Motion Graphics: Complex, made simple", title: "Complex, made simple", caption: "A 45-second explainer for one product, service or feature." },
    { src: "/products/ai-product-explainer-advance-motion-graphics/2.jpg", alt: "AI Product Explainer + Advance Motion Graphics: Storyboard first", title: "Storyboard first", caption: "Script, storyboard and visual direction before production starts." },
    { src: "/products/ai-product-explainer-advance-motion-graphics/3.jpg", alt: "AI Product Explainer + Advance Motion Graphics: Motion graphics", title: "Motion graphics", caption: "Animated product, UI and data moments that hold attention." },
    { src: "/products/ai-product-explainer-advance-motion-graphics/4.jpg", alt: "AI Product Explainer + Advance Motion Graphics: One polished master", title: "One polished master", caption: "AI voiceover, music and captions, in 16:9 or 9:16 at 1080p." },
    WORK("ai-lab-1-2-9x16-main-product-explainer-activ-yuva", "Activ Yuva product explainer"),
    WORK("ai-lab-2-1-9x16-health-returns-activ-yuva", "Activ Yuva HealthReturns explainer"),
    WORK("ai-lab-shivam-sh2", "Product explainer with Shivam"),
  ],
  "AI Campaign Film + Advanced Motion Graphic Video": [
    { src: "/products/ai-campaign-film-advanced-motion-graphic-video/1.jpg", alt: "AI Campaign Film + Advanced Motion Graphic Video: One big idea", title: "One big idea", caption: "A creative concept and script for your hero campaign film." },
    { src: "/products/ai-campaign-film-advanced-motion-graphic-video/2.jpg", alt: "AI Campaign Film + Advanced Motion Graphic Video: Custom AI scenes", title: "Custom AI scenes", caption: "Moodboard-led, custom AI-generated scenes built around your brand." },
    { src: "/products/ai-campaign-film-advanced-motion-graphic-video/3.jpg", alt: "AI Campaign Film + Advanced Motion Graphic Video: Advanced motion", title: "Advanced motion", caption: "Compositing, motion graphics and sound design for a premium finish." },
    { src: "/products/ai-campaign-film-advanced-motion-graphic-video/4.jpg", alt: "AI Campaign Film + Advanced Motion Graphic Video: A 45-second hero film", title: "A 45-second hero film", caption: "One 16:9 master in 1080p, ready for launch." },
    WORK("ai-lab-sinet-english-v004", "SINet AI brand film"),
    WORK("33", "AI property film"),
    WORK("32", "AI brand content"),
  ],
  "Reel Editing Pack": [
    { src: "/products/reel-editing-pack/1.jpg", alt: "Reel Editing Pack: Send your footage", title: "Send your footage", caption: "We pick the best moments from what you already have." },
    { src: "/products/reel-editing-pack/2.jpg", alt: "Reel Editing Pack: Edited to stop the scroll", title: "Edited to stop the scroll", caption: "Up to 7 reels, up to 30 sec each, cut for social." },
    { src: "/products/reel-editing-pack/3.jpg", alt: "Reel Editing Pack: Captions and brand styling", title: "Captions and brand styling", caption: "Captions, basic motion graphics and copyright-safe music." },
    { src: "/products/reel-editing-pack/4.jpg", alt: "Reel Editing Pack: Ready in 9:16", title: "Ready in 9:16", caption: "Colour-corrected, audio-cleaned exports in 1080p." },
    WORK("studios-abhi-ka-star", "ABHI Ka Star reel"),
    WORK("studios-women-s-day-abhi", "ABHI Women's Day reel"),
    WORK("studios-1-draft-9-eat-move-heal", "Eat Move Heal reel"),
  ],
  "Founder / CEO Video Shoot": [
    { src: "/products/founder-ceo-video-shoot/1.jpg", alt: "Founder / CEO Video Shoot: Planned and styled", title: "Planned and styled", caption: "Pre-shoot planning and styling references before the day." },
    { src: "/products/founder-ceo-video-shoot/2.jpg", alt: "Founder / CEO Video Shoot: A professional setup", title: "A professional setup", caption: "Camera, 2-point soft lighting and a lapel mic, on location." },
    { src: "/products/founder-ceo-video-shoot/3.jpg", alt: "Founder / CEO Video Shoot: One session, 7 videos", title: "One session, 7 videos", caption: "Seven edited videos, up to 30 sec each, from one shoot." },
    { src: "/products/founder-ceo-video-shoot/4.jpg", alt: "Founder / CEO Video Shoot: Polished to post", title: "Polished to post", caption: "Colour, audio clean-up and supers, delivered in 1080p." },
    WORK("studios-mr-mayank-bathwal-ceo-aditya-birla-health-insurance", "CEO film, Aditya Birla Health Insurance"),
    WORK("studios-abhi-ex-coms", "Leadership communication film"),
    WORK("studios-wo-vo-sales-pro", "ABHI Sales Pro film"),
  ],
  "Half-Day Content Shoot": [
    { src: "/products/half-day-content-shoot/1.jpg", alt: "Half-Day Content Shoot: A 5-hour shoot", title: "A 5-hour shoot", caption: "One location and one professional camera, planned in advance." },
    { src: "/products/half-day-content-shoot/2.jpg", alt: "Half-Day Content Shoot: Video and stills", title: "Video and stills", caption: "Up to 4 short-form videos and 10 edited photographs." },
    { src: "/products/half-day-content-shoot/3.jpg", alt: "Half-Day Content Shoot: Lit and miked", title: "Lit and miked", caption: "Lighting and professional audio for clean results." },
    { src: "/products/half-day-content-shoot/4.jpg", alt: "Half-Day Content Shoot: Branded and captioned", title: "Branded and captioned", caption: "Edited with captions and branding, in 9:16 or 16:9." },
    WORK("studios-hdfc-x-abhi-sampoorna2-0", "HDFC Bank x ABHI shoot"),
    WORK("studios-dha-1", "DHA Face Scan content"),
    WORK("studios-b1", "Branded content shoot"),
  ],
  "Event Content Coverage": [
    { src: "/products/event-content-coverage/1.jpg", alt: "Event Content Coverage: Two cameras, four hours", title: "Two cameras, four hours", caption: "Gimbal-mounted coverage of your event, start to finish." },
    { src: "/products/event-content-coverage/2.jpg", alt: "Event Content Coverage: Stage and speakers", title: "Stage and speakers", caption: "Keynotes, panels and the moments that matter on stage." },
    { src: "/products/event-content-coverage/3.jpg", alt: "Event Content Coverage: People and energy", title: "People and energy", caption: "Audience reactions, guest interactions and candid photos." },
    { src: "/products/event-content-coverage/4.jpg", alt: "Event Content Coverage: Aftermovie + 25 photos", title: "Aftermovie + 25 photos", caption: "One branded aftermovie and 25 edited high-resolution photographs." },
    WORK("studios-umang-2024", "UMANG 2024 event film"),
    WORK("studios-utsav-aftermovie", "Utsav aftermovie"),
    WORK("studios-on-dec-1-2023-we-ushered-in-a-new-era-of-100-health-and-100-health-insurance", "Activ One launch event"),
  ],
  "Logo Refresh": [
    { src: "/products/logo-refresh/1.jpg", alt: "Logo Refresh: Review and direction", title: "Review and direction", caption: "We review your current logo and set a creative direction." },
    { src: "/products/logo-refresh/2.jpg", alt: "Logo Refresh: 4 concepts, 4 mockups", title: "4 concepts, 4 mockups", caption: "Four logo options, each shown on real-world mockups." },
    { src: "/products/logo-refresh/3.jpg", alt: "Logo Refresh: Refined to final", title: "Refined to final", caption: "Two iterations, plus colour and typography refinement." },
    { src: "/products/logo-refresh/4.jpg", alt: "Logo Refresh: Every format you need", title: "Every format you need", caption: "Primary logo, a secondary variation, and PNG, JPG, SVG and PDF files." },
    STILL("/brand/activ-health/5.png", "Activ Health app logo, the redesign"),
    STILL("/brand/activ-health/1.png", "Activ Health logo, early sketch"),
  ],
  "Campaign Creative Kit": [
    { src: "/products/campaign-creative-kit/1.jpg", alt: "Campaign Creative Kit: One key visual", title: "One key visual", caption: "A campaign key visual that sets the look for everything else." },
    { src: "/products/campaign-creative-kit/2.jpg", alt: "Campaign Creative Kit: 7 campaign creatives", title: "7 campaign creatives", caption: "Seven creatives in one connected visual system." },
    { src: "/products/campaign-creative-kit/3.jpg", alt: "Campaign Creative Kit: Adapted for each channel", title: "Adapted for each channel", caption: "Up to 3 adaptations in your brand type and colour." },
    { src: "/products/campaign-creative-kit/4.jpg", alt: "Campaign Creative Kit: Social-ready exports", title: "Social-ready exports", caption: "Files ready to post, with 2 revision rounds per creative." },
    WORK("studios-7-draft6-income-protect", "Income Protect campaign creative"),
    WORK("studios-6-common-mistakes", "Campaign explainer creative"),
  ],
  "Pitch Deck Makeover": [
    { src: "/products/pitch-deck-makeover/1.jpg", alt: "Pitch Deck Makeover: Structure first", title: "Structure first", caption: "We restructure your content so the story is easy to follow." },
    { src: "/products/pitch-deck-makeover/2.jpg", alt: "Pitch Deck Makeover: Up to 22 slides, redesigned", title: "Up to 22 slides, redesigned", caption: "A full layout redesign with typography and a colour system." },
    { src: "/products/pitch-deck-makeover/3.jpg", alt: "Pitch Deck Makeover: Charts that read", title: "Charts that read", caption: "Charts, infographics and images styled to your brand." },
    { src: "/products/pitch-deck-makeover/4.jpg", alt: "Pitch Deck Makeover: Editable and PDF", title: "Editable and PDF", caption: "An editable deck plus a PDF, with 2 revision rounds." },
  ],
  "Brand Build": [
    { src: "/products/brand-build/1.jpg", alt: "Brand Build: Strategy and positioning", title: "Strategy and positioning", caption: "Discovery, positioning and the brand's personality and voice." },
    { src: "/products/brand-build/2.jpg", alt: "Brand Build: Identity and logo system", title: "Identity and logo system", caption: "A visual identity with logo, colour and typography systems." },
    { src: "/products/brand-build/3.jpg", alt: "Brand Build: Brand guidelines", title: "Brand guidelines", caption: "Clear rules so every team uses the brand the same way." },
    { src: "/products/brand-build/4.jpg", alt: "Brand Build: Brand collaterals", title: "Brand collaterals", caption: "The everyday materials your brand needs, designed to match." },
    STILL("/brand/activ-health/5.png", "Activ Health app logo, the redesign"),
  ],
  "Marketing Launch Kit": [
    { src: "/products/marketing-launch-kit/1.jpg", alt: "Marketing Launch Kit: 4 hero key visuals", title: "4 hero key visuals", caption: "The lead visuals for your launch, in one design system." },
    { src: "/products/marketing-launch-kit/2.jpg", alt: "Marketing Launch Kit: 15 social creatives", title: "15 social creatives", caption: "Plus 2 story adaptations for a launch-ready feed." },
    { src: "/products/marketing-launch-kit/3.jpg", alt: "Marketing Launch Kit: Email and banner", title: "Email and banner", caption: "2 mailer creatives and a digital banner to match." },
    { src: "/products/marketing-launch-kit/4.jpg", alt: "Marketing Launch Kit: Ready to publish", title: "Ready to publish", caption: "Export-ready files, with 2 revision rounds." },
    WORK("studios-7-draft6-income-protect", "Income Protect launch creative"),
  ],
  "UGC Starter Pack": [
    { src: "/products/ugc-starter-pack/1.jpg", alt: "UGC Starter Pack: A creator matched to you", title: "A creator matched to you", caption: "One creator who fits your audience and category." },
    { src: "/products/ugc-starter-pack/2.jpg", alt: "UGC Starter Pack: 4 natural UGC videos", title: "4 natural UGC videos", caption: "Phone-shot, creator-style videos that feel native to the feed." },
    { src: "/products/ugc-starter-pack/3.jpg", alt: "UGC Starter Pack: Hooks that land", title: "Hooks that land", caption: "Scripted openings built to stop the scroll." },
    { src: "/products/ugc-starter-pack/4.jpg", alt: "UGC Starter Pack: Organic or paid", title: "Organic or paid", caption: "Ready to post, or to test as paid social ads." },
    WORK("21", "Study abroad creator content"),
    WORK("22", "Social creator content"),
    WORK("27", "Hair care creator content"),
  ],
  "UGC Performance Pack": [
    { src: "/products/ugc-performance-pack/1.jpg", alt: "UGC Performance Pack: 3 creators, 10 videos", title: "3 creators, 10 videos", caption: "Ten performance-focused UGC videos across three creators." },
    { src: "/products/ugc-performance-pack/2.jpg", alt: "UGC Performance Pack: Hooks and angles to test", title: "Hooks and angles to test", caption: "Different hooks and angles, so you can find what converts." },
    { src: "/products/ugc-performance-pack/3.jpg", alt: "UGC Performance Pack: Professional camera", title: "Professional camera", caption: "Shot on a professional camera for a polished finish." },
    { src: "/products/ugc-performance-pack/4.jpg", alt: "UGC Performance Pack: Built for paid and organic", title: "Built for paid and organic", caption: "A bank of creative variations to test across channels." },
    WORK("26", "Editorial creator content"),
    WORK("27", "Hair care creator content"),
    WORK("16", "Influencer content campaign"),
  ],
  "Influencer Campaign Management": [
    { src: "/products/influencer-campaign-management/1.jpg", alt: "Influencer Campaign Management: Strategy first", title: "Strategy first", caption: "Objectives, audience and the campaign idea, set before anyone is briefed." },
    { src: "/products/influencer-campaign-management/2.jpg", alt: "Influencer Campaign Management: Creator discovery", title: "Creator discovery", caption: "Shortlisted from 1,00,000+ creators and verified for fit." },
    { src: "/products/influencer-campaign-management/3.jpg", alt: "Influencer Campaign Management: Negotiation and execution", title: "Negotiation and execution", caption: "Rates, briefs, approvals and posting, managed end to end." },
    { src: "/products/influencer-campaign-management/4.jpg", alt: "Influencer Campaign Management: Reporting", title: "Reporting", caption: "Results reported back, so you know what worked." },
    WORK("16", "Influencer content campaign"),
    WORK("1", "Content and campaign work"),
    WORK("21", "Study abroad creator campaign"),
  ],
};

/**
 * AVATARS GENESIS HAS BUILT — for Build Your AI Avatar Clone's "What's
 * included" (Genesis, 3 Oct 2026: "add 15–20 polished AI avatar images in
 * this section only"). The seven avatar portraits, then stills of those
 * avatars at work in Genesis's AI videos. Real work only: each is an avatar
 * Genesis made, named as the AI Lab section names it.
 */
export type AvatarShot = { src: string; name: string; line: string; kind: "Real person" | "Virtual" };

export const avatarShowcase: AvatarShot[] = [
  { src: "/avatars/tanvi.jpg", name: "Tanvi", line: "Head of Creative, Genesis", kind: "Real person" },
  { src: "/avatars/shivam.jpg", name: "Shivam", line: "Founder & CEO, Genesis", kind: "Real person" },
  { src: "/avatars/bharat.jpg", name: "Bharat", line: "Advocate", kind: "Real person" },
  { src: "/avatars/jesko.jpg", name: "Jesko", line: "DJ & techno artist", kind: "Real person" },
  { src: "/avatars/ivaanat.jpg", name: "Ivaanat", line: "Fashion & beauty creator", kind: "Virtual" },
  { src: "/avatars/adi.jpg", name: "Adi", line: "Aditya Birla Health Insurance", kind: "Virtual" },
  { src: "/avatars/diya.jpg", name: "Diya", line: "Aditya Birla Health Insurance", kind: "Virtual" },
  { src: "/work/posters/ai-lab-tanvi-uiiui.jpg", name: "Tanvi", line: "In a brand reel", kind: "Real person" },
  { src: "/work/posters/ai-lab-tanvi-b2813828.jpg", name: "Tanvi", line: "Presenting to camera", kind: "Real person" },
  { src: "/work/posters/ai-lab-tanvi-photos.jpg", name: "Tanvi", line: "Campaign stills", kind: "Real person" },
  { src: "/work/posters/ai-lab-shivam-sh1.jpg", name: "Shivam", line: "Founder update", kind: "Real person" },
  { src: "/work/posters/ai-lab-shivam-sh2.jpg", name: "Shivam", line: "Product explainer", kind: "Real person" },
  { src: "/work/posters/ai-lab-bharat-bharat.jpg", name: "Bharat", line: "Legal explainer", kind: "Real person" },
  { src: "/work/posters/ai-lab-1-2-9x16-main-product-explainer-activ-yuva.jpg", name: "Activ Yuva", line: "Product explainer host", kind: "Virtual" },
  { src: "/work/posters/ai-lab-2-1-9x16-health-returns-activ-yuva.jpg", name: "Activ Yuva", line: "Health Returns explainer", kind: "Virtual" },
  { src: "/work/posters/ai-lab-sinet-english-v004.jpg", name: "SINet", line: "AI brand film", kind: "Virtual" },
];
