"use client"

import { useEffect, useState } from "react"
import { useT } from "./I18nProvider"

type Theme = "light" | "dark"

export function ThemeToggle() {
  const t = useT()
  const [theme, setTheme] = useState<Theme>("dark")

  useEffect(() => {
    const stored = (localStorage.getItem("azeroth-theme") as Theme) || "dark"
    setTheme(stored)
  }, [])

  function pick(next: Theme) {
    setTheme(next)
    document.documentElement.setAttribute("data-theme", next)
    localStorage.setItem("azeroth-theme", next)
  }

  return (
    <div className="flex" role="group" aria-label={t("theme.label")}>
      {(["light", "dark"] as Theme[]).map((item) => {
        const active = theme === item
        return (
          <button
            key={item}
            onClick={() => pick(item)}
            aria-pressed={active}
            className="-ml-px border border-line px-3 py-2 font-heading text-[11px] font-extrabold uppercase tracking-[0.08em]"
            style={{
              background: active ? "var(--color-text)" : "transparent",
              color: active ? "var(--color-bg)" : "var(--color-text)",
            }}
          >
            {item === "light" ? t("theme.light") : t("theme.dark")}
          </button>
        )
      })}
    </div>
  )
}
