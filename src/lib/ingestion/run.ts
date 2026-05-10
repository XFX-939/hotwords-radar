import type { RawItem, Source } from "@prisma/client";
import { getPrisma } from "../db";
import {
  analyzeSentiment,
  calculateHotScore,
  classifyKeyword,
  cleanText,
  extractKeywords,
  generateDailyReport,
  inferTrend,
  isDictionaryKeyword
} from "../pipeline";
import type { IngestionResult, IngestionSourceResult, ReportKeyword, SourceLocale } from "../types";
import { getAdapter } from "./adapters";
import type { RawSourceItem } from "./types";
import { hashContent, normalizeWhitespace, stripHtml } from "./utils";

interface IngestionOptions {
  trigger: string;
  sourceKey?: string;
}

interface KeywordAggregate {
  word: string;
  normalizedWord: string;
  frequency: number;
  weightedSourceSum: number;
  sourceIds: Set<string>;
  rawItemIds: Set<string>;
  firstSeenAt: Date;
  lastSeenAt: Date;
  context: string[];
  mentions: Array<{ rawItemId: string; sourceId: string; weight: number }>;
}

interface NormalizedRawItem {
  externalId?: string;
  title: string;
  url?: string;
  summary?: string;
  author?: string;
  publishedAt?: Date;
  rawJson?: unknown;
  contentHash: string;
}

type RawItemWithSource = RawItem & { source: Source };

type HotwordsGlobal = typeof globalThis & {
  hotwordsIngestion?: Promise<IngestionResult>;
};

const globalForIngestion = globalThis as HotwordsGlobal;

export function runHotwordsIngestion(options: IngestionOptions) {
  if (globalForIngestion.hotwordsIngestion) {
    return globalForIngestion.hotwordsIngestion;
  }

  globalForIngestion.hotwordsIngestion = runHotwordsIngestionUnsafe(options).finally(() => {
    globalForIngestion.hotwordsIngestion = undefined;
  });
  return globalForIngestion.hotwordsIngestion;
}

export function normalizeRawItems(sourceKey: string, items: RawSourceItem[]): NormalizedRawItem[] {
  const seen = new Set<string>();

  return items
    .map((item) => {
      const title = normalizeWhitespace(stripHtml(item.title)) ?? "";
      const summary = normalizeWhitespace(stripHtml(item.summary));
      const url = normalizeWhitespace(item.url);
      const externalId = normalizeWhitespace(item.externalId || url || undefined);
      const contentHash = hashContent([sourceKey, externalId, title, url, summary]);
      return {
        externalId,
        title,
        url,
        summary,
        author: normalizeWhitespace(item.author),
        publishedAt: item.publishedAt,
        rawJson: item.rawJson,
        contentHash
      };
    })
    .filter((item) => {
      if (!item.title || seen.has(item.contentHash)) return false;
      seen.add(item.contentHash);
      return true;
    });
}

async function runHotwordsIngestionUnsafe(options: IngestionOptions): Promise<IngestionResult> {
  const prisma = getPrisma();
  const startedAt = new Date();
  const started = Date.now();
  const sourceWhere = {
    enabled: true,
    ...(options.sourceKey ? { key: options.sourceKey } : {})
  };
  const sources = await prisma.source.findMany({
    where: sourceWhere,
    orderBy: [{ sourceWeight: "desc" }, { name: "asc" }]
  });

  const sourceResults: IngestionSourceResult[] = [];
  let insertedRawItemCount = 0;

  for (const source of sources) {
    const logStarted = new Date();
    const log = await prisma.fetchLog.create({
      data: {
        sourceId: source.id,
        status: "running",
        startedAt: logStarted
      }
    });

    try {
      const adapter = getAdapter(source.type);
      if (!adapter) {
        throw new Error(`未支持的数据源类型：${source.type}`);
      }

      const rawItems = await adapter.fetch(source);
      const normalized = normalizeRawItems(source.key, rawItems);
      let inserted = 0;

      for (const item of normalized) {
        const existing = await prisma.rawItem.findFirst({
          where: {
            sourceId: source.id,
            OR: [
              { contentHash: item.contentHash },
              ...(item.externalId ? [{ externalId: item.externalId }] : [])
            ]
          },
          select: { id: true }
        });
        if (existing) continue;

        await prisma.rawItem.create({
          data: {
            sourceId: source.id,
            externalId: item.externalId,
            title: item.title,
            url: item.url,
            summary: item.summary,
            author: item.author,
            publishedAt: item.publishedAt,
            fetchedAt: startedAt,
            rawJson: item.rawJson ? JSON.stringify(item.rawJson).slice(0, 25_000) : undefined,
            contentHash: item.contentHash
          }
        });
        inserted += 1;
      }

      insertedRawItemCount += inserted;
      const status = normalized.length === 0 ? "empty" : "success";
      const finishedAt = new Date();
      await prisma.fetchLog.update({
        where: { id: log.id },
        data: {
          status,
          finishedAt,
          durationMs: finishedAt.getTime() - logStarted.getTime(),
          itemCount: normalized.length,
          newItemCount: inserted
        }
      });
      await prisma.source.update({
        where: { id: source.id },
        data: {
          lastFetchedAt: finishedAt,
          lastStatus: status,
          lastError: null
        }
      });
      sourceResults.push({
        sourceKey: source.key,
        sourceName: source.name,
        status,
        fetched: normalized.length,
        inserted,
        error: null
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const finishedAt = new Date();
      await prisma.fetchLog.update({
        where: { id: log.id },
        data: {
          status: "failed",
          finishedAt,
          durationMs: finishedAt.getTime() - logStarted.getTime(),
          errorMessage: message
        }
      });
      await prisma.source.update({
        where: { id: source.id },
        data: {
          lastFetchedAt: finishedAt,
          lastStatus: "failed",
          lastError: message
        }
      });
      sourceResults.push({
        sourceKey: source.key,
        sourceName: source.name,
        status: "failed",
        fetched: 0,
        inserted: 0,
        error: message
      });
    }
  }

  const keywordStats = await rebuildKeywords(startedAt);
  const finishedAt = new Date();
  const successCount = sourceResults.filter((item) => item.status === "success" || item.status === "empty").length;
  const failureCount = sourceResults.filter((item) => item.status === "failed").length;
  const status = failureCount === 0 ? "success" : successCount > 0 ? "partial_success" : "failed";

  return {
    status,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: Date.now() - started,
    sourceCount: sources.length,
    successCount,
    failureCount,
    insertedRawItemCount,
    updatedKeywordCount: keywordStats.created + keywordStats.updated,
    snapshotCount: keywordStats.snapshots,
    sources: sourceResults,
    keywords: keywordStats
  };
}

async function rebuildKeywords(snapshotTime: Date) {
  const prisma = getPrisma();
  const since = new Date(snapshotTime.getTime() - 7 * 24 * 60 * 60 * 1000);
  const rawItems = await prisma.rawItem.findMany({
    where: {
      OR: [{ publishedAt: { gte: since } }, { fetchedAt: { gte: since } }]
    },
    include: { source: true },
    orderBy: [{ publishedAt: "desc" }, { fetchedAt: "desc" }],
    take: 800
  });

  await prisma.keywordMention.deleteMany();
  await prisma.keywordRelation.deleteMany();

  const segments: Array<{ locale: SourceLocale; rawItems: RawItemWithSource[] }> = [
    { locale: "all", rawItems },
    { locale: "zh", rawItems: rawItems.filter((item) => item.source.locale === "zh") },
    { locale: "en", rawItems: rawItems.filter((item) => item.source.locale === "en") }
  ];

  let created = 0;
  let updated = 0;
  let snapshots = 0;

  for (const segment of segments) {
    if (segment.locale !== "all" && segment.rawItems.length === 0) {
      await prisma.keyword.updateMany({
        where: { locale: segment.locale },
        data: { score: 0, trend: "falling" }
      });
      continue;
    }

    const stats = await rebuildKeywordSegment(segment.rawItems, segment.locale, snapshotTime);
    created += stats.created;
    updated += stats.updated;
    snapshots += stats.snapshots;
  }

  return { created, updated, snapshots };
}

async function rebuildKeywordSegment(rawItems: RawItemWithSource[], locale: SourceLocale, snapshotTime: Date) {
  const prisma = getPrisma();
  const aggregates = new Map<string, KeywordAggregate>();
  for (const rawItem of rawItems) {
    const text = `${rawItem.title} ${rawItem.summary ?? ""}`;
    const signals = extractKeywords([text]).slice(0, 12);
    const seenInItem = new Set<string>();
    for (const signal of signals) {
      if (seenInItem.has(signal.normalizedWord)) continue;
      seenInItem.add(signal.normalizedWord);
      const publishedAt = rawItem.publishedAt ?? rawItem.fetchedAt;
      const mentionWeight = signal.frequency * rawItem.source.sourceWeight;
      const current = aggregates.get(signal.normalizedWord) ?? {
        word: signal.word,
        normalizedWord: signal.normalizedWord,
        frequency: 0,
        weightedSourceSum: 0,
        sourceIds: new Set<string>(),
        rawItemIds: new Set<string>(),
        firstSeenAt: publishedAt,
        lastSeenAt: publishedAt,
        context: [],
        mentions: []
      };

      current.frequency += signal.frequency;
      current.weightedSourceSum += rawItem.source.sourceWeight;
      current.sourceIds.add(rawItem.sourceId);
      current.rawItemIds.add(rawItem.id);
      current.firstSeenAt = new Date(Math.min(current.firstSeenAt.getTime(), publishedAt.getTime()));
      current.lastSeenAt = new Date(Math.max(current.lastSeenAt.getTime(), publishedAt.getTime()));
      current.context.push(cleanText(text));
      current.mentions.push({ rawItemId: rawItem.id, sourceId: rawItem.sourceId, weight: mentionWeight });
      aggregates.set(signal.normalizedWord, current);
    }
  }

  const previousRecords = await prisma.keyword.findMany({
    where: { locale },
    include: {
      snapshots: {
        orderBy: { snapshotTime: "desc" },
        take: 1
      }
    }
  });
  const previousByWord = new Map(previousRecords.map((item) => [item.normalizedWord, item]));
  const computed = [...aggregates.values()]
    .filter((aggregate) => aggregate.rawItemIds.size >= 2 || isDictionaryKeyword(aggregate.normalizedWord))
    .map((aggregate) => {
      const averageSourceWeight = aggregate.weightedSourceSum / Math.max(1, aggregate.rawItemIds.size);
      const context = aggregate.context.join(" ");
      const score = calculateHotScore({
        frequency: aggregate.frequency,
        sourceWeight: averageSourceWeight,
        sourceCount: aggregate.sourceIds.size,
        itemCount: aggregate.rawItemIds.size,
        latestSeenAt: aggregate.lastSeenAt
      });
      const previous = previousByWord.get(aggregate.normalizedWord);
      const previousScore = previous?.snapshots[0]?.score ?? null;
      return {
        aggregate,
        score,
        trend: inferTrend(previousScore, score),
        category: classifyKeyword(aggregate.word, context),
        sentiment: analyzeSentiment(aggregate.word, context)
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 120);

  await prisma.keyword.updateMany({
    where: {
      locale,
      normalizedWord: {
        notIn: computed.map((item) => item.aggregate.normalizedWord)
      }
    },
    data: {
      score: 0,
      trend: "falling"
    }
  });

  let created = 0;
  let updated = 0;
  let snapshots = 0;
  const keywordIds = new Map<string, string>();

  for (const [index, item] of computed.entries()) {
    const previous = previousByWord.get(item.aggregate.normalizedWord);
    if (previous) updated += 1;
    else created += 1;

    const keyword = await prisma.keyword.upsert({
      where: {
        normalizedWord_locale: {
          normalizedWord: item.aggregate.normalizedWord,
          locale
        }
      },
      create: {
        word: item.aggregate.word,
        normalizedWord: item.aggregate.normalizedWord,
        category: item.category,
        score: item.score,
        trend: item.trend,
        sentiment: item.sentiment,
        locale,
        firstSeenAt: item.aggregate.firstSeenAt,
        lastSeenAt: item.aggregate.lastSeenAt
      },
      update: {
        word: item.aggregate.word,
        category: item.category,
        score: item.score,
        trend: item.trend,
        sentiment: item.sentiment,
        firstSeenAt: previous
          ? new Date(Math.min(previous.firstSeenAt.getTime(), item.aggregate.firstSeenAt.getTime()))
          : item.aggregate.firstSeenAt,
        lastSeenAt: item.aggregate.lastSeenAt
      }
    });
    keywordIds.set(item.aggregate.normalizedWord, keyword.id);

    await prisma.keywordSnapshot.create({
      data: {
        keywordId: keyword.id,
        score: item.score,
        rank: index + 1,
        sourceCount: item.aggregate.sourceIds.size,
        itemCount: item.aggregate.rawItemIds.size,
        snapshotTime
      }
    });
    snapshots += 1;

    for (const mention of item.aggregate.mentions) {
      await prisma.keywordMention.upsert({
        where: {
          keywordId_rawItemId: {
            keywordId: keyword.id,
            rawItemId: mention.rawItemId
          }
        },
        create: {
          keywordId: keyword.id,
          rawItemId: mention.rawItemId,
          sourceId: mention.sourceId,
          weight: mention.weight
        },
        update: {
          sourceId: mention.sourceId,
          weight: mention.weight
        }
      });
    }
  }

  await rebuildRelations(computed.map((item) => item.aggregate), keywordIds);
  await upsertDailyReport(computed, snapshotTime, locale);

  return { created, updated, snapshots };
}

async function rebuildRelations(aggregates: KeywordAggregate[], keywordIds: Map<string, string>) {
  const prisma = getPrisma();
  const byRawItem = new Map<string, string[]>();
  for (const aggregate of aggregates) {
    for (const rawItemId of aggregate.rawItemIds) {
      byRawItem.set(rawItemId, [...(byRawItem.get(rawItemId) ?? []), aggregate.normalizedWord]);
    }
  }

  const weights = new Map<string, { a: string; b: string; weight: number }>();
  for (const words of byRawItem.values()) {
    const unique = [...new Set(words)].sort().slice(0, 8);
    for (let i = 0; i < unique.length; i += 1) {
      for (let j = i + 1; j < unique.length; j += 1) {
        const key = `${unique[i]}::${unique[j]}`;
        const current = weights.get(key) ?? { a: unique[i], b: unique[j], weight: 0 };
        current.weight += 1;
        weights.set(key, current);
      }
    }
  }

  for (const relation of [...weights.values()].sort((a, b) => b.weight - a.weight).slice(0, 160)) {
    const keywordAId = keywordIds.get(relation.a);
    const keywordBId = keywordIds.get(relation.b);
    if (!keywordAId || !keywordBId || keywordAId === keywordBId) continue;
    await prisma.keywordRelation.create({
      data: {
        keywordAId,
        keywordBId,
        relationType: "co_occurrence",
        weight: relation.weight
      }
    });
  }
}

async function upsertDailyReport(
  computed: Array<{ aggregate: KeywordAggregate; score: number; trend: string; category: string }>,
  now: Date,
  locale: SourceLocale
) {
  if (computed.length === 0) return;
  const prisma = getPrisma();
  const topKeywords: ReportKeyword[] = computed.slice(0, 20).map((item) => ({
    word: item.aggregate.word,
    category: item.category,
    score: item.score,
    trend: item.trend
  }));
  const risingKeywords = topKeywords.filter((item) => item.trend === "rising" || item.trend === "up" || item.trend === "new");
  const date = formatDateKey(now);
  const report = generateDailyReport({ date, topKeywords, risingKeywords });

  await prisma.dailyReport.upsert({
    where: {
      date_locale: {
        date,
        locale
      }
    },
    create: {
      date,
      title: report.title,
      summary: report.summary,
      contentMarkdown: report.contentMarkdown,
      locale
    },
    update: {
      title: report.title,
      summary: report.summary,
      contentMarkdown: report.contentMarkdown
    }
  });
}

function formatDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "2026";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}
