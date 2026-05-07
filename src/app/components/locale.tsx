"use client"

import { createContext, useContext, useState } from "react"

type Locale = "zh" | "en"

const LocaleContext = createContext<{ locale: Locale; setLocale: (l: Locale) => void }>({
  locale: "zh",
  setLocale: () => {},
})

export function useLocale() {
  return useContext(LocaleContext)
}

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
  const toggleLocale = () => setLocale(locale === "zh" ? "en" : "zh")

  return (
    <button
      onClick={toggleLocale}
      className="hover:text-brand-blue transition-colors focus-visible:outline-none focus-visible:text-brand-blue"
      aria-label={locale === "zh" ? "Switch to English" : "切换到中文"}
      aria-pressed={locale === "zh"}
    >
      {locale === "zh" ? "EN" : "中"}
    </button>
  )
}

const I18N: Record<string, Record<Locale, string>> = {
  all: { zh: "全部", en: "All" },
  updates: { zh: "条更新", en: " updates" },
  search: { zh: "搜索更新...", en: "Search updates..." },
  no_results: { zh: "未找到更新", en: "No updates found" },
  try_filter: { zh: "尝试调整筛选条件", en: "Try adjusting your filters" },
}

export function t(key: string, locale: Locale): string {
  return I18N[key]?.[locale] || key
}
