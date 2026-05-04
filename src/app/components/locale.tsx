"use client"

import { useState, createContext, useContext } from "react"

type Locale = "zh" | "en"

const LocaleContext = createContext<{ locale: Locale; setLocale: (l: Locale) => void }>({
  locale: "zh", setLocale: () => {},
})

export function useLocale() { return useContext(LocaleContext) }

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("zh")
  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function LocaleToggle() {
  const { locale, setLocale } = useLocale()
  return (
    <button
      onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
      className="px-3 py-1.5 rounded-full border border-brand-black dark:border-white/20 text-[10px] font-bold uppercase tracking-widest text-foreground hover:bg-brand-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors cursor-pointer"
      title="Switch language"
    >
      {locale === "zh" ? "EN" : "中"}
    </button>
  )
}

const I18N: Record<string, Record<Locale, string>> = {
  "all": { zh: "全部", en: "All" },
  "updates": { zh: "条更新", en: " updates" },
  "search": { zh: "搜索更新...", en: "Search updates..." },
  "no_results": { zh: "未找到更新", en: "No updates found" },
  "try_filter": { zh: "尝试调整筛选条件", en: "Try adjusting your filters" },
  "weekly": { zh: "周报", en: "Weekly" },
  "monthly": { zh: "月报", en: "Monthly" },
  "trend": { zh: "趋势", en: "Trend" },
  "ad-product": { zh: "广告产品", en: "Ad Product" },
  "api-change": { zh: "API 变更", en: "API Change" },
  "policy": { zh: "政策更新", en: "Policy" },
  "creative": { zh: "创意工具", en: "Creative" },
  "measurement": { zh: "衡量归因", en: "Measurement" },
  "targeting": { zh: "定向能力", en: "Targeting" },
  "automation": { zh: "自动化", en: "Automation" },
  "other": { zh: "其他", en: "Other" },
  "high": { zh: "重要", en: "High" },
  "medium": { zh: "一般", en: "Medium" },
  "low": { zh: "次要", en: "Low" },
  "social": { zh: "社交/短视频", en: "Social/Video" },
  "search_cat": { zh: "搜索/应用商店", en: "Search/App Store" },
  "video": { zh: "视频", en: "Video" },
  "asia": { zh: "亚洲区域", en: "Asia" },
  "dsp": { zh: "程序化/DSP", en: "Programmatic/DSP" },
  "cn-oem": { zh: "国内厂商", en: "CN OEM" },
}

export function t(key: string, locale: Locale): string {
  return I18N[key]?.[locale] || key
}
