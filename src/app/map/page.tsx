"use client";

import { useState } from "react";
import { RelationGraph } from "@/components/charts";
import { SourceLocaleToggle } from "@/components/source-locale-toggle";
import { EmptyState, ErrorState, Panel, SectionTitle, SkeletonBlock } from "@/components/ui";
import type { SourceLocale } from "@/lib/types";
import { useApi } from "@/hooks/use-api";

interface RelationData {
  nodes: Array<{ id: string; name: string; category: string; value: number }>;
  links: Array<{ source: string; target: string; value: number }>;
}

export default function MapPage() {
  const [locale, setLocale] = useState<SourceLocale>("all");
  const relations = useApi<RelationData>(`/api/relations?locale=${locale}`);

  return (
    <Panel>
      <SectionTitle
        title="热点关系图"
        eyebrow="Co-occurrence Map"
        action={<SourceLocaleToggle value={locale} onChange={setLocale} />}
      />
      {relations.loading ? (
        <SkeletonBlock className="h-[680px]" />
      ) : relations.error ? (
        <ErrorState message={relations.error} onRetry={relations.refetch} />
      ) : relations.data?.nodes.length ? (
        <RelationGraph data={relations.data} locale={locale} />
      ) : (
        <EmptyState title="暂无关系数据" />
      )}
    </Panel>
  );
}
