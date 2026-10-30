-- AI usage: every call to Claude with its tokens and cost, per person (Genesis, 30 Oct 2026).
CREATE TABLE IF NOT EXISTS "crm_ai_usage" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "source" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "chat_id" TEXT,
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "cache_read_tokens" INTEGER NOT NULL DEFAULT 0,
    "cache_write_tokens" INTEGER NOT NULL DEFAULT 0,
    "cost_micros" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "crm_ai_usage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "crm_ai_usage_user_id_created_at_idx" ON "crm_ai_usage"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "crm_ai_usage_created_at_idx" ON "crm_ai_usage"("created_at");
