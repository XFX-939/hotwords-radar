-- Add a source language dimension and allow the pipeline to store
-- separate all/zh/en keyword snapshots and daily reports.
ALTER TABLE "Source" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en';
ALTER TABLE "Keyword" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'all';
ALTER TABLE "DailyReport" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'all';

DROP INDEX IF EXISTS "Keyword_normalizedWord_key";
CREATE UNIQUE INDEX "Keyword_normalizedWord_locale_key" ON "Keyword"("normalizedWord", "locale");
CREATE INDEX "Keyword_locale_score_idx" ON "Keyword"("locale", "score");

DROP INDEX IF EXISTS "DailyReport_date_key";
CREATE UNIQUE INDEX "DailyReport_date_locale_key" ON "DailyReport"("date", "locale");
