import { CancelTrial, TrialPlans } from "@/components/crm/trial-plans";
import { Card, PageHead } from "@/components/crm/ui";
import { daysLeft, monthlyTotal, planCards, prettyDate, trialGate, trialOf } from "@/lib/crm/nova-trial";
import { requireStaff } from "@/lib/crm/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Plan & billing" };

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** An agency's Nova plan: its trial, the card step, and cancelling (lib/crm/nova-trial). */
export default async function PlanPage({ searchParams }: { searchParams: Promise<{ added?: string }> }) {
  const viewer = await requireStaff();
  const trial = await trialOf(viewer.workspaceId);
  const { added } = await searchParams;
  if (!trial) return <p className="crm-notice">{viewer.workspaceId ? "Your plan is set up by Genesis Media. Reply to any of our emails for changes." : "Plan & billing is for agencies on Nova by Genesis."}</p>;
  const admin = viewer.workspaceRole === "ADMIN" && !viewer.demo;
  const gate = trialGate(trial);
  const firstCharge = prettyDate(trial.endsAt);
  const left = daysLeft(trial);
  return (
    <>
      <PageHead kicker="Setup" title="Plan & billing" sub="Your Nova by Genesis plan, your card, and cancelling." />
      {added && trial.state === "CARD_ADDED" && <p className="crm-notice">Card added. Nothing was charged today; we&apos;ve emailed you the details.</p>}
      {trial.state === "TRIAL" && gate !== "ended" && (
        <Card title={gate === "card" ? "Choose your plan to carry on" : `Free trial · ${left} day${left === 1 ? "" : "s"} left`}>
          <p className="mb-4 text-ash">
            {gate === "card" ? "Your trial is paused until a plan is chosen and a card added." : `Everything is switched on until ${firstCharge}. From ${prettyDate(trial.cardDueAt)} we'll ask for a plan and a card; you can add it now.`}
          </p>
          <TrialPlans plans={planCards()} firstCharge={firstCharge} admin={admin} initial={trial.plan} />
        </Card>
      )}
      {(trial.state === "CARD_ADDED" || trial.state === "ACTIVE") && trial.plan && (
        <Card title={`Nova ${trial.plan}`}>
          <dl className="grid gap-3 sm:grid-cols-3">
            <div><dt className="text-[0.8125rem] text-ash">Status</dt><dd className="text-bone">{trial.state === "ACTIVE" ? "Active, renews monthly" : `Free trial until ${firstCharge}`}</dd></div>
            <div><dt className="text-[0.8125rem] text-ash">{trial.state === "ACTIVE" ? "Monthly" : "First charge"}</dt><dd className="text-bone">{rupees(monthlyTotal(trial.plan))}{trial.state === "ACTIVE" ? "" : ` on ${firstCharge}`}</dd></div>
            <div><dt className="text-[0.8125rem] text-ash">Card</dt><dd className="text-bone">Saved with Razorpay</dd></div>
          </dl>
          <p className="mt-4 text-[0.8125rem] text-ash">Razorpay emails a receipt for every payment. To change your card, use the link in Razorpay&apos;s email, or reply to any of ours.</p>
          {admin && <div className="mt-4"><CancelTrial label={trial.state === "ACTIVE" ? "Cancel plan" : "Cancel trial"} until={trial.state === "CARD_ADDED" ? firstCharge : null} /></div>}
        </Card>
      )}
      {trial.state === "TRIAL" && admin && gate === "open" && (
        <Card title="Not for you?">
          <CancelTrial label="Cancel trial" until={prettyDate(trial.cardDueAt)} />
        </Card>
      )}
      {(trial.state === "CANCELLED" || gate === "ended") && (
        <Card title={trial.state === "CANCELLED" ? "Cancelled" : "Your trial has ended"}>
          <p className="text-ash">Nothing more will be charged. Your data is kept for 30 days: reply to any of our emails, or write to us on WhatsApp, and we&apos;ll switch it back on.</p>
        </Card>
      )}
    </>
  );
}
