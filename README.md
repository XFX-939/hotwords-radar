# Felix's HotWords Radar

每日热点雷达系统。第一版是一个可运行的 MVP：使用 mock 数据源模拟每日热点抓取，写入 SQLite/Prisma 数据库，页面通过 API 读取数据库数据，不在每次打开页面时实时抓取。

## 功能

- 首页 `/`：今日词云、Top 20 热词榜、飙升热词、AI 摘要、分类热点、趋势图、数据源状态
- 热点榜 `/trending`：搜索、分类筛选、数据源筛选、按热度/涨幅/出现时间排序
- 热词详情 `/word/[keyword]`：热度分、排名、趋势折线、事件解释、相关词、来源、情绪和创作建议
- 关系图 `/map`：热词共现关系网络，点击节点进入详情页
- 日报 `/daily`：每日热点 Markdown 日报，支持复制 Markdown，PNG 导出按钮已预留
- 数据源 `/sources`：数据源状态、手动刷新、刷新日志

## 技术栈

- Next.js App Router + React + TypeScript
- Tailwind CSS
- ECharts + echarts-wordcloud
- Prisma + SQLite（开发阶段）
- node-cron 定时任务结构
- AI 分析接口预留，当前使用 mock/template 生成

## 快速启动

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

默认地址：

```text
http://127.0.0.1:3000
```

环境变量在 `.env`：

```env
DATABASE_URL="file:./dev.db"
ENABLE_DEV_REFRESH="true"
AI_PROVIDER="mock"
```

## 常用命令

```bash
npm run test       # pipeline 单元测试
npm run build      # Next.js 生产构建
npm run refresh    # 手动执行一次抓取/清洗/入库/日报生成
npm run cron       # 本地 cron worker，09:00/11:30/15:00/20:00 刷新
```

## 数据处理流程

核心代码在 `src/lib`：

- `mock-data.ts`：第一版 mock 数据源与热点内容
- `pipeline.ts`：文本清洗、关键词提取、热度计算、分类、情绪、日报生成
- `refresh.ts`：抓取数据源、写入 RawItem、聚合 Keyword、生成 Snapshot/Relation/DailyReport/FetchLog
- `queries.ts`：页面 API 的数据库查询与详情组装

真实数据接入时，优先替换 `fetchSources()`，保留后面的清洗、聚合、评分、入库接口。

## 定时任务

本地定时任务在 `scripts/cron.ts`，时间为 Asia/Shanghai：

- 09:00
- 11:30
- 15:00
- 20:00

部署到 Vercel 时，可以把 `POST /api/refresh` 接到 Vercel Cron；GitHub Actions 也可以调用同一个接口或执行 `npm run refresh`。

## 数据模型

Prisma schema 在 `prisma/schema.prisma`，包含：

- `Source`
- `RawItem`
- `Keyword`
- `KeywordSnapshot`
- `KeywordRelation`
- `DailyReport`
- `FetchLog`

当前 SQLite 下 `RawItem.rawJson` 使用字符串保存 JSON，方便后续切换 PostgreSQL 时改回原生 `Json` 类型。

## 说明

第一版不包含登录、权限、付费和真实全网爬虫。手动刷新在生产环境默认关闭，除非设置 `ENABLE_DEV_REFRESH=true`。
