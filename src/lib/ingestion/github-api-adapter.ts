import type { SourceAdapter } from "./types";
import { buildUrl, fetchWithTimeout, formatDate, normalizeWhitespace, stripHtml, toDate } from "./utils";

type GitHubRepository = {
  id: number;
  node_id?: string;
  full_name: string;
  html_url: string;
  description?: string | null;
  language?: string | null;
  stargazers_count: number;
  created_at: string;
  updated_at: string;
  owner?: { login?: string };
};

type GitHubSearchResponse = {
  items?: GitHubRepository[];
  message?: string;
};

export const githubApiAdapter: SourceAdapter = {
  sourceKey: "github_api",
  async fetch(source) {
    const since = formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const endpoint = source.endpoint.replaceAll("{since}", since);
    const url = buildUrl(endpoint, "https://api.github.com");
    const token = process.env.GITHUB_TOKEN;
    const response = await fetchWithTimeout(url.toString(), {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    const json = (await response.json()) as GitHubSearchResponse;
    if (!response.ok) {
      throw new Error(json.message || `GitHub API 请求失败：${response.status}`);
    }

    return (json.items ?? []).map((repo) => ({
      externalId: repo.node_id || String(repo.id),
      title: `${repo.full_name} 获得近期关注`,
      url: repo.html_url,
      summary: normalizeWhitespace(
        [
          stripHtml(repo.description ?? undefined),
          repo.language ? `语言：${repo.language}` : null,
          `Stars：${repo.stargazers_count}`
        ]
          .filter(Boolean)
          .join(" · ")
      ),
      author: repo.owner?.login,
      publishedAt: toDate(repo.updated_at || repo.created_at),
      rawJson: repo
    }));
  }
};

