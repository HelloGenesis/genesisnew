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
export type ProductImage = { src: string; alt: string; contain?: boolean };

const P = (file: string, alt: string): ProductImage => ({ src: `/work/posters/${file}`, alt });
const AVATAR = (name: string, label: string): ProductImage => ({ src: `/avatars/${name}.jpg`, alt: `${label}, a Genesis AI avatar` });
const MARK = (src: string, alt: string): ProductImage => ({ src, alt, contain: true });

const ACTIV_HEALTH = [1, 2, 3, 4, 5].map((n) =>
  MARK(`/brand/activ-health/${n}.png`, n === 5 ? "Activ Health app logo, the redesign" : `Activ Health logo, sketch ${n}`),
);
const GENESIS_MARKS = [
  MARK("/brand/genesis-n.png", "The Genesis N mark"),
  MARK("/brand/genesis-n-fluffy.png", "The Genesis N mark, soft render"),
];

export const productImages: Record<string, ProductImage[]> = {
  /* AI Lab */
  "Build Your AI Avatar Clone": [
    AVATAR("tanvi", "Tanvi"),
    AVATAR("jesko", "Jesko"),
    AVATAR("ivaanat", "Ivaanat"),
    AVATAR("adi", "Adi"),
    AVATAR("diya", "Diya"),
    AVATAR("shivam", "Shivam"),
    AVATAR("bharat", "Bharat"),
  ],
  "AI Video Campaign Content Pack": [
    P("ai-lab-tanvi-uiiui.jpg", "AI avatar video with Tanvi"),
    P("ai-lab-bharat-bharat.jpg", "AI avatar video for Advocate Bharat"),
    P("ai-lab-shivam-sh1.jpg", "AI avatar video with Shivam"),
    P("29.jpg", "AI content reel"),
    P("33.jpg", "AI property film"),
    P("ai-lab-tanvi-b2813828.jpg", "AI video with Tanvi"),
  ],
  "AI Product Explainer + Advance Motion Graphics": [
    P("ai-lab-1-2-9x16-main-product-explainer-activ-yuva.jpg", "Activ Yuva product explainer"),
    P("ai-lab-2-1-9x16-health-returns-activ-yuva.jpg", "Activ Yuva Health Returns explainer"),
    P("ai-lab-shivam-sh2.jpg", "AI explainer with Shivam"),
    P("32.jpg", "AI brand content"),
  ],
  "AI Campaign Film + Advanced Motion Graphic Video": [
    P("ai-lab-sinet-english-v004.jpg", "SINet AI brand film"),
    P("33.jpg", "AI property film"),
    P("32.jpg", "AI brand content"),
    P("ai-lab-tanvi-photos.jpg", "AI campaign stills with Tanvi"),
  ],

  /* Studios */
  "Reel Editing Pack": [
    P("studios-abhi-ka-star.jpg", "ABHI Ka Star reel"),
    P("studios-friends-final-1.jpg", "Edited social reel"),
    P("studios-tripagetet.jpg", "TripGate travel reel"),
    P("studios-women-s-day-abhi.jpg", "ABHI Women's Day reel"),
    P("studios-final-menopause-abhi-02.jpg", "ABHI World Menopause Day reel"),
    P("studios-1-draft-9-eat-move-heal.jpg", "Eat Move Heal reel"),
  ],
  "Founder / CEO Video Shoot": [
    P("studios-mr-mayank-bathwal-ceo-aditya-birla-health-insurance.jpg", "CEO film for Aditya Birla Health Insurance"),
    P("studios-abhi-ex-coms.jpg", "Leadership communication film"),
    P("studios-wo-vo-sales-pro.jpg", "ABHI Sales Pro film"),
    P("studios-video-001.jpg", "Spokesperson video"),
  ],
  "Half-Day Content Shoot": [
    P("studios-hdfc-x-abhi-sampoorna2-0.jpg", "HDFC Bank x ABHI content shoot"),
    P("studios-dha-1.jpg", "DHA Face Scan content"),
    P("studios-6-common-mistakes.jpg", "Social content from a shoot"),
    P("studios-b1.jpg", "Branded content shoot"),
    P("studios-video-02.jpg", "Shoot day content"),
    P("studios-1x1.jpg", "Square social cut"),
  ],
  "Event Content Coverage": [
    P("studios-umang-2024.jpg", "UMANG 2024 event film"),
    P("studios-utsav-aftermovie.jpg", "Utsav aftermovie"),
    P("studios-on-dec-1-2023-we-ushered-in-a-new-era-of-100-health-and-100-health-insurance.jpg", "Activ One launch event"),
    P("studios-with-hdfc-slide.jpg", "HDFC Bank event content"),
  ],

  /* Brand & Design: Activ Health's logo redesign, and Genesis's own marks */
  "Logo Refresh": [...ACTIV_HEALTH],
  "Campaign Creative Kit": [MARK("/brand/activ-health/5.png", "Activ Health app logo"), ...GENESIS_MARKS, P("studios-7-draft6-income-protect.jpg", "Income Protect campaign creative")],
  "Pitch Deck Makeover": [...GENESIS_MARKS, MARK("/brand/genesis-membership-card.webp", "The Genesis membership card")],
  "Brand Build": [...ACTIV_HEALTH, ...GENESIS_MARKS, MARK("/brand/genesis-membership-card.webp", "The Genesis membership card")],
  "Marketing Launch Kit": [...ACTIV_HEALTH.slice(3), ...GENESIS_MARKS, MARK("/brand/genesis-membership-card.webp", "The Genesis membership card")],

  /* Influence */
  "UGC Starter Pack": [
    P("21.jpg", "Study abroad creator content"),
    P("22.jpg", "Social creator content"),
    P("27.jpg", "Hair care creator content"),
    P("26.jpg", "Editorial creator content"),
  ],
  "UGC Performance Pack": [
    P("27.jpg", "Hair care creator content"),
    P("21.jpg", "Study abroad creator content"),
    P("26.jpg", "Editorial creator content"),
    P("22.jpg", "Social creator content"),
    P("16.jpg", "Influencer content campaign"),
    P("1.jpg", "Content and campaign work"),
  ],
  "Influencer Campaign Management": [
    P("16.jpg", "Influencer content campaign"),
    P("1.jpg", "Content and campaign work"),
    { src: "/creators/influencers/vikrant-massey.jpg", alt: "Vikrant Massey, campaign talent" },
    { src: "/creators/influencers/gunika-sethi.jpg", alt: "Gunika Sethi, creator" },
    { src: "/creators/influencers/kamya-sidana.jpg", alt: "Kamya Sidana, creator" },
    { src: "/creators/influencers/parvi-sharma.jpg", alt: "Parvi Sharma, creator" },
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
