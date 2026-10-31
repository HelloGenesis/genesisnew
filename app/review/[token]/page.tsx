import type { Metadata } from "next";

import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { readReviewToken } from "@/lib/crm/review-links";

import { ReviewForm } from "./review-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { absolute: "Your review · Genesis Media" }, robots: { index: false, follow: false } };

/**
 * WHERE THE REVIEW EMAIL'S BUTTONS LAND (lib/crm/review-links): the piece, a
 * way to watch it, and Approve or Ask for changes. No sign-in: the signed
 * link is the key, for this one piece, while it's in review.
 */
export default async function ReviewPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ do?: string }> }) {
  const { token } = await params;
  const choice = (await searchParams).do;
  const id = isDatabaseConfigured() ? readReviewToken(token) : null;
  const d = id ? await getPrisma().deliverable.findUnique({ where: { id }, include: { project: { include: { account: { select: { name: true } } } } } }) : null;
  const watch = d ? (d.fileId ? `/api/crm/files/${d.fileId}?r=${encodeURIComponent(token)}` : d.url) : null;
  return (
    <main className="min-h-screen bg-[#f4f2ef] px-4 py-16 text-[#141216] [color-scheme:light]">
      <div className="mx-auto max-w-xl rounded-[1.5rem] bg-white p-8 shadow-[0_30px_80px_-40px_rgb(0_0_0/0.35)]">
        <p className="text-[0.75rem] uppercase tracking-[0.18em] text-[#8a857c]">Genesis Media · review</p>
        {!d ? (
          <>
            <h1 className="mt-4 text-[1.5rem] font-semibold">This link has expired</h1>
            <p className="mt-3 text-[#3a3630]">Open the project in your portal to review it, or reply to the email and we&apos;ll send a new link.</p>
          </>
        ) : (
          <>
            <h1 className="mt-4 text-[1.5rem] font-semibold leading-snug">{d.title}</h1>
            <p className="mt-1 text-[#8a857c]">{d.project.account.name} · {d.project.name} · version {d.version}</p>
            {watch && (
              <a href={watch} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex h-11 items-center rounded-full border border-[#d8d4cc] px-5 font-medium">Watch it ↗</a>
            )}
            <div className="mt-8 border-t border-[#eee9e1] pt-6">
              {d.status === "IN_REVIEW" ? (
                <ReviewForm token={token} start={choice === "approve" || choice === "changes" ? choice : null} />
              ) : (
                <p className="text-[#3a3630]">{d.status === "APPROVED" ? "This is approved. Thank you!" : d.status === "CHANGES_REQUESTED" ? "Your changes are with the team; the next version will come to you." : "This isn't waiting for your review right now."}</p>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
