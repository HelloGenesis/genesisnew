# Genesis Media — Build Progress

Single source of truth for project state. Check this before resuming work in a
new session.

| Phase | Scope | Status |
| --- | --- | --- |
| 0 | Infra & security foundation | ✅ Code complete — 5 checks pending credentials |
| 1 | Design system & shared components | ✅ Complete — **needs your call on brand colour** |
| 2 | Homepage (13 sections) | ✅ Complete |
| 3 | Motion pass | ✅ Complete |
| 4 | Standalone pages | ✅ Complete |

---

## Phase 0 — Infra & security foundation

### Built

**Scaffold**
- Next.js **16.3.1** (App Router, Turbopack), React 19.2, TypeScript strict.
- Tailwind **v4** (CSS-first config — there is no `tailwind.config.ts`; tokens
  live in `@theme` inside `app/globals.css`), shadcn/ui (`base-nova` style).
- Homepage lives at `app/(home)/page.tsx` so Phase 2 sections can colocate
  under `app/(home)/components/` as specified.

**Installed & configured:** Framer Motion 13, GSAP 3.15, Lenis 1.3, Prisma 7.9,
Auth0 SDK 4.26, Sentry 10.70, Vercel Analytics 2.0, Zod 4.4, googleapis 174,
Upstash rate limiting.

> Framer Motion, GSAP and Lenis are **installed but not yet wired into any
> component** — that is Phase 1/3 work, deliberately not started.

**Database** — `prisma/schema.prisma`, three tables only (`users`,
`audit_logs`, `contact_submissions`). Initial migration SQL is generated and
committed at `prisma/migrations/0_init/migration.sql`; it has **not been
applied** to a database yet.

**Auth** — `lib/auth0.ts` (Auth0Client + role sync), `proxy.ts` (optimistic
gate), `app/insider/layout.tsx` (authoritative gate), `lib/access.ts`.

**Storage** — `lib/google-drive.ts`: service-account Drive v3 client plus
`verifyDriveAccess()`. No upload UI, as specified.

**Monitoring** — Sentry client/server/edge configs + `instrumentation.ts`;
`<Analytics />` in the root layout.

**Security** — `lib/security-headers.ts` applied to every route via
`next.config.ts`. Verified live: CSP, HSTS, X-Frame-Options, X-Content-Type-
Options, Referrer-Policy, Permissions-Policy, COOP, X-DNS-Prefetch-Control.

### Verified working

- `npm run build`, `npm run lint`, `npm run typecheck` all pass clean.
- `npm audit` → **0 vulnerabilities**.
- All security headers present on live responses (checked with `curl -I`).
- `/insider` renders a "not configured" notice instead of 500-ing while Auth0
  credentials are absent — the marketing site stays up regardless.
- `/api/diagnostics` returns 401 without a token, 401 with a wrong token, and
  503 if `DIAGNOSTICS_TOKEN` is itself unset or a placeholder.
- Prisma schema validates; migration SQL generates correctly.

### ⚠️ Blocked on credentials — 5 unverified DoD checks

These cannot be confirmed until real secrets exist. **Nothing else in Phase 0
is blocked by them.**

| Check | How to verify once credentials land |
| --- | --- |
| Deploys to Vercel | Push + import the repo in Vercel |
| `/insider` → Auth0 login → back | Visit `/insider` in a browser |
| Test write to `audit_logs` | `/api/diagnostics` → `auditLogWrite: ok` |
| Sentry receives a test error | `/api/diagnostics?sentry=throw` |
| Drive API authenticates | `/api/diagnostics` → `googleDrive: ok` |

**One command runs four of the five:**

```bash
curl -s -H "x-diagnostics-token: $DIAGNOSTICS_TOKEN" "http://localhost:3000/api/diagnostics?sentry=throw" | python3 -m json.tool
```

Every subsystem currently reports `skipped` — which is the endpoint correctly
detecting placeholder values, not a failure.

### What I need from you

1. **Neon** — pooled `DATABASE_URL` *and* unpooled `DIRECT_DATABASE_URL`.
   Migrations need the direct one (PgBouncer lacks the advisory locks the
   migration engine takes). Keep `sslmode=require` on both.
2. **Auth0** — domain, client ID, client secret, for a **Regular Web
   Application**. Register `{APP_BASE_URL}/auth/callback` as an Allowed
   Callback URL and `{APP_BASE_URL}` as an Allowed Logout URL. To grant
   Insider access, add an Auth0 Action that puts roles on the
   `https://genesismedia.co/roles` claim (`owner`/`admin`/`member`/`viewer`).
   **Users default to `VIEWER`, which is denied** — that is intentional.
3. **Google Cloud** — service account JSON, base64-encoded into
   `GOOGLE_SERVICE_ACCOUNT_JSON`. Share the target Drive folder with the
   service account's `client_email` or it authenticates into an empty Drive.
4. **Sentry** — DSN (as `NEXT_PUBLIC_SENTRY_DSN`), plus org/project/auth token
   for source map upload.
5. **Brand assets** — real colors, fonts, logos. See *Placeholders* below.
6. **Wix decision** — replace `genesismedia.co` outright, or run in parallel
   first? Doesn't block Phases 1–4; it blocks DNS cutover only.

Then run:

```bash
npm run db:deploy
```

### Decisions taken (flagging, since they're expensive to reverse)

- **Prisma 7 requires a driver adapter** — the engine no longer connects on its
  own. Using `@prisma/adapter-neon` (WebSocket), which suits Vercel's
  short-lived functions. *Consequence:* local development needs a Neon branch;
  a plain local Postgres will not work with this adapter. Neon's free branching
  is the intended workflow. Switching to `@prisma/adapter-pg` would allow local
  Postgres at the cost of TCP pooling behaviour on serverless.
- **Middleware is `proxy.ts` in Next 16**, not `middleware.ts`, and runs on the
  Node runtime only. The Auth0 SDK supports this explicitly.
- **`npm audit` fix without downgrading Prisma** — a high-severity advisory in
  `deepmerge-ts@7.1.5` (transitive, via `@prisma/config`) would have forced
  `prisma@6.12`. Resolved with a `deepmerge-ts: ^8.0.1` override in
  `package.json` instead; Prisma 7.9.1 verified working afterwards.
- **Tailwind v4 has no JS config file.** Any instruction to "add it to
  `tailwind.config.ts`" now means `@theme` in `app/globals.css`.

### Placeholders in use — replace when brand assets arrive

- **Colors** — shadcn's default neutral OKLCH palette. The `--bg #0a0a0b`,
  `--accent-amber #ff8a3d`, `--accent-teal #2dd4bf` tokens from the brief are
  **not yet applied**; Phase 1 introduces them after reviewing
  `docs/reference/`.
- **Typeface** — Geist, standing in for the bold-sans + serif-italic pairing.
- **Copy** — the placeholder homepage is scaffolding, replaced wholesale in
  Phase 2.

### Hardening follow-ups (not yet done, deliberately)

- **CSP allows `'unsafe-inline'` for `script-src` — a deliberate trade-off,
  not outstanding debt.** Next inlines its hydration payload, so removing it
  requires nonces. Next's own documentation is explicit that *"to use a nonce,
  your page must be dynamically rendered… Static pages are generated at build
  time, when no request or response headers exist—so no nonce can be
  injected."* Adopting nonces would therefore force every marketing page off
  static generation — losing CDN caching and TTFB — to defend against an
  inline-injection vector this site does not have, since no user-generated
  content is rendered inline. Revisit only if these pages become dynamic for
  some other reason. The policy still blocks third-party scripts, framing,
  plugins and off-site form posts.
- **Rate limiting falls back to an in-memory limiter** when Upstash is
  unconfigured. That is per-instance and **not sufficient in production** —
  set `UPSTASH_REDIS_REST_URL` / `_TOKEN` before the Phase 4 forms go live.
- **Field-level encryption (`pgcrypto`) not implemented.** Correct for now —
  no payment or invoice data exists yet. Revisit when invoicing lands.
- `audit_logs` stores IP and user agent (PII) — fine for a security audit
  trail, but it needs a retention policy before launch.

### Explicitly NOT built

The Genesis Workspace product — client/brand/project management, content
pipeline, invoicing, automations, influencer CRM, team permissions beyond the
Insider gate. Out of scope per the brief. The Phase 0 infra is arranged so
these can be added without re-architecting.

---

## Phase 1 — Design system & shared components

### ⚠️ Decision needed: the brand accent is red, not amber/teal

I read all 37 images in `docs/reference/` before writing any code, as the
brief instructed. **Two of them are existing Genesis Media artwork, not mood
references**: `img-012` (an Influencer Campaigns page) and `img-013` (an "Our
Content" library). Both carry the real GENESIS MEDIA lockup and both are built
on a **crimson/red** accent — red CTA gradients, a red star glyph, red glows.

The brief's placeholder tokens were `--accent-amber #ff8a3d` and
`--accent-teal #2dd4bf`. Since §4 said those were "a starting approximation,
not the final word" and told me to let the references decide, I built:

- **`crimson` `#ff2d3f`** — primary. Sampled from the Genesis CTA gradient and
  logo mark. Drives buttons, focus rings, brand glows.
- **`amber` `#ff8a3d`** — secondary, kept from the brief. It genuinely earns
  its place: the papers-catching-light motif is warm in every image that uses
  it (img-001, 005, 011, 014, 043), and that motif is the connective thread
  across Journey / Blogs / Case Studies.
- **`teal` `#2dd4bf`** — defined but effectively unused. It appears **nowhere**
  in the references. The only cool accents present are a lime `#c5ff2e`
  (img-009 pushpins) and a signal green (img-004).

**Confirm before Phase 2**: is crimson right? Everything downstream inherits
it, so it is cheap to change now and expensive after 13 sections exist. If you
prefer amber-primary, it is a one-file edit to `app/globals.css`.

### Also found in the references

`img-019` is your **current Wix site** mid-edit, which gave me real Genesis
copy rather than invented filler. Now in `lib/site-config.ts`:

> "Genesis is a Gen Z-led full-service agency where strategy, content, and
> technology come together to build iconic brands…"

Note the live site's hero has a typo — "Technolgy". I have **not** reproduced
it. Flagging so it gets fixed at the source too.

### Built

**Tokens** (`app/globals.css`) — Tailwind v4 `@theme`, dark-only. Surfaces
(`void`/`ink`/`elevated`/`raised`), accents, text ramp (`bone`/`ash`/`faint`),
glass variables, and a global `prefers-reduced-motion` reset.

**Glass** is the One UI "Blur" style, decided directly from `img-000` — which
is literally a labelled comparison of Frosted / Clear (iOS) / Blur (One UI).
Heavy blur, low-contrast fill, lit top edge, no refraction. `.glass`,
`.glass-strong`, `.glass-lit`.

**The eight required components**, all in `components/genesis/`:

| Component | File | Reference |
| --- | --- | --- |
| Glass pill button (+ segmented) | `glass-button.tsx` | img-012, img-014 |
| Glass nav | `glass-nav.tsx` | img-013, img-015 |
| Stat card + stat row | `stat-card.tsx` | img-012, img-036 |
| Orbiting / draggable cards | `orbiting-cards.tsx` | img-012 |
| Movie-poster case-study card | `poster-card.tsx` | img-025, img-026 |
| Animated timeline | `animated-timeline.tsx` | img-004 |
| Logo marquee | `logo-marquee.tsx` | — |
| Magnetic floating paper card | `paper-card.tsx` | img-009, img-011, img-053 |

Plus supporting pieces that stop the above from duplicating each other:
`atmosphere.tsx` (ground + one light + grain), `section-label.tsx`,
`genesis-mark.tsx` (placeholder logo), `lib/use-magnetic.ts`,
`lib/site-config.ts`.

**`/style-guide`** renders all of it in isolation. Dev-only: it calls
`notFound()` in production and is linked from nothing.

### Verified

Build, lint, typecheck all clean; `npm audit` 0 vulnerabilities. Rendered the
style guide in a browser and confirmed against the SSR HTML that every
component emits markup. **Three real bugs surfaced only by running it:**

1. **Hydration mismatch in `OrbitingCards`.** Framer Motion serialises style
   values at reduced precision during SSR, so `17.639320225002095%` on the
   client met `17.6393%` from the server. Fixed by rounding in the transform
   so both sides produce identical strings.
2. **`aspect-2/3` generated no CSS.** Tailwind v4 has no bare-fraction aspect
   utility — the poster cards had no aspect ratio at all. Now `aspect-[2/3]`,
   confirmed by grepping `aspect-ratio: 2 / 3` out of the compiled stylesheet.
3. **CSP blocked Vercel Analytics** (fixed in the previous commit) — the
   script is same-origin only once deployed to Vercel.

### Still placeholder

- **Typefaces** — Geist (sans) + Instrument Serif (the italic accent word).
  Both stand-ins for real brand fonts.
- **Logo** — `genesis-mark.tsx` is reconstructed from the references. One file
  to swap.
- **Poster artwork** — generated from a hash of each card's id so cards look
  distinct and stable across SSR. Deterministic on purpose: `Math.random()`
  would cause hydration mismatches.
- **Client logos** — wordmarks, not images.
- All figures and names are marked `TODO(copy)`.

### Deliberately deferred to Phase 3

Framer Motion and GSAP are installed; only component-intrinsic motion is wired
(count-up, orbit, magnetic hover, timeline fill, marquee). The `layoutId`
morphs, the Services→Portfolio 180° pan, and Lenis smooth scroll are the
Phase 3 motion pass and are not started.

---

## Phase 2 — Homepage

### Built

All 13 sections in the specified order, one component each under
`app/(home)/components/`:

Hero → Services → Portfolio → Case Studies → Our Journey → AI-Generated
Content → Influencer Marketing → Branding & Design → Client Logo Wall →
Testimonials → Journal teaser → Insider teaser → Footer CTA.

Two shared primitives keep the sections from re-deciding the same things:
`components/genesis/reveal.tsx` (the single scroll fade/slide, plus a stagger
group) and `app/(home)/components/section-shell.tsx` (label → two-tone heading
→ body, spacing, and per-section atmosphere). Copy lives entirely in
`lib/home-content.ts`.

**Route stubs.** `/our-work`, `/blog`, `/blog/[slug]`, `/creator`, `/careers`
and `/influencer-campaigns` now resolve via a shared `RouteStub` so the
homepage ships no dead links. These are placeholders, replaced wholesale in
Phase 4 — the `[slug]` route only resolves the three placeholder posts and
404s anything else.

### Verified

Build, lint, typecheck clean; `npm audit` 0 vulnerabilities. Every internal
link on the homepage resolves 200 (checked by extracting hrefs and curling
each). No horizontal overflow at 375 / 768 / 1440. Mobile nav opens and
reports `aria-expanded="true"`. All 11 section headings confirmed to reveal to
full opacity on scroll.

**Four issues found by running it, all fixed:**

1. **Primary CTA below the fold.** At 1440×900 the hero measured 1054px, so
   "Start a project" (bottom edge 910px) and the scroll cue sat off-screen —
   the single worst thing a hero can do. The headline is long real copy that
   wraps to six lines. Fixed by trimming the vertical budget and moving the
   scroll cue out of flow; hero now measures exactly 900px with both visible.
2. **`xl:text-7xl` was width-gated only**, so a wide-but-short laptop got a
   72px headline it had no room for. Now gated on width *and* height.
3. **Invalid CSS from an arbitrary variant.** Tailwind emitted
   `(min-width:1280px)and(min-height:960px)` — no spaces, unparseable, 500 on
   every page. Spaces must be written as underscores in arbitrary variants.
4. **Orbiting cards clipped** at the section edge in the narrower two-column
   layout. Orbit radius reduced; verified zero cards escape the container.

### Copy status

Real Genesis material wherever it existed in `docs/reference/`: the hero and
body copy (img-019), the influencer positioning line and all five figures
(img-012), and the client and format lists (img-013).

**Invented and must be replaced before launch:**
- All four case-study results — the numbers are fabricated placeholders.
- All three testimonials, including names and roles.
- The journey milestones and dates.
- The three journal posts.
- Service descriptions (structure is a guess at the real six-way split).

**Also needs a decision:** client names (Kayali, Tata Motors, ICICI Bank,
Miraggio, Yonex, Third Wave Coffee, Mauritius Tourism, Kreo Tech, Dot & Key)
come from Genesis's own artwork, but display rights on the new public site
should be confirmed.

---

## Spec document — content corrected

You supplied **"Genesis Website Content.pdf" (Layout(Gaurav): FINAL)**. Its
images are the same set as `docs/reference/`, but it carries an **annotation
layer** that was the missing piece. Extracted text is at
`scratchpad/genesis-content.txt`.

It showed my Phase 2 copy was substantially wrong. Corrected in
`lib/home-content.ts`:

| Was (invented) | Now (from the spec) |
| --- | --- |
| Kayali, Tata Motors, ICICI, Yonex… | **Aditya Birla Capital, HDFC, Aditya Birla Sun Life Insurance, Mahindra Finance** |
| 6 invented services | **5: Content Production, AI Content, Influencer Marketing, Branding & Design, Apps & Games** |
| Invented hero line | **"Empowering brands that want to win at content, influencer activations & AI"** |
| — | **AI avatars: Adi, Diya, Ivaanat, Shivam, Tanvi** |
| — | **Celebrities: Vikrant Massey, Ajay Devgn, Akash, Rashmi, Parvi** |
| 3 fabricated testimonials | **12 real names/companies** (Anu Raj–Mahindra, Amey Khopte–ABSLI, Aditya Rane–IndusInd Nippon, …) |
| — | **Branding work: Tripgate, Abhi App, Doja** |

Behaviour directives from the same document are now implemented, and are
recorded next to the content they govern.

## Phase 3 — Motion pass

- **Services → Portfolio camera turn.** Spec: *"when going from services to
  portfolio the camera turns 180*"*. Both sections are the two faces of one
  stage; GSAP ScrollTrigger pins it and scrubs yaw 0°→180°. Verified scrubbing
  linearly (0/50/100/150/180) and confirmed absent below 1024px.
- **Apple Watch clusters.** Spec asks for this twice — client logos
  *"movable like Apple Watch Apps"* and testimonials *"move around like how
  apps move around in an apple watch"*. `WatchCluster` puts items on a
  honeycomb lattice in a draggable plane; each scales by distance from centre,
  driven by MotionValues so dragging never re-renders.
- **Lenis smooth scroll**, wired into GSAP's ticker with
  `lenis.on("scroll", ScrollTrigger.update)` and `lagSmoothing(0)`. Disabled
  for reduced-motion and coarse pointers.
- **Magnetic floating paper blogs** already carried the motif; the spec
  confirms the intent (*"papers moving like magnetics"*, ref igloo.inc).

### ⚠️ Verification limit you should know about

This browser pane **does not emit `scroll` events for programmatic scrolls** —
`window.scrollTo` moves the page but fires zero events. Every scroll-driven
library correctly stays at progress 0 under that condition, which made a
working animation look broken and sent me rewriting it twice before I checked
the harness instead of the code. Scroll-driven work here is verified by
dispatching a synthetic `scroll` event after moving.

**The mechanism is confirmed; the *feel* is not.** Scroll the turn yourself —
pacing and the 160% pin length are taste calls I cannot make from a script.

### Still owed before launch

- Every case-study **result** figure, all 12 testimonial **quotes**, journey
  milestones and dates, and the three journal posts.
- Assets: client logo files ("Ask tanvi"), AI avatar stills, portfolio
  thumbnails, video testimonials.
- Confirm spellings: the document writes "Vikhrant Messay" / "Ajay Devgan".
- The crimson-vs-amber brand call is still open.

---

## Phase 4 — Standalone pages

### Built

| Route | What it is |
| --- | --- |
| `/our-work` | The content library ("Genesis' NETFLIX"). All 8 spec categories as filter tabs over a poster grid. |
| `/influencer-campaigns` | Deep dive: figures, celebrity collaborations, creator genres, the four-step process, enquiry form. |
| `/creator` | "I'm a Creator" — why work with Genesis, plus a roster application form. |
| `/careers` | The waitlist, modelled on img-044: one glass panel, one action. |
| `/blog` | Hub. Posts render as magnetic floating papers, per the spec's "each paper is a blog". |
| `/blog/[slug]` | MDX post template with scoped prose styles. |
| `/insider` | Dashboard shell behind the Auth0 gate. |

**Forms.** One `ContactForm` serves contact, creator and careers. It posts to a
server action that validates with Zod, rate-limits by IP, writes to
`contact_submissions`, then records an audit entry — in that order, so nothing
touches the database before validation passes. A honeypot field catches bots
and is accepted silently rather than rejected.

**Blog.** Posts are MDX in `content/blog`, parsed with gray-matter and
validated with Zod — malformed frontmatter fails the build rather than
rendering blank. The homepage teaser reads the same files as `/blog`, so the
two cannot drift.

**Insider.** Deliberately narrow. The one live panel is recent contact
submissions, because that table is genuinely ours; the Workspace modules
(clients, projects, pipeline, invoicing) appear as locked placeholders so the
shape is visible without implying they exist.

### Verified

Build, lint, typecheck clean; `npm audit` 0 vulnerabilities.

- **Zero dead links.** Crawled every page, extracted all internal hrefs, and
  curled each: 9 distinct links, all 200. Unknown blog slugs 404 correctly.
- **The form works end to end.** A valid submission reaches the action and
  returns *"not connected to a database yet"* — the DB guard refusing to
  pretend it saved. With the browser's own `type=email` check bypassed, the
  server's Zod validation still returns a field-level error and sets
  `aria-invalid`.
- **Content library filters**: 9 items, Films → 2, AI Content → 1,
  `aria-selected` tracked.

### ⚠️ The three blog posts are drafts, so production shows an empty journal

I wrote the two AI posts the spec asks for, plus a creative-process piece. All
three carry `draft: true`, so they are visible in development and **excluded
from production** — the production build generated zero post pages, and
`/blog` will read "No posts published yet".

That is deliberate: they are my drafts, not Genesis's writing, and they end
with a sign-off note. Publishing is a one-word change per file
(`draft: false` in the frontmatter) once you have read them.

### Still owed

Unchanged from earlier phases: case-study results, testimonial quotes, journey
dates, real assets (client logos, avatar stills, portfolio thumbnails), and
the crimson-vs-amber brand decision. Plus, for these pages specifically:
real content-library thumbnails and video links.

---

## Production readiness — closed

The five phases were complete, but the site was missing the things every
production site needs and nobody specs:

- **`app/not-found.tsx`** — a branded 404. A bare framework error page on a
  design-led agency site reads as neglect.
- **`app/error.tsx`** — route-level boundary. It reports to Sentry on mount
  rather than relying on the global handler: an error caught by a boundary
  never reaches `window.onerror`, so without this it would render a friendly
  page and be silently lost. The digest is surfaced because it is the only
  handle a user can give support that ties their report to a real failure.
- **`app/global-error.tsx`** — last resort, for failures in the root layout
  itself. Renders its own `<html>`/`<body>` and uses no design-system
  components, because at that point the layout they assume has failed. Its
  plain `<a>` is deliberate and lint-suppressed with the reason: `next/link`
  would depend on the very thing that just broke.
- **`app/robots.ts`** — blocks `/insider`, `/style-guide` and `/api/`, so
  internal surfaces stay out of results even if a URL leaks.
- **`app/sitemap.ts`** — public routes only, with blog entries from the same
  MDX loader the pages use, so an unpublished draft can never be advertised.

The **style guide** now covers every component. Ten built after it was first
written were missing from it: Spotlight/GhostType/CornerNote, LitRoom,
StandingFigure, PaperVortex, DocumentWall, WatchCluster, FloatingPapers,
ToolsStack, GlowWord/IridescentButton and ContactForm.

Verified live: robots.txt serves the right rules, sitemap lists 9 URLs, an
unknown path returns a branded 404, build/lint/typecheck clean, `npm audit`
0 vulnerabilities.

---

## What is left, and who it belongs to

**Nothing further is blocked on engineering.** Everything remaining needs a
decision or an asset:

| Owed | Blocks |
| --- | --- |
| Neon, Auth0, Google service account, Sentry credentials | The 5 Phase 0 checks; `/insider`; the forms actually storing anything |
| Case-study results (4), testimonial quotes (12), journey dates | Those sections shipping — names are real, so invented quotes are worse than blanks |
| Client logo files, AI avatar stills, content-library clips | Placeholder art throughout; the spec wants library tiles "playing on their own like a GIF" |
| The real tools list | The AI stack shows categories, not vendors |
| Crimson vs amber brand call | Open since Phase 1 |
| Upstash Redis credentials | Rate limiting is per-instance until then — not production-safe for public forms |

---

## Spec audit — every annotation checked

Walked the whole annotation list against the code rather than against memory.
Seven requirements were specified and never built. All are now in:

| Spec annotation | Was | Now |
| --- | --- | --- |
| Our Journey — *"//numbers increasing animation"* | No figures at all | Fronted by a `StatRow` that counts up on entry |
| *"Add creative process (BTS)"* (asked twice) | Missing | New homepage section, pinned-paper treatment |
| *"Content Creation — Create a New Page"* | Missing | `/content-creation`, with the blogs section and creative process it specifies |
| *"Social Media Icons (like stars)"* | Missing | The lockup's four-point star, clip-path shaped, in the footer |
| Footer — *"//liquid glass"* | Plain bordered grid | One heavy-blur pane with a lit top edge |
| *"I'm a creator page ⟶ slide up"* | Static | Page rises into place on mount; skipped under reduced motion |
| *"//videos playing on their own like a GIF"* | Gradient only | Tiles render a muted looping inline video when a clip exists |

Two notes on how these were built:

**The video path is a mechanism, not a mock.** A library item with a `clip`
renders a muted, looping, `playsInline` video with no controls; one without
falls back to generated artwork. The grid works today and upgrades the moment
real media lands — no code change, just data.

**`lucide-react` v1 removed its brand icons**, so Instagram/YouTube/LinkedIn
are drawn inline. Pulling a whole icon package for three glyphs was not a
trade worth making.

### Verified

All 8 routes 200 · 12 anchored homepage sections in spec order · **0 dead
links** across every page · build, lint, typecheck clean · 0 vulnerabilities.

### Specified but blocked on assets, not code

- *"TOOLS WE USE, SOME PICS, VIDEOS"* — the stack renders; the pics and videos
  need supplying.
- *"Update this reel video with new content"* — the hero has no reel.
- *"Start Video testimonial project"* — testimonials are text cards until that
  footage exists.
- *"[Add blog articles linked to the video uploaded on YouTube]"* and
  *"Change YouTube thumbnail"* — needs the video IDs.
- *"Work with us //maybe a chair visual…"* — marked "//design not sure yet" in
  the spec itself, so deliberately not invented.

---

## Media mechanisms — built ahead of the assets

The remaining spec items were all "blocked on assets". Rather than leave them
as notes, the mechanisms are built, so each turns on with data alone and no
code change.

| Spec item | Mechanism |
| --- | --- |
| *"Update this reel video with new content"* | `<Reel>` in the hero. Set `heroReel.src` and it plays. |
| *"videos playing on their own like a GIF"* | Library tiles render a muted inline loop when an item has `clip`. |
| *"TOOLS WE USE, SOME PICS, VIDEOS"* | Same `<Reel>`, ready to sit beside the stack. |
| *"Start Video testimonial project"* | A testimonial with `clip` becomes a video card; the rest stay text, so the wall fills one person at a time rather than waiting on a full shoot. |
| *"[blog articles linked to the video uploaded on YouTube]"* | `youtube:` in a post's frontmatter renders the film above the prose. |

Three decisions inside those:

**`<Reel>` does not autoplay under `prefers-reduced-motion`.** It shows the
poster with a play control instead — auto-playing video is exactly what that
setting exists to stop.

**Without a source it renders a labelled frame**, correctly sized, rather than
a stock gradient pretending to be footage. The layout is honest today.

**The YouTube frame only mounts on click**, against `youtube-nocookie`. An
autoloaded player sets cookies and pulls hundreds of kilobytes before anyone
asked to watch; clicking is consent, and reading stays fast. CSP gained
`frame-src 'self' https://www.youtube-nocookie.com` — scoped to that host
only. Thumbnails go through `next/image` with a remote pattern locked to
`i.ytimg.com/vi/**`.

### What genuinely cannot be built

Copy that must be true: the 4 case-study results, 12 testimonial quotes,
journey figures and dates, and the real tools list. Names are real, so
invented quotes are worse than blanks. Plus credentials, brand assets, and the
crimson-vs-amber call.

---

## Design QA pass — 2026-08-21

Full audit of every section and page against `docs/reference/`,
`docs/spec/pages/` and the spec annotations. Findings are in **`AUDIT.md`**
with file:line evidence and measured values; this is what was fixed.

### Method, and its limits

Playwright is not installed and no browser automation is available. The in-app
browser pane went hidden mid-session and returns black frames. Verification was
therefore: headless Chrome full-viewport captures, DOM and computed-style
measurement, pixel sampling of the reference images, and code-level comparison
against the tokens. Two consequences worth knowing:

- Numbers in `AUDIT.md` and in the commit messages are **measured**, not
  estimated — sampled from the reference files and from the served HTML.
- Sections more than one viewport down the page **cannot** be captured
  headlessly, because the hero is `min-h-dvh` and therefore always equals the
  viewport height. Those were verified through the DOM instead, which is more
  precise for geometry and gives no picture. Where that limits a claim, the
  commit says so.

Coverage was uneven: four section groups were audited in depth, the global
layer was measured directly, and five were audited at code level only. The
table in `AUDIT.md` marks which is which.

### Fixed — foundational

Every section inherits these, so they were fixed once rather than chased.

| Finding | Before | After |
| --- | --- | --- |
| Glass fill | +3.4 luminance lift | +10.8 (bright ground), ~+16.5 (dark) |
| Nav | hardcoded 3% / blur(12px), bypassing the tokens | `.glass` / `.glass-strong` |
| `GhostType` | 3.5% white — below the grain's own 3.36 amplitude | 12%, and it wraps |
| Poster placeholder art | hue 92/105/135 — lime and green | brand arc 350°–30° |
| Teal | joint-most-used tone, in none of the references | 0 non-brand accents site-wide |

Genesis's own artwork was the calibration source: a glass panel in `p07_0`
sits +18.6 above its ground, the lit database card +29.9.

### Fixed — sections

- **Hero.** Wall curvature was inverted — flanks receded where the reference
  has them coming forward, which with a taller centre panel rendered a
  symmetric pyramid. Sheet colour used a neutral multiply, draining ivory to
  olive-khaki; the reference pegs red at 246–252 on every sheet and collapses
  only green and blue. Room was lit from above the wall, doubling the ambient
  the sheets had to beat. Scene-only, against the reference: mean luminance
  93.4 → 108.9 (ref 107.0), warmth +128 → +174 (ref +180).
- **Case Studies.** Wrong archetype — a 2×2 glass grid where spec page 13's
  images are movie-poster stages. Now on `PosterRail` with the crimson bloom.
- **Journey.** The newspaper composited 8% lighter than the page. Paper and ink
  are now sampled from `p15_0` (paper lum 201→147, ink 46→68), which required
  a `surface="light"` timeline: white type measured 3.6:1 on the corrected
  paper, under the 4.5:1 body floor. Titles now 5.2–9.6:1, body 5.0–8.2:1.
  Rail widened from a 1px hairline; its `to-transparent` end stop had made the
  bottom third invisible even at full scroll.
- **Creative Process.** Display type was 1.2:1 where the reference is ~12:1, so
  nothing was occluded because nothing was visible. Geometry was mine from the
  previous session and only the tilt magnitude was right: card aspect
  1.20–1.46 → **0.81** (reference 0.81), overlap 0–4% → 36%, tilts now all one
  way. Card fills inverted to dark, as the reference's are.
- **Services.** A three-up feature grid tilted 2.2–2.6° — a rendering artefact,
  not a decision. Now a scattered arc at 8–13° with 25–31% overlap and three
  size steps. It also did not fit: at ~1000px inside a 100dvh face, two of the
  five disciplines sat below a fold that could not be scrolled, because Lenis
  hijacks the wheel and the face's `overflow-y-auto` never ran. Now 807px with
  zero overflow, and `data-lenis-prevent` as the safety net.
- **AI Studio.** Showed five accents, none of them the brand's primary.
  Re-keyed to faint → amber → crimson.
- **Portfolio.** The "minimal Scroll section" did not scroll — the track was
  the container width to the pixel. Now 112px of real scroll, and the face
  re-fitted to the turn.
- **Stat row.** One confirmed figure now renders as a display statement rather
  than as one cell of a four-up bar with 85% of it empty.

### The second pass — everything above that had been deferred

All seven items previously listed here as "not fixed" are now done.

- **Camera pan no longer reads as a card flip.** The ground, grain and light
  were lifted out of the rotating stage so they carry through the turn — at the
  halfway point you now see a lit room instead of the empty black frame two
  coplanar hidden-backface faces produce. The stage also pulls back to 0.94 and
  returns, because a camera arcing around a subject does not hold a constant
  distance. And **"the slides move"** — the spec's first clause on page 1, which
  was never implemented — now runs: the poster rail is scrubbed sideways by the
  same progress that drives the yaw.
- **The hero scene scales.** `radius`/`height`/`perspective` are CSS lengths
  driven from container units, with the panel width following through
  `calc()`. That exposed a second cause: the wall still measured a constant 68%
  of the frame at 1024, 1440 and 2560 because the legibility scrim was
  darkening the left half at every width. Masked to the copy band, the wall now
  spans **88.8%** against the reference's 88.9% — and headline contrast went
  *up*, 3.9:1 to 4.3:1.
- **The water reflects.** A second wall renders into the floor, flipped and
  masked. Profiling also caught the tone running backwards: the reference
  brightens toward the camera (46 → 106 → 198), ours darkened (94 → 60 → 30).
  Lower third mean 46.0 → 75.1 against 63.1.
- **Blocks have three faces each** — a lit top and two shaded sides, where ten
  flat rectangles with one hairline could never read as volume.
- **The avatar arc is a wall**, full-bleed and clipping at both edges (span 61%
  → 103.6% of viewport), with the opacity ramp gone: rotation and depth carry
  the curve, and fading the flanks was what made it read as a carousel.
- **Tools-stack curves meet their labels.** Labels now come off the same
  expression as the emitters instead of `justify-between` with percentage
  padding; misalignment ~46px → **0px** on all six rows. `FOCUS_X` also moved
  off the wordmark it was being drawn 150px inside.
- **The thin pages.** `/influencer-campaigns` leads with the real creator
  constellation (99.1% shadow → 91.8%, 0 images → 17). `/careers` was checked
  against its own reference first and was too dark even for that (95.4% vs
  75.7%); it now has the lit bank and silhouetted growth that reference's
  structure calls for, at 84.1%. `/content-creation` and `/creator` improved on
  their own from the glass-fill correction.

### Known gaps

- Hero warmth and saturation still trail the reference (+132 vs +167, 82% vs
  93%). I tested the haze layer as the cause; it moved saturation by 0.0, so
  that edit was reverted rather than kept on a guess. Not yet explained.
- The camera turn's *feel* has never been verified. Lenis owns the scroll
  position, so scripted scrolling drives ScrollTrigger to the end and leaves it
  there rather than scrubbing. Initial state and both mechanisms are confirmed;
  the motion needs a human.

### Still needs you

Unchanged from the list below, plus: `AUDIT.md` ends with a "Blocked on the
client" table naming who owns each item. The three that block the most are the
hero reel, the AI avatar stills, and the case-study headlines and figures.

---

## Design critique pass — 2026-08-21

Full critique in **`DESIGN_CRITIQUE.md`**, judged on the rendered DOM at
1440x900 and 375x812. This is what changed.

### The finding

The scenes were never the problem. The connective tissue was, and it was
measurable:

| | before | after | a designed system |
| --- | --- | --- | --- |
| Distinct type steps | **35** | 22 | 7–9 |
| Distinct type sizes | 20 | **11** | 7–9 |
| Distinct spacings | **25** | 19 | 8–10 |
| Distinct radii | **10** | **5** | 3–4 |
| Elevation tiers | **1** | **3** | 3–4 |
| Motion presets | **1** | **3** | — |

Every one of those is the signature of decisions taken per call site instead of
once.

### Fixed

- **Type scale.** Every integer 8→16px was in use, then a hole between 20 and
  36 so card titles had no step and collapsed onto body size. Eight named steps
  now, line-height and tracking attached; `h3` at 28px is the step that did not
  exist and is used 36 times.
- **Spacing.** Snapped to a 4-based scale. Six values (6, 10, 14, 28…) existed
  only because someone reached for `gap-2.5` in the moment.
- **Elevation.** `raised` was used *zero* times, and `void`/`ink` differ by two
  luminance levels — invisible. One box-shadow covered 88 elements, so nothing
  read as above anything. Four tiers now, surface and shadow moving together,
  plus `.glass-chip` so a 28px pill stops wearing a 32px card shadow.
- **Radius.** Ten values → four. The 2px on the Journey broadsheet stays; that
  one is representational.
- **Lime on a crimson brand.** `#c5ff2e` on ten Services pushpins, hardcoded.
  Now crimson. I also had to correct myself: I reported "0 non-brand accents"
  after the previous pass, but that grep only checked teal and violet and
  missed all ten.
- **Motion.** 51 reveals, every one at 0.6s, 14 of 16 sections on the default
  direction. Three presets now, chosen by what the thing *is* — and `scene`
  applies no translation at all, because something the size of the document
  wall moving 24px reads as a hitch rather than an entrance.
- **Composition.** `SectionShell` gains `align="split"`. Eleven sections ran
  the centred boxed arrangement; several had already hand-rolled a split header
  rather than use the shell, which said the shell was missing the mode.
- **Dead code.** `components/ui/button.tsx` — the only shadcn component in the
  tree, imported by nothing.

### Two defects this pass caused or caught

- **Caused.** The mechanical type remap conflated a card *title* and a body
  *standfirst*, both of which happened to be 18px, and promoted both to `h3`.
  Standfirsts jumped 16→28px. Fixed to `lead`. That is what a find-and-replace
  does when the utility name encodes size instead of role — and it is the
  argument for the named scale.
- **Caught.** At 375px the influencer headline ran to x=417 in a 375px viewport
  and was clipped silently by `overflow:hidden` — no scrollbar, nothing to
  notice. Cause was `min-width: auto` on a grid item refusing to shrink below
  its longest line. Found by measuring, not by looking.

### The rhythm steps, now also on the scale

The three section rhythm steps (56/80/112px) were initially left off the
published scale because snapping them re-flows every section and I cannot
screenshot sections to verify. They are now snapped as well — 56→64, 80→96,
112→128, plus 40→48, 144→128 and 176→160 — and verified by measuring section
heights and the pinned faces rather than by eye.

Two things that constraint surfaced:

- **The portfolio face was already overflowing by 33px**, a regression from the
  earlier 20→24 snap, which had pushed the "Browse the full library" CTA under
  a fold that only exists because the section is pinned. Both camera-turn faces
  now measure exactly 900/900 with zero overflow.
- **Portfolio's own padding deliberately sits BELOW the rhythm step.** A face
  inside the turn is clamped to 100dvh, and that constraint outranks the
  spacing scale. Written down in the component rather than left as a mystery.

Measured on the live DOM, the resolved values are now exactly the published
scales:

```
spacing   4  8  12  16  24  32  48  64  96  128  160
type      11  14  16  19  28  40  56  80
radius    8  12  24  pill
```

Still off, and correctly so: `2px` (a 0.5-step chip padding and the Journey
broadsheet's paper radius), `text-[5px]` in the paper vortex, and the
viewport-scaled display clamps. The 112/142/283px values that showed up in the
first sweep turned out to be inline lattice coordinates in WatchCluster and the
creator constellation — geometry, not rhythm, and correctly excluded.

---

## Light theme audit — every route, both themes

The light theme shipped as a token flip, and a token flip is exactly the
thing that cannot carry a page whose subject is light itself. Walked all
nine routes in both themes and found one bug repeated in five places, plus a
real runtime error.

### Scenes do not flip

`/careers`, `/our-work` and `/blog` are LIT SCENES — a glowing meadow bank, a
dark media-library window, a dark room full of lit paper. The chrome around
them was hardcoded dark; only the type flipped. Results: `/careers` lost its
glowing headline word entirely (a glow has nothing to shine against on
off-white), `/our-work` rendered "Our Content" near-black on `#0c0b10`, and
`/blog` put a razor seam through its standfirst — half the sentence on cream,
half on black.

Added a `.scene-dark` utility that re-pins the whole token set inside a
subtree. It sets `color` as well as `background-color`: with only the
background pinned, any text relying on inheritance keeps the light theme's
foreground and still lands dark-on-dark. `body:has(.scene-dark) header` takes
the nav with it, so a light bar never floats on a black page.

The same fault, one level down, hit the poster cards: a billboard is a dark
object, so every client name rendered black-on-black in light mode. Those
labels now use `--color-scene`. **The two `.glass` chips on each card
deliberately still flip** — glass is a white fill, so it lightens the poster
beneath it and its label has to darken to match. Which token a label wants
depends on what is directly behind it, not on which component it lives in.

### A spotlight cannot be brighter than paper

On a dark ground a spotlight is additive: the beam is the bright thing. On
cream there is nothing left to brighten, so the beam only shifted the hue and
landed as a yellow stain. Light works the other way round on paper — a lit
patch reads because everything else is darker. `--spot-beam` drops to 0.22 in
the light theme and `--spot-veil` brings in the falloff instead.

### Math.sin is not the same number on the server and the client

`/blog` carried a hydration error that survived three wrong guesses. The diff
was one character deep: server `x2="81.48208398713905"`, client
`x2="81.4820839871827"`. Both the textures and the vortex hashed with
`Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453`, and Math.sin is
transcendental — implementations are not required to agree to the last bit,
and Node and V8-in-Chrome don't. Those values are interpolated into SVG
coordinates, baked into a data URI, baked into an inline style, so React
discarded the server render of all 56 sheets. Replaced with an integer hash;
`Math.imul` and the bitwise operators are exactly specified and cannot drift.
Rounding the coordinates also took the page from 540KB to 499KB.

**Two debugging notes worth keeping.** React's dev-mode hydration diff prints
the server side through the CSSOM, so every value comes back re-serialised
and every property looks like it mismatches. And comparing the DOM against
the server HTML proves nothing, because React logs attribute mismatches
without patching them — the DOM still holds the server's values, so the two
always agree. Only the fiber's props are the client's actual expectation.

### The mobile hero

The scrim is a 94deg ramp, clear by 72% across, because on desktop the copy
sits low and left. At 375px that is 270px, and the headline runs to 351px —
so the last quarter of every line sat on the wall at its brightest.
Headline 1.93:1 against a 3.0 floor; body copy 1.31:1 against 4.5. Below
`sm` the scrim now runs full-width and ramps vertically: 7.85:1 and 7.21:1.

Those figures are computed, not sampled, and the reason is worth recording:
this hero sets amber type on an amber wall, so neither a brightness threshold
nor a chroma filter separates glyphs from ground — both keep returning the
type as if it were background. Alpha-compositing the scrim at its actual
alpha over the brightest measured wall pixel is exact and needs no such
separation.

### Also

The pushpin glow was `rgb(197 255 46)` — lime, left behind when the pin head
was changed to crimson, on every pinned card on the site. Journey's cool
accent `#cfe3ff` measured about 1.2:1 on cream; now `--cool-accent`, which
flips. Checked the other hardcoded inks and the rest correctly do not flip:
they sit on lit objects — the newspaper sheet, the glass buttons, the glow
capsule — not on the page ground.

---

## "Almost all designs are broken" — what it actually was

Reported: light mode broken on every page, very rough page breaks, designs
broken, animations not smooth, text overlapping. All five were real. Four of
them came from three causes.

### The measuring was wrong first

Every earlier pass judged this site through a browser pane running at
**673x321**. That is not a desktop, and it is why those passes kept
concluding things were fine. `scratchpad/cdp.mjs` now drives headless Chrome
over CDP — emulated colour scheme AND reduced motion, real viewports,
full-page slices, console capture, arbitrary JS. Node 26 ships a WebSocket, so
it needs no dependencies.

Two of its own results had to be thrown out before anything here was
trustworthy. The contrast checker read Tailwind v4's `oklab()` as near-black
and reported the site's brightest display type as 1.04:1 — colours are now
resolved by painting them on a canvas. And the overlap checker counted
`getBoundingClientRect` boxes, which are axis-aligned, so inside a card tilted
13 degrees a numeral and a heading that flexbox guarantees cannot touch
reported 80% overlap.

### Reduce Motion collapsed the desktop layout

The camera-pan installs its pin under `(min-width: 1024px) and
(prefers-reduced-motion: no-preference)`, but its geometry was plain `lg:` —
`lg:absolute lg:inset-0` on both faces inside an `lg:h-dvh lg:overflow-hidden`
box. A desktop visitor with Reduce Motion got the geometry without the
mechanism: two entire sections pinned on top of each other, every line of one
printed over the other, the second unreachable. Measured at 1440px, "04" sat
at 100% overlap on "Aditya Birla Sun Life Insurance".

One flag explains three of the five complaints — broken designs, overlapping
text, and "animations are not smooth" in the sense that there were none.
The CSS query and the JS query now have to be the same query: `motion-safe:`.

Homepage real text overlaps 20 -> 0; all eight routes measure 0.

Three more SSR splits shared the root cause — `useReducedMotion()` is null
during SSR and true in the browser, so anything gated on it renders
differently on each side. A static tilt is orientation, not motion; drag is
direct manipulation, not motion; and `motion-safe:` already gates what it
gates. `SlideUp` was the worst: an early `return <>{children}</>` changed the
tree SHAPE and discarded the server render of /creator entirely.

### One colour no page could carry

`--color-amber` is a fixed `#ff8a3d`, used as type in 17 places. On the light
theme's paper: **1.97-2.08:1**, against floors of 3.0 and 4.5. Every section
heading's accent word, every service caption, every numbered label. 31 amber
text nodes across four routes; all 31 failed.

Amber is also a light source here — glows, borders, the lit hero wall — so it
could not just be darkened. Type takes `--amber-ink` (`#ff8a3d` dark,
`#a8410b` light) and `.scene-dark` re-pins it, so lit scenes keep the bright
amber with no per-call-site special casing. 31 -> 0, dark mode unchanged.

### Glass had no edge on paper

A translucent white fill lifts hard against black and not at all against
cream: measured **1.082:1** card-to-ground, with the border pixel landing
between the two. The testimonial wall rendered as names floating on paper.
Light mode now builds glass the other way round — the fill stays near-white,
the border goes to 0.26, and the shadows become two-layer, a tight contact
shadow plus a soft ambient one. One soft blur alone reads as fog.

### The rough page break was one section

A luminance profile down the page, sampled in the gutters, found two cliffs,
both at the only pinned-dark section: 0.676 -> 0.003 entering, 0.002 -> 0.836
leaving, in three pixels. Both edges now ramp over 7rem, blending to the
adjacent grounds through the surface tokens so they follow the theme. Capping
the top band at 90% mattered: at full strength it reset to clean paper, but
journey above ends darkened by its own curl shadow, so the band overshot and
drew the line it was there to remove. Hard edges 5 -> 3, and the remaining
three are dark cards reaching the viewport edge, not section breaks.

### Animation smoothness is NOT confirmed

168 elements on /blog carried `will-change: transform` — three nested per
sheet, 56 sheets. Two bought nothing (a running CSS animation is promoted
anyway; the inner node already had a 3D context). Now 56.

But that is a layer count, not a frame rate. A harness driving real wheel
events through CDP reported a 33.3ms median — until the same harness reported
33.3ms on `about:blank`. Headless Chrome caps rAF at 30Hz here, so it cannot
tell a smooth page from a janky one. **This one needs confirming on real
hardware.**

### Still open

- Case Studies duplicates Portfolio: same clients, same rail, because every
  case-study headline and result is still `TODO`, so the cards fall back to
  the client name. A copy problem showing up as a design one.
- Ten clipped creator-card labels ("Travel Creator" -> "Travel Crea…").
- The poster rails have no edge mask, so cards cut mid-word at the viewport.

---

## Vertical pages brief — 2026-09-28

Source: "Website - Vertical pages pricing Design and copy" (49 pages). It
replaces the first pricing brief. Copy is verbatim; the mockups' light-page
skin is re-set in the site's own language (dark glass, Mont ExtraLight, brand
yellow).

**Homepage.** The first pricing brief's additions are removed — the
Memberships section and the Join / Book / View Work buttons on the four
vertical sections are back to what `main` had. Section 1 (the Brain, its
"Membership from" buttons and "Your creative team. On demand.") is kept, as
asked; its buttons now point at each vertical page's `#pricing`, and
"Explore Memberships" at /pricing.

**/pricing.** The "vibe" block (One team. One monthly fee. + four vertical
cards), then "Choose your creative team." — the four verticals' packages
behind tabs that slide — then one line of logos and the one-time projects
slider. The old /pricing/<vertical> pages 308 to the vertical pages.

**The four vertical pages** (/influencer-marketing, /ai-content-automation,
/content-production, /brand-design) are rebuilt to the brief: centred
breadcrumb + vertical tabs, logos, plans with a Monthly/Quarterly switch
(quarterly = 3× monthly, no discount, as the brief says), "View What's
Included" accordion, "Compare Plans" window, add-ons with prices behind a
button, case studies, work, closing band. Copy lives in `lib/verticals/*`;
shared pieces in `app/(home)/components/offer/`.

**Every footer** opens with a 15-minute booking calendar (Genesis logo in
place of the reference's illustration).

**Mont demo font.** Its ExtraLight file draws % * # < > | ~ ° ± † ‰ and the
arrows as one placeholder glyph. `app/layout.tsx` now gives the face a
unicode-range that leaves those (and the hairline /) to the fallback font.
Remove it when the retail files land.

### Still owed by Genesis

| Item | Where it goes |
| --- | --- |
| The 15-minute booking calendar link | `bookingUrl` in lib/pricing — until then a picked slot opens WhatsApp |
| Razorpay link per plan | `joinUrls` in lib/pricing — until then plan buttons open WhatsApp |
| AI Labs comparison table, Growth + Enterprise columns | The PDF's table is cut off after Starter; lib/verticals/ai-labs.ts compares only what the cards state |
| "Priority 48-Hour Production" price | Blank in the brief; shows "On request" |
| Bookable hours for the calendar | Placeholder: weekdays 11:00–17:30 IST |
| The final /pricing page | The brief says it will follow; the one-time projects are "as of now" |

### Conversion pass — 2026-09-28

- One name per vertical in nav, breadcrumbs and footer (Genesis Influence /
  Studios / AI Labs / Brand & Design). URLs keep their search words.
- Nav is the buying path only; I'm a Creator and Career live in the footer.
- Influence stats share lib/proof's confirmed brands (45+) and views (500M+).
- Homepage: "Projects from ₹25K · Memberships from ₹65K/month" under the
  promise, and a one-line pricing strip after the verticals. ₹25K is
  Genesis's entry price.
- /pricing: tabs are linkable (`/pricing?v=studios`), the three pricing
  models are explained above them, and "How Genesis Memberships Work" follows.
- Vertical pages: visible h1 (hero), a sticky "on this page" bar, and a
  phone call-to-action bar.
- Calendar says "Request this slot" and that the slot is confirmed on
  WhatsApp, until `bookingUrl` is set.
- Vercel Analytics custom events: `whatsapp_click` on every wa.me link and
  `cta_click` on anything with `data-track` (plans, billing, tabs, jump bar,
  booking). Custom events need a Vercel Pro plan to appear.

Then, from the design/UX/copy/pricing review:

- /pricing opens its plans panel with the three pricing models as cards —
  who each is for and where it starts (project from ₹25K, membership from
  ₹65K/month, commission of creator fees + 15%).
- Every plan grid carries the brief's terms (stop before the next billing
  cycle, pause where available, prices exclusive of GST) and a "What these
  terms mean" glossary built only from definitions the brief gives.
- Influence shows a worked commission example (₹5,00,000 → ₹75,000).
- "Start Starter" reads "Start with Starter".
- Small titles use the text face; Mont ExtraLight is kept for display sizes.
- "Every video includes" and the Studios Starter breakdown open on demand,
  and the plans sit on their own full-width band, so the long pages lead
  with the decision.

Still owed: Razorpay links, testimonials, case-study results, team strip,
licensed fonts, a real-device speed check, definitions of "adaptation" and
"premium vs standard video", and decisions on a quarterly incentive and a
project-to-membership credit.

### Sales-ready pass — 2026-09-28

- Homepage divisions each end on a **plan bar**: the product (AI Content
  Studio, Content Monthly, Always-On Creative Desk, Influencer & UGC
  Campaigns), its promise, where the price starts, "See … plans", a direct
  start (the Razorpay link once `joinUrls` is filled) and "View … work".
  AI Lab and Studios headings now use the products' own lines ("Build once.
  Publish continuously.", "From brief to publish.").
- AI Avatar Setup (₹24,999/-, the entry price) is offered under the avatars.
- The homepage memberships block now says the model: one team, one monthly
  fee; the four steps; each division's starting price; Explore Memberships /
  Book a 15-min Call.
- Brand & Design: the ₹64,999/- plan is "Always-On" (Genesis Creative
  Desk), with the Quarterly/Monthly switch; What's included is a bento; case
  studies and work show Brand & Design and motion graphics only.
- Fixed: the jump bar and phone CTA bar sat inside <main>, whose children get
  content-visibility with a 900px intrinsic size — they now render after it.
  Brand & Design cards overflowed a 375px screen by 52px. Studios hero
  buttons wrapped at 1440px.
- Audit: every route at 375 / 768 / 1024 / 1440 — no horizontal overflow, no
  overlapping text; 48 internal links and every cross-page anchor resolve.
  (Audits must force `content-visibility: visible` on main's children, and a
  hidden browser pane skips rendering entirely, so measure, don't screenshot.)

Open copy questions for Genesis: TripGate vs "TripGatee" (the case study and
the work tile disagree); motion-graphics studies are headlined "Video
Production"; "Your creative team" opens both the homepage and Brand & Design.

---

## Repository

Remote is `https://github.com/HelloGenesis/genesisnew`, set as `origin`. Work goes to the `pricing` branch; `main` is not touched.

Pushing works from this machine; `main` is up to date with `origin/main`.

## Commands

```bash
npm run dev        # dev server
npm run build      # prisma generate + next build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run db:migrate # create + apply a migration (dev)
npm run db:deploy  # apply pending migrations (prod/CI)
npm run db:studio  # browse data
```
