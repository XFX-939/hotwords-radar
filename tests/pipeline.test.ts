import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateHotScore,
  cleanText,
  extractKeywords,
  generateDailyReport
} from "../src/lib/pipeline";
import { normalizeRawItems } from "../src/lib/ingestion/run";

describe("hotwords pipeline", () => {
  it("cleans Chinese hot titles without destroying readable words", () => {
    assert.equal(cleanText("【突发】AI Agent 大爆发！！#热搜#"), "突发 AI Agent 大爆发 热搜");
  });

  it("extracts useful keywords and removes filler words", () => {
    const result = extractKeywords([
      "OpenAI 发布新模型，AI Agent 进入内容创作工作流",
      "多平台热议 AI Agent 和智能体应用"
    ]);

    assert.ok(result.map((item) => item.word).includes("AI Agent"));
    assert.ok((result.find((item) => item.word === "AI Agent")?.frequency ?? 0) >= 2);
  });

  it("removes English filler words from public feed titles", () => {
    const result = extractKeywords([
      "The future of AI and agents on the web",
      "A guide to Rust, TypeScript, and AI Agent workflows"
    ]);
    const words = result.map((item) => item.normalizedWord);

    assert.ok(!words.includes("the"));
    assert.ok(!words.includes("of"));
    assert.ok(!words.includes("and"));
    assert.ok(!words.includes("to"));
    assert.ok(!words.includes("on"));
    assert.ok(words.includes("rust"));
    assert.ok(words.includes("typescript"));
    assert.ok(words.includes("aiagent"));
  });

  it("keeps Chinese signal words and removes feed boilerplate", () => {
    const result = extractKeywords([
      "早报 官方推出更多报道：苹果正在研发全息 iPhone，华为发布安全通告",
      "欢迎关注 查看全文：AI 手机和智能座舱成为讨论焦点，3 月份融资 10 亿元"
    ]);
    const words = result.map((item) => item.normalizedWord);

    assert.ok(!words.includes("早报"));
    assert.ok(!words.includes("官方"));
    assert.ok(!words.includes("更多"));
    assert.ok(!words.includes("亿元"));
    assert.ok(!words.includes("月份"));
    assert.ok(words.includes("苹果"));
    assert.ok(words.includes("iphone"));
    assert.ok(words.includes("华为"));
    assert.ok(words.includes("ai手机"));
    assert.ok(words.includes("智能座舱"));
  });

  it("rewards cross-source, fresh, frequent signals in composite hot score", () => {
    const strong = calculateHotScore({
      frequency: 8,
      sourceWeight: 1.2,
      sourceCount: 4,
      itemCount: 8,
      latestSeenAt: new Date()
    });
    const weak = calculateHotScore({
      frequency: 1,
      sourceWeight: 0.7,
      sourceCount: 1,
      itemCount: 1,
      latestSeenAt: new Date(Date.now() - 1000 * 60 * 60 * 72)
    });

    assert.ok(strong > weak);
    assert.ok(strong <= 100);
  });

  it("normalizes raw source items and deduplicates by content hash", () => {
    const result = normalizeRawItems("rss-demo", [
      { title: " <b>OpenAI 发布新工具</b> ", url: "https://example.com/a", summary: "AI Agent 新闻" },
      { title: "OpenAI 发布新工具", url: "https://example.com/a", summary: "AI Agent 新闻" }
    ]);

    assert.equal(result.length, 1);
    assert.equal(result[0].title, "OpenAI 发布新工具");
    assert.ok(result[0].contentHash.length > 20);
  });

  it("generates a markdown daily report from keyword summaries", () => {
    const report = generateDailyReport({
      date: "2026-05-09",
      topKeywords: [
        { word: "AI Agent", category: "AI", score: 96, trend: "up" },
        { word: "低空经济", category: "财经", score: 88, trend: "rising" }
      ],
      risingKeywords: [{ word: "具身智能", category: "科技", score: 82, trend: "rising" }]
    });

    assert.match(report.title, /2026-05-09/);
    assert.match(report.contentMarkdown, /今日十大热词/);
    assert.match(report.contentMarkdown, /AI Agent/);
  });
});
