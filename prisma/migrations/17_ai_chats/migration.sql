-- The CRM's AI assistant conversations (27 Oct 2026).
CREATE TABLE IF NOT EXISTS "crm_ai_chats" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "messages" JSONB NOT NULL DEFAULT '[]',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "crm_ai_chats_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "crm_ai_chats_user_id_updated_at_idx" ON "crm_ai_chats"("user_id", "updated_at");
