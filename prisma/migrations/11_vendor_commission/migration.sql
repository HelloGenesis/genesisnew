-- Vendors and freelancers paid on commission (22 Oct 2026).
ALTER TABLE "crm_accounts" ADD COLUMN IF NOT EXISTS "vendor_commission_percent" DOUBLE PRECISION;
