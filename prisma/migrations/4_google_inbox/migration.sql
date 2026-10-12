-- CreateEnum
CREATE TYPE "InboxSource" AS ENUM ('GMAIL', 'DRIVE', 'SHEET', 'RAZORPAY');

-- CreateEnum
CREATE TYPE "InboxKind" AS ENUM ('BRIEF', 'CLIENT', 'VENDOR', 'INVOICE', 'PROPOSAL', 'LINK', 'OTHER');

-- CreateEnum
CREATE TYPE "InboxStatus" AS ENUM ('NEW', 'DONE', 'DISMISSED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LeadSource" ADD VALUE 'EMAIL';
ALTER TYPE "LeadSource" ADD VALUE 'GOOGLE_DRIVE';
ALTER TYPE "LeadSource" ADD VALUE 'SHEET_IMPORT';

-- CreateTable
CREATE TABLE "crm_google_connections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "scopes" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "last_error" TEXT,
    "gmail_cursor" TEXT,
    "drive_cursor" TIMESTAMP(3),
    "last_sync_at" TIMESTAMP(3),
    "connected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_google_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_inbox_items" (
    "id" TEXT NOT NULL,
    "dedupe_key" TEXT NOT NULL,
    "user_id" TEXT,
    "source" "InboxSource" NOT NULL,
    "external_id" TEXT NOT NULL,
    "kind" "InboxKind" NOT NULL,
    "status" "InboxStatus" NOT NULL DEFAULT 'NEW',
    "confidence" DOUBLE PRECISION,
    "title" TEXT NOT NULL,
    "sender" TEXT,
    "sender_email" TEXT,
    "summary" TEXT,
    "url" TEXT,
    "links" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "data" JSONB,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "lead_id" TEXT,
    "brief_id" TEXT,
    "account_id" TEXT,
    "expense_id" TEXT,
    "handled_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_inbox_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "href" TEXT,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_sheet_imports" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "spreadsheet_id" TEXT NOT NULL,
    "sheet_name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "mapping" JSONB NOT NULL,
    "auto_sync" BOOLEAN NOT NULL DEFAULT false,
    "rows_imported" INTEGER NOT NULL DEFAULT 0,
    "last_run_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_sheet_imports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "crm_google_connections_user_id_key" ON "crm_google_connections"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "crm_inbox_items_dedupe_key_key" ON "crm_inbox_items"("dedupe_key");

-- CreateIndex
CREATE INDEX "crm_inbox_items_user_id_status_occurred_at_idx" ON "crm_inbox_items"("user_id", "status", "occurred_at");

-- CreateIndex
CREATE INDEX "crm_inbox_items_status_kind_idx" ON "crm_inbox_items"("status", "kind");

-- CreateIndex
CREATE INDEX "crm_inbox_items_account_id_idx" ON "crm_inbox_items"("account_id");

-- CreateIndex
CREATE INDEX "crm_inbox_items_lead_id_idx" ON "crm_inbox_items"("lead_id");

-- CreateIndex
CREATE INDEX "crm_notifications_user_id_read_at_created_at_idx" ON "crm_notifications"("user_id", "read_at", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "crm_sheet_imports_spreadsheet_id_sheet_name_kind_key" ON "crm_sheet_imports"("spreadsheet_id", "sheet_name", "kind");

