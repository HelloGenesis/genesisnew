import { z } from "zod";

/**
 * The three lead forms, defined once as data.
 *
 * WHY A SPEC AND NOT THREE COMPONENTS. Genesis needs a creator form, a brand
 * form and a small popup, and they are the same machine at three lengths:
 * same validation, same rate limit, same table, same honeypot, same error
 * rendering. Written as three components they drift within a fortnight — one
 * grows a field the others do not, one loses its error styling in a refactor.
 *
 * WHY THE ZOD SCHEMA IS DERIVED FROM THE SPEC RATHER THAN WRITTEN BESIDE IT.
 * A field list and a validator that must agree, maintained separately, is the
 * oldest bug in form code: someone adds a field to the UI and the server
 * silently drops it, or tightens the server and the UI never says why. There
 * is one list here, and the schema is built from it, so they cannot disagree.
 *
 * WHERE THE ANSWERS GO. `name`, `email`, `company` and `message` are columns
 * on contact_submissions. Everything else — a creator's follower count, a
 * brand's budget range — goes into the `metadata` JSON column that already
 * exists on that model. No migration, and nothing is thrown away.
 */

export type FieldSpec = {
  name: string;
  label: string;
  type?:
    | "text"
    | "email"
    | "tel"
    | "url"
    | "textarea"
    | "select"
    | "checkbox-group"
    | "consent";
  required?: boolean;
  options?: readonly string[];
  placeholder?: string;
  autoComplete?: string;
  /** Sits in one column of the two-column grid rather than spanning it. */
  half?: boolean;
  max?: number;
};

export type FormSpec = {
  kind: FormKind;
  /** Which SubmissionType the row is stored as. */
  submissionType: "CONTACT" | "CREATOR" | "CAREERS_WAITLIST";
  title: string;
  blurb: string;
  submitLabel: string;
  successMessage: string;
  fields: readonly FieldSpec[];
};

export type FormKind =
  | "creator"
  | "brand"
  | "quick"
  | "career"
  | "influencer";

/** The four verticals plus the two honest answers a prospect might give. */
const NEEDS = [
  "Genesis Influence",
  "Genesis Studios",
  "Genesis AI Labs",
  "Genesis Brand & Design",
  "Multiple services",
  "Not sure yet",
] as const;

const BUDGETS = [
  "Under ₹5L",
  "₹5L – ₹15L",
  "₹15L – ₹50L",
  "₹50L+",
  "Not sure yet",
] as const;

const TIMELINES = [
  "Immediately",
  "Within a month",
  "1–3 months",
  "Just exploring",
] as const;

/**
 * The roles Genesis actually hires for, taken from the form they run at
 * genesismedia.co/career.
 *
 * These replace a list I had built from the careers page's "disciplines we
 * hire for" — plausible, and not the same thing. "Content production" is a
 * department; "Influencer Marketing Intern" is a job someone applies to, and
 * an applicant picking from the first list tells you almost nothing about
 * which opening they meant.
 */
const POSITIONS = [
  "Influencer Marketing",
  "Influencer Marketing Intern",
  "Content Creator",
  "Creative Intern",
  "AI & Graphic Intern",
  "Social Media Intern",
  "Copy Writer",
  "Content Strategist",
  "Video Editor",
  "Cinematographer",
  "Digital Marketing",
  "Other",
] as const;

const PLATFORMS = [
  "Instagram",
  "YouTube",
  "Twitter",
  "Snapchat",
  "LinkedIn",
  "Twitch",
] as const;

const CREATOR_GOALS = ["Access to Brand Campaigns", "Guidance for growth"] as const;

export const FORMS: Record<FormKind, FormSpec> = {
  /** A — creators applying to the Genesis network. */
  creator: {
    kind: "creator",
    submissionType: "CREATOR",
    title: "Work with Genesis",
    blurb:
      "Join the Genesis creator network. Tell us where you post and what you make — we brief creators for brand campaigns every week.",
    submitLabel: "Join the network",
    successMessage:
      "Thanks — you're in the network. We'll be in touch when a brief fits.",
    fields: [
      { name: "name", label: "Name", required: true, half: true, autoComplete: "name" },
      { name: "email", label: "Email", type: "email", required: true, half: true, autoComplete: "email" },
      { name: "phone", label: "Phone", type: "tel", half: true, autoComplete: "tel" },
      { name: "city", label: "City", half: true, autoComplete: "address-level2" },
      { name: "instagram", label: "Instagram", half: true, placeholder: "@handle" },
      { name: "youtube", label: "YouTube", half: true, placeholder: "@channel" },
      { name: "niche", label: "Category / niche", half: true, placeholder: "Fashion, tech, food…" },
      { name: "followers", label: "Followers", half: true, placeholder: "Across your main platform" },
      { name: "avgViews", label: "Average views", half: true },
      {
        name: "portfolio",
        label: "Portfolio, profile or media kit link",
        type: "url",
        half: true,
        placeholder: "https://",
      },
      {
        name: "message",
        label: "Anything else we should know?",
        type: "textarea",
        max: 4000,
      },
    ],
  },

  /** B — brands starting a project. */
  brand: {
    kind: "brand",
    submissionType: "CONTACT",
    title: "Start a project",
    blurb:
      "Tell us what you're trying to do. The more you give us here, the more useful our first conversation is.",
    submitLabel: "Send brief",
    successMessage: "Thanks — we'll come back to you within a working day.",
    fields: [
      /*
       * WHAT IS REQUIRED IS GENESIS'S CALL, and they have moved the line.
       * Their list: Name, Company, Email, Phone, Project Brief and Website or
       * Social Media Link — "other fields are optional".
       *
       * TWO CHANGES, IN OPPOSITE DIRECTIONS. Phone and website become
       * required, which is a real cost — every additional required field
       * loses some proportion of the people who start the form — and it is a
       * cost Genesis is choosing knowingly: a brand enquiry with no phone
       * number and no link to look at is one that cannot be qualified before
       * the first call.
       *
       * And "What do you need?" becomes OPTIONAL, which is the half that is
       * easy to miss. It was required, and it is not on Genesis's list — so
       * leaving it required would have kept a mandatory field they did not
       * ask for while adding two they did.
       */
      { name: "name", label: "Name", required: true, half: true, autoComplete: "name" },
      { name: "company", label: "Company", required: true, half: true, autoComplete: "organization" },
      { name: "email", label: "Email", type: "email", required: true, half: true, autoComplete: "email" },
      { name: "phone", label: "Phone", type: "tel", required: true, half: true, autoComplete: "tel" },
      {
        name: "website",
        label: "Website or social",
        type: "url",
        required: true,
        half: true,
        placeholder: "https://",
      },
      {
        name: "need",
        label: "What do you need?",
        type: "select",
        options: NEEDS,
        half: true,
      },
      { name: "budget", label: "Budget range", type: "select", options: BUDGETS, half: true },
      { name: "timeline", label: "Timeline", type: "select", options: TIMELINES, half: true },
      {
        name: "message",
        label: "Project brief",
        type: "textarea",
        required: true,
        max: 4000,
        placeholder: "What are you launching, who is it for, and what does success look like?",
      },
    ],
  },

  /**
   * C — the popup. Four questions, and it must stay that way.
   *
   * The brief is explicit that a visitor should not fill in a large form for
   * every interaction. Email is required rather than "phone or email" because
   * the email column on contact_submissions is NOT NULL — accepting a phone
   * number alone would mean either inventing an address to satisfy the column
   * or a migration; phone is here as an optional second line instead.
   */
  quick: {
    kind: "quick",
    submissionType: "CONTACT",
    title: "Let's talk",
    blurb: "Four questions. We'll take it from there.",
    submitLabel: "Let's talk",
    successMessage: "Got it — we'll be in touch shortly.",
    fields: [
      { name: "name", label: "Name", required: true, half: true, autoComplete: "name" },
      { name: "company", label: "Company", half: true, autoComplete: "organization" },
      { name: "email", label: "Email", type: "email", required: true, half: true, autoComplete: "email" },
      { name: "phone", label: "Phone", type: "tel", half: true, autoComplete: "tel" },
      {
        name: "message",
        label: "What can we help you with?",
        type: "textarea",
        required: true,
        max: 2000,
      },
    ],
  },
  /*
   * D — careers. Mirrors the form running at genesismedia.co/career, which is
   * the field set Genesis asked for.
   *
   * THE CV IS A LINK, NOT AN UPLOAD, and that is a platform limit rather than
   * a choice. A service account has no Drive storage quota of its own — it can
   * read a shared folder but cannot own a file it creates in one — so an
   * upload button wired to the "Website Forms" folder would fail on every
   * submission. See the note in google-sheets.ts. A Shared Drive or a blob
   * store makes a real uploader a contained change; shipping a button that
   * drops the file would not have been.
   */
  career: {
    kind: "career",
    submissionType: "CAREERS_WAITLIST",
    title: "Join our talented team",
    blurb:
      "We open roles in batches. Tell us what you do and leave a link to your work — we reach out when something matching opens up.",
    submitLabel: "Submit application",
    successMessage:
      "Thanks — your application is in. We'll be in touch when a matching role opens.",
    fields: [
      { name: "name", label: "First name", required: true, half: true, autoComplete: "given-name" },
      { name: "lastName", label: "Last name", half: true, autoComplete: "family-name" },
      { name: "email", label: "Email", type: "email", required: true, half: true, autoComplete: "email" },
      { name: "phone", label: "Contact number", type: "tel", required: true, half: true, autoComplete: "tel" },
      { name: "position", label: "Position", type: "select", options: POSITIONS, required: true, half: true },
      {
        name: "portfolio",
        label: "Portfolio or CV link",
        type: "url",
        required: true,
        half: true,
        placeholder: "Drive, Behance, Notion, LinkedIn…",
      },
      {
        name: "message",
        label: "About yourself",
        type: "textarea",
        required: true,
        max: 4000,
      },
    ],
  },

  /*
   * E — creators and influencers onboarding. Mirrors
   * genesismedia.co/influencer-registration-form.
   *
   * The picture is a link for the same reason the CV is.
   */
  influencer: {
    kind: "influencer",
    submissionType: "CREATOR",
    title: "Get onboarded with us",
    blurb:
      "Hello influencers and creators. Tell us where you post, what you charge and what you are looking for — we brief creators for brand campaigns every week.",
    submitLabel: "Submit",
    successMessage:
      "Thanks — you're on the roster. We'll be in touch when a brief fits.",
    fields: [
      { name: "name", label: "Name", required: true, autoComplete: "name", placeholder: "Your name" },
      {
        name: "platforms",
        label: "Influencer marketing platforms",
        type: "checkbox-group",
        options: PLATFORMS,
        required: true,
      },
      { name: "email", label: "Email", type: "email", required: true, half: true, autoComplete: "email" },
      { name: "phone", label: "Phone", type: "tel", required: true, half: true, autoComplete: "tel" },
      {
        name: "goals",
        label: "What brings you to us?",
        type: "checkbox-group",
        options: CREATOR_GOALS,
        required: true,
      },
      { name: "instagram", label: "Instagram link", type: "url", required: true, half: true, placeholder: "Enter Instagram link" },
      { name: "youtube", label: "YouTube link", type: "url", half: true, placeholder: "Enter YouTube link" },
      /*
        Labels kept short enough to hold one line in a half-width column. "YT
        integrated reel cost (₹)" plus its "(optional)" suffix wrapped, and a
        two-line label in a two-column grid pushes its own input 11px below the
        one beside it — which is the ragged edge that made this form look
        packed. The placeholder carries the caveat either way.
      */
      { name: "igReelCost", label: "IG reel cost (₹)", half: true, placeholder: "Per reel — subject to change." },
      { name: "ytReelCost", label: "YT integrated (₹)", half: true, placeholder: "Per video — subject to change." },
      { name: "previousBrands", label: "Previous brands you've collaborated with", type: "textarea", max: 2000 },
      {
        name: "picture",
        label: "Link to a picture of yourself",
        type: "url",
        required: true,
        placeholder: "Drive, Instagram post, portfolio…",
      },
      { name: "message", label: "Any comments?", type: "textarea", max: 4000 },
      {
        name: "consent",
        label:
          "I agree to the terms and conditions, and permit Genesis to use my social media profiles to pitch brands on my behalf.",
        type: "consent",
        required: true,
      },
    ],
  },

};

/** Columns on contact_submissions; everything else is metadata. */
export const COLUMN_FIELDS = new Set(["name", "email", "company", "message"]);

/**
 * Builds the validator from the field list, so the two cannot disagree.
 *
 * Optional text fields accept an empty string because that is what a browser
 * submits for an untouched input — treating "" as a type error would fail
 * every form where someone skipped an optional line.
 */
/**
 * Whether a posted `kind` is one this module knows.
 *
 * DERIVED FROM `FORMS`, AND IT LIVES HERE FOR A REASON. This was a hand-typed
 * list of three kinds sitting in the server action — `value === "creator" ||
 * value === "brand" || value === "quick"` — and adding `career` and
 * `influencer` to FORMS did not add them to it. Both new forms rendered
 * perfectly, validated in the browser, submitted, and came back "Unknown
 * form." from the server. They had never once worked.
 *
 * That is precisely the failure this file's own header warns about: a list and
 * a second list that must agree, maintained apart. The schema is already
 * derived from the field spec for the same reason; the guard should have been
 * too. `in FORMS` cannot fall behind FORMS.
 */
export function isFormKind(value: string): value is FormKind {
  return value in FORMS;
}

export function schemaFor(spec: FormSpec) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of spec.fields) {
    const max = field.max ?? (field.type === "textarea" ? 4000 : 200);
    let rule: z.ZodTypeAny;

    if (field.type === "checkbox-group") {
      /*
        Several boxes under one name, so the value arrives as an ARRAY and the
        action reads it with getAll rather than get. A required group means at
        least one ticked; an optional one may be empty.
      */
      const set = z.array(z.enum([...(field.options ?? [])] as [string, ...string[]]));
      shape[field.name] = field.required
        ? set.min(1, `Choose at least one ${field.label.toLowerCase()}`)
        : set;
      continue;
    }

    if (field.type === "consent") {
      /*
        A required consent box is the one field where "unchecked" must fail
        rather than fall through as an empty string — an unticked terms box
        that submits anyway is a form that collected an agreement nobody gave.
        A browser sends nothing at all for an unchecked box, hence literal("")
        being the failing case rather than the passing one.
      */
      shape[field.name] = field.required
        ? z.literal("on", { message: `${field.label} must be accepted` })
        : z.string().max(10).optional().or(z.literal(""));
      continue;
    }

    if (field.type === "email") {
      rule = z.email("Please enter a valid email address").max(max);
    } else if (field.type === "select") {
      rule = z.enum([...(field.options ?? [])] as [string, ...string[]]);
    } else if (field.type === "url") {
      // People type "instagram.com/x" far more often than a full URL, so this
      // stays a length-checked string rather than rejecting the common case.
      rule = z.string().trim().max(max);
    } else {
      rule = z.string().trim().max(max);
    }

    if (field.required) {
      if (field.type !== "select" && field.type !== "email") {
        rule = (rule as z.ZodString).min(1, `${field.label} is required`);
      }
    } else {
      rule = rule.optional().or(z.literal(""));
    }

    shape[field.name] = rule;
  }

  // Honeypot: real users never see it, so anything in it is a bot.
  shape.hp = z.string().max(0).optional().or(z.literal(""));
  shape.source = z.string().trim().max(120).optional().or(z.literal(""));

  return z.object(shape);
}
