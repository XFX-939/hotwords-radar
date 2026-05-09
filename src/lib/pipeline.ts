import type {
  DailyReportInput,
  HotScoreInput,
  KeywordSignal,
  ReportKeyword,
  Sentiment,
  TrendDirection
} from "./types";

const stopWords = new Set([
  "今天",
  "今日",
  "大家",
  "为什么",
  "如何",
  "一个",
  "成为",
  "讨论",
  "关注",
  "继续",
  "发布",
  "升温",
  "引发",
  "走红",
  "开始",
  "最新",
  "热点",
  "热搜",
  "平台",
  "应用",
  "AI",
  "Agent"
]);

const keywordDictionary = [
  "AI Agent",
  "OpenAI",
  "DeepSeek",
  "GLM",
  "Minimax",
  "低空经济",
  "新能源汽车",
  "智能驾驶",
  "高考志愿",
  "志愿填报",
  "演唱会经济",
  "端午出游",
  "反向旅游",
  "国际金价",
  "黄金定投",
  "AI 编程",
  "内容创作",
  "个人 IP",
  "具身智能",
  "数据中心",
  "AI 算力",
  "暑期档",
  "毕业季租房",
  "健康睡眠",
  "职场副业",
  "无人机物流",
  "eVTOL",
  "机器人",
  "多模态",
  "智能体",
  "周报",
  "高考",
  "黄金",
  "租房",
  "足球",
  "NBA"
].sort((a, b) => b.length - a.length);

const categoryRules: Array<{ category: string; words: string[] }> = [
  { category: "AI", words: ["AI", "智能体", "OpenAI", "Agent", "大模型", "多模态", "AI 编程"] },
  { category: "科技", words: ["机器人", "具身智能", "数据中心", "算力", "智能驾驶", "新能源汽车", "模型"] },
  { category: "财经", words: ["经济", "融资", "黄金", "金价", "市场", "供应链", "价格战", "定投"] },
  { category: "社会", words: ["租房", "出游", "旅游", "睡眠", "健康", "城市", "毕业季"] },
  { category: "娱乐", words: ["电影", "暑期档", "演唱会", "动画", "预售"] },
  { category: "体育", words: ["足球", "NBA", "季后赛", "亚洲杯", "球员"] },
  { category: "国际", words: ["国际", "海外", "全球", "美元", "地缘"] },
  { category: "职场", words: ["职场", "副业", "周报", "招聘", "程序员", "工作流"] },
  { category: "教育", words: ["高考", "志愿", "专业", "考生", "家长"] }
];

export function normalizeWord(word: string) {
  return cleanText(word).toLowerCase().replace(/\s+/g, "");
}

export function cleanText(input: string) {
  return input
    .replace(/[【】「」《》〈〉“”‘’"'`]/g, " ")
    .replace(/[!！?？#＃@￥$%^&*（）()_+=|\\/:：；;，,。.\[\]{}<>~·、-]/g, " ")
    .replace(/[^\p{Script=Han}A-Za-z0-9\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractKeywords(texts: string[]): KeywordSignal[] {
  const counts = new Map<string, { word: string; normalizedWord: string; frequency: number }>();

  for (const rawText of texts) {
    const text = cleanText(rawText);
    const lowerText = text.toLowerCase();

    for (const dictionaryWord of keywordDictionary) {
      const normalized = normalizeWord(dictionaryWord);
      const pattern = dictionaryWord.replace(/\s+/g, "\\s+");
      const matches = lowerText.match(new RegExp(pattern.toLowerCase(), "g"));
      if (matches?.length) {
        const current = counts.get(normalized) ?? {
          word: dictionaryWord,
          normalizedWord: normalized,
          frequency: 0
        };
        current.frequency += matches.length;
        counts.set(normalized, current);
      }
    }

    for (const token of text.match(/[A-Za-z][A-Za-z0-9]{1,}|[\p{Script=Han}]{2,6}/gu) ?? []) {
      if (/^\d+$/.test(token) || stopWords.has(token) || token.length < 2) continue;
      const normalized = normalizeWord(token);
      if (!normalized || stopWords.has(normalized)) continue;
      const current = counts.get(normalized) ?? {
        word: token,
        normalizedWord: normalized,
        frequency: 0
      };
      current.frequency += 1;
      counts.set(normalized, current);
    }
  }

  return [...counts.values()]
    .filter((item) => {
      const isDictionaryWord = keywordDictionary.some((word) => normalizeWord(word) === item.normalizedWord);
      return (item.frequency >= 2 || isDictionaryWord) && !stopWords.has(item.word);
    })
    .sort((a, b) => b.frequency - a.frequency || b.word.length - a.word.length)
    .slice(0, 80);
}

export function calculateHotScore(input: HotScoreInput) {
  const ageHours = Math.max(0, (Date.now() - input.latestSeenAt.getTime()) / 36e5);
  const recencyWeight = Math.max(0.38, 1 - ageHours / 96);
  const rankWeight = 1 + (50 - Math.min(50, Math.max(1, input.bestRank))) / 50;
  const platformCountWeight = 1 + Math.min(input.sourceCount, 8) * 0.18;
  const frequencyWeight = Math.log2(input.frequency + 1) * 18;
  const rawScore = frequencyWeight * rankWeight * recencyWeight * platformCountWeight;

  return Math.round(Math.min(100, Math.max(1, rawScore)) * 10) / 10;
}

export function classifyKeyword(word: string, context = "") {
  const haystack = `${word} ${context}`;
  const matched = categoryRules.find((rule) => rule.words.some((token) => haystack.includes(token)));
  return matched?.category ?? "社会";
}

export function analyzeSentiment(word: string, context = ""): Sentiment {
  const haystack = `${word} ${context}`;
  if (/(增长|机会|升温|回暖|活跃|提升|扩张|受欢迎|量产)/.test(haystack)) return "positive";
  if (/(承压|风险|下跌|争议|失败|冲突|焦虑|避坑)/.test(haystack)) return "negative";
  if (/(波动|讨论|边界|观望|不确定)/.test(haystack)) return "mixed";
  return "neutral";
}

export function inferTrend(previousScore: number | null, currentScore: number): TrendDirection {
  if (!previousScore) return currentScore >= 75 ? "rising" : "up";
  const delta = currentScore - previousScore;
  if (delta >= 12) return "rising";
  if (delta >= 3) return "up";
  if (delta <= -6) return "down";
  return "stable";
}

export function buildKeywordExplanation(keyword: ReportKeyword, relatedWords: string[]) {
  const related = relatedWords.slice(0, 5).join("、") || "平台讨论、搜索热度、内容扩散";
  return `${keyword.word} 今天热度较高，核心原因是它同时出现在多个热点语境中，并与 ${related} 等议题形成联动。当前热度分为 ${Math.round(
    keyword.score
  )}，趋势为${trendLabel(keyword.trend)}，说明它已经不只是单点新闻，而是具备跨平台扩散和持续讨论的潜力。`;
}

export function buildCreationSuggestions(keyword: ReportKeyword, relatedWords: string[]) {
  const related = relatedWords.slice(0, 4).join("、");
  return [
    `做一篇「${keyword.word} 为什么突然火了」的背景解释型内容，适合公众号、知乎和视频号。`,
    `围绕 ${related || keyword.category} 做对比盘点，提炼普通用户真正关心的影响。`,
    `如果面向短视频，可以用 30 秒解释事件脉络，再给出 3 个值得继续观察的信号。`
  ];
}

export function generateDailyReport(input: DailyReportInput) {
  const topLines = input.topKeywords
    .slice(0, 10)
    .map((item, index) => `${index + 1}. **${item.word}**（${item.category}，热度 ${Math.round(item.score)}）`)
    .join("\n");
  const risingLines = input.risingKeywords
    .slice(0, 10)
    .map((item) => `- ${item.word}：${item.category} / ${trendLabel(item.trend)} / ${Math.round(item.score)} 分`)
    .join("\n");
  const categoryGroups = groupBy(input.topKeywords, (item) => item.category);
  const categoryLines = [...categoryGroups.entries()]
    .map(([category, items]) => `- ${category}：${items.slice(0, 4).map((item) => item.word).join("、")}`)
    .join("\n");
  const headline = input.topKeywords[0]?.word ?? "今日热点";
  const second = input.topKeywords[1]?.word ?? "跨平台讨论";
  const title = `${input.date} 互联网热点日报`;
  const summary = `今日互联网讨论集中在 ${headline}、${second} 等话题，AI、财经、职场与社会生活类议题交织明显。`;
  const contentMarkdown = `# ${title}

## 今日一句话

${summary}

## 今日十大热词

${topLines}

## 新晋与飙升热词

${risingLines}

## 各分类热点

${categoryLines}

## 内容创作选题建议

- 用「为什么火」解释 ${headline} 的事件背景、平台扩散和用户情绪。
- 将 ${headline} 与 ${second} 做横向对比，产出趋势观察或行业分析。
- 从普通用户视角拆解影响：谁受益、谁焦虑、接下来要看什么信号。
`;

  return { title, summary, contentMarkdown };
}

export function trendLabel(trend: string) {
  const labels: Record<string, string> = {
    rising: "快速上升",
    up: "上升",
    stable: "平稳",
    down: "回落"
  };
  return labels[trend] ?? "平稳";
}

function groupBy<T>(items: T[], key: (item: T) => string) {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const group = key(item);
    map.set(group, [...(map.get(group) ?? []), item]);
  }
  return map;
}
