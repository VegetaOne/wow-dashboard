import Link from "next/link"
import { characterBase } from "@/lib/characterTabs"
import type { GameMode } from "@/lib/battlenet"
import type { CharacterWeek, InstanceStatus } from "@/lib/weekly"
import type { Language } from "@/lib/config-cache"
import {
  dateLocale,
  formatRemaining,
  translator,
  type Translate,
} from "@/lib/i18n"

/**
 * Tabelle der Wochenübersicht.
 *
 * Bewusst je Charakter eine Karte statt einer breiten Tabelle: die Zahl der
 * Instanzen ist je Modus verschieden, und eine Spalte je Instanz würde bei
 * Classic Era mit sieben Schlachtzügen noch gehen, bei Retail aber nicht.
 *
 * Server-Komponente: die Sprache kommt deshalb als Eigenschaft herein und
 * nicht über den Client-Kontext.
 */

function statusLabel(instance: InstanceStatus, t: Translate): string {
  if (instance.open) return t("weekly.statusOpen")
  const complete = instance.cleared.filter((c) => c.complete)
  if (complete.length > 0) return t("weekly.statusDone")
  return t("weekly.statusStarted")
}

function InstanceRow({
  instance,
  now,
  language,
  t,
}: {
  instance: InstanceStatus
  now: number
  language: Language
  t: Translate
}) {
  const label = statusLabel(instance, t)
  const remaining = formatRemaining(language, instance.window.end.getTime() - now)

  return (
    <tr>
      <td className="align-top">
        <span className="font-heading font-extrabold">{instance.name}</span>
        <span className="ml-2 text-[12px] opacity-50">
          {instance.expansionName}
        </span>
        {!instance.lockoutKnown && (
          <span className="ml-2 tag tag-outline text-[11px]">
            {t("weekly.lockoutAssumed")}
          </span>
        )}
        {instance.lockoutNote && (
          <div className="mt-0.5 text-[12px] opacity-55">
            {instance.lockoutNote}
          </div>
        )}
      </td>

      <td className="align-top">
        {instance.cleared.length === 0 ? (
          <span className="opacity-55">—</span>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {instance.cleared.map((c) => (
              <span
                key={c.difficulty}
                className={`tag text-[11px] ${c.complete ? "tag-accent" : "tag-neutral"}`}
                title={
                  c.complete
                    ? t("weekly.allBossesKilled")
                    : t("weekly.partiallyKilled")
                }
              >
                {c.difficultyName} {c.killed}/{c.total}
              </span>
            ))}
          </div>
        )}
      </td>

      <td className="align-top whitespace-nowrap">
        <span
          className="font-heading text-[13px] font-extrabold uppercase tracking-[0.06em]"
          style={{
            color: instance.open ? "var(--color-accent)" : "inherit",
            opacity: instance.open ? 1 : 0.6,
          }}
        >
          {label}
        </span>
      </td>

      <td className="align-top whitespace-nowrap text-right">
        <div className="text-[13px]">{remaining}</div>
        <div className="eyebrow">
          {t("weekly.days", { days: instance.window.days })}
          {instance.window.shortened ? t("weekly.shortened") : ""}
        </div>
      </td>
    </tr>
  )
}

export function WeeklyOverview({
  characters,
  mode,
  generatedAtMs,
  language,
}: {
  characters: CharacterWeek[]
  mode: GameMode
  generatedAtMs: number
  language: Language
}) {
  const t = translator(language)

  if (characters.length === 0) {
    return (
      <div className="border-2 border-line px-4 py-3 text-[13px]">
        <span className="eyebrow block">{t("weekly.noCharacters")}</span>
        {t("weekly.noCharactersHint")}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {characters.map((character) => {
        const openCount = character.instances.filter((i) => i.open).length

        return (
          <section
            key={`${character.realmSlug}:${character.name}`}
            className="border-2 border-line"
          >
            <div className="flex flex-wrap items-baseline gap-3 border-b-2 border-line px-4 py-3">
              <Link
                href={characterBase(mode, character.realmSlug, character.name)}
                className="font-heading text-[17px] font-extrabold tracking-[-0.01em] no-underline"
              >
                {character.name}
              </Link>
              <span className="text-[13px] opacity-60">
                {character.realmName} ·{" "}
                {t("character.levelClass", { level: character.level })} ·{" "}
                {character.className}
              </span>

              <span className="ml-auto eyebrow">
                {character.failed
                  ? t("weekly.characterFailed")
                  : character.instances.length === 0
                    ? t("weekly.noRaids")
                    : t("weekly.openOfTotal", {
                        open: openCount,
                        total: character.instances.length,
                      })}
              </span>
            </div>

            {character.stale && (
              <div className="border-b border-line px-4 py-1.5">
                <span className="eyebrow" style={{ color: "var(--color-accent)" }}>
                  {character.fetchedAt
                    ? t("weekly.lastKnownFrom", {
                        date: character.fetchedAt.toLocaleDateString(
                          dateLocale(language)
                        ),
                      })
                    : t("weekly.lastKnown")}
                </span>
              </div>
            )}

            {character.failed ? (
              <p className="px-4 py-3 text-[13px] opacity-60">
                {t("weekly.failedText")}
              </p>
            ) : character.instances.length === 0 ? (
              <p className="px-4 py-3 text-[13px] opacity-60">
                {t("weekly.noRaidData")}
              </p>
            ) : (
              <table className="table w-full">
                <thead>
                  <tr>
                    <th className="text-left">{t("weekly.colInstance")}</th>
                    <th className="text-left">{t("weekly.colCleared")}</th>
                    <th className="text-left">{t("weekly.colStatus")}</th>
                    <th className="text-right">{t("weekly.colResetIn")}</th>
                  </tr>
                </thead>
                <tbody>
                  {character.instances.map((instance) => (
                    <InstanceRow
                      key={`${instance.instanceId}:${instance.name}`}
                      instance={instance}
                      now={generatedAtMs}
                      language={language}
                      t={t}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )
      })}
    </div>
  )
}
