export const TIME_RANGES = [
  { label: "今日", value: "today" },
  { label: "近24小时", value: "24h" },
  { label: "近3天", value: "3d" },
  { label: "近7天", value: "7d" }
] as const;

export const CATEGORIES = [
  "全部",
  "科技",
  "财经",
  "社会",
  "娱乐",
  "体育",
  "国际",
  "AI",
  "职场",
  "教育"
] as const;

export const SOURCE_TYPES = ["rss", "newsapi", "gdelt", "github_api"] as const;
export const SOURCE_LOCALES = [
  { label: "全部来源", value: "all" },
  { label: "中文信息源", value: "zh" },
  { label: "英文信息源", value: "en" }
] as const;

export type TimeRange = (typeof TIME_RANGES)[number]["value"];
export type Category = (typeof CATEGORIES)[number];
export type SourceLocale = (typeof SOURCE_LOCALES)[number]["value"];
export type TrendDirection = "rising" | "up" | "stable" | "down" | "new" | "falling";
export type Sentiment = "positive" | "neutral" | "negative" | "mixed";

export interface KeywordSignal {
  word: string;
  normalizedWord: string;
  frequency: number;
}

export interface HotScoreInput {
  frequency: number;
  sourceWeight: number;
  sourceCount: number;
  itemCount: number;
  latestSeenAt: Date;
}

export interface ReportKeyword {
  word: string;
  category: string;
  score: number;
  trend: string;
}

export interface DailyReportInput {
  date: string;
  topKeywords: ReportKeyword[];
  risingKeywords: ReportKeyword[];
}

export interface KeywordListItem {
  id: string;
  rank: number;
  word: string;
  normalizedWord: string;
  category: string;
  score: number;
  trend: TrendDirection;
  sentiment: Sentiment;
  locale: SourceLocale;
  sourceCount: number;
  itemCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface RefreshResult {
  trigger: string;
  sourceCount: number;
  rawItemCount: number;
  keywordCount: number;
  relationCount: number;
  durationMs: number;
  status: "success" | "partial_success" | "failed";
}

export interface DataStats {
  enabledSourceCount: number;
  enabledZhSourceCount: number;
  enabledEnSourceCount: number;
  rawItemCount: number;
  keywordCount: number;
  lastFetchedAt: string | null;
  hasRealData: boolean;
  fallbackMode: boolean;
}

export interface IngestionSourceResult {
  sourceKey: string;
  sourceName: string;
  status: "success" | "empty" | "failed" | "skipped";
  fetched: number;
  inserted: number;
  error: string | null;
}

export interface IngestionResult {
  status: "success" | "partial_success" | "failed";
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  sourceCount: number;
  successCount: number;
  failureCount: number;
  insertedRawItemCount: number;
  updatedKeywordCount: number;
  snapshotCount: number;
  sources: IngestionSourceResult[];
  keywords: {
    created: number;
    updated: number;
    snapshots: number;
  };
}
