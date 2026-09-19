import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { GuildRoster } from "@/components/GuildRoster"
import { GAME_MODES, type GameMode } from "@/lib/battlenet"
import {
  attempt,
  characterGuild,
  guildProfile,
  guildRoster,
  guildActivity,
  guildAchievements,
} from "@/lib/character"
import {
  parseGuild,
  parseActivity,
  parseGuildAchievements,
  type GuildActivityEntry,
} from "@/lib/guild"
import { getT, getFormat } from "@/lib/t"
import type { Format } from "@/lib/format"
import type { Translate } from "@/lib/i18n"

export default async function GuildPage({
  params,
}: {
  params: { mode: string; realm: string; name: string }
}) {
  const session = await getServerSession(await getAuthOptions())
  if (!session?.accessToken) redirect("/login")

  const t = await getT()
  const f = await getFormat()
  const { realm, name } = params
  const config = GAME_MODES.find((m) => m.id === params.mode) ?? GAME_MODES[0]
  const mode = config.id as GameMode
  const token = session.accessToken

  const guildRef = await attempt(() => characterGuild({ realm, name, mode }, token))

  const header = (
    <div className="mb-6">
      <h3>{t("tab.guild")}</h3>
      <p className="mt-1 text-[13px] opacity-60">{t("guild.intro")}</p>
    </div>
  )

  if (guildRef.failed) {
    return (
      <div className="px-6 py-6">
        {header}
        <div className="border-2 border-accent px-4 py-3 text-[13px]">
          <span className="eyebrow block">{t("guild.membershipUnknown")}</span>
          {t("guild.profileEndpointFailedText")}
        </div>
      </div>
    )
  }

  const guild = guildRef.value
  if (!guild) {
    return (
      <div className="px-6 py-6">
        {header}
        <div className="border-2 border-line px-4 py-3 text-[13px] opacity-75">
          {t("guild.notInGuild")}
        </div>
      </div>
    )
  }

  const [profileResult, rosterResult, activityResult, achievementsResult] =
    await Promise.all([
      attempt(() => guildProfile(guild, mode, token)),
      attempt(() => guildRoster(guild, mode, token)),
      attempt(() => guildActivity(guild, mode, token)),
      attempt(() => guildAchievements(guild, mode, token)),
    ])

  const profile = parseGuild(profileResult.value)
  const roster = rosterResult.value
  const activity = parseActivity(activityResult.value)
  const achievements = parseGuildAchievements(achievementsResult.value)

  const stale =
    profileResult.stale ||
    rosterResult.stale ||
    activityResult.stale ||
    achievementsResult.stale
  const fetchedAt = rosterResult.fetchedAt ?? profileResult.fetchedAt

  // Die Mitgliederzahl aus dem Profil und die Länge der Liste können
  // auseinanderliegen – beide Zahlen sind belegbar, also beide zeigen.
  const listed = roster?.members.length ?? null

  return (
    <div className="px-6 py-6">
      {header}

      {stale && (
        <div className="mb-4 border-2 border-line px-4 py-2">
          <span className="eyebrow" style={{ color: "var(--color-accent)" }}>
            {fetchedAt
              ? t("weekly.lastKnownFrom", { date: f.date(fetchedAt.getTime()) })
              : t("weekly.lastKnown")}
          </span>
        </div>
      )}

      <div className="space-y-10">
        <section>
          <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h4 className="m-0">{profile?.name ?? guild.name}</h4>
            {profile?.realmName && (
              <span className="eyebrow">{profile.realmName}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label={t("card.faction")} value={profile?.faction ?? "—"} />
            <Stat
              label={t("guild.members")}
              value={
                profile?.memberCount !== null && profile?.memberCount !== undefined
                  ? f.number(profile.memberCount)
                  : listed !== null
                    ? f.number(listed)
                    : "—"
              }
              note={
                profile?.memberCount != null && listed !== null && listed !== profile.memberCount
                  ? t("guild.listShows", { count: f.number(listed) })
                  : undefined
              }
            />
            <Stat
              label={t("achievements.points")}
              value={
                profile?.achievementPoints != null
                  ? f.number(profile.achievementPoints)
                  : achievements.totalPoints != null
                    ? f.number(achievements.totalPoints)
                    : "—"
              }
              note={
                achievements.totalQuantity != null
                  ? t("guild.achievementsCount", { count: f.number(achievements.totalQuantity) })
                  : undefined
              }
            />
            <Stat
              label={t("guild.founded")}
              value={profile?.createdAt != null ? f.date(profile.createdAt) : "—"}
            />
          </div>
        </section>

        <section>
          {rosterResult.failed ? (
            <div className="border-2 border-accent px-4 py-3 text-[13px]">
              <span className="eyebrow block">{t("guild.rosterUnavailable")}</span>
              {t("guild.rosterEndpointFailedText")}
            </div>
          ) : (
            <GuildRoster
              members={roster?.members ?? []}
              mode={mode}
              canLoadItemLevels={config.hasRichProfile}
            />
          )}
        </section>

        <section>
          <h4 className="mb-3">{t("guild.recentEvents")}</h4>
          <ActivityList
            entries={activity}
            failed={activityResult.failed}
            t={t}
            f={f}
          />
        </section>

        <section>
          <h4 className="mb-3">{t("guild.recentAchievements")}</h4>
          {achievementsResult.failed ? (
            <div className="border-2 border-line px-4 py-3 text-[13px] opacity-75">
              {t("guild.achievementsEndpointFailed")}
            </div>
          ) : achievements.recent.length === 0 ? (
            <div className="border-2 border-line px-4 py-3 text-[13px] opacity-75">
              {t("guild.noAchievementsWithDate")}
            </div>
          ) : (
            <div className="border-2 border-line">
              {achievements.recent.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-wrap items-baseline gap-x-3 border-b border-line px-4 py-2 last:border-0"
                >
                  <span className="min-w-0 flex-1 basis-[200px] truncate text-[13px]">
                    {a.name}
                  </span>
                  <span className="flex-none text-[12px] opacity-50">
                    {f.date(a.completedAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  note,
}: {
  label: string
  value: string
  note?: string
}) {
  return (
    <div className="border-2 border-line px-4 py-3">
      <span className="eyebrow block">{label}</span>
      <span
        className="font-heading text-[20px] font-extrabold leading-tight tracking-[-0.01em]"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </span>
      {note && <span className="mt-0.5 block text-[11px] opacity-50">{note}</span>}
    </div>
  )
}

function ActivityList({
  entries,
  failed,
  t,
  f,
}: {
  entries: GuildActivityEntry[]
  failed: boolean
  t: Translate
  f: Format
}) {
  if (failed) {
    return (
      <div className="border-2 border-line px-4 py-3 text-[13px] opacity-75">
        {t("guild.activityEndpointFailedText")}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="border-2 border-line px-4 py-3 text-[13px] opacity-75">
        {t("guild.noEvents")}
      </div>
    )
  }

  return (
    <div className="border-2 border-line">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 border-b border-line px-4 py-2 last:border-0"
        >
          <span className="w-24 flex-none">
            <span className="eyebrow">
              {entry.kind === "achievement"
                ? t("guild.achievementKind")
                : t("guild.bossKillKind")}
            </span>
          </span>

          <span className="min-w-0 flex-1 basis-[180px] truncate text-[13px]">
            {entry.subject}
          </span>

          {entry.characterName && (
            <span className="flex-none text-[12px] opacity-70">
              {entry.characterName}
            </span>
          )}

          {entry.detail && (
            <span className="tag tag-neutral flex-none">{entry.detail}</span>
          )}

          <span className="w-20 flex-none text-right text-[11px] opacity-50">
            {f.date(entry.timestamp)}
          </span>
        </div>
      ))}
    </div>
  )
}
