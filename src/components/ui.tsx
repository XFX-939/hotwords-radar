import Link from "next/link";
import { AlertCircle, Inbox } from "lucide-react";
import { trendClass, trendText } from "@/lib/format";

export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`glass-panel w-full min-w-0 max-w-full overflow-hidden rounded-lg p-4 ${className}`}>{children}</section>;
}

export function SectionTitle({
  title,
  eyebrow,
  action
}: {
  title: string;
  eyebrow?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        {eyebrow ? <p className="eyebrow mb-1 text-xs uppercase tracking-[0.18em]">{eyebrow}</p> : null}
        <h2 className="text-primary text-lg font-semibold">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function SkeletonBlock({ className = "h-48" }: { className?: string }) {
  return <div className={`skeleton animate-pulse rounded-lg ${className}`} />;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="status-risk rounded-lg border p-4 text-sm">
      <div className="mb-3 flex items-center gap-2">
        <AlertCircle size={16} />
        <span>{message}</span>
      </div>
      {onRetry ? (
        <button onClick={onRetry} className="btn-secondary rounded-md px-3 py-1.5 text-xs">
          重试
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title = "暂无数据",
  description = "刷新后再看看。",
  action
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-secondary flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-[color:var(--line)] bg-[color:var(--panel-soft)] p-6 text-center">
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-md border border-[color:var(--line)] bg-[color:var(--panel-strong)] text-[color:var(--accent)]">
        <Inbox size={21} />
      </span>
      <p className="text-primary text-sm font-medium">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-5">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function TrendBadge({ trend }: { trend: string }) {
  return <span className={`inline-flex rounded-md border px-2 py-1 text-xs ${trendClass(trend)}`}>{trendText(trend)}</span>;
}

export function KeywordLink({ word, children }: { word: string; children?: React.ReactNode }) {
  return (
    <Link href={`/word/${encodeURIComponent(word)}`} className="link-primary font-medium">
      {children ?? word}
    </Link>
  );
}

export function Metric({
  label,
  value,
  hint
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div className="soft-panel min-w-0 rounded-lg p-3">
      <p className="text-secondary text-xs">{label}</p>
      <div className="text-primary mt-2 text-2xl font-semibold">{value}</div>
      {hint ? <div className="text-muted mt-1 text-xs">{hint}</div> : null}
    </div>
  );
}
