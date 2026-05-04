# 媒体信息系统 — 工作流规范

## 信息流全景

```
信息源 (28 URLs)
     │
     ▼
┌──────────────────────────────────┐
│  Stage 1: 采集 (Playwright)       │
│  · 渲染 JS 页面                    │
│  · iframe 页面 3 次重试            │
│  · 提取页面文本 + 链接             │
│  · 单源超时不影响整体              │
└──────────────┬───────────────────┘
               ▼
┌──────────────────────────────────┐
│  Stage 2: AI 提取 (MiniMax M2.7)  │
│  · 严格按日期范围过滤              │
│  · 中文标题 + 200字摘要            │
│  · 分类 + 重要程度 + 标签          │
│  · CTA 文本 / 非文章内容排除       │
│  · 无 URL 时 fallback 到页面 URL   │
└──────────────┬───────────────────┘
               ▼
┌──────────────────────────────────┐
│  Stage 3: 验证 (5 轮检查)          │
│  ① 日期在指定范围内               │
│  ② 无垃圾标题 (Learn more 等)     │
│  ③ 80%+ 有中文摘要                │
│  ④ 无 HTML 乱码                   │
│  ⑤ 数据结构完整                   │
└──────────────┬───────────────────┘
               ▼
┌──────────────────────────────────┐
│  Stage 4: 存储                    │
│  · data/updates.json (全量)       │
│  · data/weekly/YYYY-WNN.json     │
│  · data/monthly/YYYY-MM.md       │
└──────────────┬───────────────────┘
               ▼
┌──────────────────────────────────┐
│  Stage 5: 部署                    │
│  · git push → Vercel 自动构建     │
│  · Next.js SSG 静态生成           │
│  · 公开访问无需登录               │
└──────────────────────────────────┘
```

---

## 触发时机

| 触发 | 时间 | 模式 | 数据范围 |
|------|------|------|----------|
| 每周一 | CST 06:00 (UTC Sun 22:00) | `--mode=weekly` | 上一周 (Mon-Sun) |
| 月底最后一天 | CST 06:00 | `--mode=monthly` | 当月全部数据 |
| 手动 backfill | 按需 | `--mode=backfill` | 指定月份范围 |

GitHub Actions cron:
- 周报: `0 22 * * 0`
- 月报: `0 22 28-31 * *` (检查是否月底最后一天)

---

## 数据命名规范

| 类型 | 格式 | 示例 | 说明 |
|------|------|------|------|
| 周数据文件 | `YYYY-WNN.json` | `2026-W17.json` | ISO 8601 周编号 |
| 月报文件 | `YYYY-MM.md` | `2026-04.md` | Markdown 文章 |
| 更新 ID | `{platform}-{date}-{seq}` | `tiktok-2026-04-24-001` | 平台-日期-序号 |
| week 字段 | `YYYY-WNN` | `2026-W17` | ISO 周标签，用 `isocalendar()` 计算 |

**禁止**: 使用 `M01` 等月份格式作为周标签。周数据必须用 ISO `W` 格式。

---

## 平台信息源规则

### 分类
| 类别代码 | 名称 | 当前平台 |
|----------|------|----------|
| `social` | 社交/短视频 | TikTok, Meta, Snapchat, Pinterest, X |
| `search` | 搜索/应用商店 | Google, Apple |
| `video` | 视频 | YouTube |
| `asia` | 亚洲区域 | 快手, LINE, Naver, Kakao |
| `dsp` | 程序化/DSP | DV360, AppLovin, ironSource, Mintegral, Pangle, Amazon |
| `cn-oem` | 国内厂商海外渠道 | Huawei, Xiaomi, OPPO, vivo |

### 新增信息源步骤
1. 在 `scripts/sources_config.py` 的 `SOURCES` 列表中添加条目
2. 必须包含字段: `platform`, `name`, `url`, `wait_ms`, `category`
3. JS 重渲染页面: `wait_ms` 设为 5000+
4. iframe 页面: 添加 `"use_iframe": True`
5. 在 `src/lib/types.ts` 的 `Platform` 类型和 `PLATFORM_META` 中注册新平台
6. 在前端验证侧边栏显示正常

### 特殊处理
- **TikTok API Changelog**: iframe 模式，3 次重试，每次最多等 90 秒
- **快手/Naver/Kakao**: JS 渲染内容少，可能返回 0 文章属正常

---

## AI 处理规则

### 周报提取 (extract_and_summarize)
- 输入: 页面文本 + 链接列表 + 日期范围
- 输出: JSON 数组，每条含 title/titleOriginal/summary/category/importance/tags/sourceUrl/date
- **强制**: 只返回日期范围内的文章，2025 年及更早的必须排除
- **强制**: 排除 Learn more / Read more 等 CTA 文本
- **强制**: API changelog 同天多条合并为一条
- **sourceUrl**: 如果 AI 没返回 URL，使用页面 URL 作为 fallback

### 月报生成 (generate_monthly_report)
- 输入: 当月所有 updates 数据
- 输出: Markdown 文章
- **格式**: 按平台类别分段，自然语言描述，关键更新标题内嵌超链接
- **长度**: 2000-4000 字
- **语言**: 中文
- **开头**: 100 字月度总结概览
- **不包含**: 无更新的平台

---

## 前端展示规范

### 页面结构
| 路由 | 类型 | 说明 |
|------|------|------|
| `/` | 首页 | 侧边栏 + 卡片式更新列表 + 搜索/分类筛选 |
| `/report/YYYY-MM` | 月报 | AI 文章式 Markdown 渲染 |
| `/weekly/YYYY-WNN` | 周报 | 按平台分组的卡片列表 |

### 侧边栏
- 平台按 6 大类分组，可折叠
- 隐藏零数据的平台
- 底部: Weekly (绿点, W 格式) + Monthly (蓝点)
- 桌面端显示，移动端隐藏

### 移动端
- 顶部: 横向滚动平台筛选药丸 + 月报入口徽章
- 卡片: 单列排列
- 内容区: 紧凑 padding (p-4)

### 更新卡片
- 左侧彩色边框 (平台色)
- 标签: 平台 + 重要程度(红/黄/灰) + 分类
- 标题可点击跳转原文
- 摘要直接内联显示
- 底部: tags + 来源名称

---

## 验证检查清单

每次采集后自动运行，全部通过才算合格:

### 周报验证 (5 项)
- [ ] `dates_in_range`: 所有文章日期在指定范围内
- [ ] `no_garbage_titles`: 无 CTA 垃圾标题
- [ ] `summaries_present`: 80%+ 有中文摘要
- [ ] `no_html_in_text`: 标题和摘要无 HTML 标签
- [ ] `valid_structure`: 所有字段完整 (id/date/platform/title/summary/category/sourceUrl)

### 月报验证 (5 项)
- [ ] `report_not_empty`: 内容 > 200 字
- [ ] `has_platform_sections`: 有 2+ 个 `##` 段落
- [ ] `has_hyperlinks`: 包含 `[text](url)` 格式超链接
- [ ] `no_raw_json`: 无原始 JSON 泄露
- [ ] `reasonable_length`: 500-20000 字

---

## 部署流程

```bash
# 1. 本地开发
npm run dev

# 2. 构建检查
npm run build

# 3. 提交
git add -A
git commit -m "type: description"

# 4. 推送 (触发 Vercel 自动部署)
git push

# 5. 手动部署 (如需)
vercel --prod --yes
```

commit message 格式: `feat:` / `fix:` / `chore:` / `docs:`

---

## 故障排查

| 问题 | 原因 | 解决 |
|------|------|------|
| TikTok API 无数据 | iframe 超时 | 自动 3 次重试，GitHub Actions 环境通常更稳定 |
| 抓到 2025 年文章 | AI 日期过滤不严 | 检查 EXTRACT_PROMPT 中的日期范围强制约束 |
| "Learn more" 标题 | CTA 过滤遗漏 | 在 scraper.py 的 CTA_PATTERNS 中添加 |
| 月报无超链接 | AI 未使用 sourceUrl | 检查 MONTHLY_REPORT_PROMPT 中的超链接要求 |
| Vercel 构建失败 | repo 设为 private | Vercel 免费版不支持 private，保持 public |
| 周标签显示 M 格式 | backfill 用了月编号 | 必须用 `isocalendar()` 计算 ISO 周号 |
