-- A brief's duration (Genesis, 31 Oct 2026: "add duration here"), e.g. "6 weeks" or "1 Nov to 15 Dec".
ALTER TABLE "crm_briefs" ADD COLUMN "duration" TEXT;

-- Internal review (Genesis, 31 Oct 2026): a cut the producer approves before the client ever sees it.
ALTER TYPE "DeliverableStatus" ADD VALUE IF NOT EXISTS 'INTERNAL_REVIEW' BEFORE 'IN_REVIEW';
