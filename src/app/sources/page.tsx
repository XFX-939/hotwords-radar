"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { SourceLocaleToggle } from "@/components/source-locale-toggle";
import { EmptyState, ErrorState, Metric, Panel, SectionTitle, SkeletonBlock } from "@/components/ui";
import { formatChineseTime } from "@/lib/format";
import type { SourceLocale } from "@/lib/types";
import { useApi } from "@/hooks/use-api";

interface SourceResponse {
  stats: {
    enabledSourceCount: number;
    enabledZhSourceCount: number;
    enabledEnSourceCount: number;
    rawItemCount: number;
    keywordCount: number;
    lastFetchedAt: string | null;
    hasRealData: boolean;
  };
  sources: Array<{
    id: string;
    key: string;
    name: string;
    type: string;
    locale: string;
    endpoint: string;
    enabled: boolean;
    sourceWeight: number;
    lastFetchedAt: string | null;
    lastStatus: string;
    lastError: string | null;
  }>;
  logs: Array<{
    id: string;
    sourceName: string;
    sourceKey: string;
    startedAt: string;
    finishedAt: string | null;
    status: string;
    durationMs: number;
    itemCount: number;
    newItemCount: number;
    errorMessage: string | null;
  }>;
}

export default function SourcesPage() {
  const [locale, setLocale] = useState<SourceLocale>("all");
  const sources = useApi<SourceResponse>(`/api/sources?locale=${locale}`);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const [refreshTone, setRefreshTone] = useState<"neutral" | "success" | "risk">("neutral");

  async function refresh() {
    setRefreshing(true);
    setRefreshTone("neutral");
    setRefreshMessage("正在拉取合规公开数据源并写入数据库...");
    try {
      const response = await fetch("/api/jobs/ingest-hotwords", { method: "POST" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "刷新失败");
      setRefreshTone("success");
      setRefreshMessage(
        `刷新完成：成功 ${json.data.successCount} 个源，失败 ${json.data.failureCount} 个源，新增 ${json.data.insertedRawItemCount} 条内容`
      );
      await sources.refetch();
    } catch (error) {
      setRefreshTone("risk");
      setRefreshMessage(error instanceof Error ? error.message : "刷新失败");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_24rem]">
      <Panel>
        <SectionTitle
          title="数据源管理"
          eyebrow="Sources"
          action={
            <div className="flex flex-wrap justify-end gap-2">
              <SourceLocaleToggle value={locale} onChange={setLocale} />
              <button
                onClick={refresh}
                disabled={refreshing}
                className="btn-primary inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm disabled:opacity-60"
              >
                <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
                手动刷新
              </button>
            </div>
          }
        />
        {refreshMessage ? (
          <div className={`status-${refreshTone} mb-4 rounded-md border px-3 py-2 text-sm`}>
            {refreshMessage}
          </div>
        ) : null}
        {sources.data ? (
          <div className="mb-4 grid gap-3 md:grid-cols-4">
            <Metric label="启用数据源" value={sources.data.stats.enabledSourceCount} />
            <Metric label="RawItem" value={sources.data.stats.rawItemCount} />
            <Metric label="Keyword" value={sources.data.stats.keywordCount} />
            <Metric label="最近刷新" value={formatChineseTime(sources.data.stats.lastFetchedAt)} />
          </div>
        ) : null}
        {sources.loading ? (
          <SkeletonBlock className="h-96" />
        ) : sources.error ? (
          <ErrorState message={sources.error} onRetry={sources.refetch} />
        ) : sources.data?.sources.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {sources.data.sources.map((source) => (
              <div key={source.id} className="row-surface rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-primary font-semibold">{source.name}</h2>
                    <p className="text-muted mt-1 text-xs">
                      {source.type} · {source.locale === "zh" ? "中文源" : "英文源"} · 权重 {source.sourceWeight}
                    </p>
                  </div>
                  <span
                    className={`rounded-md border px-2 py-1 text-xs ${
                      source.lastStatus === "success"
                        ? "status-success"
                        : source.lastStatus === "idle" || source.lastStatus === "empty"
                          ? "status-neutral"
                        : "status-risk"
                    }`}
                  >
                    {source.enabled ? source.lastStatus : "disabled"}
                  </span>
                </div>
                <p className="text-muted mt-4 break-all text-xs">{source.endpoint}</p>
                <p className="text-secondary mt-3 text-xs">最近更新时间：{formatChineseTime(source.lastFetchedAt)}</p>
                {source.lastError ? <p className="mt-3 text-xs text-[color:var(--risk)]">{source.lastError}</p> : null}
                <button className="btn-secondary mt-4 inline-flex cursor-not-allowed rounded-md px-3 py-2 text-xs opacity-60" disabled>
                  单源刷新后续开放
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="暂无数据源" />
        )}
      </Panel>

      <Panel>
        <SectionTitle title="刷新日志" eyebrow="Logs" />
        <div className="space-y-3">
          {(sources.data?.logs ?? []).map((log) => (
            <div key={log.id} className="row-surface rounded-md p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-primary text-sm font-medium">{log.sourceName}</span>
                <span className="text-muted font-mono text-xs">{log.durationMs}ms</span>
              </div>
              <p className="text-secondary mt-2 text-xs">
                {formatChineseTime(log.startedAt)} · {log.status} · 拉取 {log.itemCount} / 新增 {log.newItemCount}
              </p>
              {log.errorMessage ? <p className="mt-2 text-xs text-[color:var(--risk)]">{log.errorMessage}</p> : null}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
