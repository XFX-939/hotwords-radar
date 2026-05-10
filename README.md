# Felix's HotWords Radar

每日热点雷达系统。当前版本定位为“合规公开数据源聚合系统”：后台定时拉取官方 API、公开 RSS/Atom/JSON Feed 和自维护 RSS 源，先写入数据库，再生成综合热度分、词云、榜单、关系图和日报。

> 综合热度分只代表本系统已接入公开数据源内的聚合信号，不代表全网真实热度，也不代表任何第三方平台官方热度。

## 功能

- 首页 `/`：词云、Top 20 热词榜、飙升热词、公开数据源统计、日报摘要、趋势图、数据源状态
- 热点榜 `/trending`：中文/英文来源切换、搜索、分类筛选、数据源筛选、按热度/涨幅/出现时间排序
- 热词详情 `/word/[keyword]`：综合热度分、排名、趋势折线、事件解释、相关词、真实来源、情绪和创作建议
- 关系图 `/map`：热词共现关系网络，点击节点进入详情页
- 日报 `/daily`：基于真实 Keyword 和 RawItem 的 Markdown 日报，PNG 导出按钮已预留
- 数据源 `/sources`：Source 配置、FetchLog、失败信息、手动刷新

## 合规边界

第一版只接入：

- 官方开放 API：NewsAPI、GDELT、GitHub REST/Search API
- 公开 RSS / Atom / JSON Feed
- 数据库中自维护的 RSS URL

当前 seed 内置英文与中文两组来源。中文来源包括 36氪综合 RSS、36氪快讯 RSS、少数派 RSS、爱范儿 RSS、美团技术团队 RSS、华为安全通告 RSS；英文来源包括 GitHub API、GitHub Blog、Cloudflare Blog、BBC Technology、arXiv cs.AI、NewsAPI、GDELT 等。`Source.locale` 用于区分 `zh` / `en`，前端可切换“全部来源 / 中文来源 / 英文来源”三套聚合结果。

## 数据源与语言模式

系统不会在页面打开时实时访问第三方站点。所有外部数据都由后台任务统一更新：

```text
公开 API / RSS
→ RawItem 入库
→ 按 all / zh / en 分组聚合
→ Keyword / Snapshot / Relation / DailyReport
→ 页面 API 从数据库读取
```

语言模式说明：

- `all`：综合所有启用来源计算结果。
- `zh`：只使用中文公开信息源计算结果。
- `en`：只使用英文公开信息源计算结果。

这些结果是分别生成的，不是前端简单过滤同一份榜单。

不实现：

- 登录、Cookie、验证码绕过
- 代理池、规避检测、模拟浏览器访问
- 微博、知乎、B站、抖音、小红书、头条等非官方页面爬虫
- 高频访问第三方页面

## 技术栈

- Next.js App Router + React + TypeScript
- Tailwind CSS
- ECharts
- Prisma + SQLite（开发阶段，可迁移 PostgreSQL）
- node-cron / Vercel Cron
- NewsAPI / GDELT / GitHub API / rss-parser

## 环境变量

复制 `.env.example` 为 `.env`：

```env
DATABASE_URL="file:./dev.db"
NEWS_API_KEY=""
GITHUB_TOKEN=""
CRON_SECRET="change-me"
GDELT_BASE_URL="https://api.gdeltproject.org/api/v2"
ENABLE_DEV_REFRESH="false"
AI_PROVIDER="mock"
```

说明：

- `NEWS_API_KEY`：NewsAPI 官方 key，缺失时 NewsAPI 数据源会失败并写入 FetchLog，不影响其他源。
- `GITHUB_TOKEN`：可选，用于提高 GitHub API 限额。
- `CRON_SECRET`：Vercel Cron / 生产环境手动触发任务的校验 token。
- `ENABLE_DEV_REFRESH`：仅用于开发或内网部署时开放无 token 手动刷新。

## 快速启动

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run refresh
npm run dev
```

默认地址：

```text
http://127.0.0.1:3000
```

本地开发注意：

- `npm run dev` 默认监听 `127.0.0.1`。
- 不建议在 dev server 运行时同时执行 `npm run build`。如果页面突然变成无样式的裸 HTML，停止 dev server，删除或挪走 `.next` 后重新 `npm run dev`。

## 常用命令

```bash
npm run test       # pipeline 单元测试
npm run build      # Next.js 生产构建
npm run refresh    # 手动执行一次公开数据源入库/聚合/日报生成
npm run cron       # 本地 cron worker，09:00/11:30/15:00/20:00 刷新
```

## 数据处理流程

核心代码：

- `src/lib/ingestion/adapters.ts`：按 Source.type 分发 adapter
- `src/lib/ingestion/rss-adapter.ts`：公开 RSS/Atom/JSON Feed
- `src/lib/ingestion/newsapi-adapter.ts`：NewsAPI 官方接口
- `src/lib/ingestion/gdelt-adapter.ts`：GDELT 官方公开接口
- `src/lib/ingestion/github-api-adapter.ts`：GitHub 官方 REST/Search API
- `src/lib/ingestion/run.ts`：读取 Source、拉取、RawItem 去重、Keyword 聚合、Mention、Snapshot、Relation、DailyReport
- `src/lib/pipeline.ts`：文本清洗、关键词提取、停用词/自定义词典、分类、情绪、综合热度分和日报模板
- `src/lib/queries.ts`：页面 API 的数据库查询与详情组装

流程：

```text
Source
→ SourceAdapter.fetch()
→ RawItem 去重入库
→ 按 all / zh / en 生成 Keyword / KeywordMention 聚合
→ KeywordSnapshot 趋势快照
→ KeywordRelation 共现关系
→ DailyReport 模板日报
→ 页面 API 从数据库读取
```

## 手动触发

开发环境：

```bash
curl -X POST http://127.0.0.1:3000/api/jobs/ingest-hotwords
```

生产环境：

```bash
curl -X POST https://your-domain.com/api/jobs/ingest-hotwords \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Ubuntu 部署参考

服务器要求：

- Ubuntu Server 24.04 LTS
- Node.js 20+
- npm
- Git
- 可写的应用目录，例如 `/var/www/hotwords-radar`

首次部署：

```bash
git clone git@github.com:XFX-939/hotwords-radar.git /var/www/hotwords-radar
cd /var/www/hotwords-radar
cp .env.example .env
npm ci
npm run db:generate
npm run db:migrate
npm run db:seed
npm run refresh
npm run build
npm run start
```

生产环境建议用 systemd 托管：

```ini
[Unit]
Description=Felix's HotWords Radar
After=network.target

[Service]
WorkingDirectory=/var/www/hotwords-radar
Environment=NODE_ENV=production
Environment=PORT=3005
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Nginx 反向代理示例：

```nginx
server {
  server_name hotwords.xiangfuxing.tech;

  location / {
    proxy_pass http://127.0.0.1:3005;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## Vercel Cron

`vercel.json` 已配置 4 个 UTC 时间点，对应北京时间：

- `0 1 * * *` → 09:00
- `30 3 * * *` → 11:30
- `0 7 * * *` → 15:00
- `0 12 * * *` → 20:00

Vercel Cron 会以 GET 调用 API，并自动带上 `Authorization: Bearer $CRON_SECRET`。Hobby 计划如果 cron 数量受限，可以改成一个每小时任务，在接口内部按北京时间判断是否执行。

## 数据模型

Prisma schema 在 `prisma/schema.prisma`，包含：

- `Source`
  - `locale` 标记来源语言：`zh`、`en`
- `RawItem`
- `Keyword`
  - `locale` 标记该热词属于全部来源、中文来源或英文来源聚合
- `KeywordMention`
- `KeywordSnapshot`
- `KeywordRelation`
- `DailyReport`
  - `locale` 支持按全部/中文/英文来源生成日报
- `FetchLog`

## Demo / fallback

`src/lib/mock-data.ts` 仍保留为开发演示素材，但默认 pipeline 不再调用它。页面不会把 mock 数据伪装成真实数据；没有真实 RawItem/Keyword 时会显示空状态。
