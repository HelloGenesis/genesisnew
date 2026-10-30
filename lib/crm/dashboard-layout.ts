/*
 * THE DASHBOARD, ARRANGED BY EACH PERSON (Genesis, 31 Oct 2026: "this layout
 * should be editable by the users, arrange things above and below; give an
 * option to customise and add almost all the features"). Each section is a
 * widget; a person's layout is their order, each one's width and which are
 * hidden, saved for them (app/(crm)/admin/actions/dashboard). Widgets added
 * later join the end of everyone's layout. Shared by the page (server) and
 * the editor (components/crm/dashboard-grid).
 */

export const WIDGETS = {
  numbers: { title: "Your numbers", blurb: "Pipeline, follow-ups, money in, projects and reviews at a glance." },
  tasks: { title: "Tasks", blurb: "Yours and what you've given others; tick, rename, re-date right here." },
  calendar: { title: "Calendar", blurb: "Your Google Calendar for the week." },
  views: { title: "Views delivered", blurb: "Views and reach your creators' posts have delivered, by client." },
  projects: { title: "Ongoing projects", blurb: "Every active project, with its stage and due date." },
  hotLeads: { title: "Leads heating up", blurb: "Leads moving fastest: qualified, booked, proposed or negotiating." },
  followUps: { title: "Follow up today", blurb: "Leads whose follow-up is today or overdue." },
  requests: { title: "Requests waiting on us", blurb: "Briefs and questions clients sent from their portal." },
  due: { title: "Due in the next 7 days", blurb: "Projects due this week, with their stage." },
  quotes: { title: "Quotes awaiting a reply", blurb: "Quotes and plans sent and not yet accepted, with who opened them." },
  invoices: { title: "Unpaid invoices", blurb: "Invoices sent and not yet paid, overdue first." },
  creators: { title: "Influencer database", blurb: "How many creators you have, and the latest added." },
  divisions: { title: "Active work by division", blurb: "Projects running in each division." },
  orders: { title: "Latest orders", blurb: "What was bought on the website and through Razorpay." },
  gmail: { title: "From Gmail & Drive", blurb: "Briefs, client details and invoices found in connected Gmail and Drive." },
} as const;

export type WidgetId = keyof typeof WIDGETS;
export type WidgetSlot = { id: WidgetId; wide: boolean; hidden?: boolean };

/* The starting layout: the numbers first, then today's work, then the rest; Gmail & Drive lower down. */
export const DEFAULT_LAYOUT: WidgetSlot[] = [
  { id: "numbers", wide: true },
  /* The task sheet needs the room (components/crm/task-sheet). */
  { id: "tasks", wide: true },
  { id: "calendar", wide: false },
  { id: "views", wide: false },
  { id: "projects", wide: false },
  { id: "hotLeads", wide: false },
  { id: "followUps", wide: false },
  { id: "requests", wide: false },
  { id: "due", wide: false },
  { id: "quotes", wide: false },
  { id: "invoices", wide: false },
  { id: "creators", wide: false, hidden: true },
  { id: "divisions", wide: false },
  { id: "orders", wide: false },
  { id: "gmail", wide: true },
];

/** A saved layout made whole: unknown ids dropped, new widgets added (hidden ones stay hidden). */
export function normaliseLayout(saved: unknown): WidgetSlot[] {
  const list = Array.isArray(saved) ? saved : [];
  const out: WidgetSlot[] = [];
  for (const s of list) {
    const id = (s as WidgetSlot)?.id;
    if (id in WIDGETS && !out.some((o) => o.id === id)) out.push({ id, wide: Boolean((s as WidgetSlot).wide), ...((s as WidgetSlot).hidden ? { hidden: true } : {}) });
  }
  for (const d of DEFAULT_LAYOUT) if (!out.some((o) => o.id === d.id)) out.push(d);
  return out;
}
