import type { TourStep } from "@/components/crm/tour-overlay";

/**
 * "HOW IT WORKS" FOR EVERY SECTION (Genesis, 22 Oct 2026: "add tours to each
 * section and tab, like quotes, invoices, influencer database, how to make an
 * influencer plan, all across"). Each page's button walks through that page;
 * a step whose target isn't on screen is shown in the middle instead.
 *
 * Targets are "text:" + the words a heading or button starts with, so a guide
 * keeps pointing at the right place as long as the page keeps its words.
 */
export type Guide = { title: string; steps: TourStep[] };

const GUIDES: { match: RegExp; guide: Guide }[] = [
  {
    match: /^\/admin\/quotes\/(new|[^/]+)$/,
    guide: {
      title: "How to make a quote or influencer plan",
      steps: [
        { title: "Making a quote or influencer plan", body: "This page builds the whole document: proposal, influencer plan and pricing. Nothing is sent until you choose to; Save keeps it as a draft the team can see." },
        { target: "text:This document has", title: "1. Choose what it holds", body: "Tick Proposal, Influencer plan and/or Price lines. An influencer plan usually has the proposal and the plan; a quote has price lines." },
        { target: 'input[placeholder^="Pick a client"]', title: "2. Who it's for", body: "Pick the client or lead: their name, email and company fill in. Or type a new one." },
        { target: "text:Proposal", title: "3. The proposal", body: "Problems, objectives, target group (TG), platforms and content ideas. Add images, bold text and lists with the toolbar." },
        { target: "text:Influencer plan", title: "4. Add creators", body: "Search the influencer database, paste a profile link, add a creator by hand, or Import Excel / CSV. Everyone you add is saved to the database too." },
        { target: "text:Editing", title: "5. Internal or external", body: "Internal shows your costs and profit; external is what the brand sees. Columns can be shown, hidden or added." },
        { target: "text:Import Excel", title: "Got a sheet already?", body: "Import an Excel or CSV of creators: columns are matched for you, and the creators land on the plan with their rates." },
        { target: "text:Costing", title: "6. Price lines", body: "Products and services with quantity and price, for quotes and for fees on a plan." },
        { target: "text:Totals", title: "7. Totals and GST", body: "Discount, GST (CGST/SGST or IGST) and the total. Choose whether creators' fees are added to the total." },
        { target: "text:Save", title: "8. Save", body: "Saves the draft for the whole team. If the plan has Google Sheets, they update too. Leaving with unsaved changes asks first." },
        { target: "text:Export", title: "9. Excel and Google Sheets", body: "Download the internal or external Excel, or make live internal and external Google Sheets." },
        { target: "text:Send to the client", title: "10. Send it", body: "Email it with a link and PDF, and a Razorpay pay link if you like; or share on WhatsApp. The client's link shows when they've opened it." },
        { target: "text:Get costing", title: "Ask creators for rates", body: "Message every creator on the plan on WhatsApp or email from your saved template. Reach out in the sidebar does the same across plans." },
        { target: "text:Make the invoice", title: "When it's accepted", body: "Mark it accepted to open the project, and make the invoice from it in one click. The PDF is filed in the client's Google Drive folder." },
      ],
    },
  },
  {
    match: /^\/admin\/quotes$/,
    guide: {
      title: "Quotes & plans",
      steps: [
        { title: "Quotes & plans", body: "Every proposal, quote and influencer plan, the team's together. Drafts show here as soon as they're saved." },
        { target: "text:New influencer plan", title: "Make an influencer plan", body: "Start a plan here, or tick creators in the Influencer database and press Make a plan with these." },
        { target: "text:New quote", title: "Make a quote", body: "Start a price quote or proposal. Open any one to edit, send, duplicate or invoice it." },
      ],
    },
  },
  {
    match: /^\/admin\/creators$/,
    guide: {
      title: "Influencer database",
      steps: [
        { title: "Influencer database", body: "Creators with followers, rates, contacts, agency and where they came from. Find them, edit them in place, and turn a selection into a plan." },
        { target: 'input[placeholder="Name or @handle"]', title: "Find creators", body: "Search by name or handle, then narrow by platform, tier, niche, city, source and followers. Pick several in a filter to widen it." },
        { target: "text:Any source", title: "Where they came from", body: "Every creator records their source: a Google Sheet, an Excel file, a plan, the website, an agency. Filter by it here." },
        { target: "text:Add a creator", title: "Add one", body: "Name, handle, rates, niches, languages, agency and point of contact (POC), and the source." },
        { target: "text:Import", title: "Import a sheet", body: "Bring in an Excel, CSV or Google Sheet: columns are matched for you, nobody is duplicated, and the source is recorded." },
        { target: "thead", title: "Edit in place", body: "Every cell has a pencil: tap it, change the value, press Enter. Followers can be typed as 84K, 1.2M or 4.4Cr." },
        { target: "text:tick all shown", title: "Make a plan", body: "Tick creators, then Make a plan with these, or download them as Excel or Google Sheets." },
      ],
    },
  },
  {
    match: /^\/admin\/invoices$/,
    guide: {
      title: "Invoices",
      steps: [
        { title: "Invoices", body: "GST tax invoices, numbered in a series per financial year, with what's outstanding and overdue." },
        { target: "text:Make the invoice", title: "From a quote", body: "Pick a quote and make its invoice: client, billing details, lines and quotation number filled in." },
        { target: "text:New invoice", title: "Or from scratch", body: "For retainers, extra work or reimbursements without a quote." },
      ],
    },
  },
  {
    match: /^\/admin\/invoices\/(new|[^/]+)$/,
    guide: {
      title: "Making and sending an invoice",
      steps: [
        { title: "An invoice, start to finish", body: "Fill it in (or from a quote), check it, send it with a pay link, get it signed, and it's filed in Google Drive." },
        { target: "text:Fill from a quote", title: "Fill from a quote", body: "Copies the client, billing details, lines, discount and quotation number from a quote." },
        { target: "text:Billed to", title: "Billed to", body: "The client's registered name, GSTIN, PAN and address: they print under “To,”. Fill from a client, or type them once and they're remembered." },
        { target: "text:Lines", title: "Lines", body: "Description, SAC, quantity and rate. GST is worked out from the place of supply." },
        { target: "text:Send to the client", title: "Send", body: "Email it with a Razorpay pay link, or share the link. It's filed as a PDF in the client's Drive folder." },
        { target: "text:Signature", title: "Signature", body: "Download, sign by hand, and upload the signed copy; finance is told at once." },
        { target: "text:Supporting document", title: "Supporting document", body: "Screenshots or a link (a Drive folder, the live post) that go with the invoice." },
        { target: "text:Google Drive", title: "Google Drive", body: "Where its PDF is filed, with a button to save it again now." },
      ],
    },
  },
  {
    match: /^\/admin\/leads$/,
    guide: {
      title: "Leads & pipeline",
      steps: [
        { title: "Leads & pipeline", body: "Every enquiry from the website, calls, WhatsApp, email and referrals, from first contact to won or lost." },
        { target: "text:Add a lead", title: "Add a lead", body: "Name, company, what they want and the next follow-up date." },
        { target: "text:Filter", title: "Filter", body: "By stage, owner, source or division." },
        { title: "Move them along", body: "Drag a lead across the stages. The sidebar count shows follow-ups that are due; open a lead to make its quote." },
      ],
    },
  },
  {
    match: /^\/admin\/reachout$/,
    guide: {
      title: "Reach out",
      steps: [
        { title: "Reach out", body: "Ask creators for their rates, plan by plan, from one place." },
        { target: "text:Plans", title: "Pick a plan", body: "Each plan shows how many of its creators you've contacted." },
        { target: "text:Get costing", title: "Write the message once", body: "Campaign, audience, cities and deliverables fill the template; each creator gets it with their own name." },
        { title: "Send", body: "WhatsApp opens with the message ready, or email sends it from the CRM. Each creator is marked contacted." },
      ],
    },
  },
  {
    match: /^\/admin\/briefs$/,
    guide: { title: "Briefs", steps: [{ title: "Briefs", body: "What clients have asked for, from email, Drive, the portal or added by hand." }, { target: "text:Add a brief", title: "Add a brief", body: "Paste or attach it; then make a quote or plan from it in one click." }] },
  },
  {
    match: /^\/admin\/accounts$/,
    guide: { title: "Clients & agencies", steps: [{ title: "Clients & agencies", body: "Every client, agency and partner: contacts, billing details (used on invoices), projects, quotes and history." }, { target: "text:Add an account", title: "Add one", body: "A client, an agency (with its brands), a vendor, or a reseller with a referral link and commission." }] },
  },
  {
    match: /^\/admin\/projects/,
    guide: { title: "Projects", steps: [{ title: "Projects", body: "The work once a client says yes: stages, deliverables sent for approval, files in Google Drive, and who's on it." }, { target: "text:Filter", title: "Filter", body: "By status, client or person." }, { title: "Approvals", body: "Upload a deliverable and the client approves it or asks for changes in their portal; the sidebar count shows changes requested." }] },
  },
  {
    match: /^\/admin\/tasks$/,
    guide: { title: "Tasks", steps: [{ title: "Tasks", body: "Your to-dos and what you've given others, with due dates." }, { target: "text:Add a task", title: "Add a task", body: "Give it to yourself or a teammate, with a due date; they're told." }] },
  },
  {
    match: /^\/admin\/inbox$/,
    guide: { title: "Inbox · Gmail & Drive", steps: [{ title: "Inbox · Gmail & Drive", body: "Connect your Google once: briefs, client details and invoices in your email and Drive are found and turned into leads." }, { target: "text:Connect Google", title: "Connect Google", body: "Allows Gmail, Drive, Sheets and Contacts. Your contacts then sync to your Google Contacts." }, { target: "text:Waiting for you", title: "Waiting for you", body: "What was found: keep it (it becomes a lead or record) or clear it." }, { target: "text:Import a Google Sheet", title: "Import a Google Sheet", body: "Bring leads, clients, vendors or influencers in from a sheet, and keep it in sync." }] },
  },
  {
    match: /^\/admin\/staff$/,
    guide: { title: "Staff & roles", steps: [{ title: "Staff & roles", body: "Who works in the CRM and what each person can open." }, { target: "text:Add someone", title: "Add someone", body: "Their email and one or more roles: Sales, Producer, Finance, Influencer team, Creative, Admin." }, { target: "text:Portal access", title: "Portal access", body: "Give a client their portal, or an influencer their own profile and campaigns." }, { target: "text:Can also see", title: "Can also see", body: "Open more to someone: everyone's leads, quotes or invoices, and influencer data (none, only what they add, or all)." }] },
  },
  {
    match: /^\/admin$/,
    guide: { title: "Dashboard", steps: [{ title: "Your dashboard", body: "Your day: tasks due, follow-ups, new briefs and the numbers that matter. Super admins can view anyone's dashboard." }, { target: "text:Tasks", title: "Tasks", body: "What's due, yours and what you've given others." }, { target: "text:Calendar", title: "Calendar", body: "Your Google Calendar for the week." }] },
  },
  {
    match: /^\/portal$/,
    guide: { title: "Your portal", steps: [{ title: "Your portal", body: "Everything Genesis is doing for you: work to approve, briefs, invoices and your team." }, { target: "text:Send a brief", title: "Send a brief", body: "Tell the team what you need; you'll see the replies here." }] },
  },
];

export function guideFor(path: string): Guide | null {
  return GUIDES.find((g) => g.match.test(path))?.guide ?? null;
}
