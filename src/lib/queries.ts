import { getPrisma } from "./db";
import { buildKeywordExplanation, buildCreationSuggestions, normalizeWord } from "./pipeline";
import { runRefreshPipeline } from "./refresh";
import type { KeywordListItem, TimeRange, TrendDirection, Sentiment } from "./types";

interface KeywordQuery {
  range?: string;
  category?: string;
  source?: string;
  sort?: string;
  search?: string;
  limit?: number;
}

export async function ensureInitialData() {
  const prisma = getPrisma();
  const count = await prisma.keyword.count();
  if (count === 0) {
    await runRefreshPipeline({ trigger: "dev-initial-seed" });
  }
}

export async function getKeywordList(query: KeywordQuery = {}): Promise<KeywordListItem[]> {
  await ensureInitialData();
  const prisma = getPrisma();
  const since = getRangeStart((query.range as TimeRange) || "24h");
  const sourceId = query.source && query.source !== "all" ? query.source : undefined;

  const keywords = await prisma.keyword.findMany({
    where: {
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
    const checks = await Promise.all(keywords.map((keyword) => keywordAppearsInSource(keyword.word, sourceId)));
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

export async function getSources() {
  await ensureInitialData();
  const prisma = getPrisma();
  const [sources, logs] = await Promise.all([
    prisma.source.findMany({ orderBy: [{ enabled: "desc" }, { name: "asc" }] }),
    prisma.fetchLog.findMany({ orderBy: { startedAt: "desc" }, take: 8 })
  ]);

  return {
    sources: sources.map((source) => ({
      id: source.id,
      name: source.name,
      type: source.type,
      url: source.url,
      enabled: source.enabled,
      lastFetchedAt: source.lastFetchedAt?.toISOString() ?? null,
      status: source.status,
      createdAt: source.createdAt.toISOString(),
      updatedAt: source.updatedAt.toISOString()
    })),
    logs: logs.map((log) => ({
      id: log.id,
      startedAt: log.startedAt.toISOString(),
      finishedAt: log.finishedAt?.toISOString() ?? null,
      status: log.status,
      successCount: log.successCount,
      failureCount: log.failureCount,
      durationMs: log.durationMs,
      message: log.message,
      error: log.error
    }))
  };
}

export async function getKeywordDetail(keywordParam: string) {
  await ensureInitialData();
  const prisma = getPrisma();
  const decoded = decodeURIComponent(keywordParam);
  const normalized = normalizeWord(decoded);
  const keyword = await prisma.keyword.findFirst({
    where: {
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
  const rawItems = await prisma.rawItem.findMany({
    where: {
      OR: [{ title: { contains: keyword.word } }, { summary: { contains: keyword.word } }]
    },
    include: { source: true },
    orderBy: { fetchedAt: "desc" },
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
    sources: rawItems.map((item) => ({
      id: item.id,
      sourceName: item.source.name,
      sourceType: item.source.type,
      title: item.title,
      url: item.url,
      summary: item.summary,
      rank: item.rank,
      hotValue: item.hotValue,
      publishedAt: item.publishedAt?.toISOString() ?? null,
      fetchedAt: item.fetchedAt.toISOString()
    }))
  };
}

export async function getKeywordTrend(keywordParam: string) {
  await ensureInitialData();
  const prisma = getPrisma();
  const normalized = normalizeWord(decodeURIComponent(keywordParam));
  const keyword = await prisma.keyword.findFirst({
    where: { normalizedWord: normalized },
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

export async function getRelations() {
  await ensureInitialData();
  const prisma = getPrisma();
  const keywords = await prisma.keyword.findMany({
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

export async function getDailyReport() {
  await ensureInitialData();
  const prisma = getPrisma();
  const report = await prisma.dailyReport.findFirst({
    orderBy: { date: "desc" }
  });
  return report
    ? {
        id: report.id,
        date: report.date,
        title: report.title,
        summary: report.summary,
        contentMarkdown: report.contentMarkdown,
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString()
      }
    : null;
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
  const trendScore: Record<string, number> = { rising: 4, up: 3, stable: 2, down: 1 };
  const copy = [...items];
  if (sort === "growth") {
    return copy.sort((a, b) => trendScore[b.trend] - trendScore[a.trend] || b.score - a.score);
  }
  if (sort === "appeared") {
    return copy.sort((a, b) => Date.parse(b.firstSeenAt) - Date.parse(a.firstSeenAt));
  }
  if (sort === "updated") {
    return copy.sort((a, b) => Date.parse(b.lastSeenAt) - Date.parse(a.lastSeenAt));
  }
  return copy.sort((a, b) => b.score - a.score);
}

async function keywordAppearsInSource(word: string, sourceId: string) {
  const prisma = getPrisma();
  const count = await prisma.rawItem.count({
    where: {
      sourceId,
      OR: [{ title: { contains: word } }, { summary: { contains: word } }]
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
