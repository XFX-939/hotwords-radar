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
  "新闻",
  "报道",
  "早报",
  "表示",
  "认为",
  "显示",
  "正在",
  "可以",
  "来自",
  "推出",
  "官方",
  "消息",
  "此次",
  "相关",
  "记者",
  "近日",
  "近期",
  "日前",
  "目前",
  "同时",
  "其中",
  "之一",
  "方面",
  "通过",
  "进行",
  "实现",
  "提供",
  "包括",
  "行业",
  "企业",
  "集团",
  "公司",
  "文章",
  "全文",
  "订阅",
  "欢迎",
  "关注",
  "查看",
  "更多",
  "科技",
  "产品",
  "团队",
  "用户",
  "服务",
  "图源",
  "a",
  "an",
  "the",
  "of",
  "and",
  "or",
  "to",
  "in",
  "on",
  "at",
  "by",
  "as",
  "for",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "it",
  "its",
  "they",
  "them",
  "their",
  "you",
  "your",
  "we",
  "our",
  "us",
  "he",
  "she",
  "his",
  "her",
  "not",
  "no",
  "new",
  "more",
  "most",
  "other",
  "some",
  "such",
  "than",
  "then",
  "into",
  "over",
  "after",
  "before",
  "under",
  "between",
  "through",
  "during",
  "without",
  "within",
  "across",
  "against",
  "using",
  "use",
  "used",
  "said",
  "says",
  "via",
  "open",
  "self",
  "agent",
  "agents",
  "company",
  "companies",
  "inc",
  "ltd",
  "llc",
  "corp",
  "corporation",
  "template",
  "templates",
  "beautiful",
  "download",
  "downloader",
  "model",
  "models",
  "billion",
  "million",
  "yuan",
  "dollar",
  "dollars",
  "with",
  "from",
  "this",
  "that",
  "have",
  "has",
  "will",
  "about",
  "AI",
  "Agent",
  "万元",
  "亿元",
  "亿美元",
  "亿港元",
  "人民币",
  "港元",
  "美元",
  "月份",
  "万对",
  "六号",
  "购买",
  "建造",
  "翻建",
  "整为",
  "报道称",
  "网传",
  "立案",
  "同比",
  "同比上升",
  "同比增长"
]);

const keywordDictionary = [
  "AI Agent",
  "OpenAI",
  "DeepSeek",
  "Claude",
  "Gemini",
  "GitHub",
  "Nvidia",
  "GPU",
  "苹果",
  "iPhone",
  "Google",
  "Anthropic",
  "甲骨文",
  "华为",
  "中汽协",
  "理想汽车",
  "小鹏汽车",
  "小米汽车",
  "新能源汽车",
  "智能座舱",
  "自动驾驶",
  "高阶智驾",
  "智能驾驶",
  "锁电",
  "固态电池",
  "半导体",
  "AI 手机",
  "AI 眼镜",
  "Rust",
  "Zig",
  "Solidity",
  "Go",
  "HTML",
  "Transformer",
  "Kubernetes",
  "TypeScript",
  "React",
  "Next.js",
  "Bitcoin",
  "Ethereum",
  "GLM",
  "Minimax",
  "低空经济",
  "新能源汽车",
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
  "芯片",
  "国产芯片",
  "国产替代",
  "云计算",
  "云服务",
  "网络安全",
  "大模型",
  "算力",
  "开源模型",
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

const normalizedStopWords = new Set([...stopWords].map((word) => normalizeStopWord(word)));
const dictionaryNormalizedWords = new Set(keywordDictionary.map((word) => normalizeStopWord(word)));

export function isDictionaryKeyword(word: string) {
  return dictionaryNormalizedWords.has(normalizeStopWord(word));
}

const categoryRules: Array<{ category: string; words: string[] }> = [
  {
    category: "AI",
    words: [
      "AI",
      "智能体",
      "OpenAI",
      "DeepSeek",
      "Claude",
      "Gemini",
      "Agent",
      "大模型",
      "多模态",
      "AI 编程",
      "AI 手机",
      "AI 眼镜",
      "Transformer",
      "Anthropic"
    ]
  },
  {
    category: "科技",
    words: [
      "GitHub",
      "Nvidia",
      "GPU",
      "芯片",
      "国产芯片",
      "半导体",
      "国产替代",
      "机器人",
      "具身智能",
      "数据中心",
      "算力",
      "智能驾驶",
      "自动驾驶",
      "高阶智驾",
      "智能座舱",
      "新能源汽车",
      "固态电池",
      "华为",
      "苹果",
      "iPhone",
      "小米汽车",
      "理想汽车",
      "小鹏汽车",
      "模型",
      "开源",
      "网络安全",
      "云计算",
      "云服务",
      "Kubernetes",
      "TypeScript",
      "React",
      "Next.js"
    ]
  },
  { category: "财经", words: ["Business", "market", "经济", "融资", "黄金", "金价", "市场", "供应链", "价格战", "定投", "Bitcoin", "Ethereum"] },
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

function normalizeStopWord(word: string) {
  return word.toLowerCase().replace(/\s+/g, "");
}

function isStopWord(word: string) {
  const normalized = normalizeStopWord(cleanText(word));
  return normalizedStopWords.has(normalized);
}

function isWeakEnglishToken(word: string) {
  const normalized = normalizeStopWord(word);
  return /^[a-z]+$/.test(normalized) && normalized.length < 3 && !dictionaryNormalizedWords.has(normalized);
}

function isWeakChineseToken(word: string) {
  const normalized = normalizeStopWord(cleanText(word));
  if (!/[\p{Script=Han}]/u.test(normalized) || dictionaryNormalizedWords.has(normalized)) return false;
  if (normalized.length > 4) return true;
  if (/(万元|亿元|亿美元|亿港元|人民币|港元|美元|月份)$/.test(normalized)) return true;
  if (/^[一二三四五六七八九十百千万亿两0-9]+(月|日|号|月份|万元|亿元|美元|港元|对)$/.test(normalized)) {
    return true;
  }
  return /^(近日|近期|目前|日前|其中|同时|报道称|网传|立案|购买|建造|翻建|整为)$/.test(normalized);
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
      const matches = lowerText.match(buildDictionaryRegex(dictionaryWord));
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
      if (/^\d+$/.test(token) || isStopWord(token) || isWeakEnglishToken(token) || isWeakChineseToken(token) || token.length < 2) {
        continue;
      }
      const normalized = normalizeWord(token);
      if (!normalized || isStopWord(normalized) || isWeakEnglishToken(normalized) || isWeakChineseToken(normalized)) continue;
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
      const isDictionaryWord = dictionaryNormalizedWords.has(item.normalizedWord);
      return (
        (item.frequency >= 2 || isDictionaryWord) &&
        !isStopWord(item.word) &&
        !isWeakEnglishToken(item.word) &&
        !isWeakChineseToken(item.word)
      );
    })
    .sort((a, b) => b.frequency - a.frequency || b.word.length - a.word.length)
    .slice(0, 80);
}

function buildDictionaryRegex(word: string) {
  const pattern = word
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(escapeRegExp)
    .join("\\s+");
  const isAsciiPhrase = /^[a-z0-9.+#\s-]+$/i.test(word);
  return new RegExp(isAsciiPhrase ? `(?<![a-z0-9])${pattern}(?![a-z0-9])` : pattern, "g");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function calculateHotScore(input: HotScoreInput) {
  const ageHours = Math.max(0, (Date.now() - input.latestSeenAt.getTime()) / 36e5);
  const recencyWeight = Math.max(0.35, Math.exp(-ageHours / 72));
  const frequencyWeight = Math.min(2.2, 0.65 + Math.log2(input.frequency + 1) / 3);
  const platformWeight = 1 + Math.min(Math.max(0, input.sourceCount - 1), 6) * 0.16;
  const itemCountWeight = 1 + Math.min(Math.max(0, input.itemCount - 1), 12) * 0.06;
  const sourceWeight = Math.max(0.2, input.sourceWeight);
  const rawScore = sourceWeight * recencyWeight * frequencyWeight * platformWeight * itemCountWeight * 42;

  return Math.round(Math.min(100, Math.max(1, rawScore)) * 10) / 10;
}

export function classifyKeyword(word: string, context = "") {
  const haystack = `${word} ${context}`;
  const direct = categoryRules.find((rule) => rule.words.some((token) => word.includes(token)));
  if (direct) return direct.category;
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
  if (!previousScore) return "new";
  const delta = currentScore - previousScore;
  if (delta >= 12) return "rising";
  if (delta >= 3) return "up";
  if (delta <= -12) return "falling";
  if (delta <= -4) return "down";
  return "stable";
}

export function buildKeywordExplanation(keyword: ReportKeyword, relatedWords: string[]) {
  const related = relatedWords.slice(0, 5).join("、") || "公开数据源、搜索语境、内容扩散";
  return `${keyword.word} 今天综合热度较高，核心原因是它同时出现在多个公开数据源语境中，并与 ${related} 等议题形成联动。当前综合热度分为 ${Math.round(
    keyword.score
  )}，趋势为${trendLabel(keyword.trend)}。这个分数来自已接入公开数据源的聚合信号，不代表任何平台的官方热度。`;
}

export function buildCreationSuggestions(keyword: ReportKeyword, relatedWords: string[]) {
  const related = relatedWords.slice(0, 4).join("、");
  return [
    `做一篇「${keyword.word} 为什么突然火了」的背景解释型内容，适合公众号、长文平台和视频号。`,
    `围绕 ${related || keyword.category} 做对比盘点，提炼普通用户真正关心的影响。`,
    `如果面向短视频，可以用 30 秒解释事件脉络，再给出 3 个值得继续观察的信号。`
  ];
}

export function generateDailyReport(input: DailyReportInput) {
  const topLines = input.topKeywords
    .slice(0, 10)
    .map((item, index) => `${index + 1}. **${item.word}**（${item.category}，综合热度 ${Math.round(item.score)}）`)
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
  const summary = `今日公开数据源讨论集中在 ${headline}、${second} 等话题，AI、科技、财经与社会生活类议题交织明显。`;
  const contentMarkdown = `# ${title}

## 今日一句话

${summary}

## 今日十大热词

${topLines}

> 注：以下为系统基于已接入公开数据源计算的综合热度分，不代表全网真实热度或第三方平台官方热度。

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
    new: "新出现",
    rising: "快速上升",
    up: "上升",
    stable: "平稳",
    down: "回落",
    falling: "快速回落"
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
