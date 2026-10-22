-- Who added each creator, for "only what they add" access (22 Oct 2026).
ALTER TABLE "crm_creators" ADD COLUMN IF NOT EXISTS "created_by_id" TEXT;
CREATE INDEX IF NOT EXISTS "crm_creators_created_by_id_idx" ON "crm_creators"("created_by_id");
DO $$ BEGIN
  ALTER TABLE "crm_creators" ADD CONSTRAINT "crm_creators_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
