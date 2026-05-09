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

export const SOURCE_TYPES = ["热搜榜", "资讯流", "社区讨论", "创作平台"] as const;

export type TimeRange = (typeof TIME_RANGES)[number]["value"];
export type Category = (typeof CATEGORIES)[number];
export type TrendDirection = "rising" | "up" | "stable" | "down";
export type Sentiment = "positive" | "neutral" | "negative" | "mixed";

export interface KeywordSignal {
  word: string;
  normalizedWord: string;
  frequency: number;
}

export interface HotScoreInput {
  frequency: number;
  bestRank: number;
  sourceCount: number;
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
  status: "success" | "failed";
}
