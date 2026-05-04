# Media Updates v3 — 多媒体平台更新追踪系统

## 项目概述

为 TopTou 产品团队打造的广告平台更新信息聚合系统。覆盖 6 大类 20+ 平台的 32 个官方信息源，每周一自动采集上周更新，MiniMax M2.7 AI 生成中文摘要，月底自动生成文章式月报（内嵌超链接的 Markdown 文章）。

## 链接

- **线上**: https://media-updates.vercel.app（公开，可分享）
- **GitHub**: https://github.com/lohyeulam-stack/media-updates（public）

## 6 大类平台 (32 信息源)

| 类别 | 平台 |
|------|------|
| 社交/短视频 | TikTok(4), Meta(3), Snapchat(2), Pinterest(2), X(1), LinkedIn(1) |
| 搜索/应用商店 | Google(2), Apple(1) |
| 视频 | YouTube(1), Spotify(1) |
| 亚洲区域 | 快手(1), LINE(1), Naver(1), Kakao(1) |
| 程序化/DSP | DV360(1), AppLovin(1), ironSource(1), Mintegral(1), Pangle(1), Amazon(1) |
| 国内厂商 | Huawei(1), Xiaomi(1), OPPO(1), vivo(1) |

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 15 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui + react-markdown |
| AI | MiniMax M2.7 (周提取 + 月报生成) |
| 采集 | Python + Playwright (含 iframe 3次重试) |
| 自动化 | GitHub Actions (周一 CST 06:00 + 月底最后一天) |
| 数据 | JSON (data/updates.json + weekly/ + monthly/) |
| 部署 | Vercel (push 后自动部署) |

## 页面结构

- `/` — 首页：侧边栏(可折叠平台目录+周报+月报入口) + 卡片式更新列表 + 搜索/筛选
- `/report/2026-04` — 月报：AI 文章式 Markdown 渲染，按平台分段，更新标题内嵌超链接
- `/weekly/2026-W17` — 周报：卡片式按平台分组展示

## 响应式设计

- **桌面**：左侧边栏(可折叠分组) + 右侧双列卡片
- **移动端**：侧边栏隐藏 → 顶部横向滚动平台筛选药丸 + 月报入口徽章 + 单列卡片

## 采集流程

```
Playwright 批量渲染 32 URL (含 iframe 3次重试)
  → MiniMax AI 提取指定日期范围内文章 + 中文摘要
  → 5 轮自验证 (日期/标题/摘要/HTML/结构)
  → data/weekly/YYYY-WNN.json
  → 月底: AI 汇总月报 → data/monthly/YYYY-MM.md
```

## 运行命令

```bash
# 周报（上一周）
MINIMAX_API_KEY="xxx" py scripts/fetch_updates.py --mode=weekly

# 周报（当前周）
MINIMAX_API_KEY="xxx" py scripts/fetch_updates.py --mode=weekly --current-week

# 月报
MINIMAX_API_KEY="xxx" py scripts/fetch_updates.py --mode=monthly

# 回溯历史数据
MINIMAX_API_KEY="xxx" py scripts/fetch_updates.py --mode=backfill --backfill-year=2026 --backfill-start=1 --backfill-end=4

# 前端
npm run dev / npm run build

# 部署
vercel --prod --yes
```

## Python 环境

- Windows 启动器: `py`（不是 `python`）
- Python 3.14.0
- 依赖: requests, beautifulsoup4, playwright
- Playwright chromium: `py -m playwright install chromium`

## 当前数据状态

- 2026年1-3月：已回溯完成（95条更新 + 3份月报）
- 2026年4月：回溯进行中
- TikTok API Changelog：iframe 模式，3次重试，成功率约 70%

## 关键注意事项

- MiniMax API Key 存储在 GitHub Secrets，环境变量名 `MINIMAX_API_KEY`
- `web_search` 功能无效，AI 仅用于内容理解和结构化
- TikTok API iframe 页面加载不稳定（5-90秒不等），已实现 3 次重试
- Vercel 免费版不支持 private repo 构建，仓库保持 public
- GitHub 账号: lohyeulam-stack
