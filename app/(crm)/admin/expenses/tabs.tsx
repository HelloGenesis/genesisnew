import Link from "next/link";

/** Expenses, subscriptions and GST: one section, three tabs. */
export function MoneyTabs({ active }: { active: "expenses" | "subscriptions" | "gst" }) {
  const tabs = [
    ["expenses", "/admin/expenses", "Expenses & salaries"],
    ["subscriptions", "/admin/expenses/subscriptions", "Our subscriptions"],
    ["gst", "/admin/expenses/gst", "GST"],
  ] as const;
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Expenses sections">
      {tabs.map(([key, href, label]) => (
        <Link key={key} href={href} aria-current={active === key ? "page" : undefined} className={`crm-btn crm-btn-sm ${active === key ? "crm-btn-primary" : "crm-btn-secondary"}`}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
