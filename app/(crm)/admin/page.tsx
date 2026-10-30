import { Mail } from "lucide-react";
import Link from "next/link";

import { DashboardGrid } from "@/components/crm/dashboard-grid";
import { TaskSheet } from "@/components/crm/task-sheet";
import { Badge, Card, PageHead, Stats, Status, StageBar } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import { DIVISION_LABEL, DIVISIONS, LEAD_STATUS, ORDER_STATUS, REQUEST_KIND, REQUEST_STATUS, date, money, projectRef, requestRef, todayIst } from "@/lib/crm/catalog";
import { inDays, staffOptions } from "@/lib/crm/options";
import { accountScope, creatorScope, inboxScope, invoiceScope, isSuperAdmin, leadScope, orderScope, projectScope, quoteScope, seesCreators, through } from "@/lib/crm/scope";
import { requireStaff } from "@/lib/crm/session";
import { TaskTabs } from "@/components/crm/task-tabs";
import { DEFAULT_LAYOUT, normaliseLayout, type WidgetId } from "@/lib/crm/dashboard-layout";
import { quoteRef } from "@/lib/crm/quote-templates";
import { stagesOf } from "@/lib/crm/stages";

export const dynamic = "force-dynamic";

/** Monthly value of a subscription: a quarterly plan's charge is three months. */
const monthly = (amountPaise: number, billing: string | null) => (billing === "quarterly" ? Math.round(amountPaise / 3) : amountPaise);

export default async function AdminOverview({ searchParams }: { searchParams: Promise<{ person?: string }> }) {
  const viewer = await requireStaff();
  const prisma = getPrisma();
  /*
    THE DASHBOARD IS YOURS; A SUPER ADMIN'S IS EVERYONE'S (Genesis, 12 Oct
    2026). Shivam and Tanvi see the whole company here, and can look at it as
    any one person sees it; everyone else sees their own leads, quotes,
    clients, projects and finds (lib/crm/scope).
  */
  const superAdmin = isSuperAdmin(viewer);
  const { person: personParam } = await searchParams;
  const person = superAdmin && personParam ? personParam : null;
  const leads = leadScope(viewer, person);
  const orders = orderScope(viewer, person);
  const projects = projectScope(viewer, person);
  const accounts = accountScope(viewer, person);
  const taskOwner = person ?? viewer.id;
  const today = new Date(todayIst());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const weekAhead = new Date(today.getTime() + 7 * 864e5);

  const [pipeline, dueLeads, subs, revenue, activeProjects, inReview, changes, openRequests, failing, latestOrders, requests, dueProjects, myTasks, byDivision] = await Promise.all([
    prisma.lead.aggregate({ where: { ...leads, status: { notIn: ["WON", "LOST", "NURTURE"] } }, _sum: { valuePaise: true }, _count: true }),
    prisma.lead.findMany({ where: { ...leads, status: { notIn: ["WON", "LOST"] }, nextFollowUp: { lte: today } }, orderBy: { nextFollowUp: "asc" }, take: 8 }),
    prisma.subscription.findMany({ where: { ...through("order", orders), status: { in: ["ACTIVE", "AUTHENTICATED"] } }, select: { amountPaise: true, billing: true } }),
    prisma.payment.aggregate({ where: { ...through("order", orders), paidAt: { gte: monthStart }, status: "CAPTURED" }, _sum: { amountPaise: true } }),
    prisma.project.count({ where: { ...projects, status: "ACTIVE" } }),
    prisma.deliverable.count({ where: { ...through("project", projects), status: "IN_REVIEW" } }),
    prisma.deliverable.count({ where: { ...through("project", projects), status: "CHANGES_REQUESTED" } }),
    prisma.request.count({ where: { ...through("account", accounts), status: "OPEN" } }),
    prisma.subscription.count({ where: { ...through("order", orders), status: { in: ["PENDING", "HALTED"] } } }),
    prisma.order.findMany({ where: orders, orderBy: { createdAt: "desc" }, take: 6, include: { account: true } }),
    prisma.request.findMany({ where: { ...through("account", accounts), status: { in: ["OPEN", "IN_PROGRESS"] } }, orderBy: { createdAt: "asc" }, take: 6, include: { account: true } }),
    prisma.project.findMany({ where: { ...projects, status: "ACTIVE", dueDate: { lte: weekAhead } }, orderBy: { dueDate: "asc" }, take: 6, include: { account: true } }),
    prisma.task.findMany({ where: { status: "OPEN", OR: [{ ownerId: taskOwner }, { createdById: taskOwner }] }, orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }], take: 40, include: { owner: true } }),
    prisma.project.groupBy({ by: ["division"], where: { ...projects, status: "ACTIVE" }, _count: true }),
  ]);
  /* What Gmail and Drive turned up: everyone's for owners and admins, your own otherwise. */
  const seesAll = Object.keys(inboxScope(viewer, person)).length === 0;
  const scope = inboxScope(viewer, person);
  const [found, waiting, connected] = await Promise.all([
    prisma.inboxItem.findMany({ where: { ...scope, kind: { not: "OTHER" } }, orderBy: { occurredAt: "desc" }, take: 6 }),
    prisma.inboxItem.groupBy({ by: ["kind"], where: { ...scope, status: "NEW" }, _count: true }),
    prisma.googleConnection.count(),
  ]);
  const finders = await prisma.user.findMany({ where: { id: { in: [...new Set(found.map((f) => f.userId).filter((x): x is string => Boolean(x)))] } }, select: { id: true, name: true, email: true } });
  const mine = myTasks.filter((t) => t.ownerId === taskOwner).slice(0, 8);
  const given = myTasks.filter((t) => t.ownerId !== taskOwner).slice(0, 8);
  const taskStaff = await staffOptions();
  const team = superAdmin ? taskStaff : [];
  const viewing = person ? team.find(([id]) => id === person)?.[1] : null;
  const todayStr = todayIst();
  const greetingName = viewer.name?.split(" ")[0] ?? viewer.email?.split("@")[0] ?? "there";
  const longDate = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" }).format(new Date());
  /* All features is its own page now, with a rail icon (app/(crm)/admin/features). */
  const mrr = subs.reduce((sum, s) => sum + monthly(s.amountPaise, s.billing), 0);

  /* The newer sections (Genesis, 31 Oct 2026: views delivered, ongoing projects, leads heating up, and more). */
  const quoteWhere = { ...quoteScope(viewer, person), status: { in: ["SENT", "VIEWED"] as ("SENT" | "VIEWED")[] } };
  const [posts, viewsByProject, ongoing, hotLeads, quotesOut, quotesSum, unpaid, creatorCount, newCreators, savedLayout] = await Promise.all([
    prisma.campaignCreator.aggregate({ where: { project: projects }, _sum: { views: true, reach: true }, _count: { postUrl: true } }),
    prisma.campaignCreator.groupBy({ by: ["projectId"], where: { project: projects, views: { not: null } }, _sum: { views: true } }),
    prisma.project.findMany({ where: { ...projects, status: "ACTIVE" }, orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }], take: 8, include: { account: true } }),
    prisma.lead.findMany({ where: { ...leads, status: { in: ["QUALIFIED", "CALL_BOOKED", "PROPOSAL_SENT", "NEGOTIATION"] } }, orderBy: [{ updatedAt: "desc" }], take: 8 }),
    prisma.quote.findMany({ where: quoteWhere, orderBy: { sentAt: "desc" }, take: 6 }),
    prisma.quote.aggregate({ where: quoteWhere, _sum: { totalPaise: true }, _count: true }),
    prisma.invoice.findMany({ where: { ...invoiceScope(viewer, person), status: "SENT" }, orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }], take: 8 }),
    seesCreators(viewer) ? prisma.creator.count({ where: creatorScope(viewer) }) : Promise.resolve(0),
    seesCreators(viewer) ? prisma.creator.findMany({ where: creatorScope(viewer), orderBy: { createdAt: "desc" }, take: 5 }) : Promise.resolve([]),
    prisma.appSetting.findUnique({ where: { key: `dashboard:${viewer.id}` } }),
  ]);
  const viewProjects = await prisma.project.findMany({ where: { id: { in: viewsByProject.map((v) => v.projectId) } }, select: { id: true, account: { select: { name: true } } } });
  const byClient = new Map<string, number>();
  for (const v of viewsByProject) {
    const name = viewProjects.find((p) => p.id === v.projectId)?.account.name ?? "Other";
    byClient.set(name, (byClient.get(name) ?? 0) + (v._sum.views ?? 0));
  }
  const topClients = [...byClient].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const compact = (n: number) => new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(n);
  const layout = savedLayout ? normaliseLayout(JSON.parse(savedLayout.value)) : DEFAULT_LAYOUT;
  const more = (href: string, label: string) => <Link href={href} className="crm-link text-[0.875rem]">{label} ↗</Link>;

  /* One list of tasks as the Tasks page's sheet; a new row goes to `owner` (null: the sheet asks). */
  const taskSheet = (list: typeof mine, owner: string | null) => (
    <TaskSheet
      rows={list.map((t) => ({ id: t.id, title: t.title, details: t.details ?? "", links: t.links.join(", "), ownerId: t.ownerId, dueDate: t.dueDate ? t.dueDate.toISOString().slice(0, 10) : null, priority: t.priority, done: false }))}
      staff={taskStaff}
      today={todayStr}
      defaultOwner={owner}
      newDue={inDays(1)}
    />
  );
  const nodes: Partial<Record<WidgetId, React.ReactNode>> = {
    numbers: (
        <Stats
          items={[
            { label: "Open pipeline", value: money(pipeline._sum.valuePaise ?? 0), hint: `${pipeline._count} live leads`, href: "/admin/leads" },
            { label: "Follow-ups due", value: dueLeads.length, tone: dueLeads.length ? "warn" : undefined, href: "/admin/leads?due=1" },
            { label: "Recurring revenue (monthly)", value: money(mrr), hint: `${subs.length} active plans`, href: "/admin/billing" },
            { label: "Collected this month", value: money(revenue._sum.amountPaise ?? 0), href: "/admin/billing" },
            { label: "Active projects", value: activeProjects, href: "/admin/projects" },
            { label: "Waiting on client review", value: inReview, href: "/admin/projects?filter=review" },
            { label: "Changes requested", value: changes, tone: changes ? "warn" : undefined, href: "/admin/projects?filter=changes" },
            { label: failing ? "Renewals failing" : "Open requests", value: failing || openRequests, tone: failing ? "bad" : openRequests ? "warn" : undefined, href: failing ? "/admin/billing" : "/admin/requests" },
          ]}
        />
    ),
    tasks: (
      /* The Tasks page's own sheet (Genesis, 31 Oct 2026: "keep the same thing as on Tasks, with a slider inside"): every cell edited in place, a new task on the last row; scrolls inside the card. */
      <Card title="Tasks" action={more("/admin/tasks", "All tasks")}>
        <TaskTabs mine={{ count: mine.length, node: taskSheet(mine, taskOwner) }} given={{ count: given.length, node: taskSheet(given, null) }} />
      </Card>
    ),
    calendar: (
          <Card
            title="Calendar"
            action={<a href="https://calendar.google.com/calendar/r/week" target="_blank" rel="noreferrer" className="crm-link text-[0.875rem]">Open Google Calendar ↗</a>}
          >
            {viewer.email ? (
              <>
                {/*
                  THEIR OWN GOOGLE CALENDAR, EMBEDDED. Google shows it to whoever
                  is signed in to that Google account in this browser (Workspace
                  calendars are private to the domain), so nothing is stored here.
                */}
                <iframe
                  title="Your Google Calendar"
                  src={`https://calendar.google.com/calendar/embed?src=${encodeURIComponent(viewer.email)}&ctz=Asia%2FKolkata&mode=WEEK&showTitle=0&showPrint=0&showCalendars=0&showTz=0&wkst=2`}
                  className="h-[26rem] w-full rounded-xl border border-[var(--glass-border)] bg-white"
                  loading="lazy"
                />
                <p className="mt-2 text-[0.75rem] text-faint">Showing {viewer.email}. Blank? Sign in to Google in this browser as {viewer.email}.</p>
              </>
            ) : (
              <p className="text-ash">Sign in with an email to see your calendar.</p>
            )}
          </Card>
    ),
    views: (
      <Card title="Views delivered" action={more("/admin/projects?division=INFLUENCE", "Campaigns")}>
        <div className="grid grid-cols-3 gap-3">
          {[["Views", compact(posts._sum.views ?? 0)], ["Reach", compact(posts._sum.reach ?? 0)], ["Posts live", String(posts._count.postUrl)]].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-[var(--hover-wash)] px-4 py-3">
              <span className="block text-[0.8125rem] text-ash">{k}</span>
              <span className="text-[1.5rem] font-semibold tabular-nums text-bone">{v}</span>
            </div>
          ))}
        </div>
        {topClients.length > 0 ? (
          <ul className="mt-4 divide-y divide-[var(--glass-border)]">
            {topClients.map(([name, n]) => (
              <li key={name} className="flex justify-between gap-3 py-2 text-[0.9375rem]"><span className="truncate text-bone">{name}</span><span className="tabular-nums text-ash">{compact(n)} views</span></li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-[0.875rem] text-ash">Views show here as creators&apos; posts go live and their numbers are added on a campaign.</p>
        )}
      </Card>
    ),
    projects: (
      <Card title={`Ongoing projects · ${activeProjects}`} action={more("/admin/projects", "Projects")}>
        {ongoing.length === 0 ? (
          <p className="text-ash">No active projects.</p>
        ) : (
          <ul className="divide-y divide-[var(--glass-border)]">
            {ongoing.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/projects/${p.id}`} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-bone">{projectRef(p.number)} · {p.name}</span>
                    <span className="block truncate text-[0.8125rem] text-ash">{p.account.name} · {stagesOf(p)[p.stage] ?? "—"}</span>
                  </span>
                  <span className="shrink-0 text-[0.8125rem] text-ash">{p.dueDate ? date(p.dueDate) : "No date"}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    ),
    hotLeads: (
      <Card title={`Leads heating up · ${hotLeads.length}`} action={more("/admin/leads", "Pipeline")}>
        {hotLeads.length === 0 ? (
          <p className="text-ash">No leads past first contact yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--glass-border)]">
            {hotLeads.map((lead) => (
              <li key={lead.id}>
                <Link href={`/admin/leads/${lead.id}`} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-bone">{lead.name}{lead.company ? ` · ${lead.company}` : ""}</span>
                    <span className="block truncate text-[0.8125rem] text-ash">{money(lead.valuePaise)} · moved {date(lead.updatedAt)}</span>
                  </span>
                  <Status value={LEAD_STATUS[lead.status]} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    ),
    followUps: (
          <Card title="Follow up today" action={<Link href="/admin/leads" className="crm-link text-[0.875rem]">Pipeline ↗</Link>}>
            {dueLeads.length === 0 ? (
              <p className="text-ash">Nothing due. Nice.</p>
            ) : (
              <ul className="divide-y divide-[var(--glass-border)]">
                {dueLeads.map((lead) => (
                  <li key={lead.id} className="flex items-center justify-between gap-3 py-2.5">
                    <Link href={`/admin/leads/${lead.id}`} className="min-w-0">
                      <span className="block truncate text-bone">{lead.name}{lead.company ? ` · ${lead.company}` : ""}</span>
                      <span className="block truncate text-[0.8125rem] text-ash">{lead.interest ?? "—"} · due {date(lead.nextFollowUp)}</span>
                    </Link>
                    <Status value={LEAD_STATUS[lead.status]} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
    ),
    requests: (
          <Card title="Requests waiting on us" action={<Link href="/admin/requests" className="crm-link text-[0.875rem]">Inbox ↗</Link>}>
            {requests.length === 0 ? (
              <p className="text-ash">Inbox zero.</p>
            ) : (
              <ul className="divide-y divide-[var(--glass-border)]">
                {requests.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                    <Link href={`/admin/requests/${r.id}`} className="min-w-0">
                      <span className="block truncate text-bone">{requestRef(r.number)} · {r.title}</span>
                      <span className="block truncate text-[0.8125rem] text-ash">{r.account.name} · {REQUEST_KIND[r.kind]} · {date(r.createdAt)}</span>
                    </Link>
                    <Status value={REQUEST_STATUS[r.status]} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
    ),
    due: (
          <Card title="Due in the next 7 days" action={<Link href="/admin/projects" className="crm-link text-[0.875rem]">Projects ↗</Link>}>
            {dueProjects.length === 0 ? (
              <p className="text-ash">No deadlines this week.</p>
            ) : (
              <ul className="space-y-4">
                {dueProjects.map((p) => (
                  <li key={p.id}>
                    <Link href={`/admin/projects/${p.id}`} className="block">
                      <span className="flex justify-between gap-3 text-bone">
                        <span className="truncate">{projectRef(p.number)} · {p.name}</span>
                        <span className="shrink-0 text-[0.8125rem] text-ash">{date(p.dueDate)}</span>
                      </span>
                      <span className="mb-1.5 block text-[0.8125rem] text-ash">{p.account.name} · {DIVISION_LABEL[p.division]}</span>
                      <StageBar stages={stagesOf(p)} stage={p.stage} compact />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
    ),
    quotes: (
      <Card title={`Quotes awaiting a reply · ${quotesSum._count}`} action={more("/admin/quotes", "Quotes")}>
        <p className="mb-2 text-[0.875rem] text-ash">{money(quotesSum._sum.totalPaise ?? 0)} out with clients.</p>
        {quotesOut.length === 0 ? (
          <p className="text-ash">Nothing waiting on a reply.</p>
        ) : (
          <ul className="divide-y divide-[var(--glass-border)]">
            {quotesOut.map((q) => (
              <li key={q.id}>
                <Link href={`/admin/quotes/${q.id}`} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-bone">{quoteRef(q.number)} · {q.company ?? q.contactName}</span>
                    <span className="block truncate text-[0.8125rem] text-ash">{money(q.totalPaise)} · sent {date(q.sentAt)}</span>
                  </span>
                  <Badge tone={q.viewedAt ? "good" : "muted"}>{q.viewedAt ? "Opened" : "Not opened"}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    ),
    invoices: (
      <Card title={`Unpaid invoices · ${unpaid.length}`} action={more("/admin/invoices", "Invoices")}>
        {unpaid.length === 0 ? (
          <p className="text-ash">Everything sent has been paid.</p>
        ) : (
          <ul className="divide-y divide-[var(--glass-border)]">
            {unpaid.map((inv) => {
              const late = inv.dueDate && inv.dueDate.toISOString().slice(0, 10) < todayStr;
              return (
                <li key={inv.id}>
                  <Link href={`/admin/invoices/${inv.id}`} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="min-w-0">
                      <span className="block truncate text-bone">{inv.number} · {inv.billToName}</span>
                      <span className="block truncate text-[0.8125rem] text-ash">{money(inv.totalPaise)}</span>
                    </span>
                    <span className={`shrink-0 text-[0.8125rem] ${late ? "font-semibold text-[#dc2626]" : "text-ash"}`}>{inv.dueDate ? `due ${date(inv.dueDate)}` : "No due date"}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    ),
    ...(seesCreators(viewer) ? { creators: (
      <Card title={`Influencer database · ${creatorCount}`} action={more("/admin/creators", "Database")}>
        {newCreators.length === 0 ? (
          <p className="text-ash">No creators yet. Import a sheet in the influencer database.</p>
        ) : (
          <ul className="divide-y divide-[var(--glass-border)]">
            {newCreators.map((c) => (
              <li key={c.id} className="flex justify-between gap-3 py-2 text-[0.9375rem]"><span className="truncate text-bone">{c.name} <span className="text-ash">@{c.handle}</span></span><span className="tabular-nums text-ash">{compact(c.followers)}</span></li>
            ))}
          </ul>
        )}
      </Card>
    ) } : {}),
    divisions: (
          <Card title="Active work by division">
            <ul className="grid grid-cols-2 gap-3">
              {DIVISIONS.map((d) => (
                <li key={d} className="rounded-xl bg-[var(--hover-wash)] px-4 py-3">
                  <Link href={`/admin/projects?division=${d}`}>
                    <span className="block text-[0.8125rem] text-ash">{DIVISION_LABEL[d]}</span>
                    <span className="text-[1.5rem] font-semibold text-bone">{byDivision.find((b) => b.division === d)?._count ?? 0}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
    ),
    /* Website orders are Genesis's own. */
    ...(viewer.workspaceId ? {} : { orders: (
          <Card title="Latest orders" action={<Link href="/admin/billing" className="crm-link text-[0.875rem]">Billing ↗</Link>}>
            {latestOrders.length === 0 ? (
              <p className="text-ash">No orders yet. They arrive here from checkout.</p>
            ) : (
              <ul className="divide-y divide-[var(--glass-border)]">
                {latestOrders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-3 py-2.5">
                    <Link href={`/admin/billing/${o.id}`} className="min-w-0">
                      <span className="block truncate text-bone">{o.account?.name ?? o.company ?? o.contactName}</span>
                      <span className="block text-[0.8125rem] text-ash">{o.reference} · {money(o.totalPaise)} · {date(o.createdAt)}</span>
                    </Link>
                    <Status value={ORDER_STATUS[o.status]} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
    ) }),
    gmail: (
      /* Gmail & Drive, its mail icon on the box (Genesis, 31 Oct 2026), lower down by default. */
      <Card
        title={<span className="flex items-center gap-2.5"><span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-[#ea4335] via-[#fbbc05] to-[#34a853] text-white"><Mail className="size-4" aria-hidden /></span>From Gmail &amp; Drive</span>}
        action={more("/admin/inbox", "Inbox")}
      >
        {found.length === 0 ? (
          <p className="text-ash">
            {connected ? "Nothing found yet. Briefs, client and vendor details, invoices and links from connected Gmail and Drive show up here." : "Nobody has connected Google yet."}{" "}
            <Link href="/admin/inbox" className="crm-link">Connect yours</Link>
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_14rem]">
            <ul className="divide-y divide-[var(--glass-border)]">
              {found.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-3 py-2">
                  <Link href={f.briefId ? `/admin/briefs/${f.briefId}` : `/admin/inbox?item=${f.id}&status=ALL`} className="min-w-0">
                    <span className="block truncate text-bone">{f.title}</span>
                    <span className="block truncate text-[0.75rem] text-ash">{f.sender ?? f.senderEmail ?? "—"} · {date(f.occurredAt)}{seesAll ? ` · ${finders.find((u) => u.id === f.userId)?.name ?? finders.find((u) => u.id === f.userId)?.email ?? ""}` : ""}</span>
                  </Link>
                  <Badge tone={f.kind === "BRIEF" ? "good" : f.kind === "INVOICE" ? "warn" : "info"}>{f.kind === "BRIEF" ? "Brief" : f.kind.charAt(0) + f.kind.slice(1).toLowerCase()}</Badge>
                </li>
              ))}
            </ul>
            <ul className="grid grid-cols-2 gap-2 self-start">
              {(["BRIEF", "CLIENT", "VENDOR", "INVOICE"] as const).map((k) => (
                <li key={k} className="rounded-xl bg-[var(--hover-wash)] px-3 py-2">
                  <Link href={`/admin/inbox?kind=${k}`}>
                    <span className="block text-[0.75rem] text-ash">{k === "BRIEF" ? "Briefs" : k === "CLIENT" ? "Clients" : k === "VENDOR" ? "Vendors" : "Invoices"} to handle</span>
                    <span className="text-[1.25rem] text-bone">{waiting.find((w) => w.kind === k)?._count ?? 0}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    ),
  };

  return (
    <>
      {/* Hi, by name and title (Genesis, 11 Oct 2026); names and titles are set in Staff & roles. */}
      <PageHead kicker={`Dashboard · ${longDate}`} title={`Hi ${greetingName}, welcome${viewer.workspaceId ? " back" : " to Genesis"}.`} sub={viewer.title ? <span className="text-bone">{viewer.title}<span className="text-ash"> · {viewing ? `Viewing ${viewing}'s dashboard.` : superAdmin ? "Everything across the team." : "What needs attention today."}</span></span> : "What needs attention today."}>
        {superAdmin && (
          <form action="/admin" className="flex items-center gap-2">
            <select name="person" defaultValue={person ?? ""} className="crm-input w-auto !py-1.5 text-[0.875rem]" aria-label="View the dashboard as">
              <option value="">Everyone (all data)</option>
              {team.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
            <button className="crm-btn crm-btn-secondary crm-btn-sm">View</button>
          </form>
        )}
      </PageHead>

      {/* Arranged by each person (lib/crm/dashboard-layout; Genesis, 31 Oct 2026). */}
      <DashboardGrid layout={layout} nodes={nodes} demo={viewer.demo} />
    </>
  );
}
