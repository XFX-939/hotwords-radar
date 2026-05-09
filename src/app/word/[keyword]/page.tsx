"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { TrendChart } from "@/components/charts";
import { EmptyState, ErrorState, KeywordLink, Metric, Panel, SectionTitle, SkeletonBlock, TrendBadge } from "@/components/ui";
import { formatChineseTime, formatScore, sentimentText } from "@/lib/format";
import { useApi } from "@/hooks/use-api";

interface KeywordDetail {
  word: string;
  category: string;
  score: number;
  rank: number;
  trend: string;
  sentiment: string;
  firstSeenAt: string;
  lastSeenAt: string;
  explanation: string;
  relatedKeywords: string[];
  sentimentAnalysis: {
    positive: number;
    neutral: number;
    negative: number;
    label: string;
  };
  creationSuggestions: string[];
  sources: Array<{
    id: string;
    sourceName: string;
    sourceType: string;
    title: string;
    url: string;
    summary: string | null;
    rank: number | null;
    hotValue: number | null;
    publishedAt: string | null;
    fetchedAt: string;
  }>;
}

export default function KeywordDetailPage() {
  const params = useParams<{ keyword: string }>();
  const keyword = params.keyword;
  const detail = useApi<KeywordDetail>(keyword ? `/api/keywords/${keyword}` : null);
  const trend = useApi<Array<{ time: string; score: number; rank: number; sourceCount: number; itemCount: number }>>(
    keyword ? `/api/keywords/${keyword}/trend` : null
  );

  if (detail.loading) {
    return <SkeletonBlock className="h-[720px]" />;
  }

  if (detail.error) {
    return <ErrorState message={detail.error} onRetry={detail.refetch} />;
  }

  if (!detail.data) {
    return <EmptyState title="热词不存在" />;
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-secondary mb-3 flex gap-2 text-sm">
            <Link href="/" className="link-primary inline-flex items-center gap-1">
              <ArrowLeft size={15} />
              首页
            </Link>
            <span>/</span>
            <Link href="/trending" className="link-primary">
              热点榜
            </Link>
          </div>
          <h1 className="text-primary text-3xl font-semibold sm:text-4xl">{detail.data.word}</h1>
          <p className="text-secondary mt-2 text-sm">
            {detail.data.category} · 首次出现 {formatChineseTime(detail.data.firstSeenAt)} · 最近更新{" "}
            {formatChineseTime(detail.data.lastSeenAt)}
          </p>
        </div>
        <TrendBadge trend={detail.data.trend} />
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="当前热度分" value={formatScore(detail.data.score)} />
        <Metric label="当前排名" value={`#${detail.data.rank}`} />
        <Metric label="分类" value={detail.data.category} />
        <Metric label="情绪" value={sentimentText(detail.data.sentiment)} hint={detail.data.sentimentAnalysis.label} />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_0.9fr]">
        <Panel>
          <SectionTitle title="热度趋势" eyebrow="Trend" />
          {trend.loading ? (
            <SkeletonBlock className="h-80" />
          ) : trend.data?.length ? (
            <TrendChart data={trend.data} height={320} />
          ) : (
            <EmptyState title="暂无趋势快照" />
          )}
        </Panel>

        <Panel>
          <SectionTitle title="为什么火" eyebrow="AI Explanation" />
          <p className="text-secondary text-sm leading-7">{detail.data.explanation}</p>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              ["正向", detail.data.sentimentAnalysis.positive],
              ["中性", detail.data.sentimentAnalysis.neutral],
              ["负向", detail.data.sentimentAnalysis.negative]
            ].map(([label, value]) => (
              <div key={label} className="row-surface rounded-md p-3">
                <p className="text-muted text-xs">{label}</p>
                <p className="text-primary mt-1 font-mono text-xl">{value}%</p>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Panel>
          <SectionTitle title="相关热词" />
          <div className="flex flex-wrap gap-2">
            {detail.data.relatedKeywords.length ? (
              detail.data.relatedKeywords.map((word) => (
                <KeywordLink key={word} word={word}>
                  <span className="btn-secondary inline-flex rounded-md px-3 py-1.5 text-sm">
                    {word}
                  </span>
                </KeywordLink>
              ))
            ) : (
              <EmptyState title="暂无关联词" />
            )}
          </div>
        </Panel>

        <Panel>
          <SectionTitle title="内容创作建议" />
          <div className="space-y-3">
            {detail.data.creationSuggestions.map((item) => (
              <div key={item} className="summary-card text-primary rounded-md p-3 text-sm leading-6">
                {item}
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <Panel className="mt-4">
        <SectionTitle title="相关内容来源" eyebrow="Sources" />
        <div className="grid gap-3 lg:grid-cols-2">
          {detail.data.sources.map((source) => (
            <a
              key={source.id}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="row-surface rounded-lg p-4 transition"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="status-neutral rounded-md border px-2 py-1 text-xs">
                  {source.sourceName} · {source.sourceType}
                </span>
                <ExternalLink size={15} className="text-[color:var(--muted-soft)]" />
              </div>
              <h2 className="text-primary line-clamp-2 font-medium">{source.title}</h2>
              <p className="text-secondary mt-2 line-clamp-2 text-sm leading-6">{source.summary}</p>
              <p className="text-muted mt-3 text-xs">
                排名 {source.rank ?? "-"} · 热度 {source.hotValue ?? "-"} · {formatChineseTime(source.publishedAt)}
              </p>
            </a>
          ))}
        </div>
      </Panel>
    </div>
  );
}
