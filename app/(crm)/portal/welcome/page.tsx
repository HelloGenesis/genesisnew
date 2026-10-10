import Link from "next/link";
import { redirect } from "next/navigation";

import { getViewer, portalAccounts } from "@/lib/crm/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Welcome" };

/** Signed in, but no account yet: the email they used isn't linked to one. */
export default async function WelcomePage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/portal");
  if ((await portalAccounts(viewer)).length > 0) redirect("/portal");
  return (
    <div className="crm-card crm-pad space-y-4">
      <p className="micro-label">Genesis portal</p>
      <h1 className="text-[2rem] font-normal leading-tight text-bone">You&apos;re signed in, but there&apos;s nothing here yet.</h1>
      <p className="text-ash">
        {viewer.email ?? viewer.phone} isn&apos;t linked to a Genesis account. Your portal opens automatically when you buy a plan or product on the site, or when the
        Genesis team (or your colleague) adds this email.
      </p>
      <p className="text-ash">Signed up with a different email at checkout? Sign out and sign in with that one.</p>
      <div className="flex flex-wrap gap-3">
        <Link href="/pricing" className="crm-btn crm-btn-primary">See plans & pricing</Link>
        <a href="mailto:hello@genesismedia.co" className="crm-btn crm-btn-secondary">Email the team</a>
        <Link href="/signout" className="crm-btn crm-btn-secondary">Sign out</Link>
      </div>
    </div>
  );
}
