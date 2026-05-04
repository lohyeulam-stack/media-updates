/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Platform =
  | "tiktok" | "meta" | "snapchat" | "pinterest" | "x" | "linkedin"
  | "google" | "apple"
  | "youtube" | "spotify"
  | "kuaishou" | "line" | "naver" | "kakao"
  | "dv360" | "applovin" | "ironsource" | "mintegral" | "pangle" | "amazon"
  | "huawei" | "xiaomi" | "oppo" | "vivo";

export type PlatformGroup =
  | "social" | "search" | "video" | "asia" | "programmatic" | "domestic";

export interface MediaUpdate {
  id: string;
  date: string;
  week: string; // e.g., "2026-W17"
  month: string; // e.g., "2026-04"
  platform: Platform;
  title: string;
  titleOriginal?: string;
  summary: string;
  category: string;
  importance: "high" | "medium" | "low";
  source: string;
  sourceUrl: string;
  tags: string[];
  fetchedAt: string;
}
