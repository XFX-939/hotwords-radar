import { getPrisma } from "./db";
import { buildMockRawItems, mockSources } from "./mock-data";
import {
  analyzeSentiment,
  calculateHotScore,
  classifyKeyword,
  extractKeywords,
  generateDailyReport,
  inferTrend,
  normalizeWord
} from "./pipeline";
import type { RefreshResult, ReportKeyword } from "./types";

interface RefreshOptions {
  trigger: string;
}

interface KeywordAggregate {
  word: string;
  normalizedWord: string;
  frequency: number;
  bestRank: number;
  sourceIds: Set<string>;
  itemCount: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
  context: string[];
}

export async function fetchSources(now = new Date()) {
  return {
    sources: mockSources,
    items: buildMockRawItems(now)
  };
}

export async function runRefreshPipeline(options: RefreshOptions): Promise<RefreshResult> {
  const prisma = getPrisma();
  const startedAt = new Date();
  const started = Date.now();
  const log = await prisma.fetchLog.create({
    data: {
      startedAt,
      status: "running",
      message: `Refresh started by ${options.trigger}`
    }
  });

  try {
    const now = new Date();
    const fetched = await fetchSources(now);
    const sourceByName = new Map<string, string>();

    for (const source of fetched.sources) {
      const record = await prisma.source.upsert({
        where: {
          name_url: {
            name: source.name,
            url: source.url
          }
        },
        create: {
          ...source,
          status: "ok",
          lastFetchedAt: now
        },
        update: {
          type: source.type,
          enabled: source.enabled,
          status: "ok",
          lastFetchedAt: now
        }
      });
      sourceByName.set(source.name, record.id);
    }

    const aggregates = new Map<string, KeywordAggregate>();
    let rawItemCount = 0;

    for (const item of fetched.items) {
      const sourceId = sourceByName.get(item.sourceName);
      if (!sourceId) continue;

      const rawItem = await prisma.rawItem.create({
        data: {
          sourceId,
          title: item.title,
          url: item.url,
          summary: item.summary,
          rank: item.rank,
          hotValue: item.hotValue,
          publishedAt: item.publishedAt,
          fetchedAt: now,
          rawJson: JSON.stringify({
            categoryHint: item.categoryHint,
            sourceName: item.sourceName,
            trigger: options.trigger
          })
        }
      });
      rawItemCount += 1;

      const signals = extractKeywords([item.title, item.summary]).slice(0, 10);
      for (const signal of signals) {
        const current = aggregates.get(signal.normalizedWord) ?? {
          word: signal.word,
          normalizedWord: signal.normalizedWord,
          frequency: 0,
          bestRank: item.rank,
          sourceIds: new Set<string>(),
          itemCount: 0,
          firstSeenAt: item.publishedAt,
          lastSeenAt: item.publishedAt,
          context: []
        };
        current.frequency += signal.frequency;
        current.bestRank = Math.min(current.bestRank, item.rank);
        current.sourceIds.add(sourceId);
        current.itemCount += 1;
        current.firstSeenAt = new Date(Math.min(current.firstSeenAt.getTime(), item.publishedAt.getTime()));
        current.lastSeenAt = new Date(Math.max(current.lastSeenAt.getTime(), item.publishedAt.getTime()));
        current.context.push(`${rawItem.title} ${rawItem.summary ?? ""}`);
        aggregates.set(signal.normalizedWord, current);
      }
    }

    const previousRecords = await prisma.keyword.findMany({
      include: {
        snapshots: {
          orderBy: { snapshotTime: "desc" },
          take: 1
        }
      }
    });
    const previousByWord = new Map(previousRecords.map((item) => [item.normalizedWord, item]));
    const computed = [...aggregates.values()]
      .map((aggregate) => {
        const score = calculateHotScore({
          frequency: aggregate.frequency,
          bestRank: aggregate.bestRank,
          sourceCount: aggregate.sourceIds.size,
          latestSeenAt: aggregate.lastSeenAt
        });
        const previous = previousByWord.get(aggregate.normalizedWord);
        const previousScore = previous?.snapshots[0]?.score ?? null;
        const context = aggregate.context.join(" ");
        return {
          aggregate,
          score,
          trend: inferTrend(previousScore, score),
          category: classifyKeyword(aggregate.word, context),
          sentiment: analyzeSentiment(aggregate.word, context)
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 80);

    await prisma.keyword.updateMany({
      where: {
        normalizedWord: {
          notIn: computed.map((item) => item.aggregate.normalizedWord)
        }
      },
      data: {
        score: 1,
        trend: "down"
      }
    });

    const keywordIds = new Map<string, string>();
    for (const [index, item] of computed.entries()) {
      const previous = previousByWord.get(item.aggregate.normalizedWord);
      const keyword = await prisma.keyword.upsert({
        where: { normalizedWord: item.aggregate.normalizedWord },
        create: {
          word: item.aggregate.word,
          normalizedWord: item.aggregate.normalizedWord,
          category: item.category,
          score: item.score,
          trend: item.trend,
          sentiment: item.sentiment,
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
          itemCount: item.aggregate.itemCount,
          snapshotTime: now
        }
      });
    }

    const relationWeights = buildRelationWeights(fetched.items.map((item) => `${item.title} ${item.summary}`));
    let relationCount = 0;
    for (const relation of relationWeights) {
      const keywordAId = keywordIds.get(relation.a);
      const keywordBId = keywordIds.get(relation.b);
      if (!keywordAId || !keywordBId || keywordAId === keywordBId) continue;
      await prisma.keywordRelation.upsert({
        where: {
          keywordAId_keywordBId_relationType: {
            keywordAId,
            keywordBId,
            relationType: "co_occurrence"
          }
        },
        create: {
          keywordAId,
          keywordBId,
          relationType: "co_occurrence",
          weight: relation.weight
        },
        update: {
          weight: { increment: relation.weight }
        }
      });
      relationCount += 1;
    }

    const topKeywords: ReportKeyword[] = computed.slice(0, 20).map((item) => ({
      word: item.aggregate.word,
      category: item.category,
      score: item.score,
      trend: item.trend
    }));
    const risingKeywords = topKeywords.filter((item) => item.trend === "rising" || item.trend === "up");
    const date = formatDateKey(now);
    const report = generateDailyReport({ date, topKeywords, risingKeywords });

    await prisma.dailyReport.upsert({
      where: { date },
      create: {
        date,
        title: report.title,
        summary: report.summary,
        contentMarkdown: report.contentMarkdown
      },
      update: {
        title: report.title,
        summary: report.summary,
        contentMarkdown: report.contentMarkdown
      }
    });

    const durationMs = Date.now() - started;
    await prisma.fetchLog.update({
      where: { id: log.id },
      data: {
        status: "success",
        finishedAt: new Date(),
        successCount: rawItemCount,
        failureCount: 0,
        durationMs,
        message: `Refresh completed with ${computed.length} keywords`
      }
    });

    return {
      trigger: options.trigger,
      sourceCount: fetched.sources.length,
      rawItemCount,
      keywordCount: computed.length,
      relationCount,
      durationMs,
      status: "success"
    };
  } catch (error) {
    const durationMs = Date.now() - started;
    await prisma.fetchLog.update({
      where: { id: log.id },
      data: {
        status: "failed",
        finishedAt: new Date(),
        failureCount: 1,
        durationMs,
        error: error instanceof Error ? error.message : String(error)
      }
    });
    throw error;
  }
}

function buildRelationWeights(texts: string[]) {
  const weights = new Map<string, { a: string; b: string; weight: number }>();

  for (const text of texts) {
    const signals = extractKeywords([text])
      .slice(0, 6)
      .map((item) => normalizeWord(item.word));
    const unique = [...new Set(signals)].sort();
    for (let i = 0; i < unique.length; i += 1) {
      for (let j = i + 1; j < unique.length; j += 1) {
        const key = `${unique[i]}::${unique[j]}`;
        const current = weights.get(key) ?? { a: unique[i], b: unique[j], weight: 0 };
        current.weight += 1;
        weights.set(key, current);
      }
    }
  }

  return [...weights.values()].sort((a, b) => b.weight - a.weight).slice(0, 120);
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
