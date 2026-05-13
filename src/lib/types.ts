export type Platform =
  | "tiktok" | "meta" | "snapchat" | "pinterest" | "x" | "linkedin" | "quora"
  | "google" | "apple" | "bing"
  | "youtube" | "spotify" | "netflix" | "uber"
  | "kwai" | "line" | "naver" | "kakao" | "bigo" | "newsbreak" | "smartnews" | "vk" | "yandex" | "mediago"
  | "dv360" | "applovin" | "ironsource" | "mintegral" | "pangle" | "amazon" | "ttd" | "taboola" | "outbrain" | "criteo" | "moloco" | "miq"
  | "huawei" | "xiaomi" | "oppo" | "vivo"

export type Category =
  | "ad-product" | "api-change" | "policy" | "creative"
  | "measurement" | "targeting" | "automation" | "other"

export type PlatformCategory = "social" | "search" | "video" | "asia" | "dsp" | "cn-oem"

export interface MediaUpdate {
  id: string
  date: string
  week?: string
  platform: Platform
  title: string
  titleOriginal?: string
  summary: string
  category: Category
  importance: "high" | "medium" | "low"
  source: string
  sourceUrl: string
  imageUrl?: string | null
  tags: string[]
  fetchedAt: string
}

export const PLATFORM_META: Record<Platform, { label: string; color: string; group: PlatformCategory }> = {
  tiktok:      { label: "TikTok",      color: "#000000", group: "social" },
  meta:        { label: "Meta",        color: "#0081FB", group: "social" },
  snapchat:    { label: "Snapchat",    color: "#FFFC00", group: "social" },
  pinterest:   { label: "Pinterest",   color: "#E60023", group: "social" },
  x:           { label: "X (Twitter)", color: "#000000", group: "social" },
  linkedin:    { label: "LinkedIn",    color: "#0A66C2", group: "social" },
  quora:       { label: "Quora",       color: "#B92B27", group: "social" },
  google:      { label: "Google",      color: "#4285F4", group: "search" },
  apple:       { label: "Apple",       color: "#000000", group: "search" },
  bing:        { label: "Bing",        color: "#008373", group: "search" },
  youtube:     { label: "YouTube",     color: "#FF0000", group: "video" },
  spotify:     { label: "Spotify",     color: "#1DB954", group: "video" },
  netflix:     { label: "Netflix",     color: "#E50914", group: "video" },
  uber:        { label: "Uber",        color: "#000000", group: "video" },
  kwai:        { label: "快手",         color: "#FF4906", group: "asia" },
  line:        { label: "LINE",        color: "#06C755", group: "asia" },
  naver:       { label: "Naver",       color: "#03CF5D", group: "asia" },
  kakao:       { label: "Kakao",       color: "#FEE500", group: "asia" },
  bigo:        { label: "Bigo Ads",    color: "#4A90E2", group: "asia" },
  newsbreak:   { label: "NewsBreak",   color: "#FF6B6B", group: "asia" },
  smartnews:   { label: "SmartNews",   color: "#00A0E9", group: "asia" },
  vk:          { label: "VK",          color: "#4680C2", group: "asia" },
  yandex:      { label: "Yandex",      color: "#FF0000", group: "asia" },
  mediago:     { label: "MediaGo",     color: "#6C5CE7", group: "asia" },
  dv360:       { label: "DV360",       color: "#4285F4", group: "dsp" },
  applovin:    { label: "AppLovin",    color: "#1A73E8", group: "dsp" },
  ironsource:  { label: "ironSource",  color: "#5C6BC0", group: "dsp" },
  mintegral:   { label: "Mintegral",   color: "#FF6F00", group: "dsp" },
  pangle:      { label: "Pangle",      color: "#FF4081", group: "dsp" },
  amazon:      { label: "Amazon",      color: "#FF9900", group: "dsp" },
  ttd:         { label: "The Trade Desk", color: "#00A3E0", group: "dsp" },
  taboola:     { label: "Taboola",     color: "#0055FF", group: "dsp" },
  outbrain:    { label: "Outbrain",    color: "#FF6600", group: "dsp" },
  criteo:      { label: "Criteo",      color: "#FF5000", group: "dsp" },
  moloco:      { label: "Moloco",      color: "#6C5CE7", group: "dsp" },
  miq:         { label: "MiQ",         color: "#00B8D4", group: "dsp" },
  huawei:      { label: "Huawei",      color: "#CF0A2C", group: "cn-oem" },
  xiaomi:      { label: "Xiaomi",      color: "#FF6700", group: "cn-oem" },
  oppo:        { label: "OPPO",        color: "#1BA784", group: "cn-oem" },
  vivo:        { label: "vivo",        color: "#415FFF", group: "cn-oem" },
}

export const GROUP_LABELS: Record<PlatformCategory, string> = {
  social: "社交/短视频",
  search: "搜索/应用商店",
  video: "视频",
  asia: "亚洲区域",
  dsp: "程序化/DSP",
  "cn-oem": "国内厂商海外渠道",
}

export const CATEGORY_LABELS: Record<Category, string> = {
  "ad-product": "广告产品",
  "api-change": "API 变更",
  policy: "政策更新",
  creative: "创意工具",
  measurement: "衡量归因",
  targeting: "定向能力",
  automation: "自动化",
  other: "其他",
}
