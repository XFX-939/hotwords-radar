"use client";

import { useState } from "react";
import { FilterBar } from "@/components/filters";
import { KeywordTable } from "@/components/keyword-table";
import { EmptyState, ErrorState, Panel, SectionTitle, SkeletonBlock } from "@/components/ui";
import type { KeywordListItem } from "@/lib/types";
import { useApi } from "@/hooks/use-api";

interface SourceResponse {
  sources: Array<{ id: string; name: string }>;
}

export default function TrendingPage() {
  const [range, setRange] = useState("7d");
  const [category, setCategory] = useState("全部");
  const [source, setSource] = useState("all");
  const [sort, setSort] = useState("heat");
  const [search, setSearch] = useState("");
  const query = `/api/trending?range=${range}&category=${encodeURIComponent(category)}&source=${source}&sort=${sort}&search=${encodeURIComponent(search)}`;
  const keywords = useApi<KeywordListItem[]>(query);
  const sources = useApi<SourceResponse>("/api/sources");

  return (
    <div>
      <FilterBar
        range={range}
        category={category}
        source={source}
        sort={sort}
        search={search}
        sources={sources.data?.sources ?? []}
        onRange={setRange}
        onCategory={setCategory}
        onSource={setSource}
        onSort={setSort}
        onSearch={setSearch}
      />
      <Panel>
        <SectionTitle title="热点榜单" eyebrow="Trending Table" />
        {keywords.loading ? (
          <SkeletonBlock className="h-[520px]" />
        ) : keywords.error ? (
          <ErrorState message={keywords.error} onRetry={keywords.refetch} />
        ) : keywords.data?.length ? (
          <KeywordTable items={keywords.data} />
        ) : (
          <EmptyState title="没有匹配的热词" description="试试调整分类、时间范围或搜索词。" />
        )}
      </Panel>
    </div>
  );
}
