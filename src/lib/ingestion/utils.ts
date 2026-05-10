import { createHash } from "node:crypto";

const DEFAULT_TIMEOUT_MS = 10_000;

export async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json, application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
        "User-Agent": "FelixHotWordsRadar/1.0 (+https://hotwords.xiangfuxing.tech)",
        ...(init.headers ?? {})
      }
    });
  } finally {
    clearTimeout(timer);
  }
}

export function hashContent(parts: Array<string | null | undefined>) {
  return createHash("sha256")
    .update(parts.filter(Boolean).join("|").trim().toLowerCase())
    .digest("hex");
}

export function toDate(value: unknown) {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function normalizeWhitespace(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() || undefined;
}

export function stripHtml(value: string | null | undefined) {
  if (!value) return undefined;
  return normalizeWhitespace(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, "\"")
      .replace(/&#39;/g, "'")
  );
}

export function buildUrl(endpoint: string, base?: string) {
  if (/^https?:\/\//i.test(endpoint)) return new URL(endpoint);
  const root = base?.replace(/\/$/, "") || "";
  const path = endpoint.replace(/^\//, "");
  return new URL(`${root}/${path}`);
}

export function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

