"use client"

import { ThemeProvider } from "next-themes"
import { LocaleProvider } from "./components/locale"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <LocaleProvider>{children}</LocaleProvider>
    </ThemeProvider>
  )
}
