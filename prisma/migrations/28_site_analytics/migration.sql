-- Website analytics (Genesis, 31 Oct 2026: "a visitor analytics page and the entire dashboard for the websites").
CREATE TABLE "site_sessions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "visitor_id" TEXT NOT NULL,
  "is_new" BOOLEAN NOT NULL DEFAULT true,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "host" TEXT,
  "landing" TEXT NOT NULL,
  "referrer" TEXT,
  "source" TEXT NOT NULL,
  "utm_source" TEXT,
  "utm_medium" TEXT,
  "utm_campaign" TEXT,
  "country" TEXT,
  "city" TEXT,
  "device" TEXT NOT NULL,
  "browser" TEXT,
  "os" TEXT,
  "pages" INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX "site_sessions_started_at_idx" ON "site_sessions"("started_at");
CREATE INDEX "site_sessions_last_at_idx" ON "site_sessions"("last_at");

CREATE TABLE "site_page_views" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "session_id" TEXT NOT NULL REFERENCES "site_sessions"("id") ON DELETE CASCADE,
  "path" TEXT NOT NULL,
  "title" TEXT,
  "position" INTEGER NOT NULL DEFAULT 0,
  "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "duration_ms" INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX "site_page_views_at_idx" ON "site_page_views"("at");
CREATE INDEX "site_page_views_session_id_idx" ON "site_page_views"("session_id");

CREATE TABLE "site_events" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "session_id" TEXT NOT NULL REFERENCES "site_sessions"("id") ON DELETE CASCADE,
  "kind" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "site_events_at_idx" ON "site_events"("at");
