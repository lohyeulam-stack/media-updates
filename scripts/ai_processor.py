"""MiniMax M2.7 AI processor — weekly extraction + monthly report generation."""

from __future__ import annotations

import json
import os
from datetime import datetime

import requests

API_URL = "https://api.minimax.chat/v1/text/chatcompletion_v2"
MODEL = "MiniMax-M2.7-highspeed"

EXTRACT_PROMPT = """你是一个广告行业情报分析师。我会给你一个广告平台官方博客页面的文本内容和链接列表。

你的任务：
1. 从中提取所有能识别到的**文章/更新条目**
2. **严格只提取日期在 {date_range} 范围内的文章**
3. 任何日期在此范围之外的文章（包括2025年及更早的）必须排除，绝对不要返回
4. 如果无法确定日期，跳过该条目不要包含
5. 排除导航链接、页脚链接、广告链接、登录注册、"Learn more"/"Read more"按钮等非文章内容
6. 对于 API changelog 类型的内容，将同一天的多个变更合并为一条，在摘要中列出所有变更点

对每篇文章返回：
{{
  "title": "中文标题（英文原文翻译为中文）",
  "titleOriginal": "原始英文标题",
  "summary": "200字以内中文摘要，突出对广告投放团队的实际影响和关键变更",
  "category": "分类",
  "importance": "high/medium/low",
  "tags": ["标签1", "标签2", "标签3"],
  "sourceUrl": "文章链接（如果有的话）",
  "date": "YYYY-MM-DD 格式的发布日期"
}}

分类选项：ad-product / api-change / policy / creative / measurement / targeting / automation / other
重要程度：high=重大功能或破坏性变更 / medium=功能优化 / low=小调整或营销内容

严格返回 JSON 数组，无其他文本。如果没有符合条件的文章，返回 []"""


MONTHLY_REPORT_PROMPT = """你是一个广告行业资深编辑。请根据以下数据，撰写一份**{month}月媒体平台更新月报**。

要求：
1. 使用 Markdown 格式
2. 按平台类别分大段：社交/短视频、搜索/应用商店、视频、亚洲区域、程序化/DSP、国内厂商海外渠道
3. 每个平台的更新用**自然语言段落**描述，不要用列表
4. **每条更新必须以 Markdown 超链接形式嵌入标题**，格式为 [更新标题](sourceUrl字段的值)。数据中的 sourceUrl 字段就是链接地址，你必须使用它
5. 突出对广告投放团队的影响
6. 文章开头有一段100字的月度总结概览
7. 没有更新的平台不要提及
8. 语言：中文
9. 总长度控制在 2000-4000 字

示例格式：
## 社交/短视频
### TikTok
本月TikTok API发布多项增强。[Smart+广告互动组件支持扩展](https://business-api.tiktok.com/...)使广告主可以管理互动插件。同时[关键词发现工具扩展至11个新地区](https://business-api.tiktok.com/...)，覆盖英国、法国等市场。

数据（JSON格式，注意使用每条数据中的 sourceUrl 作为超链接地址）：
{data}"""


def _call_minimax(system_prompt: str, user_content: str, timeout: int = 90) -> str | None:
    api_key = os.environ.get("MINIMAX_API_KEY", "")
    if not api_key:
        print("[AI] MINIMAX_API_KEY not set")
        return None

    try:
        resp = requests.post(
            API_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content},
                ],
            },
            timeout=timeout,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"[AI] API error: {e}")
        return None


def extract_and_summarize(
    page_text: str,
    links: list[dict],
    platform: str,
    source_name: str,
    week_start: str,
    week_end: str,
) -> list[dict]:
    prompt = EXTRACT_PROMPT.format(date_range=f"{week_start} 至 {week_end}")

    links_text = "\n".join(
        f"- [{l.get('title', '')}]({l.get('url', '')}) (date: {l.get('date', 'unknown')})"
        for l in links[:30]
    )

    user_content = f"""平台: {platform} ({source_name})
日期范围: {week_start} 至 {week_end}

=== 页面链接列表 ===
{links_text}

=== 页面文本内容（前1万字） ===
{page_text[:10000]}"""

    content = _call_minimax(prompt, user_content)
    if not content:
        return _fallback_from_links(links, platform, source_name)

    try:
        start = content.find("[")
        end = content.rfind("]") + 1
        if start >= 0 and end > start:
            parsed = json.loads(content[start:end])
            for item in parsed:
                item["platform"] = platform
                item["source"] = source_name
            print(f"[AI] Extracted {len(parsed)} articles from {source_name}")
            return parsed
    except json.JSONDecodeError:
        pass

    print(f"[AI] Failed to parse response for {source_name}")
    return []


def generate_monthly_report(month_label: str, all_updates: list[dict]) -> str:
    if not all_updates:
        return f"# {month_label} 媒体平台更新月报\n\n本月暂无收录更新。"

    data_json = json.dumps(all_updates, ensure_ascii=False, indent=1)
    if len(data_json) > 30000:
        data_json = data_json[:30000] + "\n... (truncated)"

    prompt = MONTHLY_REPORT_PROMPT.format(month=month_label, data="{data}")
    content = _call_minimax(prompt, f"数据：\n{data_json}", timeout=120)

    if content:
        print(f"[AI] Monthly report generated: {len(content)} chars")
        return content

    return _fallback_monthly_report(month_label, all_updates)


def _fallback_from_links(links: list[dict], platform: str, source_name: str) -> list[dict]:
    return [
        {
            "title": l.get("title", ""),
            "titleOriginal": l.get("title", ""),
            "summary": l.get("snippet", ""),
            "category": "other",
            "importance": "medium",
            "tags": [],
            "sourceUrl": l.get("url", ""),
            "date": l.get("date", ""),
            "platform": platform,
            "source": source_name,
        }
        for l in links
        if l.get("title", "").strip() and len(l.get("title", "")) > 8
    ]


def _fallback_monthly_report(month_label: str, updates: list[dict]) -> str:
    lines = [f"# {month_label} 媒体平台更新月报\n"]
    by_platform: dict[str, list[dict]] = {}
    for u in updates:
        by_platform.setdefault(u.get("platform", "other"), []).append(u)

    for plat, items in sorted(by_platform.items()):
        lines.append(f"\n## {plat.upper()}\n")
        for item in items:
            url = item.get("sourceUrl", "")
            title = item.get("title", "Unknown")
            summary = item.get("summary", "")
            if url:
                lines.append(f"- [{title}]({url}): {summary[:100]}")
            else:
                lines.append(f"- {title}: {summary[:100]}")

    return "\n".join(lines)
