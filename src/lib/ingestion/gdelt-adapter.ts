import type { SourceAdapter } from "./types";
import { buildUrl, fetchWithTimeout, normalizeWhitespace, stripHtml, toDate } from "./utils";

type GdeltArticle = {
  url?: string;
  url_mobile?: string;
  title?: string;
  seendate?: string;
  socialimage?: string;
  domain?: string;
  language?: string;
  sourcecountry?: string;
};

type GdeltResponse = {
  articles?: GdeltArticle[];
};

export const gdeltAdapter: SourceAdapter = {
  sourceKey: "gdelt",
  async fetch(source) {
    const url = buildUrl(source.endpoint, process.env.GDELT_BASE_URL || "https://api.gdeltproject.org/api/v2");
    const response = await fetchWithTimeout(url.toString());
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`GDELT 请求失败：${response.status} ${text.slice(0, 120)}`);
    }
    let json: GdeltResponse;
    try {
      json = JSON.parse(text) as GdeltResponse;
    } catch {
      throw new Error(`GDELT 返回非 JSON 数据，可能正在限流：${text.slice(0, 120)}`);
    }

    return (json.articles ?? [])
      .map((article) => ({
        externalId: normalizeWhitespace(article.url),
        title: normalizeWhitespace(stripHtml(article.title)) ?? "",
        url: normalizeWhitespace(article.url || article.url_mobile),
        summary: normalizeWhitespace([article.domain, article.language, article.sourcecountry].filter(Boolean).join(" · ")),
        author: normalizeWhitespace(article.domain),
        publishedAt: toDate(article.seendate),
        rawJson: article
      }))
      .filter((item) => item.title);
  }
};
