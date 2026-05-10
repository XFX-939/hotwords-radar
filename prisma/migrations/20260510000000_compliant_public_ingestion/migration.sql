-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sourceWeight" REAL NOT NULL DEFAULT 1,
    "fetchIntervalMinutes" INTEGER NOT NULL DEFAULT 180,
    "lastFetchedAt" DATETIME,
    "lastStatus" TEXT NOT NULL DEFAULT 'idle',
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RawItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "externalId" TEXT,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "summary" TEXT,
    "author" TEXT,
    "publishedAt" DATETIME,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawJson" TEXT,
    "contentHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RawItem_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Keyword" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "word" TEXT NOT NULL,
    "normalizedWord" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "score" REAL NOT NULL DEFAULT 0,
    "trend" TEXT NOT NULL DEFAULT 'stable',
    "sentiment" TEXT NOT NULL DEFAULT 'neutral',
    "firstSeenAt" DATETIME NOT NULL,
    "lastSeenAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "KeywordMention" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keywordId" TEXT NOT NULL,
    "rawItemId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "weight" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KeywordMention_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "Keyword" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KeywordMention_rawItemId_fkey" FOREIGN KEY ("rawItemId") REFERENCES "RawItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KeywordMention_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KeywordSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keywordId" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "rank" INTEGER NOT NULL,
    "sourceCount" INTEGER NOT NULL,
    "itemCount" INTEGER NOT NULL,
    "snapshotTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KeywordSnapshot_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "Keyword" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KeywordRelation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keywordAId" TEXT NOT NULL,
    "keywordBId" TEXT NOT NULL,
    "weight" REAL NOT NULL,
    "relationType" TEXT NOT NULL DEFAULT 'co_occurrence',
    CONSTRAINT "KeywordRelation_keywordAId_fkey" FOREIGN KEY ("keywordAId") REFERENCES "Keyword" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KeywordRelation_keywordBId_fkey" FOREIGN KEY ("keywordBId") REFERENCES "Keyword" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "contentMarkdown" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FetchLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "newItemCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    CONSTRAINT "FetchLog_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Source_key_key" ON "Source"("key");

-- CreateIndex
CREATE INDEX "RawItem_sourceId_fetchedAt_idx" ON "RawItem"("sourceId", "fetchedAt");

-- CreateIndex
CREATE INDEX "RawItem_publishedAt_idx" ON "RawItem"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RawItem_sourceId_externalId_key" ON "RawItem"("sourceId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "RawItem_sourceId_contentHash_key" ON "RawItem"("sourceId", "contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "Keyword_normalizedWord_key" ON "Keyword"("normalizedWord");

-- CreateIndex
CREATE INDEX "Keyword_score_idx" ON "Keyword"("score");

-- CreateIndex
CREATE INDEX "Keyword_category_idx" ON "Keyword"("category");

-- CreateIndex
CREATE INDEX "Keyword_lastSeenAt_idx" ON "Keyword"("lastSeenAt");

-- CreateIndex
CREATE INDEX "KeywordMention_rawItemId_idx" ON "KeywordMention"("rawItemId");

-- CreateIndex
CREATE INDEX "KeywordMention_sourceId_idx" ON "KeywordMention"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "KeywordMention_keywordId_rawItemId_key" ON "KeywordMention"("keywordId", "rawItemId");

-- CreateIndex
CREATE INDEX "KeywordSnapshot_keywordId_snapshotTime_idx" ON "KeywordSnapshot"("keywordId", "snapshotTime");

-- CreateIndex
CREATE INDEX "KeywordRelation_weight_idx" ON "KeywordRelation"("weight");

-- CreateIndex
CREATE UNIQUE INDEX "KeywordRelation_keywordAId_keywordBId_relationType_key" ON "KeywordRelation"("keywordAId", "keywordBId", "relationType");

-- CreateIndex
CREATE UNIQUE INDEX "DailyReport_date_key" ON "DailyReport"("date");

-- CreateIndex
CREATE INDEX "FetchLog_sourceId_startedAt_idx" ON "FetchLog"("sourceId", "startedAt");

