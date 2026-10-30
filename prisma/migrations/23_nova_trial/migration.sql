-- Nova by Genesis's 14-day free trial (lib/crm/nova-trial).
ALTER TABLE "crm_accounts" ADD COLUMN IF NOT EXISTS "trial_started_at" TIMESTAMP(3);
ALTER TABLE "crm_accounts" ADD COLUMN IF NOT EXISTS "trial_card_due_at" TIMESTAMP(3);
ALTER TABLE "crm_accounts" ADD COLUMN IF NOT EXISTS "trial_ends_at" TIMESTAMP(3);
ALTER TABLE "crm_accounts" ADD COLUMN IF NOT EXISTS "trial_state" TEXT;
ALTER TABLE "crm_accounts" ADD COLUMN IF NOT EXISTS "trial_plan" TEXT;
ALTER TABLE "crm_accounts" ADD COLUMN IF NOT EXISTS "trial_subscription_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "crm_accounts_trial_subscription_id_key" ON "crm_accounts"("trial_subscription_id");
CREATE INDEX IF NOT EXISTS "crm_accounts_trial_state_idx" ON "crm_accounts"("trial_state");
