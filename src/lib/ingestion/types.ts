import type { Source } from "@prisma/client";

export type RawSourceItem = {
  externalId?: string;
  title: string;
  url?: string;
  summary?: string;
  author?: string;
  publishedAt?: Date;
  rawJson?: unknown;
};

export interface SourceAdapter {
  sourceKey: string;
  fetch(source: Source): Promise<RawSourceItem[]>;
}

export type SourceType = "rss" | "newsapi" | "gdelt" | "github_api";

