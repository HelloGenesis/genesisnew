import { proof } from "./proof";

/**
 * Copy for the standalone pages.
 *
 * Same rule as lib/home-content.ts: real material from the spec document
 * where it exists, everything else marked TODO. Categories and the "Genesis'
 * NETFLIX" framing come from the spec.
 */

// --- /our-work — Content Library -------------------------------------------

export const ourWork = {
  label: "Portfolio",
  heading: "Everything",
  headingAccent: "we've made",
  body:
    "The complete library — reels, films, campaigns and brand work. Filter by division or by format; every piece opens on its own page.",
} as const;

/** Sidebar navigation, exactly as listed in the mockup. */
// --- /influencer-campaigns --------------------------------------------------

export const influencerPage = {
  label: "Strategic · Targeted · Impactful",
  heading: "Influencer",
  headingAccent: "campaigns",
  body:
    "From discovery to delivery, we connect brands with the right voices to create content that drives results.",
  // From lib/proof.ts. The three TODOs that used to sit here were rendering
  // as literal "TODO" wherever a component did not think to guard them.
  stats: [proof.creatorDatabase, proof.campaigns, proof.brands, proof.reach],
  genres: [
    "Fashion", "Fitness", "Finance", "Travel", "Food",
    "Tech", "Lifestyle", "Beauty", "Gaming", "Parenting",
  ],
  process: [
    { title: "Discovery", body: "Brief, audience and channel strategy — before a single creator is approached." },
    { title: "Matching", body: "Creators shortlisted from the database against the audience, not the follower count." },
    { title: "Production", body: "Scripting, direction and edit support so the content clears the bar." },
    { title: "Delivery", body: "Publishing, tracking and reporting against the numbers agreed up front." },
  ],
} as const;

// --- /creator ---------------------------------------------------------------

export const creatorPage = {
  label: "I'm a creator",
  heading: "Work with",
  headingAccent: "Genesis",
  body:
    "We run campaigns for brands that pay on time and brief properly. If you make content people actually watch, we'd like you on the roster.",
  /*
    ONE LINE EACH. These ran to two sentences apiece, which in four cards side
    by side is a paragraph of body copy where the eye expects a list. The
    promise is the title; the line under it only has to make the title
    specific.
  */
  benefits: [
    { title: "Real briefs", body: "Deliverable, deadline and fee agreed before you start." },
    { title: "Paid on schedule", body: "Terms set at signing, not renegotiated after delivery." },
    { title: "Creative latitude", body: "Brand guardrails, not a shot list." },
    { title: "Repeat work", body: "Most creators come back for the next campaign." },
  ],
} as const;

// --- /careers ---------------------------------------------------------------

export const careersPage = {
  label: "Careers",
  /*
    NOT "the waitlist" any more. That was accurate when the form took a name,
    an email and a message; it now asks which role you are applying for and
    for a link to your work, which is an application. Telling someone they are
    joining a waitlist and then asking them to pick a position is two
    different promises on one page.
  */
  heading: "Join our talented",
  headingAccent: "team",
  body:
    "We open roles in batches. Tell us which role you're after and leave a link to your work — we reach out when something matching opens up.",
  disciplines: [
    "Content production", "Editing & post", "Creative direction",
    "Strategy", "Influencer partnerships", "Design & motion",
    "AI content", "Engineering",
  ],
} as const;

// --- /content-creation ------------------------------------------------------

/**
 * Spec, page 28: "Content Creation - Create a New Page / Add blogs section /
 * Add creative process 2 lines or sections / [Add blog articles linked to the
 * video uploaded on YouTube]".
 */
export const contentCreationPage = {
  label: "Content creation",
  heading: "Production that holds up",
  headingAccent: "on any feed",
  body:
    "Creative direction, strategy, scripting, shoot and post — the full pipeline in-house, so a campaign never loses its thread between the idea and the published post.",
  capabilities: [
    { title: "Creative direction", body: "The idea, and the argument about whether it is the right one." },
    { title: "Strategy", body: "Audience, channel and measurement decided before anything is shot." },
    { title: "Scripting", body: "Concept to board, written for the placement it will actually run in." },
    { title: "Production", body: "Shoot or generation, with the standard set at the top." },
    { title: "Edit & post", body: "Assembly, grade and sound — where timing decides whether it works." },
    { title: "Distribution", body: "Publishing, tracking, and reporting against the numbers agreed up front." },
  ],
  /**
   * TODO(content): the spec wants each article linked to its YouTube video,
   * and the thumbnails changed. Needs the video IDs.
   */
  videoNote: "Articles pair with the film they document.",
} as const;

/**
 * Genesis Academy — announced, not yet open.
 *
 * The copy is Genesis's, verbatim: "Genesis Academy: Empowering students and
 * professionals to build their careers with AI and automation in advertising,
 * real estate, and more." Split into a heading and a body because the page
 * needs both and the sentence already contains them — the name is the
 * heading, the promise is the standfirst.
 */
export const academy = {
  label: "Genesis Academy",
  headingLead: "Coming",
  headingAccent: "soon",
  title: "Genesis Academy — coming soon",
  body:
    "Genesis Academy: Empowering students and professionals to build their careers with AI and automation in advertising, real estate, and more.",
} as const;
