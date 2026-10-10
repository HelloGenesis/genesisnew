-- CreateEnum
CREATE TYPE "Division" AS ENUM ('AI_LAB', 'STUDIOS', 'BRAND_DESIGN', 'INFLUENCE');

-- CreateEnum
CREATE TYPE "StaffRoleKind" AS ENUM ('OWNER', 'ADMIN', 'SALES', 'PRODUCER', 'FINANCE');

-- CreateEnum
CREATE TYPE "AccountKind" AS ENUM ('BRAND', 'AGENCY', 'VENDOR');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PROSPECT', 'ACTIVE', 'PAUSED', 'CHURNED');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'MEMBER', 'BILLING');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CALL_BOOKED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON', 'LOST', 'NURTURE');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('WEBSITE_FORM', 'CHECKOUT', 'WHATSAPP', 'CALL', 'REFERRAL', 'PARTNER', 'INSTAGRAM', 'LINKEDIN', 'EVENT', 'OUTBOUND', 'OTHER');

-- CreateEnum
CREATE TYPE "ActivityKind" AS ENUM ('NOTE', 'CALL', 'EMAIL', 'MEETING', 'WHATSAPP', 'STATUS', 'SYSTEM');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'DONE');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'NORMAL', 'HIGH');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "OrderChannel" AS ENUM ('WEBSITE', 'MANUAL', 'PARTNER');

-- CreateEnum
CREATE TYPE "LineKind" AS ENUM ('MEMBERSHIP', 'ONE_TIME', 'QUOTED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('CREATED', 'AUTHENTICATED', 'ACTIVE', 'PENDING', 'HALTED', 'PAUSED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CAPTURED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('DUE', 'APPROVED', 'PAID', 'VOID');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'ON_HOLD', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeliverableKind" AS ENUM ('VIDEO', 'IMAGE', 'DESIGN', 'DOCUMENT', 'LINK');

-- CreateEnum
CREATE TYPE "DeliverableStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED');

-- CreateEnum
CREATE TYPE "RequestKind" AS ENUM ('NEW_BRIEF', 'REVISION', 'NEW_CONTENT', 'SUPPORT', 'BILLING', 'CANCELLATION');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_ON_CLIENT', 'DONE', 'DECLINED');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('OFFERED', 'ACCEPTED', 'DECLINED', 'SUBMITTED', 'APPROVED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VendorInvoiceStatus" AS ENUM ('SUBMITTED', 'APPROVED', 'PAID', 'REJECTED');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('INSTAGRAM', 'YOUTUBE', 'LINKEDIN', 'X', 'FACEBOOK', 'MOJ', 'JOSH', 'SNAPCHAT', 'OTHER');

-- CreateEnum
CREATE TYPE "CreatorTier" AS ENUM ('NANO', 'MICRO', 'MID', 'MACRO', 'MEGA', 'CELEBRITY');

-- CreateEnum
CREATE TYPE "CampaignCreatorStatus" AS ENUM ('SHORTLISTED', 'APPROACHED', 'NEGOTIATING', 'CONFIRMED', 'CONTENT_RECEIVED', 'APPROVED', 'POSTED', 'PAID', 'DROPPED');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "QuoteKind" AS ENUM ('QUOTE', 'INFLUENCER_PLAN');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'PAID', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "FileAudience" AS ENUM ('TEAM', 'TEAM_VENDOR', 'TEAM_CLIENT', 'EVERYONE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "phone_verified" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateTable
CREATE TABLE "crm_staff_roles" (
    "user_id" TEXT NOT NULL,
    "role" "StaffRoleKind" NOT NULL,
    "granted_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_staff_roles_pkey" PRIMARY KEY ("user_id","role")
);

-- CreateTable
CREATE TABLE "crm_staff_invites" (
    "email" TEXT NOT NULL,
    "role" "StaffRoleKind" NOT NULL,
    "invited_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_staff_invites_pkey" PRIMARY KEY ("email","role")
);

-- CreateTable
CREATE TABLE "crm_staff_totp" (
    "user_id" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "last_step" INTEGER NOT NULL DEFAULT 0,
    "confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_staff_totp_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "crm_accounts" (
    "id" TEXT NOT NULL,
    "kind" "AccountKind" NOT NULL DEFAULT 'BRAND',
    "status" "AccountStatus" NOT NULL DEFAULT 'PROSPECT',
    "name" TEXT NOT NULL,
    "legal_name" TEXT,
    "gstin" TEXT,
    "billing_address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'IN',
    "website" TEXT,
    "industry" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "parent_id" TEXT,
    "is_reseller" BOOLEAN NOT NULL DEFAULT false,
    "commission_percent" INTEGER NOT NULL DEFAULT 0,
    "referral_code" TEXT,
    "referred_by_id" TEXT,
    "vendor_skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "vendor_rate_note" TEXT,
    "payout_note" TEXT,
    "manager_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_account_members" (
    "account_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_account_members_pkey" PRIMARY KEY ("account_id","user_id")
);

-- CreateTable
CREATE TABLE "crm_account_invites" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
    "invited_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_account_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_leads" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "designation" TEXT,
    "division" "Division",
    "interest" TEXT,
    "source" "LeadSource" NOT NULL DEFAULT 'WEBSITE_FORM',
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "value_paise" INTEGER NOT NULL DEFAULT 0,
    "owner_id" TEXT,
    "next_follow_up" DATE,
    "notes" TEXT,
    "lost_reason" TEXT,
    "contact_submission_id" TEXT,
    "account_id" TEXT,
    "partner_id" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_activities" (
    "id" TEXT NOT NULL,
    "kind" "ActivityKind" NOT NULL DEFAULT 'NOTE',
    "body" TEXT NOT NULL,
    "lead_id" TEXT,
    "account_id" TEXT,
    "project_id" TEXT,
    "actor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "details" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
    "due_date" DATE,
    "owner_id" TEXT,
    "lead_id" TEXT,
    "account_id" TEXT,
    "project_id" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "crm_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_orders" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "channel" "OrderChannel" NOT NULL DEFAULT 'WEBSITE',
    "account_id" TEXT,
    "partner_id" TEXT,
    "billing" TEXT,
    "subtotal_paise" INTEGER NOT NULL DEFAULT 0,
    "discount_paise" INTEGER NOT NULL DEFAULT 0,
    "combo_discount_paise" INTEGER NOT NULL DEFAULT 0,
    "tax_paise" INTEGER NOT NULL DEFAULT 0,
    "tax_label" TEXT NOT NULL DEFAULT 'GST 18%',
    "total_paise" INTEGER NOT NULL DEFAULT 0,
    "recurring_paise" INTEGER NOT NULL DEFAULT 0,
    "one_time_paise" INTEGER NOT NULL DEFAULT 0,
    "contact_name" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "contact_phone" TEXT,
    "company" TEXT,
    "tax_id" TEXT,
    "billing_address" TEXT,
    "notes" TEXT,
    "consent" TEXT,
    "razorpay_link_id" TEXT,
    "razorpay_subscription_id" TEXT,
    "razorpay_payment_id" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "quote_id" TEXT,

    CONSTRAINT "crm_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_order_lines" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "division" "Division" NOT NULL,
    "kind" "LineKind" NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "charge_paise" INTEGER NOT NULL DEFAULT 0,
    "extras" JSONB,
    "extra_labels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "extras_paise" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "crm_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_subscriptions" (
    "id" TEXT NOT NULL,
    "razorpay_id" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'CREATED',
    "account_id" TEXT,
    "order_id" TEXT,
    "billing" TEXT,
    "amount_paise" INTEGER NOT NULL DEFAULT 0,
    "paid_count" INTEGER NOT NULL DEFAULT 0,
    "current_end" TIMESTAMP(3),
    "next_charge_at" TIMESTAMP(3),
    "cancel_requested_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "last_event_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_payments" (
    "id" TEXT NOT NULL,
    "razorpay_id" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'CAPTURED',
    "amount_paise" INTEGER NOT NULL,
    "method" TEXT,
    "order_id" TEXT,
    "subscription_id" TEXT,
    "account_id" TEXT,
    "invoice_id" TEXT,
    "invoice_url" TEXT,
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_webhook_events" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "crm_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_commissions" (
    "id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "order_id" TEXT,
    "payment_id" TEXT,
    "percent" INTEGER NOT NULL,
    "base_paise" INTEGER NOT NULL,
    "amount_paise" INTEGER NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'DUE',
    "paid_at" TIMESTAMP(3),
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_projects" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "division" "Division" NOT NULL,
    "product_id" TEXT,
    "account_id" TEXT NOT NULL,
    "order_id" TEXT,
    "order_line_id" TEXT,
    "subscription_id" TEXT,
    "stages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "stage" INTEGER NOT NULL DEFAULT 0,
    "lead_id" TEXT,
    "quote_id" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "manager_id" TEXT,
    "start_date" DATE,
    "due_date" DATE,
    "quota" INTEGER,
    "brief" TEXT,
    "drive_url" TEXT,
    "report_summary" TEXT,
    "report_shared" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_deliverables" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" "DeliverableKind" NOT NULL DEFAULT 'VIDEO',
    "url" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "DeliverableStatus" NOT NULL DEFAULT 'DRAFT',
    "file_id" TEXT,
    "assignment_id" TEXT,
    "submitted_by_id" TEXT,
    "feedback" TEXT,
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_deliverables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_requests" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "kind" "RequestKind" NOT NULL DEFAULT 'NEW_BRIEF',
    "status" "RequestStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "links" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "account_id" TEXT NOT NULL,
    "project_id" TEXT,
    "created_by_id" TEXT,
    "assignee_id" TEXT,
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_messages" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "project_id" TEXT,
    "request_id" TEXT,
    "author_id" TEXT,
    "from_staff" BOOLEAN NOT NULL DEFAULT false,
    "internal" BOOLEAN NOT NULL DEFAULT false,
    "body" TEXT NOT NULL,
    "links" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_vendor_assignments" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "brief" TEXT,
    "fee_paise" INTEGER NOT NULL DEFAULT 0,
    "due_date" DATE,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'OFFERED',
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_vendor_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_vendor_invoices" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "assignment_id" TEXT,
    "number" TEXT NOT NULL,
    "amount_paise" INTEGER NOT NULL,
    "tax_paise" INTEGER NOT NULL DEFAULT 0,
    "file_url" TEXT,
    "status" "VendorInvoiceStatus" NOT NULL DEFAULT 'SUBMITTED',
    "note" TEXT,
    "submitted_by_id" TEXT,
    "decided_by_id" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_vendor_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_creators" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "platform" "Platform" NOT NULL DEFAULT 'INSTAGRAM',
    "profile_url" TEXT,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "avg_views" INTEGER,
    "engagement_rate" DOUBLE PRECISION,
    "tier" "CreatorTier" NOT NULL DEFAULT 'MICRO',
    "niches" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "city" TEXT,
    "gender" TEXT,
    "reel_rate_paise" INTEGER,
    "story_rate_paise" INTEGER,
    "post_rate_paise" INTEGER,
    "email" TEXT,
    "phone" TEXT,
    "managed_by" TEXT,
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "blacklisted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_creators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_campaign_creators" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "status" "CampaignCreatorStatus" NOT NULL DEFAULT 'SHORTLISTED',
    "fee_paise" INTEGER,
    "deliverables" TEXT,
    "post_url" TEXT,
    "views" INTEGER,
    "likes" INTEGER,
    "comments" INTEGER,
    "shares" INTEGER,
    "saves" INTEGER,
    "reach" INTEGER,
    "posted_at" TIMESTAMP(3),
    "client_visible" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_campaign_creators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_email_outbox" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "to" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "to_staff" BOOLEAN NOT NULL DEFAULT false,
    "staff_scope" TEXT,
    "subject" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "dedupe_key" TEXT,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "next_attempt_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_error" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_email_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_sheet_outbox" (
    "id" TEXT NOT NULL,
    "tab" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,

    CONSTRAINT "crm_sheet_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_quotes" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "kind" "QuoteKind" NOT NULL DEFAULT 'QUOTE',
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "division" "Division",
    "account_id" TEXT,
    "lead_id" TEXT,
    "request_id" TEXT,
    "contact_name" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "contact_phone" TEXT,
    "company" TEXT,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "terms" TEXT,
    "add_gst" BOOLEAN NOT NULL DEFAULT true,
    "gst_percent" INTEGER NOT NULL DEFAULT 18,
    "discount_paise" INTEGER NOT NULL DEFAULT 0,
    "subtotal_paise" INTEGER NOT NULL DEFAULT 0,
    "tax_paise" INTEGER NOT NULL DEFAULT 0,
    "total_paise" INTEGER NOT NULL DEFAULT 0,
    "razorpay_link_id" TEXT,
    "payment_url" TEXT,
    "created_by_id" TEXT,
    "sent_at" TIMESTAMP(3),
    "viewed_at" TIMESTAMP(3),
    "accepted_at" TIMESTAMP(3),
    "accepted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_quote_lines" (
    "id" TEXT NOT NULL,
    "quote_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "kind" TEXT NOT NULL DEFAULT 'custom',
    "product_id" TEXT,
    "division" "Division",
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "details" TEXT,
    "note" TEXT,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "unit_paise" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "crm_quote_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_quote_creators" (
    "id" TEXT NOT NULL,
    "quote_id" TEXT NOT NULL,
    "creator_id" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "profile_url" TEXT,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "avg_views" INTEGER,
    "niches" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "city" TEXT,
    "deliverables" TEXT,
    "fee_paise" INTEGER,

    CONSTRAINT "crm_quote_creators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_drive_files" (
    "id" TEXT NOT NULL,
    "drive_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mime_type" TEXT,
    "size_bytes" BIGINT,
    "web_view_link" TEXT,
    "folder" TEXT NOT NULL DEFAULT 'brief',
    "audience" "FileAudience" NOT NULL DEFAULT 'EVERYONE',
    "project_id" TEXT,
    "account_id" TEXT,
    "uploaded_by_id" TEXT,
    "uploaded_as" TEXT NOT NULL DEFAULT 'staff',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_drive_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "crm_accounts_referral_code_key" ON "crm_accounts"("referral_code");

-- CreateIndex
CREATE INDEX "crm_accounts_kind_status_idx" ON "crm_accounts"("kind", "status");

-- CreateIndex
CREATE INDEX "crm_accounts_parent_id_idx" ON "crm_accounts"("parent_id");

-- CreateIndex
CREATE INDEX "crm_accounts_referred_by_id_idx" ON "crm_accounts"("referred_by_id");

-- CreateIndex
CREATE INDEX "crm_account_members_user_id_idx" ON "crm_account_members"("user_id");

-- CreateIndex
CREATE INDEX "crm_account_invites_email_idx" ON "crm_account_invites"("email");

-- CreateIndex
CREATE UNIQUE INDEX "crm_account_invites_account_id_email_key" ON "crm_account_invites"("account_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "crm_leads_contact_submission_id_key" ON "crm_leads"("contact_submission_id");

-- CreateIndex
CREATE INDEX "crm_leads_status_idx" ON "crm_leads"("status");

-- CreateIndex
CREATE INDEX "crm_leads_next_follow_up_idx" ON "crm_leads"("next_follow_up");

-- CreateIndex
CREATE INDEX "crm_leads_owner_id_idx" ON "crm_leads"("owner_id");

-- CreateIndex
CREATE INDEX "crm_leads_email_idx" ON "crm_leads"("email");

-- CreateIndex
CREATE INDEX "crm_activities_lead_id_created_at_idx" ON "crm_activities"("lead_id", "created_at");

-- CreateIndex
CREATE INDEX "crm_activities_account_id_created_at_idx" ON "crm_activities"("account_id", "created_at");

-- CreateIndex
CREATE INDEX "crm_activities_project_id_created_at_idx" ON "crm_activities"("project_id", "created_at");

-- CreateIndex
CREATE INDEX "crm_tasks_status_due_date_idx" ON "crm_tasks"("status", "due_date");

-- CreateIndex
CREATE UNIQUE INDEX "crm_orders_reference_key" ON "crm_orders"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "crm_orders_razorpay_link_id_key" ON "crm_orders"("razorpay_link_id");

-- CreateIndex
CREATE UNIQUE INDEX "crm_orders_razorpay_subscription_id_key" ON "crm_orders"("razorpay_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "crm_orders_quote_id_key" ON "crm_orders"("quote_id");

-- CreateIndex
CREATE INDEX "crm_orders_status_created_at_idx" ON "crm_orders"("status", "created_at");

-- CreateIndex
CREATE INDEX "crm_orders_account_id_idx" ON "crm_orders"("account_id");

-- CreateIndex
CREATE INDEX "crm_orders_contact_email_idx" ON "crm_orders"("contact_email");

-- CreateIndex
CREATE INDEX "crm_order_lines_order_id_idx" ON "crm_order_lines"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "crm_subscriptions_razorpay_id_key" ON "crm_subscriptions"("razorpay_id");

-- CreateIndex
CREATE UNIQUE INDEX "crm_subscriptions_order_id_key" ON "crm_subscriptions"("order_id");

-- CreateIndex
CREATE INDEX "crm_subscriptions_status_idx" ON "crm_subscriptions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "crm_payments_razorpay_id_key" ON "crm_payments"("razorpay_id");

-- CreateIndex
CREATE INDEX "crm_payments_account_id_paid_at_idx" ON "crm_payments"("account_id", "paid_at");

-- CreateIndex
CREATE UNIQUE INDEX "crm_commissions_payment_id_key" ON "crm_commissions"("payment_id");

-- CreateIndex
CREATE INDEX "crm_commissions_partner_id_status_idx" ON "crm_commissions"("partner_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "crm_projects_number_key" ON "crm_projects"("number");

-- CreateIndex
CREATE UNIQUE INDEX "crm_projects_order_line_id_key" ON "crm_projects"("order_line_id");

-- CreateIndex
CREATE INDEX "crm_projects_account_id_status_idx" ON "crm_projects"("account_id", "status");

-- CreateIndex
CREATE INDEX "crm_projects_status_due_date_idx" ON "crm_projects"("status", "due_date");

-- CreateIndex
CREATE INDEX "crm_deliverables_project_id_status_idx" ON "crm_deliverables"("project_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "crm_requests_number_key" ON "crm_requests"("number");

-- CreateIndex
CREATE INDEX "crm_requests_account_id_status_idx" ON "crm_requests"("account_id", "status");

-- CreateIndex
CREATE INDEX "crm_requests_status_created_at_idx" ON "crm_requests"("status", "created_at");

-- CreateIndex
CREATE INDEX "crm_messages_project_id_created_at_idx" ON "crm_messages"("project_id", "created_at");

-- CreateIndex
CREATE INDEX "crm_messages_request_id_created_at_idx" ON "crm_messages"("request_id", "created_at");

-- CreateIndex
CREATE INDEX "crm_messages_account_id_created_at_idx" ON "crm_messages"("account_id", "created_at");

-- CreateIndex
CREATE INDEX "crm_vendor_assignments_vendor_id_status_idx" ON "crm_vendor_assignments"("vendor_id", "status");

-- CreateIndex
CREATE INDEX "crm_vendor_invoices_status_idx" ON "crm_vendor_invoices"("status");

-- CreateIndex
CREATE UNIQUE INDEX "crm_vendor_invoices_vendor_id_number_key" ON "crm_vendor_invoices"("vendor_id", "number");

-- CreateIndex
CREATE INDEX "crm_creators_tier_idx" ON "crm_creators"("tier");

-- CreateIndex
CREATE INDEX "crm_creators_city_idx" ON "crm_creators"("city");

-- CreateIndex
CREATE UNIQUE INDEX "crm_creators_platform_handle_key" ON "crm_creators"("platform", "handle");

-- CreateIndex
CREATE UNIQUE INDEX "crm_campaign_creators_project_id_creator_id_key" ON "crm_campaign_creators"("project_id", "creator_id");

-- CreateIndex
CREATE UNIQUE INDEX "crm_email_outbox_dedupe_key_key" ON "crm_email_outbox"("dedupe_key");

-- CreateIndex
CREATE INDEX "crm_email_outbox_status_next_attempt_at_idx" ON "crm_email_outbox"("status", "next_attempt_at");

-- CreateIndex
CREATE INDEX "crm_sheet_outbox_sent_at_idx" ON "crm_sheet_outbox"("sent_at");

-- CreateIndex
CREATE UNIQUE INDEX "crm_sheet_outbox_tab_key_key" ON "crm_sheet_outbox"("tab", "key");

-- CreateIndex
CREATE UNIQUE INDEX "crm_quotes_number_key" ON "crm_quotes"("number");

-- CreateIndex
CREATE UNIQUE INDEX "crm_quotes_token_key" ON "crm_quotes"("token");

-- CreateIndex
CREATE UNIQUE INDEX "crm_quotes_razorpay_link_id_key" ON "crm_quotes"("razorpay_link_id");

-- CreateIndex
CREATE INDEX "crm_quotes_status_created_at_idx" ON "crm_quotes"("status", "created_at");

-- CreateIndex
CREATE INDEX "crm_quotes_account_id_idx" ON "crm_quotes"("account_id");

-- CreateIndex
CREATE INDEX "crm_quotes_lead_id_idx" ON "crm_quotes"("lead_id");

-- CreateIndex
CREATE INDEX "crm_quote_lines_quote_id_position_idx" ON "crm_quote_lines"("quote_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "crm_drive_files_drive_id_key" ON "crm_drive_files"("drive_id");

-- CreateIndex
CREATE INDEX "crm_drive_files_project_id_folder_created_at_idx" ON "crm_drive_files"("project_id", "folder", "created_at");

-- CreateIndex
CREATE INDEX "crm_drive_files_account_id_created_at_idx" ON "crm_drive_files"("account_id", "created_at");

-- AddForeignKey
ALTER TABLE "crm_staff_roles" ADD CONSTRAINT "crm_staff_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_staff_totp" ADD CONSTRAINT "crm_staff_totp_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_accounts" ADD CONSTRAINT "crm_accounts_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "crm_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_accounts" ADD CONSTRAINT "crm_accounts_referred_by_id_fkey" FOREIGN KEY ("referred_by_id") REFERENCES "crm_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_accounts" ADD CONSTRAINT "crm_accounts_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_account_members" ADD CONSTRAINT "crm_account_members_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "crm_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_account_members" ADD CONSTRAINT "crm_account_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_account_invites" ADD CONSTRAINT "crm_account_invites_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "crm_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "crm_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "crm_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "crm_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "crm_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "crm_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "crm_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "crm_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "crm_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_orders" ADD CONSTRAINT "crm_orders_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "crm_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_orders" ADD CONSTRAINT "crm_orders_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "crm_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_orders" ADD CONSTRAINT "crm_orders_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "crm_quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_order_lines" ADD CONSTRAINT "crm_order_lines_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "crm_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_subscriptions" ADD CONSTRAINT "crm_subscriptions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "crm_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_subscriptions" ADD CONSTRAINT "crm_subscriptions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "crm_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_payments" ADD CONSTRAINT "crm_payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "crm_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_payments" ADD CONSTRAINT "crm_payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "crm_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_payments" ADD CONSTRAINT "crm_payments_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "crm_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_commissions" ADD CONSTRAINT "crm_commissions_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "crm_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_commissions" ADD CONSTRAINT "crm_commissions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "crm_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_commissions" ADD CONSTRAINT "crm_commissions_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "crm_payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_projects" ADD CONSTRAINT "crm_projects_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "crm_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_projects" ADD CONSTRAINT "crm_projects_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "crm_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_projects" ADD CONSTRAINT "crm_projects_order_line_id_fkey" FOREIGN KEY ("order_line_id") REFERENCES "crm_order_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_projects" ADD CONSTRAINT "crm_projects_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "crm_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_projects" ADD CONSTRAINT "crm_projects_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "crm_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_projects" ADD CONSTRAINT "crm_projects_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "crm_quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_projects" ADD CONSTRAINT "crm_projects_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deliverables" ADD CONSTRAINT "crm_deliverables_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "crm_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deliverables" ADD CONSTRAINT "crm_deliverables_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "crm_drive_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deliverables" ADD CONSTRAINT "crm_deliverables_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "crm_vendor_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_requests" ADD CONSTRAINT "crm_requests_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "crm_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_requests" ADD CONSTRAINT "crm_requests_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "crm_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_requests" ADD CONSTRAINT "crm_requests_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_requests" ADD CONSTRAINT "crm_requests_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_messages" ADD CONSTRAINT "crm_messages_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "crm_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_messages" ADD CONSTRAINT "crm_messages_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "crm_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_messages" ADD CONSTRAINT "crm_messages_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "crm_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_messages" ADD CONSTRAINT "crm_messages_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_vendor_assignments" ADD CONSTRAINT "crm_vendor_assignments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "crm_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_vendor_assignments" ADD CONSTRAINT "crm_vendor_assignments_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "crm_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_vendor_invoices" ADD CONSTRAINT "crm_vendor_invoices_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "crm_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_vendor_invoices" ADD CONSTRAINT "crm_vendor_invoices_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "crm_vendor_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_campaign_creators" ADD CONSTRAINT "crm_campaign_creators_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "crm_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_campaign_creators" ADD CONSTRAINT "crm_campaign_creators_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "crm_creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_quotes" ADD CONSTRAINT "crm_quotes_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "crm_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_quotes" ADD CONSTRAINT "crm_quotes_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "crm_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_quotes" ADD CONSTRAINT "crm_quotes_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "crm_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_quote_lines" ADD CONSTRAINT "crm_quote_lines_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "crm_quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_quote_creators" ADD CONSTRAINT "crm_quote_creators_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "crm_quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_drive_files" ADD CONSTRAINT "crm_drive_files_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "crm_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_drive_files" ADD CONSTRAINT "crm_drive_files_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "crm_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Genesis quote numbers continue from Price Quote #0000039 (sent 6 Oct 2026).
SELECT setval(pg_get_serial_sequence('crm_quotes', 'number'), 39);
