"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { EmptyState, ErrorState, Panel, SectionTitle, SkeletonBlock } from "@/components/ui";
import { formatChineseTime } from "@/lib/format";
import { useApi } from "@/hooks/use-api";

interface SourceResponse {
  sources: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
    enabled: boolean;
    lastFetchedAt: string | null;
    status: string;
  }>;
  logs: Array<{
    id: string;
    startedAt: string;
    finishedAt: string | null;
    status: string;
    successCount: number;
    failureCount: number;
    durationMs: number;
    message: string | null;
    error: string | null;
  }>;
}

export default function SourcesPage() {
  const sources = useApi<SourceResponse>("/api/sources");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const [refreshTone, setRefreshTone] = useState<"neutral" | "success" | "risk">("neutral");

  async function refresh() {
    setRefreshing(true);
    setRefreshTone("neutral");
    setRefreshMessage("正在抓取 mock 数据源并写入数据库...");
    try {
      const response = await fetch("/api/refresh", { method: "POST" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "刷新失败");
      setRefreshTone("success");
      setRefreshMessage(`刷新完成：${json.data.keywordCount} 个热词，${json.data.rawItemCount} 条内容`);
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
            <button
              onClick={refresh}
              disabled={refreshing}
              className="btn-primary inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm disabled:opacity-60"
            >
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
              手动刷新
            </button>
          }
        />
        {refreshMessage ? (
          <div className={`status-${refreshTone} mb-4 rounded-md border px-3 py-2 text-sm`}>
            {refreshMessage}
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
                    <p className="text-muted mt-1 text-xs">{source.type}</p>
                  </div>
                  <span
                    className={`rounded-md border px-2 py-1 text-xs ${
                      source.status === "ok"
                        ? "status-success"
                        : "status-risk"
                    }`}
                  >
                    {source.status}
                  </span>
                </div>
                <p className="text-muted mt-4 break-all text-xs">{source.url}</p>
                <p className="text-secondary mt-3 text-xs">最近更新时间：{formatChineseTime(source.lastFetchedAt)}</p>
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
                <span className="text-primary text-sm font-medium">{log.status}</span>
                <span className="text-muted font-mono text-xs">{log.durationMs}ms</span>
              </div>
              <p className="text-secondary mt-2 text-xs">
                {formatChineseTime(log.startedAt)} · 成功 {log.successCount} / 失败 {log.failureCount}
              </p>
              {log.message ? <p className="text-muted mt-2 text-xs">{log.message}</p> : null}
              {log.error ? <p className="mt-2 text-xs text-[color:var(--risk)]">{log.error}</p> : null}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
