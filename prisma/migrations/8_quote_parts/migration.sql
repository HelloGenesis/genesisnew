-- Which parts a quote holds: proposal, plan, pricing (Genesis, 13 Oct 2026). Empty = worked out from what it has.
ALTER TABLE "crm_quotes" ADD COLUMN "parts" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
