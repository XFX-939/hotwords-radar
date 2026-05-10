import { gdeltAdapter } from "./gdelt-adapter";
import { githubApiAdapter } from "./github-api-adapter";
import { newsApiAdapter } from "./newsapi-adapter";
import { rssAdapter } from "./rss-adapter";
import type { SourceAdapter, SourceType } from "./types";

const adapters: Record<SourceType, SourceAdapter> = {
  rss: rssAdapter,
  newsapi: newsApiAdapter,
  gdelt: gdeltAdapter,
  github_api: githubApiAdapter
};

export function getAdapter(type: string) {
  return adapters[type as SourceType];
}

