-- Agency CRMs (22 Oct 2026): each agency's records are tagged with its account id; Genesis's stay null.
ALTER TABLE "crm_leads" ADD COLUMN IF NOT EXISTS "workspace_id" TEXT;
CREATE INDEX IF NOT EXISTS "crm_leads_workspace_id_idx" ON "crm_leads"("workspace_id");
ALTER TABLE "crm_briefs" ADD COLUMN IF NOT EXISTS "workspace_id" TEXT;
CREATE INDEX IF NOT EXISTS "crm_briefs_workspace_id_idx" ON "crm_briefs"("workspace_id");
ALTER TABLE "crm_accounts" ADD COLUMN IF NOT EXISTS "workspace_id" TEXT;
CREATE INDEX IF NOT EXISTS "crm_accounts_workspace_id_idx" ON "crm_accounts"("workspace_id");
ALTER TABLE "crm_quotes" ADD COLUMN IF NOT EXISTS "workspace_id" TEXT;
CREATE INDEX IF NOT EXISTS "crm_quotes_workspace_id_idx" ON "crm_quotes"("workspace_id");
ALTER TABLE "crm_invoices" ADD COLUMN IF NOT EXISTS "workspace_id" TEXT;
CREATE INDEX IF NOT EXISTS "crm_invoices_workspace_id_idx" ON "crm_invoices"("workspace_id");
ALTER TABLE "crm_projects" ADD COLUMN IF NOT EXISTS "workspace_id" TEXT;
CREATE INDEX IF NOT EXISTS "crm_projects_workspace_id_idx" ON "crm_projects"("workspace_id");
ALTER TABLE "crm_tasks" ADD COLUMN IF NOT EXISTS "workspace_id" TEXT;
CREATE INDEX IF NOT EXISTS "crm_tasks_workspace_id_idx" ON "crm_tasks"("workspace_id");
ALTER TABLE "crm_creators" ADD COLUMN IF NOT EXISTS "workspace_id" TEXT;
CREATE INDEX IF NOT EXISTS "crm_creators_workspace_id_idx" ON "crm_creators"("workspace_id");
ALTER TABLE "crm_requests" ADD COLUMN IF NOT EXISTS "workspace_id" TEXT;
CREATE INDEX IF NOT EXISTS "crm_requests_workspace_id_idx" ON "crm_requests"("workspace_id");
ALTER TABLE "crm_accounts" ADD COLUMN IF NOT EXISTS "crm_workspace" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "crm_accounts" ADD COLUMN IF NOT EXISTS "crm_profile" JSONB;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "workspace_id" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "workspace_role" TEXT;
CREATE INDEX IF NOT EXISTS "users_workspace_id_idx" ON "users"("workspace_id");
DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "crm_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- A creator's handle is unique within each CRM, not across them: an agency keeps its own copy.
ALTER TABLE "crm_creators" DROP CONSTRAINT IF EXISTS "crm_creators_platform_handle_key";
DROP INDEX IF EXISTS "crm_creators_platform_handle_key";
CREATE UNIQUE INDEX IF NOT EXISTS "crm_creators_genesis_handle_key" ON "crm_creators"("platform", "handle") WHERE "workspace_id" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "crm_creators_workspace_handle_key" ON "crm_creators"("workspace_id", "platform", "handle") WHERE "workspace_id" IS NOT NULL;

-- Invoices are numbered in each CRM's own series.
ALTER TABLE "crm_invoices" DROP CONSTRAINT IF EXISTS "crm_invoices_fy_seq_key";
DROP INDEX IF EXISTS "crm_invoices_fy_seq_key";
CREATE UNIQUE INDEX IF NOT EXISTS "crm_invoices_genesis_fy_seq_key" ON "crm_invoices"("fy", "seq") WHERE "workspace_id" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "crm_invoices_workspace_fy_seq_key" ON "crm_invoices"("workspace_id", "fy", "seq") WHERE "workspace_id" IS NOT NULL;

-- Emails from an agency CRM: replies go to the agency.
ALTER TABLE "crm_email_outbox" ADD COLUMN IF NOT EXISTS "reply_to" TEXT;
