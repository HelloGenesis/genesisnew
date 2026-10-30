-- NOVA AI credits for agencies' CRMs (lib/crm/nova-ai).
CREATE TABLE IF NOT EXISTS "crm_nova_ai_credits" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "ref" TEXT,
    "note" TEXT,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "crm_nova_ai_credits_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "crm_nova_ai_credits_ref_key" ON "crm_nova_ai_credits"("ref");
CREATE INDEX IF NOT EXISTS "crm_nova_ai_credits_workspace_id_created_at_idx" ON "crm_nova_ai_credits"("workspace_id", "created_at");
