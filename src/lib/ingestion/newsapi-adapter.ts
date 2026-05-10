import type { SourceAdapter } from "./types";
import { buildUrl, fetchWithTimeout, normalizeWhitespace, stripHtml, toDate } from "./utils";

type NewsApiArticle = {
  source?: { id?: string | null; name?: string | null };
  author?: string | null;
  title?: string | null;
  description?: string | null;
  url?: string | null;
  publishedAt?: string | null;
  content?: string | null;
};

type NewsApiResponse = {
  status: string;
  code?: string;
  message?: string;
  articles?: NewsApiArticle[];
};

export const newsApiAdapter: SourceAdapter = {
  sourceKey: "newsapi",
  async fetch(source) {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
      throw new Error("NEWS_API_KEY 未配置，NewsAPI 数据源已跳过");
    }

    const url = buildUrl(source.endpoint, "https://newsapi.org/v2");
    url.searchParams.set("apiKey", apiKey);
    if (!url.searchParams.has("pageSize")) url.searchParams.set("pageSize", "50");

    const response = await fetchWithTimeout(url.toString(), {
      headers: {
        "X-Api-Key": apiKey
      }
    });
    const json = (await response.json()) as NewsApiResponse;
    if (!response.ok || json.status !== "ok") {
      throw new Error(json.message || `NewsAPI 请求失败：${response.status}`);
    }

    return (json.articles ?? [])
      .map((article) => ({
        externalId: normalizeWhitespace(article.url || article.title || undefined),
        title: normalizeWhitespace(stripHtml(article.title ?? undefined)) ?? "",
        url: normalizeWhitespace(article.url ?? undefined),
        summary: stripHtml(article.description || article.content || undefined),
        author: normalizeWhitespace(article.author || article.source?.name || undefined),
        publishedAt: toDate(article.publishedAt),
        rawJson: article
      }))
      .filter((item) => item.title);
  }
};

