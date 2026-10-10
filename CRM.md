# Genesis CRM

Built 10 October 2026 inside genesisnew, modelled on genesis-coworking's
control room and integrations. One database, three sides:

| Who | Where | What they do |
| --- | --- | --- |
| Genesis staff | `/admin` | Leads and pipeline, clients and agencies, projects and deliverables, requests, tasks, the influencer database, vendors, orders, subscriptions, commissions, payouts, staff, integrations |
| Clients (brands) | `/portal` | Follow projects stage by stage, approve work or request changes, send briefs and revisions, message the team, see plans, orders, payments and invoices, add colleagues |
| Agencies | `/portal` | All of the above for every brand they manage (switch between them), add brands, and — as a reseller — a referral link and commission |
| Vendors and crew | `/portal` | Accept or decline work, deliver files (Genesis reviews before the client sees them), submit invoices, keep payout details |

Everyone signs in at **`/login`** — no passwords.

## How the pieces connect

- **Website forms → leads.** A brand enquiry or quick contact becomes a lead,
  due for follow-up today. A creator's Influencer Onboarding form adds them
  to the influencer database. (`lib/crm/capture.ts`)
- **Checkout → order + lead.** Every checkout is kept as a pending order with
  its lines, and as a lead, so unpaid checkouts get followed up.
- **Razorpay webhook → client and work.** When Razorpay says it's paid:
  - the order is marked paid, once only;
  - the client's account is found (by email or GSTIN) or created, and the
    buyer gets portal access;
  - one project opens per product, with the "4 of 4 delivered" count read
    from the product's own "What's included";
  - the payment is recorded and any reseller commission is worked out;
  - the lead is closed as won;
  - the client gets an email with each product's own "what we need from
    you" list.

  Each plan renewal opens that cycle's project. A failing or halted renewal
  alerts finance and producers (pause the queue) and tells the client.
  Events applied out of order or twice are handled, and failures are
  retried. (`lib/crm/orders.ts`)
- **Payment links for quoted work.** From a client's page, staff send a
  Razorpay link for anything not in the cart (an Influence campaign, a custom
  quote). When it's paid, it becomes a project like any checkout.
- **Delivery.** Each division moves through its own stages:
  - AI Lab: brief → script lock → Draft 1 → generation → Draft 2 → delivered
  - Studios: brief → pre-production → shoot → edit → review → delivered
  - Brand & Design: brief → discovery → concepts → revisions → final files → delivered
  - Influence: brief → shortlist → confirmed → content → live → report

  Clients are emailed when a project moves on and when something is ready
  to review.
- **Email** goes through a durable outbox delivered by Resend, with retries
  and a "failed" list in Integrations. (`lib/crm/notify.ts`)
- **Google Sheets mirror.** Leads, accounts, orders, payments, projects and
  requests each get a live tab ("CRM Leads"…) in the forms spreadsheet,
  updated in place. (`lib/crm/sheets.ts`)
- **Scheduled jobs.** `/api/jobs/run` (Vercel Cron, every minute) does four
  things, each independent and safe to re-run (`lib/crm/jobs.ts`):
  - retries failed webhooks;
  - sends the 9am morning digest of follow-ups and tasks due;
  - delivers queued emails;
  - syncs the sheet.

## Security

- **Sign-in is Auth0 only:** Google, or a one-time code by email or SMS.
  OTP requests are rate-limited per IP on top of Auth0's own limits.
- **Staff roles:** Owner, Admin, Sales, Producer, Finance. A role is never
  self-assigned; an owner grants it to an email, and it's claimed only when
  that address signs in verified. `CRM_OWNER_EMAILS` bootstraps the first
  owner.
- **`/admin` needs two-factor:** an authenticator-app code (QR set-up on
  first visit, then every 12 hours), or Auth0 MFA.
- **Portal access is scoped to the person's own accounts.** Every page and
  action checks it, plus an agency's brands. Internal notes, draft
  deliverables and unconfirmed creators never reach the portal.
- **Exports and changes are audit-logged.** CSV exports escape formula
  injection.

## Going live — what to set up

1. **Database (Neon).** Run the CRM migration:
   ```bash
   npm run db:deploy
   ```
2. **Auth0.**
   - Callback URL: `https://www.genesismedia.co/auth/callback`
   - Logout URL: `https://www.genesismedia.co`
   - Grant types: Authorization Code, Refresh Token and **Passwordless OTP**.
   - Connections: Passwordless → Email, set to **one-time code** (not magic
     link); Google with your own OAuth client; SMS optional (needs DLT
     registration for India).
   - List the tested connections in `AUTH0_CONNECTIONS`.
3. **First owner.** Set `CRM_OWNER_EMAILS`, or run:
   ```bash
   npm run staff:grant -- you@genesismedia.co OWNER
   ```
   Then sign in at `/login`. Add the rest of the team in Staff & roles.
4. **Resend.** Set `RESEND_API_KEY` and `CRM_EMAIL_FROM` (on a verified
   domain), and `CRM_OPS_EMAIL`.
5. **Razorpay webhook.** Add these events, alongside `payment_link.paid`:
   - `subscription.authenticated`, `subscription.activated`, `subscription.charged`
   - `subscription.pending`, `subscription.halted`
   - `subscription.paused`, `subscription.resumed`
   - `subscription.cancelled`, `subscription.completed`
6. **Vercel.** Set `CRON_SECRET`; `vercel.json` already schedules the job.
   Per-minute crons need a Pro plan; on Hobby, change the schedule to daily.
7. **Sheets (optional).** Leave as is to use the forms spreadsheet, or set
   `CRM_SHEETS_ID` to a separate one shared with the service account.
8. Check **Integrations** in `/admin`: every row should say Connected.

## Local development

```bash
npm run db:dev
```
That runs the embedded Postgres; keep it in its own terminal. Then:
```bash
npm run db:deploy && npm run crm:seed -- you@genesismedia.co
```
Then start the dev server with local sign-in switched on:
```bash
CRM_DEV_LOGIN=1 npm run dev
```

`.env.development.local` points `DATABASE_URL` at the local database. With
Auth0 unset and `CRM_DEV_LOGIN=1`, `/login` signs in any email without a code
(development only). The two-factor check still runs; use any authenticator
app with the QR code.
