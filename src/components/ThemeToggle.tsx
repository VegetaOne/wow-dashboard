"use client"

import { useEffect, useState } from "react"
import { useT } from "./I18nProvider"

type Theme = "light" | "dark"

/**
 * Thema als Reiter mit Glyphe wie in der Warband-Übergabe:
 * ☀ Pergament (light) / ☾ Nacht (dark). Die Namen stehen als Titel und
 * Bezeichnung dabei – eine Glyphe allein sagt einem Screenreader nichts.
 */
export function ThemeToggle() {
  const t = useT()
  const [theme, setTheme] = useState<Theme>("dark")

  useEffect(() => {
    try {
      setTheme((localStorage.getItem("azeroth-theme") as Theme) || "dark")
    } catch {
      // Ohne Speicher bleibt es beim Standard
    }
  }, [])

  function pick(next: Theme) {
    setTheme(next)
    document.documentElement.setAttribute("data-theme", next)
    try {
      localStorage.setItem("azeroth-theme", next)
    } catch {
      // Ohne Speicher gilt die Wahl nur bis zum Neuladen
    }
  }

  return (
    <div className="flex" role="group" aria-label={t("theme.label")}>
      {(["light", "dark"] as Theme[]).map((item) => {
        const label = item === "light" ? t("theme.light") : t("theme.dark")
        return (
          <button
            key={item}
            onClick={() => pick(item)}
            aria-pressed={theme === item}
            aria-label={label}
            title={label}
            className="wb-tab"
            style={{ padding: "9px 11px", fontSize: 14, letterSpacing: 0 }}
          >
            {item === "light" ? "☀" : "☾"}
          </button>
        )
      })}
    </div>
  )
}
