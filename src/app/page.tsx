"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Database, RadioTower, RefreshCw, Sparkles } from "lucide-react";
import { WordCloudChart, TrendChart } from "@/components/charts";
import { FilterBar } from "@/components/filters";
import { CompactRanking, KeywordTable } from "@/components/keyword-table";
import { EmptyState, ErrorState, Metric, Panel, SectionTitle, SkeletonBlock } from "@/components/ui";
import { formatChineseTime } from "@/lib/format";
import type { KeywordListItem } from "@/lib/types";
import { useApi } from "@/hooks/use-api";

interface SourceResponse {
  sources: Array<{ id: string; name: string; status: string; type: string; lastFetchedAt: string | null }>;
}

interface DailyResponse {
  title: string;
  summary: string;
  contentMarkdown: string;
  updatedAt: string;
}

export default function HomePage() {
  const [range, setRange] = useState("24h");
  const [category, setCategory] = useState("全部");
  const [source, setSource] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const query = `/api/keywords?range=${range}&category=${encodeURIComponent(category)}&source=${source}&sort=heat&limit=80`;
  const keywords = useApi<KeywordListItem[]>(query);
  const sources = useApi<SourceResponse>("/api/sources");
  const daily = useApi<DailyResponse>("/api/daily");
  const focusWord = keywords.data?.[0]?.word;
  const trend = useApi<Array<{ time: string; score: number }>>(
    focusWord ? `/api/keywords/${encodeURIComponent(focusWord)}/trend` : null
  );

  const rising = useMemo(
    () => (keywords.data ?? []).filter((item) => item.trend === "rising" || item.trend === "up").slice(0, 10),
    [keywords.data]
  );
  const categoryCards = useMemo(() => {
    const groups = new Map<string, KeywordListItem[]>();
    for (const item of keywords.data ?? []) {
      groups.set(item.category, [...(groups.get(item.category) ?? []), item]);
    }
    return [...groups.entries()].slice(0, 8);
  }, [keywords.data]);

  async function refreshAll() {
    setRefreshing(true);
    try {
      await fetch("/api/refresh", { method: "POST" });
      await Promise.all([keywords.refetch(), sources.refetch(), daily.refetch(), trend.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }

  const renderRefreshAction = () => (
    <button onClick={refreshAll} disabled={refreshing} className="btn-secondary inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs">
      <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
      {refreshing ? "刷新中" : "点击刷新获取最新热点"}
    </button>
  );

  return (
    <div>
      <FilterBar
        range={range}
        category={category}
        source={source}
        sources={sources.data?.sources ?? []}
        onRange={setRange}
        onCategory={setCategory}
        onSource={setSource}
      />

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.6fr_0.95fr]">
        <Panel className="min-h-[380px] lg:min-h-[460px]">
          <SectionTitle title="今日热点摘要" eyebrow="AI Brief" />
          {daily.loading ? (
            <SkeletonBlock className="h-48" />
          ) : daily.error ? (
            <ErrorState message={daily.error} onRetry={daily.refetch} />
          ) : daily.data ? (
            <div className="space-y-5">
              <div className="summary-card rounded-lg p-4">
                <Sparkles className="mb-3 text-[color:var(--accent)]" size={22} />
                <p className="text-primary break-all text-base font-semibold leading-relaxed sm:text-lg">{daily.data.summary}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Metric label="热词总量" value={keywords.data?.length ?? "-"} hint="数据库读取" />
                <Metric label="数据源" value={sources.data?.sources.length ?? "-"} hint="mock pipeline" />
              </div>
              <p className="text-muted text-xs">最近生成：{formatChineseTime(daily.data.updatedAt)}</p>
            </div>
          ) : (
            <EmptyState description="日报尚未生成，可以先刷新数据源。" action={renderRefreshAction()} />
          )}
        </Panel>

        <Panel className="min-h-[420px] p-4 lg:min-h-[460px]">
          <div className="mb-2 flex items-center justify-between px-1">
            <div>
              <p className="eyebrow text-xs uppercase tracking-[0.2em]">Word Cloud</p>
              <h1 className="text-primary mt-1 text-2xl font-semibold">今日互联网在关注什么</h1>
            </div>
            <Link href="/trending" className="btn-secondary hidden items-center gap-1 rounded-md px-3 py-2 text-sm sm:flex">
              全部榜单 <ArrowUpRight size={15} />
            </Link>
          </div>
          {keywords.loading ? (
            <SkeletonBlock className="h-[360px]" />
          ) : keywords.error ? (
            <ErrorState message={keywords.error} onRetry={keywords.refetch} />
          ) : keywords.data?.length ? (
            <WordCloudChart keywords={keywords.data} />
          ) : (
            <EmptyState title="词云暂无数据" description="数据库里还没有可展示的热词。" action={renderRefreshAction()} />
          )}
        </Panel>

        <Panel className="min-h-[380px] lg:min-h-[460px]">
          <SectionTitle title="飙升热词 Top 10" eyebrow="Rising" />
          {keywords.loading ? (
            <SkeletonBlock className="h-72" />
          ) : rising.length ? (
            <CompactRanking items={rising} />
          ) : (
            <EmptyState
              title="暂无飙升热词"
              description="当前时间范围内还没有明显上升的热词。"
              action={renderRefreshAction()}
            />
          )}
        </Panel>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Panel>
          <SectionTitle title="今日热词榜 Top 20" eyebrow="Ranking" action={<Link className="link-primary text-sm" href="/trending">查看全部</Link>} />
          {keywords.loading ? (
            <SkeletonBlock className="h-96" />
          ) : keywords.data?.length ? (
            <KeywordTable items={keywords.data.slice(0, 20)} />
          ) : (
            <EmptyState />
          )}
        </Panel>

        <div className="space-y-4">
          <Panel>
            <SectionTitle title={focusWord ? `${focusWord} 热度趋势` : "热度趋势"} eyebrow="Trend" />
            {trend.loading ? (
              <SkeletonBlock className="h-72" />
            ) : trend.data?.length ? (
              <TrendChart data={trend.data} />
            ) : (
              <EmptyState title="暂无趋势数据" />
            )}
          </Panel>
          <Panel>
            <SectionTitle title="数据源状态" eyebrow="Sources" />
            <div className="space-y-2">
              {(sources.data?.sources ?? []).map((item) => (
                <div key={item.id} className="row-surface flex items-center justify-between rounded-md p-3">
                  <div className="min-w-0">
                    <div className="text-primary flex items-center gap-2 text-sm">
                      <Database size={15} className="text-[color:var(--muted-soft)]" />
                      {item.name}
                    </div>
                    <p className="text-muted mt-1 text-xs">{item.type} · {formatChineseTime(item.lastFetchedAt)}</p>
                  </div>
                  <span className="status-success inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs">
                    <RadioTower size={12} />
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {categoryCards.map(([name, items]) => (
          <Panel key={name} className="min-h-40">
            <SectionTitle title={`${name}热点`} />
            <CompactRanking items={items.slice(0, 4)} limit={4} />
          </Panel>
        ))}
      </section>
    </div>
  );
}
