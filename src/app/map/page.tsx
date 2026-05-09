"use client";

import { RelationGraph } from "@/components/charts";
import { EmptyState, ErrorState, Panel, SectionTitle, SkeletonBlock } from "@/components/ui";
import { useApi } from "@/hooks/use-api";

interface RelationData {
  nodes: Array<{ id: string; name: string; category: string; value: number }>;
  links: Array<{ source: string; target: string; value: number }>;
}

export default function MapPage() {
  const relations = useApi<RelationData>("/api/relations");

  return (
    <Panel>
      <SectionTitle title="热点关系图" eyebrow="Co-occurrence Map" />
      {relations.loading ? (
        <SkeletonBlock className="h-[680px]" />
      ) : relations.error ? (
        <ErrorState message={relations.error} onRetry={relations.refetch} />
      ) : relations.data?.nodes.length ? (
        <RelationGraph data={relations.data} />
      ) : (
        <EmptyState title="暂无关系数据" />
      )}
    </Panel>
  );
}
