"use client";

import dynamic from "next/dynamic";
import type { CSSProperties } from "react";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { categoryColor, chartThemeColors, formatChineseTime } from "@/lib/format";
import type { KeywordListItem } from "@/lib/types";

const ReactECharts = dynamic(async () => (await import("echarts-for-react")).default, { ssr: false });

export function WordCloudChart({ keywords }: { keywords: KeywordListItem[] }) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const mode = resolvedTheme === "dark" ? "dark" : "light";
  const visibleKeywords = useMemo(() => keywords.slice(0, 52), [keywords]);
  const maxScore = Math.max(...visibleKeywords.map((keyword) => keyword.score), 1);
  const minScore = Math.min(...visibleKeywords.map((keyword) => keyword.score), maxScore);

  return (
    <div className="word-cloud-surface min-h-[360px]" aria-label="今日热词词云">
      {visibleKeywords.map((keyword, index) => {
        const scoreRange = Math.max(maxScore - minScore, 1);
        const weight = (keyword.score - minScore) / scoreRange;
        const fontSize = Math.round(14 + weight * 30 + Math.max(0, 8 - index) * 1.2);
        return (
          <button
            key={keyword.id}
            type="button"
            title={`${keyword.word} · ${keyword.category} · 热度 ${Math.round(keyword.score)}`}
            onClick={() => router.push(`/word/${encodeURIComponent(keyword.word)}`)}
            className="word-cloud-token"
            style={{
              color: categoryColor(keyword.category, mode),
              "--word-size": `${fontSize}px`,
              fontWeight: index < 8 ? 800 : 700
            } as CSSProperties}
          >
            {keyword.word}
          </button>
        );
      })}
    </div>
  );
}

export function TrendChart({
  data,
  height = 280
}: {
  data: Array<{ time: string; score: number; rank?: number; sourceCount?: number; itemCount?: number }>;
  height?: number;
}) {
  const { resolvedTheme } = useTheme();
  const mode = resolvedTheme === "dark" ? "dark" : "light";
  const chartColors = useMemo(() => chartThemeColors(mode), [mode]);
  const option = useMemo(
    () => ({
      grid: { left: 36, right: 18, top: 24, bottom: 34 },
      tooltip: {
        trigger: "axis",
        backgroundColor: chartColors.tooltipBg,
        borderColor: chartColors.tooltipBorder,
        textStyle: { color: chartColors.tooltipText }
      },
      xAxis: {
        type: "category",
        data: data.map((item) => formatChineseTime(item.time)),
        axisLine: { lineStyle: { color: chartColors.grid } },
        axisLabel: { color: chartColors.axis }
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 100,
        splitLine: { lineStyle: { color: chartColors.grid } },
        axisLabel: { color: chartColors.axis }
      },
      series: [
        {
          name: "热度分",
          type: "line",
          smooth: true,
          symbolSize: 8,
          lineStyle: { width: 3, color: chartColors.accent },
          itemStyle: { color: chartColors.accent },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: chartColors.accentAreaTop },
                { offset: 1, color: chartColors.accentAreaBottom }
              ]
            }
          },
          data: data.map((item) => item.score)
        }
      ]
    }),
    [chartColors, data]
  );

  return <ReactECharts key={mode} option={option} notMerge style={{ height }} />;
}

export function RelationGraph({
  data
}: {
  data: {
    nodes: Array<{ id: string; name: string; category: string; value: number }>;
    links: Array<{ source: string; target: string; value: number }>;
  };
}) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const mode = resolvedTheme === "dark" ? "dark" : "light";
  const chartColors = useMemo(() => chartThemeColors(mode), [mode]);
  const categories = useMemo(
    () =>
      [...new Set(data.nodes.map((node) => node.category))].map((name) => ({
        name,
        itemStyle: { color: categoryColor(name, mode) }
      })),
    [data.nodes, mode]
  );
  const option = useMemo(
    () => ({
      tooltip: {
        backgroundColor: chartColors.tooltipBg,
        borderColor: chartColors.tooltipBorder,
        textStyle: { color: chartColors.tooltipText }
      },
      legend: {
        top: 0,
        textStyle: { color: chartColors.axis },
        data: categories.map((item) => item.name)
      },
      series: [
        {
          type: "graph",
          layout: "force",
          roam: true,
          top: 40,
          draggable: true,
          categories,
          label: { show: true, color: chartColors.label, fontSize: 12 },
          force: {
            repulsion: 240,
            edgeLength: [60, 180],
            gravity: 0.08
          },
          lineStyle: {
            color: chartColors.relationLine,
            width: 1.2,
            curveness: 0.18
          },
          emphasis: {
            focus: "adjacency",
            lineStyle: { width: 3 }
          },
          data: data.nodes.map((node) => ({
            id: node.id,
            name: node.name,
            value: node.value,
            category: categories.findIndex((category) => category.name === node.category),
            symbolSize: Math.max(18, Math.min(68, node.value * 0.72))
          })),
          links: data.links.map((link) => ({
            source: link.source,
            target: link.target,
            value: link.value,
            lineStyle: { width: Math.max(1, Math.min(5, link.value)) }
          }))
        }
      ]
    }),
    [categories, chartColors, data.links, data.nodes]
  );

  return (
    <ReactECharts
      key={mode}
      option={option}
      notMerge
      style={{ height: 680 }}
      onEvents={{
        click: (params: { dataType?: string; name?: string }) => {
          if (params.dataType === "node" && params.name) {
            router.push(`/word/${encodeURIComponent(params.name)}`);
          }
        }
      }}
    />
  );
}
