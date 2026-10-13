-- Proposal sections, plan columns and the values of added columns (Genesis, 13 Oct 2026).
ALTER TABLE "crm_quotes" ADD COLUMN "proposal_tg" TEXT,
ADD COLUMN "proposal_sections" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "plan_columns" JSONB NOT NULL DEFAULT '{}';

ALTER TABLE "crm_quote_creators" ADD COLUMN "extra" JSONB NOT NULL DEFAULT '{}';
