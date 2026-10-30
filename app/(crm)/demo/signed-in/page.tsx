import Link from "next/link";

import { ProductWordmark } from "@/components/genesis/product-wordmark";

export const metadata = { title: "Nova live demo" };

/** Signed in already: the demo is for visitors, so this person keeps their own CRM (app/(crm)/demo). */
export default function DemoSignedIn() {
  return (
    <main className="mx-auto flex min-h-[70svh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <ProductWordmark product="nova" className="h-[32px]" />
      <p className="text-bone">You&apos;re signed in, so this shows your own CRM, not the demo.</p>
      <p className="text-small text-ash">To try the live demo as a visitor would, open this page in a private window.</p>
      <Link href="/admin" className="crm-btn crm-btn-primary crm-btn-sm">Open my CRM</Link>
    </main>
  );
}
