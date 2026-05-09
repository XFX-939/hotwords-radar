import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateHotScore,
  cleanText,
  extractKeywords,
  generateDailyReport
} from "../src/lib/pipeline";

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

  it("rewards cross-platform, fresh, high-rank signals in hot score", () => {
    const strong = calculateHotScore({
      frequency: 8,
      bestRank: 1,
      sourceCount: 4,
      latestSeenAt: new Date()
    });
    const weak = calculateHotScore({
      frequency: 1,
      bestRank: 40,
      sourceCount: 1,
      latestSeenAt: new Date(Date.now() - 1000 * 60 * 60 * 72)
    });

    assert.ok(strong > weak);
    assert.ok(strong <= 100);
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
