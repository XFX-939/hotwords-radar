import type { Category } from "./types";

export interface MockSourceDefinition {
  name: string;
  type: string;
  url: string;
  enabled: boolean;
}

export interface MockRawItem {
  sourceName: string;
  title: string;
  url: string;
  summary: string;
  rank: number;
  hotValue: number;
  publishedAt: Date;
  categoryHint: Exclude<Category, "全部">;
}

export const mockSources: MockSourceDefinition[] = [
  {
    name: "微博热搜",
    type: "热搜榜",
    url: "https://s.weibo.com/top/summary",
    enabled: true
  },
  {
    name: "百度热榜",
    type: "热搜榜",
    url: "https://top.baidu.com/board",
    enabled: true
  },
  {
    name: "知乎热榜",
    type: "社区讨论",
    url: "https://www.zhihu.com/hot",
    enabled: true
  },
  {
    name: "36氪快讯",
    type: "资讯流",
    url: "https://36kr.com/newsflashes",
    enabled: true
  },
  {
    name: "小红书趋势",
    type: "创作平台",
    url: "https://www.xiaohongshu.com",
    enabled: true
  }
];

const hour = 1000 * 60 * 60;

export function buildMockRawItems(now = new Date()): MockRawItem[] {
  return [
    {
      sourceName: "微博热搜",
      title: "AI Agent 创业潮升温，多家应用登上效率工具榜",
      url: "https://example.com/weibo/ai-agent-startups",
      summary: "智能体、自动化办公和内容生成成为今日科技讨论中心。",
      rank: 1,
      hotValue: 9580000,
      publishedAt: new Date(now.getTime() - hour),
      categoryHint: "AI"
    },
    {
      sourceName: "知乎热榜",
      title: "为什么大家突然都在讨论 AI Agent 工作流？",
      url: "https://example.com/zhihu/ai-agent-workflow",
      summary: "从个人效率到企业自动化，AI Agent 的落地价值被重新评估。",
      rank: 2,
      hotValue: 8140000,
      publishedAt: new Date(now.getTime() - hour * 1.5),
      categoryHint: "AI"
    },
    {
      sourceName: "36氪快讯",
      title: "OpenAI 新模型推动多模态应用更新，AI Agent 生态继续扩张",
      url: "https://example.com/36kr/openai-model",
      summary: "模型能力、智能体平台和企业级工具成为创业公司新叙事。",
      rank: 4,
      hotValue: 6620000,
      publishedAt: new Date(now.getTime() - hour * 2),
      categoryHint: "科技"
    },
    {
      sourceName: "百度热榜",
      title: "低空经济试点城市扩容，无人机物流和文旅场景受关注",
      url: "https://example.com/baidu/low-altitude",
      summary: "政策、产业链和地方项目推动低空经济成为财经热点。",
      rank: 3,
      hotValue: 7810000,
      publishedAt: new Date(now.getTime() - hour * 3),
      categoryHint: "财经"
    },
    {
      sourceName: "36氪快讯",
      title: "低空经济融资活跃，eVTOL 企业发布新一轮测试计划",
      url: "https://example.com/36kr/evtol",
      summary: "资本市场继续关注低空经济和无人机供应链。",
      rank: 8,
      hotValue: 4390000,
      publishedAt: new Date(now.getTime() - hour * 6),
      categoryHint: "财经"
    },
    {
      sourceName: "微博热搜",
      title: "高考倒计时一个月，志愿填报和专业选择讨论升温",
      url: "https://example.com/weibo/gaokao",
      summary: "教育、就业、AI 专业和城市选择成为家庭讨论焦点。",
      rank: 6,
      hotValue: 5120000,
      publishedAt: new Date(now.getTime() - hour * 4),
      categoryHint: "教育"
    },
    {
      sourceName: "知乎热榜",
      title: "今年高考志愿填报，AI 专业还值得选吗？",
      url: "https://example.com/zhihu/ai-major",
      summary: "考生和家长围绕 AI、计算机、就业前景展开讨论。",
      rank: 7,
      hotValue: 4870000,
      publishedAt: new Date(now.getTime() - hour * 5),
      categoryHint: "教育"
    },
    {
      sourceName: "百度热榜",
      title: "新能源汽车价格战再起，供应链和二手车市场承压",
      url: "https://example.com/baidu/ev-price",
      summary: "车企促销、销量目标和消费者观望情绪持续发酵。",
      rank: 5,
      hotValue: 6030000,
      publishedAt: new Date(now.getTime() - hour * 2.5),
      categoryHint: "财经"
    },
    {
      sourceName: "36氪快讯",
      title: "新能源汽车智能驾驶功能密集升级，端到端模型成竞争点",
      url: "https://example.com/36kr/ev-ai-driving",
      summary: "智能驾驶、车端大模型和数据闭环成为科技产业热点。",
      rank: 9,
      hotValue: 4200000,
      publishedAt: new Date(now.getTime() - hour * 8),
      categoryHint: "科技"
    },
    {
      sourceName: "微博热搜",
      title: "演唱会经济带动周边消费，城市文旅发布新套餐",
      url: "https://example.com/weibo/concert-economy",
      summary: "演唱会、酒店、交通和城市消费成为社交平台热门话题。",
      rank: 11,
      hotValue: 3180000,
      publishedAt: new Date(now.getTime() - hour * 10),
      categoryHint: "娱乐"
    },
    {
      sourceName: "小红书趋势",
      title: "端午出游攻略热度上升，小众城市和反向旅游受欢迎",
      url: "https://example.com/xhs/duanwu-travel",
      summary: "年轻用户关注短途游、避开人潮和高性价比路线。",
      rank: 4,
      hotValue: 5580000,
      publishedAt: new Date(now.getTime() - hour * 2.2),
      categoryHint: "社会"
    },
    {
      sourceName: "百度热榜",
      title: "国际金价波动加剧，避险情绪影响全球市场",
      url: "https://example.com/baidu/gold",
      summary: "美元利率预期、地缘局势和央行购金共同影响金价。",
      rank: 10,
      hotValue: 3880000,
      publishedAt: new Date(now.getTime() - hour * 9),
      categoryHint: "国际"
    },
    {
      sourceName: "知乎热榜",
      title: "年轻人为什么重新关注黄金和定投？",
      url: "https://example.com/zhihu/gold-investing",
      summary: "理财、风险偏好和不确定性让黄金话题再次走热。",
      rank: 13,
      hotValue: 2760000,
      publishedAt: new Date(now.getTime() - hour * 12),
      categoryHint: "财经"
    },
    {
      sourceName: "微博热搜",
      title: "职场人开始用 AI 写周报，效率提升也引发边界讨论",
      url: "https://example.com/weibo/ai-weekly-report",
      summary: "职场效率、AI 工具和管理方式变化受到关注。",
      rank: 12,
      hotValue: 3060000,
      publishedAt: new Date(now.getTime() - hour * 7),
      categoryHint: "职场"
    },
    {
      sourceName: "小红书趋势",
      title: "职场副业笔记爆火，普通人如何做内容创作？",
      url: "https://example.com/xhs/side-hustle",
      summary: "副业、内容创作和个人 IP 成为平台讨论高频词。",
      rank: 9,
      hotValue: 3490000,
      publishedAt: new Date(now.getTime() - hour * 6.5),
      categoryHint: "职场"
    },
    {
      sourceName: "微博热搜",
      title: "足球亚洲杯预选赛名单公布，年轻球员获得机会",
      url: "https://example.com/weibo/football",
      summary: "国家队阵容、年轻球员和备战节奏引发体育讨论。",
      rank: 15,
      hotValue: 2190000,
      publishedAt: new Date(now.getTime() - hour * 15),
      categoryHint: "体育"
    },
    {
      sourceName: "百度热榜",
      title: "NBA 季后赛关键战引爆讨论，超级球星状态回暖",
      url: "https://example.com/baidu/nba",
      summary: "赛事走势、球星表现和战术调整成为体育频道焦点。",
      rank: 14,
      hotValue: 2410000,
      publishedAt: new Date(now.getTime() - hour * 11),
      categoryHint: "体育"
    },
    {
      sourceName: "36氪快讯",
      title: "具身智能机器人公司发布量产计划，制造业场景先落地",
      url: "https://example.com/36kr/robotics",
      summary: "机器人、具身智能和工厂自动化被视为新一轮 AI 应用方向。",
      rank: 6,
      hotValue: 5010000,
      publishedAt: new Date(now.getTime() - hour * 3.5),
      categoryHint: "科技"
    },
    {
      sourceName: "知乎热榜",
      title: "具身智能离普通人还有多远？",
      url: "https://example.com/zhihu/embodied-ai",
      summary: "技术路线、成本下降和真实场景数据决定落地速度。",
      rank: 12,
      hotValue: 2990000,
      publishedAt: new Date(now.getTime() - hour * 13),
      categoryHint: "AI"
    },
    {
      sourceName: "小红书趋势",
      title: "毕业季租房避坑指南走红，通勤和预算最受关注",
      url: "https://example.com/xhs/rent",
      summary: "毕业生、租房、通勤和城市生活成本成为社会话题。",
      rank: 7,
      hotValue: 4070000,
      publishedAt: new Date(now.getTime() - hour * 5.5),
      categoryHint: "社会"
    },
    {
      sourceName: "微博热搜",
      title: "电影暑期档片单公布，国产科幻与动画竞争激烈",
      url: "https://example.com/weibo/movie",
      summary: "新片宣发、预售和口碑期待推动娱乐热度。",
      rank: 16,
      hotValue: 2050000,
      publishedAt: new Date(now.getTime() - hour * 18),
      categoryHint: "娱乐"
    },
    {
      sourceName: "百度热榜",
      title: "海外科技公司加码数据中心，AI 算力需求继续增长",
      url: "https://example.com/baidu/datacenter",
      summary: "算力、芯片、能源和云服务成为国际科技市场关键词。",
      rank: 18,
      hotValue: 1860000,
      publishedAt: new Date(now.getTime() - hour * 21),
      categoryHint: "国际"
    },
    {
      sourceName: "知乎热榜",
      title: "AI 编程工具是否会改变程序员招聘标准？",
      url: "https://example.com/zhihu/ai-coding",
      summary: "AI 编程、工程效率、面试评价和初级岗位变化引发讨论。",
      rank: 5,
      hotValue: 5710000,
      publishedAt: new Date(now.getTime() - hour * 4.5),
      categoryHint: "职场"
    },
    {
      sourceName: "36氪快讯",
      title: "AI 编程平台进入企业采购清单，代码审查和安全成重点",
      url: "https://example.com/36kr/ai-coding",
      summary: "企业关注研发效率，也关注代码质量、权限和合规边界。",
      rank: 7,
      hotValue: 4620000,
      publishedAt: new Date(now.getTime() - hour * 6),
      categoryHint: "AI"
    },
    {
      sourceName: "小红书趋势",
      title: "健康睡眠打卡挑战升温，年轻人开始关注情绪恢复",
      url: "https://example.com/xhs/sleep",
      summary: "睡眠、情绪、运动和自我管理类内容持续增长。",
      rank: 12,
      hotValue: 2650000,
      publishedAt: new Date(now.getTime() - hour * 17),
      categoryHint: "社会"
    }
  ];
}
