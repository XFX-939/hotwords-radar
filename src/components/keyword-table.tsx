import { formatChineseTime, formatScore, sentimentText } from "@/lib/format";
import type { KeywordListItem } from "@/lib/types";
import { KeywordLink, TrendBadge } from "./ui";

export function KeywordTable({ items }: { items: KeywordListItem[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[860px] w-full border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-secondary text-xs">
            {["排名", "热词", "分类", "综合热度分", "趋势", "来源数", "首次出现", "最近更新", "操作"].map((head) => (
              <th key={head} className="table-divider border-b px-3 py-3 font-medium">
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="group transition hover:bg-[color:var(--accent-soft)]">
              <td className="table-divider text-secondary border-b px-3 py-3 font-mono">#{item.rank}</td>
              <td className="table-divider border-b px-3 py-3">
                <KeywordLink word={item.word} locale={item.locale} />
                <div className="text-muted mt-1 text-xs">{sentimentText(item.sentiment)}</div>
              </td>
              <td className="table-divider text-secondary border-b px-3 py-3">{item.category}</td>
              <td className="table-divider text-primary border-b px-3 py-3 font-mono text-lg">
                {formatScore(item.score)}
              </td>
              <td className="table-divider border-b px-3 py-3">
                <TrendBadge trend={item.trend} />
              </td>
              <td className="table-divider text-secondary border-b px-3 py-3">{item.sourceCount}</td>
              <td className="table-divider text-secondary border-b px-3 py-3">
                {formatChineseTime(item.firstSeenAt)}
              </td>
              <td className="table-divider text-secondary border-b px-3 py-3">
                {formatChineseTime(item.lastSeenAt)}
              </td>
              <td className="table-divider border-b px-3 py-3">
                <KeywordLink word={item.word} locale={item.locale}>
                  <span className="btn-secondary inline-flex rounded-md px-2.5 py-1 text-xs">
                    详情
                  </span>
                </KeywordLink>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CompactRanking({ items, limit = 10 }: { items: KeywordListItem[]; limit?: number }) {
  return (
    <div className="space-y-2">
      {items.slice(0, limit).map((item) => (
        <div
          key={item.id}
          className="row-surface grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 rounded-md p-2.5"
        >
          <span className="text-muted font-mono text-xs">#{item.rank}</span>
          <div className="min-w-0">
            <KeywordLink word={item.word} locale={item.locale}>
              <span className="block truncate text-sm">{item.word}</span>
            </KeywordLink>
            <span className="text-muted text-xs">{item.category}</span>
          </div>
          <div className="text-right">
            <div className="text-primary font-mono text-sm">{formatScore(item.score)}</div>
            <div className="mt-1">
              <TrendBadge trend={item.trend} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
