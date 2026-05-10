import { getPrisma } from "./db";
import { buildKeywordExplanation, buildCreationSuggestions, normalizeWord } from "./pipeline";
import type { KeywordListItem, SourceLocale, TimeRange, TrendDirection, Sentiment } from "./types";

interface KeywordQuery {
  range?: string;
  category?: string;
  source?: string;
  sort?: string;
  search?: string;
  limit?: number;
  locale?: string;
}

export async function getKeywordList(query: KeywordQuery = {}): Promise<KeywordListItem[]> {
  const prisma = getPrisma();
  const since = getRangeStart((query.range as TimeRange) || "24h");
  const sourceId = query.source && query.source !== "all" ? query.source : undefined;
  const locale = normalizeLocale(query.locale);

  const keywords = await prisma.keyword.findMany({
    where: {
      score: { gt: 0 },
      locale,
      lastSeenAt: { gte: since },
      ...(query.category && query.category !== "全部" ? { category: query.category } : {}),
      ...(query.search
        ? {
            word: {
              contains: query.search
            }
          }
        : {})
    },
    include: {
      snapshots: {
        orderBy: { snapshotTime: "desc" },
        take: 1
      }
    },
    take: 240
  });

  let sourceFiltered = keywords;
  if (sourceId) {
    const checks = await Promise.all(keywords.map((keyword) => keywordAppearsInSource(keyword.id, sourceId)));
    sourceFiltered = keywords.filter((_, index) => checks[index]);
  }

  const withSnapshot = await Promise.all(
    sourceFiltered.map(async (keyword) => {
      const latest = keyword.snapshots[0];
      const sourceCount = latest?.sourceCount ?? 0;
      const itemCount = latest?.itemCount ?? 0;
      return {
        id: keyword.id,
        rank: latest?.rank ?? 999,
        word: keyword.word,
        normalizedWord: keyword.normalizedWord,
        category: keyword.category,
        score: keyword.score,
        trend: keyword.trend as TrendDirection,
        sentiment: keyword.sentiment as Sentiment,
        locale: keyword.locale as SourceLocale,
        sourceCount,
        itemCount,
        firstSeenAt: keyword.firstSeenAt.toISOString(),
        lastSeenAt: keyword.lastSeenAt.toISOString()
      };
    })
  );

  const sorted = sortKeywords(withSnapshot, query.sort);
  return sorted.slice(0, query.limit ?? 100).map((item, index) => ({ ...item, rank: index + 1 }));
}

export async function getSources(localeParam?: string | null) {
  const prisma = getPrisma();
  const locale = normalizeLocale(localeParam);
  const sourceLocaleWhere = locale === "all" ? {} : { locale };
  const visibleSourceWhere = {
    ...sourceLocaleWhere,
    enabled: true,
    lastStatus: { not: "failed" }
  };
  const rawItemWhere = locale === "all" ? {} : { source: { is: { locale } } };
  const [sources, allSources, logs, rawItemCount, keywordCount] = await Promise.all([
    prisma.source.findMany({ where: visibleSourceWhere, orderBy: [{ sourceWeight: "desc" }, { name: "asc" }] }),
    prisma.source.findMany({ select: { enabled: true, locale: true, lastStatus: true } }),
    prisma.fetchLog.findMany({
      where: {
        status: { not: "failed" },
        source: {
          is: {
            ...sourceLocaleWhere,
            enabled: true,
            lastStatus: { not: "failed" }
          }
        }
      },
      include: { source: true },
      orderBy: { startedAt: "desc" },
      take: 12
    }),
    prisma.rawItem.count({ where: rawItemWhere }),
    prisma.keyword.count({ where: { locale } })
  ]);
  const lastFetchedAt = sources
    .map((source) => source.lastFetchedAt)
    .filter((value): value is Date => Boolean(value))
    .sort((a, b) => b.getTime() - a.getTime())[0];

  return {
    stats: {
      enabledSourceCount: sources.filter((source) => source.enabled).length,
      enabledZhSourceCount: allSources.filter((source) => source.enabled && source.locale === "zh" && source.lastStatus !== "failed").length,
      enabledEnSourceCount: allSources.filter((source) => source.enabled && source.locale === "en" && source.lastStatus !== "failed").length,
      rawItemCount,
      keywordCount,
      lastFetchedAt: lastFetchedAt?.toISOString() ?? null,
      hasRealData: rawItemCount > 0 && keywordCount > 0,
      fallbackMode: false
    },
    sources: sources.map((source) => ({
      id: source.id,
      key: source.key,
      name: source.name,
      type: source.type,
      endpoint: source.endpoint,
      locale: source.locale,
      enabled: source.enabled,
      sourceWeight: source.sourceWeight,
      fetchIntervalMinutes: source.fetchIntervalMinutes,
      lastFetchedAt: source.lastFetchedAt?.toISOString() ?? null,
      lastStatus: source.lastStatus,
      lastError: source.lastError,
      createdAt: source.createdAt.toISOString(),
      updatedAt: source.updatedAt.toISOString()
    })),
    logs: logs.map((log) => ({
      id: log.id,
      sourceId: log.sourceId,
      sourceName: log.source.name,
      sourceKey: log.source.key,
      startedAt: log.startedAt.toISOString(),
      finishedAt: log.finishedAt?.toISOString() ?? null,
      status: log.status,
      durationMs: log.durationMs,
      itemCount: log.itemCount,
      newItemCount: log.newItemCount,
      errorMessage: log.errorMessage
    }))
  };
}

export async function getKeywordDetail(keywordParam: string, localeParam?: string | null) {
  const prisma = getPrisma();
  const decoded = decodeURIComponent(keywordParam);
  const normalized = normalizeWord(decoded);
  const locale = normalizeLocale(localeParam);
  const keyword = await prisma.keyword.findFirst({
    where: {
      locale,
      OR: [{ normalizedWord: normalized }, { word: decoded }]
    },
    include: {
      snapshots: {
        orderBy: { snapshotTime: "asc" },
        take: 48
      },
      relationsA: {
        include: { keywordB: true },
        orderBy: { weight: "desc" },
        take: 12
      },
      relationsB: {
        include: { keywordA: true },
        orderBy: { weight: "desc" },
        take: 12
      }
    }
  });

  if (!keyword) return null;

  const rank = keyword.snapshots.at(-1)?.rank ?? 999;
  const related = [
    ...keyword.relationsA.map((relation) => relation.keywordB.word),
    ...keyword.relationsB.map((relation) => relation.keywordA.word)
  ].slice(0, 12);
  const mentions = await prisma.keywordMention.findMany({
    where: {
      keywordId: keyword.id
    },
    include: {
      rawItem: {
        include: { source: true }
      }
    },
    orderBy: [{ weight: "desc" }, { createdAt: "desc" }],
    take: 16
  });
  const reportKeyword = {
    word: keyword.word,
    category: keyword.category,
    score: keyword.score,
    trend: keyword.trend
  };

  return {
    id: keyword.id,
    word: keyword.word,
    normalizedWord: keyword.normalizedWord,
    category: keyword.category,
    score: keyword.score,
    rank,
    trend: keyword.trend,
    sentiment: keyword.sentiment,
    firstSeenAt: keyword.firstSeenAt.toISOString(),
    lastSeenAt: keyword.lastSeenAt.toISOString(),
    explanation: buildKeywordExplanation(reportKeyword, related),
    relatedKeywords: related,
    sentimentAnalysis: buildSentimentAnalysis(keyword.sentiment as Sentiment),
    creationSuggestions: buildCreationSuggestions(reportKeyword, related),
    sources: mentions.map((mention) => ({
      id: mention.rawItem.id,
      sourceName: mention.rawItem.source.name,
      sourceType: mention.rawItem.source.type,
      sourceLocale: mention.rawItem.source.locale,
      title: mention.rawItem.title,
      url: mention.rawItem.url,
      summary: mention.rawItem.summary,
      author: mention.rawItem.author,
      weight: mention.weight,
      publishedAt: mention.rawItem.publishedAt?.toISOString() ?? null,
      fetchedAt: mention.rawItem.fetchedAt.toISOString()
    }))
  };
}

export async function getKeywordTrend(keywordParam: string, localeParam?: string | null) {
  const prisma = getPrisma();
  const normalized = normalizeWord(decodeURIComponent(keywordParam));
  const locale = normalizeLocale(localeParam);
  const keyword = await prisma.keyword.findFirst({
    where: { normalizedWord: normalized, locale },
    include: {
      snapshots: {
        orderBy: { snapshotTime: "asc" },
        take: 48
      }
    }
  });

  if (!keyword) return [];
  return keyword.snapshots.map((snapshot) => ({
    time: snapshot.snapshotTime.toISOString(),
    score: snapshot.score,
    rank: snapshot.rank,
    sourceCount: snapshot.sourceCount,
    itemCount: snapshot.itemCount
  }));
}

export async function getRelations(localeParam?: string | null) {
  const prisma = getPrisma();
  const locale = normalizeLocale(localeParam);
  const keywords = await prisma.keyword.findMany({
    where: { score: { gt: 0 }, locale },
    orderBy: { score: "desc" },
    take: 45
  });
  const ids = new Set(keywords.map((keyword) => keyword.id));
  const relations = await prisma.keywordRelation.findMany({
    where: {
      keywordAId: { in: [...ids] },
      keywordBId: { in: [...ids] }
    },
    include: {
      keywordA: true,
      keywordB: true
    },
    orderBy: { weight: "desc" },
    take: 120
  });

  return {
    nodes: keywords.map((keyword) => ({
      id: keyword.normalizedWord,
      name: keyword.word,
      category: keyword.category,
      value: keyword.score
    })),
    links: relations.map((relation) => ({
      source: relation.keywordA.normalizedWord,
      target: relation.keywordB.normalizedWord,
      value: relation.weight
    }))
  };
}

export async function getDailyReport(localeParam?: string | null) {
  const prisma = getPrisma();
  const locale = normalizeLocale(localeParam);
  const report = await prisma.dailyReport.findFirst({
    where: { locale },
    orderBy: { date: "desc" }
  });
  return report
    ? {
        id: report.id,
        date: report.date,
        title: report.title,
        summary: report.summary,
        contentMarkdown: report.contentMarkdown,
        locale: report.locale,
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString()
      }
    : null;
}

function normalizeLocale(value?: string | null): SourceLocale {
  if (value === "zh" || value === "en") return value;
  return "all";
}

function getRangeStart(range: TimeRange) {
  const now = new Date();
  if (range === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  const hours: Record<TimeRange, number> = {
    today: 24,
    "24h": 24,
    "3d": 72,
    "7d": 168
  };
  return new Date(now.getTime() - (hours[range] ?? 24) * 36e5);
}

function sortKeywords(items: KeywordListItem[], sort = "heat") {
  const trendScore: Record<string, number> = { rising: 5, new: 4, up: 3, stable: 2, down: 1, falling: 0 };
  const copy = [...items];
  if (sort === "growth") {
    return copy.sort((a, b) => (trendScore[b.trend] ?? 0) - (trendScore[a.trend] ?? 0) || b.score - a.score);
  }
  if (sort === "appeared") {
    return copy.sort((a, b) => Date.parse(b.firstSeenAt) - Date.parse(a.firstSeenAt));
  }
  if (sort === "updated") {
    return copy.sort((a, b) => Date.parse(b.lastSeenAt) - Date.parse(a.lastSeenAt));
  }
  return copy.sort((a, b) => b.score - a.score);
}

async function keywordAppearsInSource(keywordId: string, sourceId: string) {
  const prisma = getPrisma();
  const count = await prisma.keywordMention.count({
    where: {
      keywordId,
      sourceId
    }
  });
  return count > 0;
}

function buildSentimentAnalysis(sentiment: Sentiment) {
  const presets = {
    positive: { positive: 68, neutral: 24, negative: 8, label: "偏正向" },
    neutral: { positive: 34, neutral: 52, negative: 14, label: "中性讨论" },
    negative: { positive: 18, neutral: 32, negative: 50, label: "偏负向" },
    mixed: { positive: 36, neutral: 28, negative: 36, label: "分歧明显" }
  };
  return presets[sentiment] ?? presets.neutral;
}
