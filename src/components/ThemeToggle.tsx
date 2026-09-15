"use client"

import { useEffect, useState } from "react"

type Theme = "light" | "dark"

export function ThemeToggle() {
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
    <div className="flex" role="group" aria-label="Farbschema">
      {(["light", "dark"] as Theme[]).map((t) => {
        const active = theme === t
        return (
          <button
            key={t}
            onClick={() => pick(t)}
            aria-pressed={active}
            className="-ml-px border border-line px-3 py-2 font-heading text-[11px] font-extrabold uppercase tracking-[0.08em]"
            style={{
              background: active ? "var(--color-text)" : "transparent",
              color: active ? "var(--color-bg)" : "var(--color-text)",
            }}
          >
            {t === "light" ? "Hell" : "Dunkel"}
          </button>
        )
      })}
    </div>
  )
}
