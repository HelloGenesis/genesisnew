-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('SALARY', 'FREELANCER', 'SOFTWARE', 'RENT', 'UTILITIES', 'MARKETING', 'PRODUCTION', 'TRAVEL', 'EQUIPMENT', 'PROFESSIONAL_FEES', 'TAXES', 'OTHER');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "GstReturnStatus" AS ENUM ('PENDING', 'FILED', 'NOT_APPLICABLE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LeadSource" ADD VALUE 'CHATGPT';
ALTER TYPE "LeadSource" ADD VALUE 'CALENDAR_BOOKING';

-- CreateTable
CREATE TABLE "crm_expenses" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "payee" TEXT,
    "amount_paise" INTEGER NOT NULL,
    "gst_paise" INTEGER NOT NULL DEFAULT 0,
    "paid_via" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "project_id" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_company_subscriptions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vendor" TEXT,
    "category" TEXT,
    "amount_paise" INTEGER NOT NULL,
    "cycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "next_due_date" DATE NOT NULL,
    "auto_renew" BOOLEAN NOT NULL DEFAULT true,
    "payment_method" TEXT,
    "owner_id" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_company_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_gst_filings" (
    "id" TEXT NOT NULL,
    "return_type" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "due_date" DATE NOT NULL,
    "status" "GstReturnStatus" NOT NULL DEFAULT 'PENDING',
    "filed_on" DATE,
    "arn" TEXT,
    "tax_paid_paise" INTEGER,
    "notes" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_gst_filings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_briefs" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "lead_id" TEXT,
    "account_id" TEXT,
    "division" "Division",
    "services" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "objective" TEXT,
    "audience" TEXT,
    "deliverables" TEXT,
    "platforms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "budget_paise" INTEGER,
    "deadline" DATE,
    "references" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_briefs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crm_expenses_date_idx" ON "crm_expenses"("date");

-- CreateIndex
CREATE INDEX "crm_expenses_category_date_idx" ON "crm_expenses"("category", "date");

-- CreateIndex
CREATE INDEX "crm_company_subscriptions_active_next_due_date_idx" ON "crm_company_subscriptions"("active", "next_due_date");

-- CreateIndex
CREATE INDEX "crm_gst_filings_status_due_date_idx" ON "crm_gst_filings"("status", "due_date");

-- CreateIndex
CREATE UNIQUE INDEX "crm_gst_filings_return_type_period_key" ON "crm_gst_filings"("return_type", "period");

-- CreateIndex
CREATE UNIQUE INDEX "crm_briefs_number_key" ON "crm_briefs"("number");

-- CreateIndex
CREATE INDEX "crm_briefs_lead_id_idx" ON "crm_briefs"("lead_id");

-- CreateIndex
CREATE INDEX "crm_briefs_account_id_idx" ON "crm_briefs"("account_id");


