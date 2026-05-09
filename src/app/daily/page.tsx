"use client";

import { useState } from "react";
import { Check, Clipboard, ImageDown } from "lucide-react";
import { EmptyState, ErrorState, Panel, SectionTitle, SkeletonBlock } from "@/components/ui";
import { formatChineseDate, formatChineseTime } from "@/lib/format";
import { useApi } from "@/hooks/use-api";

interface DailyResponse {
  date: string;
  title: string;
  summary: string;
  contentMarkdown: string;
  updatedAt: string;
}

export default function DailyPage() {
  const daily = useApi<DailyResponse>("/api/daily");
  const [copied, setCopied] = useState(false);

  async function copyMarkdown() {
    if (!daily.data) return;
    await navigator.clipboard.writeText(daily.data.contentMarkdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
      <Panel>
        <SectionTitle
          title={daily.data?.title ?? "AI 热点日报"}
          eyebrow="Daily Report"
          action={
            <div className="flex gap-2">
              <button
                onClick={copyMarkdown}
                className="btn-primary inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm"
              >
                {copied ? <Check size={15} /> : <Clipboard size={15} />}
                {copied ? "已复制" : "复制 Markdown"}
              </button>
              <button className="btn-secondary inline-flex cursor-not-allowed items-center gap-2 rounded-md px-3 py-2 text-sm opacity-60">
                <ImageDown size={15} />
                导出 PNG
              </button>
            </div>
          }
        />
        {daily.loading ? (
          <SkeletonBlock className="h-[620px]" />
        ) : daily.error ? (
          <ErrorState message={daily.error} onRetry={daily.refetch} />
        ) : daily.data ? (
          <article className="max-w-none">
            <pre className="markdown-panel whitespace-pre-wrap rounded-lg p-5 text-sm leading-7">
              {daily.data.contentMarkdown}
            </pre>
          </article>
        ) : (
          <EmptyState title="暂无日报" />
        )}
      </Panel>
      <div className="space-y-4">
        <Panel>
          <SectionTitle title="日报信息" />
          <div className="text-secondary space-y-3 text-sm">
            <div>
              <p className="text-muted text-xs">日期</p>
              <p className="text-primary">{formatChineseDate(daily.data?.date)}</p>
            </div>
            <div>
              <p className="text-muted text-xs">更新时间</p>
              <p className="text-primary">{formatChineseTime(daily.data?.updatedAt)}</p>
            </div>
          </div>
        </Panel>
        <Panel>
          <SectionTitle title="一句话总结" />
          <p className="text-secondary text-sm leading-6">{daily.data?.summary ?? "等待日报生成。"}</p>
        </Panel>
      </div>
    </div>
  );
}
