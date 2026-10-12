import Link from "next/link";

import { Empty, PageHead } from "@/components/crm/ui";
import { getPrisma } from "@/lib/db";
import { dateTime } from "@/lib/crm/catalog";
import { requireStaff } from "@/lib/crm/session";

import { markNotificationsRead } from "../actions/inbox";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notifications" };

/** Briefs found in your Gmail and Drive, client and vendor details, invoices: newest first. */
export default async function NotificationsPage() {
  const viewer = await requireStaff();
  const rows = await getPrisma().notification.findMany({ where: { userId: viewer.id }, orderBy: { createdAt: "desc" }, take: 200 });
  const unread = rows.filter((r) => !r.readAt).length;
  return (
    <>
      <PageHead kicker="Today" title="Notifications" sub={unread ? `${unread} unread` : "All read"}>
        {unread > 0 && (
          <form action={markNotificationsRead}>
            <button className="crm-btn crm-btn-secondary crm-btn-sm">Mark all read</button>
          </form>
        )}
      </PageHead>
      {rows.length === 0 ? (
        <Empty>Nothing yet. Briefs found in your Gmail and Drive show up here.</Empty>
      ) : (
        <ul className="crm-card divide-y divide-[var(--glass-border)]">
          {rows.map((n) => (
            <li key={n.id} className={`flex items-start gap-3 px-4 py-3 ${n.readAt ? "opacity-60" : ""}`}>
              <span className={`mt-2 size-2 shrink-0 rounded-full ${n.readAt ? "bg-transparent" : "bg-[#ffc516]"}`} aria-hidden />
              <span className="min-w-0 flex-1">
                {n.href ? <Link href={n.href} className="text-bone hover:underline">{n.title}</Link> : <span className="text-bone">{n.title}</span>}
                {n.body && <span className="mt-0.5 block whitespace-pre-wrap text-[0.875rem] text-ash">{n.body}</span>}
                <span className="mt-1 block text-[0.75rem] text-faint">{dateTime(n.createdAt)}</span>
              </span>
              {!n.readAt && (
                <form action={markNotificationsRead}>
                  <input type="hidden" name="id" value={n.id} />
                  <button className="text-[0.75rem] text-faint hover:text-bone">Mark read</button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
