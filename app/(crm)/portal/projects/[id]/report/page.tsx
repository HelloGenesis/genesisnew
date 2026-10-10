import Link from "next/link";
import { notFound } from "next/navigation";

import { CampaignReport } from "@/components/crm/campaign-report";
import { PageHead } from "@/components/crm/ui";
import { campaign } from "@/lib/crm/report";
import { portalAccounts, requirePortal } from "@/lib/crm/session";

import { PrintButton } from "@/app/quote/[token]/print-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Campaign report" };

/** The client's campaign report, once Genesis shares it. Confirmed creators only; prints to PDF. */
export default async function PortalReport({ params }: { params: Promise<{ id: string }> }) {
  const { viewer } = await requirePortal();
  const { id } = await params;
  const allowed = new Set((await portalAccounts(viewer)).map((a) => a.id));
  const data = await campaign(id, true);
  if (!data || !allowed.has(data.project.accountId) || !data.project.reportShared) notFound();
  return (
    <>
      <PageHead kicker="Campaign report" title={data.project.name}>
        <Link href={`/portal/projects/${id}`} className="crm-btn crm-btn-secondary crm-btn-sm">Project</Link>
        <PrintButton />
      </PageHead>
      <CampaignReport title={data.project.name} client={data.project.account.name} rows={data.rows} summary={data.project.reportSummary} showFees={false} heading={false} />
    </>
  );
}
