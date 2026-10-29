-- Revised plans: a revision is a copy of a quote or plan saved on its own, R1, R2… (Genesis, 29 Oct 2026).
ALTER TABLE "crm_quotes" ADD COLUMN IF NOT EXISTS "revision_of_id" TEXT;
ALTER TABLE "crm_quotes" ADD COLUMN IF NOT EXISTS "base_number" INTEGER;
ALTER TABLE "crm_quotes" ADD COLUMN IF NOT EXISTS "revision" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS "crm_quotes_revision_of_id_idx" ON "crm_quotes"("revision_of_id");
