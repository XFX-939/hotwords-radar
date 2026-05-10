import Parser from "rss-parser";
import type { SourceAdapter } from "./types";
import { normalizeWhitespace, stripHtml, toDate } from "./utils";

type FeedItem = {
  guid?: string;
  id?: string;
  link?: string;
  title?: string;
  content?: string;
  contentSnippet?: string;
  summary?: string;
  creator?: string;
  author?: string;
  isoDate?: string;
  pubDate?: string;
};

const parser = new Parser<Record<string, unknown>, FeedItem>({
  timeout: 10_000,
  headers: {
    "User-Agent": "FelixHotWordsRadar/1.0 (+https://hotwords.xiangfuxing.tech)"
  }
});

export const rssAdapter: SourceAdapter = {
  sourceKey: "rss",
  async fetch(source) {
    const feed = await parser.parseURL(source.endpoint);
    return (feed.items ?? [])
      .map((item) => ({
        externalId: normalizeWhitespace(item.guid || item.id || item.link),
        title: normalizeWhitespace(stripHtml(item.title)) ?? "",
        url: normalizeWhitespace(item.link),
        summary: stripHtml(item.contentSnippet || item.summary || item.content),
        author: normalizeWhitespace(item.creator || item.author),
        publishedAt: toDate(item.isoDate || item.pubDate),
        rawJson: item
      }))
      .filter((item) => item.title);
  }
};

