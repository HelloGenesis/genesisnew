import { type Feature, FeatureGrid } from "@/components/crm/feature-grid";
import { PageHead } from "@/components/crm/ui";
import { crmNav } from "@/lib/crm/nav";
import { requireStaff } from "@/lib/crm/session";
import { ABOUT } from "@/lib/crm/tour-copy";

export const dynamic = "force-dynamic";
export const metadata = { title: "All features" };

/**
 * ALL FEATURES (Genesis, 27 Oct 2026; its own page and rail icon from
 * 31 Oct 2026: "this should be an icon, and off the dashboard"): every page
 * this person can open, with what it does (lib/crm/tour-copy), by area.
 */
export default async function FeaturesPage() {
  const viewer = await requireStaff();
  const features: Feature[] = [];
  for (const g of crmNav(viewer))
    for (const i of g.items) if (i.href !== "/admin" && i.href !== "/admin/features" && !i.href.includes("tour=") && !features.some((f) => f.href === i.href)) features.push({ href: i.href, label: i.label, area: g.label, body: ABOUT[i.href]?.body ?? null });
  return (
    <>
      <PageHead kicker="Home" title="All features" sub="Every part of the CRM you can open, with what it does. Search, or pick an area." />
      <FeatureGrid features={features} />
    </>
  );
}
