/*
 * What each part of the CRM and the portal does, keyed by its sidebar link: the
 * tour's words (components/crm/app-tour) and the dashboard's All features.
 */
export const ABOUT: Record<string, { title: string; body: string }> = {
  "/admin": { title: "Dashboard", body: "Your day at a glance: tasks due, follow-ups, new briefs and the numbers that matter." },
  "/admin/notifications": { title: "Notifications", body: "Everything that needs you: a client opened a quote, an invoice was paid, a task was assigned." },
  "/admin/inbox": { title: "Inbox · Gmail & Drive", body: "Connect Gmail and Drive once. Briefs that arrive by email or in Drive become leads, with the brief attached." },
  "/admin/assistant/usage": { title: "AI usage", body: "What Genesis Copilot used and cost this month: yours, and for the owners, everyone's." },
  "/admin/assistant": { title: "Genesis Copilot", body: "Ask it to make quotes, proposals and influencer plans, add leads, clients and tasks, or find creators, from text, screenshots, Excel or PDFs." },
  "/admin/tasks": { title: "Tasks", body: "Your to-dos and the team's, with due dates. Overdue ones show a count here." },
  "/admin/reports": { title: "Reports", body: "Pipeline, sales and delivery numbers across the team." },
  "/admin/leads": { title: "Leads & pipeline", body: "Every enquiry from the site, calls, WhatsApp and email. Drag them across stages; the count shows follow-ups due." },
  "/admin/briefs": { title: "Briefs", body: "What clients have asked for. Turn a brief into a quote or influencer plan in one click." },
  "/admin/quotes": { title: "Quotes & plans", body: "Proposals, price quotes and influencer plans. Send a link or PDF with a Razorpay pay link; export to Excel or Google Sheets. Every save is shared with the team." },
  "/admin/quotes?type=quotes": { title: "Quotes & proposals", body: "Price quotes and proposals for shoots, films, AI content and design. Send a link or PDF with a Razorpay pay link." },
  "/admin/quotes?type=plans": { title: "Influencer plans", body: "Creator lists with costs and client prices, shared as a proposal, a client link or Google Sheets, in step with the influencer database." },
  "/admin/reachout": { title: "Reach out", body: "Ask a plan's creators for their rates on WhatsApp or email, from your saved message, and see who's been contacted." },
  "/admin/invoices": { title: "Invoices", body: "GST tax invoices with CGST/SGST or IGST worked out. Fill one from a quote; each is filed as a PDF in the client's Google Drive folder." },
  "/admin/accounts": { title: "Clients & agencies", body: "Every client, agency and partner with their contacts, billing details, projects and history." },
  "/admin/projects": { title: "Project timeline", body: "Every project on a timeline from start to due date, by stage, with deliverables for approval, files and the team on it." },
  "/admin/requests": { title: "Requests & support", body: "Briefs and questions clients send from their portal, and the replies." },
  "/admin/creators": { title: "Influencer database", body: "Creators with followers, rates and contacts. Filter, tick and make a plan; tap the pencil to edit any cell." },
  "/admin/vendors": { title: "Vendors & crew", body: "Freelancers, crews and production houses, with skills, rates and commission." },
  "/admin/billing": { title: "Orders & subscriptions", body: "Everything bought on the website and paid through Razorpay, including subscriptions." },
  "/admin/payouts": { title: "Commissions & payouts", body: "What's owed to resellers and vendors, and what's been paid." },
  "/admin/expenses": { title: "Expenses & salaries", body: "Company spending, salaries and receipts in one place." },
  "/admin/expenses/subscriptions": { title: "Our subscriptions", body: "The tools Genesis pays for, with renewal reminders." },
  "/admin/expenses/gst": { title: "GST", body: "GST due dates and filings." },
  "/admin/staff": { title: "Staff & roles", body: "Who works in the CRM, what each person can open, influencer-data access, and client or influencer portal access." },
  "/admin/lab": { title: "AI Lab", body: "Genesis AI Lab's credit prices, grants and usage." },
  "/admin/team": { title: "Team & company", body: "Your agency's team in the CRM, and your company details for quotes and invoices." },
  "/admin/settings": { title: "Integrations", body: "Google Drive, Gmail, Google Sheets and Contacts, and anything that didn't send." },
  "/portal": { title: "Overview", body: "Where everything stands: work waiting for your approval, what's next and what's due." },
  "/portal/projects": { title: "Projects", body: "Each piece of work with its stages. Review and approve deliverables here." },
  "/portal/requests": { title: "Briefs & requests", body: "Send a new brief or a question to the Genesis team, and follow the replies." },
  "/portal/billing": { title: "Billing & invoices", body: "Your invoices, payments and subscriptions." },
  "/portal/team": { title: "Team", body: "Add colleagues so they can see and approve work too." },
  "/portal/brands": { title: "Brands", body: "The brands you manage, each with their own projects." },
  "/portal/referrals": { title: "Referrals & commission", body: "Your referral link and the commission you've earned." },
  "/portal/work": { title: "My work", body: "Jobs offered to you, what you're working on, and what to deliver." },
  "/portal/invoices": { title: "Invoices & payouts", body: "Send your invoices and see what's been paid." },
};

/*
 * THE TOUR, START TO END (Genesis, 31 Oct 2026: "explain all features from
 * start to end, the entire end to end process, without missing anything").
 * One chapter per area of the CRM, in the order the work happens: a lead
 * comes in, becomes a brief and a quote or plan, the work is delivered and
 * approved, the invoice is paid. The tour lists each area's own pages under
 * its chapter (from ABOUT), so everyone sees exactly what they can open.
 */
export const JOURNEY: Record<string, { title: string; body: string }> = {
  Today: {
    title: "Home: your day",
    body: "Start here. The dashboard gathers what needs you: tasks due, leads to follow up, briefs found in Gmail and Drive, requests waiting on you and work due this week. The bell has every alert; Tasks has your to-dos and the ones you've given others.",
  },
  Sales: {
    title: "Sales: from enquiry to yes",
    body: "Every client starts as a lead: from your website, a call, WhatsApp, email, a referral, or found by the Inbox in Gmail. Move it across the pipeline until it's won or lost. What the client asks for becomes a brief, and a brief becomes a quote or proposal you send as a link or PDF, with a Razorpay pay link if you like. The client accepts it from the link.",
  },
  Influence: {
    title: "Influence: creators and plans",
    body: "Your own influencer database: import any Excel or Google Sheet, filter by niche, city, followers and rates, and edit any cell in place. Tick creators to make an influencer plan with their costs and your client prices, share it as a link, PDF or Google Sheet, and ask creators for their rates on WhatsApp or email.",
  },
  Delivery: {
    title: "Delivery: doing the work",
    body: "When a quote is accepted it becomes a project with stages and a due date. Upload each deliverable: the client approves it or asks for changes from their portal, and you see which. Files are filed in the client's Google Drive folder, client requests come in here, and freelancers and crews are offered jobs here.",
  },
  "My work": {
    title: "Your work",
    body: "The projects and client requests you're on, with what's due and what's waiting for approval.",
  },
  Money: {
    title: "Money: getting paid",
    body: "Make the invoice from the accepted quote in one click: GST worked out (CGST and SGST in your state, IGST outside), numbered in a series per financial year, emailed with a Razorpay pay link and saved as a PDF in the client's Drive folder. Payments mark it paid by themselves.",
  },
  Setup: {
    title: "Setup: your team and company",
    body: "Add your team and choose what each person can open: sales, delivery, finance, the influencer database. Your company details, GSTIN, bank and logo go on every quote and invoice.",
  },
};
