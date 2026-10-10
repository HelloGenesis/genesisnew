import "server-only";

import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import type { Division } from "@/lib/generated/prisma/enums";

import { tierFor } from "./catalog";
import { appUrl, queueStaffEmail } from "./notify";
import { queueSheet } from "./sheets";

/**
 * THE WEBSITE'S FORMS, INTO THE CRM.
 *
 * A brand enquiry or a quick contact becomes a lead, due for follow-up
 * today, with what they asked for, their budget and timeline in its notes; a
 * creator who applies through the Influencer Onboarding form joins the
 * influencer database (or updates their row), tagged "Applied via website".
 * Careers stay in the forms sheet only. Each one alerts the right staff.
 *
 * Called after the submission is saved; never throws into the form.
 */

const NEED_DIVISION: Record<string, Division> = {
  "Genesis Influence": "INFLUENCE",
  "Genesis Studios": "STUDIOS",
  "Genesis AI Lab": "AI_LAB",
  "Genesis Brand & Design": "BRAND_DESIGN",
};

/** "₹5L to ₹15L" → the bottom of the range, in paise; a rough pipeline value. */
function budgetPaise(budget: string | undefined): number {
  const match = /₹(\d+)L/.exec(budget ?? "");
  return match ? Number(match[1]) * 100_000 * 100 : 0;
}

function handleFrom(url: string | undefined): string | null {
  if (!url) return null;
  const match = /(?:instagram\.com|youtube\.com)\/(?:@)?([A-Za-z0-9._-]+)/i.exec(url) ?? /^@?([A-Za-z0-9._]+)$/.exec(url.trim());
  return match ? match[1]!.toLowerCase() : null;
}

function count(text: string | undefined): number {
  const match = /([\d.,]+)\s*([kKmM])?/.exec(text ?? "");
  if (!match) return 0;
  const value = Number(match[1]!.replace(/,/g, ""));
  const unit = match[2]?.toLowerCase();
  return Math.round(unit === "m" ? value * 1_000_000 : unit === "k" ? value * 1_000 : value);
}

export async function captureSubmission(kind: string, submissionId: string, data: Record<string, string | undefined>) {
  if (!isDatabaseConfigured()) return;
  const prisma = getPrisma();
  try {
    if (kind === "brand" || kind === "quick") {
      const lead = await prisma.lead.upsert({
        where: { contactSubmissionId: submissionId },
        create: {
          contactSubmissionId: submissionId,
          name: data.name ?? "Website visitor",
          email: data.email?.toLowerCase() ?? null,
          phone: data.phone || null,
          company: data.company || null,
          division: (data.need && NEED_DIVISION[data.need]) || null,
          interest: data.need || null,
          source: "WEBSITE_FORM",
          valuePaise: budgetPaise(data.budget),
          nextFollowUp: new Date(),
          notes: [
            data.budget && `Budget: ${data.budget}`,
            data.timeline && `Timeline: ${data.timeline}`,
            data.website && `Website: ${data.website}`,
            data.message,
          ]
            .filter(Boolean)
            .join("\n") || null,
        },
        update: {},
      });
      await queueSheet("leads", lead.id);
      await queueStaffEmail({
        kind: "lead_new",
        scope: "sales",
        subject: `New enquiry · ${lead.name}${lead.company ? ` (${lead.company})` : ""}`,
        text: [
          `${kind === "brand" ? "Project enquiry" : "Quick contact"} from the website.`,
          "",
          `Name: ${lead.name}`,
          lead.company && `Company: ${lead.company}`,
          lead.email && `Email: ${lead.email}`,
          lead.phone && `Phone: ${lead.phone}`,
          lead.interest && `Needs: ${lead.interest}`,
          lead.notes,
          "",
          `Open the lead: ${appUrl(`/admin/leads/${lead.id}`)}`,
        ]
          .filter(Boolean)
          .join("\n"),
        dedupeKey: `lead-new:${lead.id}`,
      });
      return;
    }

    if (kind === "influencer" || kind === "creator") {
      const handle = handleFrom(data.instagram) ?? handleFrom(data.youtube);
      if (!handle) return;
      const platform = handleFrom(data.instagram) ? "INSTAGRAM" : "YOUTUBE";
      const followers = count(data.followers);
      const reel = count(data.igReelCost);
      const creator = await prisma.creator.upsert({
        where: { platform_handle: { platform, handle } },
        create: {
          name: data.name ?? handle,
          handle,
          platform,
          profileUrl: data.instagram || data.youtube || null,
          followers,
          avgViews: count(data.avgViews) || null,
          tier: tierFor(followers),
          niches: (data.niche ?? "").split(/[,/]/).map((n) => n.trim()).filter(Boolean),
          city: data.city || null,
          email: data.email?.toLowerCase() ?? null,
          phone: data.phone || null,
          reelRatePaise: reel ? reel * 100 : null,
          notes: [data.previousBrands && `Previous brands: ${data.previousBrands}`, data.goals && `Goals: ${data.goals}`, data.message].filter(Boolean).join("\n") || null,
          tags: ["Applied via website"],
        },
        update: {
          email: data.email?.toLowerCase() ?? undefined,
          phone: data.phone || undefined,
          ...(reel ? { reelRatePaise: reel * 100 } : {}),
        },
      });
      await queueStaffEmail({
        kind: "creator_applied",
        scope: "producers",
        subject: `Creator applied · ${creator.name} (@${creator.handle})`,
        text: `A creator applied through the Influencer Onboarding form.\n\nOpen: ${appUrl(`/admin/creators/${creator.id}`)}`,
        dedupeKey: `creator-applied:${submissionId}`,
      });
    }
  } catch (error) {
    console.error("[crm] capture failed", error);
  }
}
