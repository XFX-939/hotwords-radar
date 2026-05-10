import type { Sentiment, TrendDirection } from "./types";

export function formatChineseTime(value?: string | null) {
  if (!value) return "暂无";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(value));
}

export function formatChineseDate(value?: string | null) {
  if (!value) return "暂无日期";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date(value));
}

export function formatScore(score: number) {
  return Math.round(score).toString();
}

export function trendText(trend: TrendDirection | string) {
  const labels: Record<string, string> = {
    new: "新出现",
    rising: "飙升",
    up: "上升",
    stable: "平稳",
    down: "回落",
    falling: "快速回落"
  };
  return labels[trend] ?? "平稳";
}

export function trendClass(trend: TrendDirection | string) {
  const classes: Record<string, string> = {
    new: "status-success",
    rising: "status-hot",
    up: "status-success",
    stable: "status-neutral",
    down: "status-risk",
    falling: "status-risk"
  };
  return classes[trend] ?? classes.stable;
}

export function sentimentText(sentiment: Sentiment | string) {
  const labels: Record<string, string> = {
    positive: "偏正向",
    neutral: "中性",
    negative: "偏负向",
    mixed: "分歧"
  };
  return labels[sentiment] ?? "中性";
}

export type ThemeMode = "light" | "dark";

const categoryPalette: Record<string, { light: string; dark: string }> = {
  AI: { light: "#0891b2", dark: "#67e8f9" },
  科技: { light: "#2563eb", dark: "#60a5fa" },
  财经: { light: "#b45309", dark: "#fbbf24" },
  社会: { light: "#7c3aed", dark: "#c4b5fd" },
  娱乐: { light: "#db2777", dark: "#fda4af" },
  体育: { light: "#15803d", dark: "#4ade80" },
  国际: { light: "#c2410c", dark: "#fdba74" },
  职场: { light: "#0284c7", dark: "#38bdf8" },
  教育: { light: "#6d28d9", dark: "#a78bfa" }
};

export function categoryColor(category: string, mode: ThemeMode = "dark") {
  return categoryPalette[category]?.[mode] ?? (mode === "dark" ? "#cbd5e1" : "#475569");
}

export function chartThemeColors(mode: ThemeMode) {
  return mode === "dark"
    ? {
        tooltipBg: "rgba(15, 23, 42, 0.96)",
        tooltipText: "#f8fafc",
        tooltipBorder: "rgba(148, 163, 184, 0.18)",
        axis: "#94a3b8",
        grid: "rgba(148, 163, 184, 0.12)",
        label: "#e2e8f0",
        accent: "#38bdf8",
        accentAreaTop: "rgba(56, 189, 248, 0.28)",
        accentAreaBottom: "rgba(56, 189, 248, 0.02)",
        relationLine: "rgba(148, 163, 184, 0.38)"
      }
    : {
        tooltipBg: "rgba(255, 255, 255, 0.97)",
        tooltipText: "#0f172a",
        tooltipBorder: "#e2e8f0",
        axis: "#64748b",
        grid: "rgba(100, 116, 139, 0.14)",
        label: "#0f172a",
        accent: "#0284c7",
        accentAreaTop: "rgba(2, 132, 199, 0.18)",
        accentAreaBottom: "rgba(2, 132, 199, 0.02)",
        relationLine: "rgba(100, 116, 139, 0.28)"
      };
}
