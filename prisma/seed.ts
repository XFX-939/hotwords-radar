import { disconnectPrisma, getPrisma } from "../src/lib/db";

const defaultSources = [
  {
    key: "newsapi-technology",
    name: "NewsAPI 科技新闻",
    type: "newsapi",
    endpoint: "top-headlines?category=technology&country=us&pageSize=50",
    locale: "en",
    sourceWeight: 1
  },
  {
    key: "newsapi-business",
    name: "NewsAPI 财经新闻",
    type: "newsapi",
    endpoint: "top-headlines?category=business&country=us&pageSize=50",
    locale: "en",
    sourceWeight: 0.9
  },
  {
    key: "gdelt-global-tech",
    name: "GDELT 全球科技事件",
    type: "gdelt",
    endpoint:
      "doc/doc?query=(technology%20OR%20AI%20OR%20chip%20OR%20robotics)&mode=ArtList&format=json&maxrecords=50&sort=HybridRel",
    locale: "en",
    sourceWeight: 1
  },
  {
    key: "github-api-recent-stars",
    name: "GitHub API 近期高星项目",
    type: "github_api",
    endpoint: "search/repositories?q=created:>{since}+stars:>25&sort=stars&order=desc&per_page=30",
    locale: "en",
    sourceWeight: 1
  },
  {
    key: "rss-github-blog",
    name: "GitHub Blog RSS",
    type: "rss",
    endpoint: "https://github.blog/feed/",
    locale: "en",
    sourceWeight: 0.85
  },
  {
    key: "rss-cloudflare-blog",
    name: "Cloudflare Blog RSS",
    type: "rss",
    endpoint: "https://blog.cloudflare.com/rss/",
    locale: "en",
    sourceWeight: 0.8
  },
  {
    key: "rss-bbc-technology",
    name: "BBC Technology RSS",
    type: "rss",
    endpoint: "https://feeds.bbci.co.uk/news/technology/rss.xml",
    locale: "en",
    sourceWeight: 0.85
  },
  {
    key: "rss-arxiv-ai",
    name: "arXiv cs.AI RSS",
    type: "rss",
    endpoint: "https://export.arxiv.org/rss/cs.AI",
    locale: "en",
    sourceWeight: 0.75
  },
  {
    key: "rss-36kr-feed",
    name: "36氪综合 RSS",
    type: "rss",
    endpoint: "https://36kr.com/feed",
    locale: "zh",
    sourceWeight: 1.05
  },
  {
    key: "rss-36kr-newsflash",
    name: "36氪快讯 RSS",
    type: "rss",
    endpoint: "https://36kr.com/feed-newsflash",
    locale: "zh",
    sourceWeight: 1.1
  },
  {
    key: "rss-sspai",
    name: "少数派 RSS",
    type: "rss",
    endpoint: "https://sspai.com/feed",
    locale: "zh",
    sourceWeight: 0.85
  },
  {
    key: "rss-ifanr",
    name: "爱范儿 RSS",
    type: "rss",
    endpoint: "https://www.ifanr.com/feed/",
    locale: "zh",
    sourceWeight: 0.9
  },
  {
    key: "rss-meituan-tech",
    name: "美团技术团队 RSS",
    type: "rss",
    endpoint: "https://tech.meituan.com/feed/",
    locale: "zh",
    sourceWeight: 0.8
  },
  {
    key: "rss-huawei-psirt",
    name: "华为安全通告 RSS",
    type: "rss",
    endpoint: "https://www.huawei.com/cn/rss-feeds/psirt/rss",
    locale: "zh",
    sourceWeight: 0.7
  }
];

async function main() {
  const prisma = getPrisma();
  for (const source of defaultSources) {
    await prisma.source.upsert({
      where: { key: source.key },
      create: {
        ...source,
        enabled: true,
        fetchIntervalMinutes: 180,
        lastStatus: "idle"
      },
      update: {
        name: source.name,
        type: source.type,
        endpoint: source.endpoint,
        locale: source.locale,
        enabled: true,
        sourceWeight: source.sourceWeight,
        fetchIntervalMinutes: 180
      }
    });
  }

  console.log(`Seeded Felix's HotWords Radar sources: ${defaultSources.length} compliant public sources.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectPrisma();
  });
