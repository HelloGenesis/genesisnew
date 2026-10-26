-- Reach-outs tracked per creator across plans (27 Oct 2026).
ALTER TABLE "crm_creators" ADD COLUMN IF NOT EXISTS "reach_status" TEXT;
ALTER TABLE "crm_creators" ADD COLUMN IF NOT EXISTS "reach_at" TIMESTAMP(3);
ALTER TABLE "crm_creators" ADD COLUMN IF NOT EXISTS "reach_by_id" TEXT;
ALTER TABLE "crm_creators" ADD COLUMN IF NOT EXISTS "reach_quote_id" TEXT;
CREATE TABLE IF NOT EXISTS "crm_reachouts" (
  "id" TEXT NOT NULL,
  "creator_id" TEXT,
  "quote_id" TEXT,
  "name" TEXT NOT NULL,
  "handle" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "by_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "crm_reachouts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "crm_reachouts_creator_id_created_at_idx" ON "crm_reachouts"("creator_id", "created_at");
CREATE INDEX IF NOT EXISTS "crm_reachouts_handle_idx" ON "crm_reachouts"("handle");
