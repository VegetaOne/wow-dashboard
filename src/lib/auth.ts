import { AuthOptions } from "next-auth"
import type { OAuthConfig } from "next-auth/providers/oauth"
import { JWT } from "next-auth/jwt"
import { configSnapshot } from "./config-cache"
import { oauthBase } from "./runtime"

/**
 * Battle.net Profil-Response vom userinfo-Endpoint:
 * { "sub": "123456789", "id": 123456789, "battletag": "User#1234" }
 */
interface BattleNetProfile {
  sub: string
  id: number
  battletag: string
}

/**
 * Zugangsdaten kommen aus der Konfiguration, nicht mehr aus der Umgebung.
 *
 * Gelesen wird der Zwischenspeicher, weil NextAuth diese Felder synchron
 * abfragt. Die Auth-Route wartet vor jeder Anfrage `loadConfig()` ab – so
 * ist der Speicher gefüllt, auch beim allerersten Aufruf nach dem Start,
 * und eine Änderung im Setup greift ohne Neustart des Containers.
 */
function credentials(): { id: string; secret: string } {
  const config = configSnapshot()
  return {
    id: config?.bnetClientId ?? "",
    secret: config?.clientSecret ?? "",
  }
}

/**
 * Battle.net als reiner OAuth2-Provider (NICHT OIDC).
 *
 * Grund: Battle.net setzt im ID-Token einen eigenen nonce, den next-auth
 * nie angefordert hat → "nonce mismatch" bei der OIDC-Validierung.
 * Ohne den openid-Scope wird kein ID-Token ausgestellt und next-auth
 * holt das Profil stattdessen vom userinfo-Endpoint. Kein nonce, kein Problem.
 *
 * Alle regions- und zugangsdatenabhängigen Felder sind **Getter**: als feste
 * Werte wären sie beim Laden des Moduls eingefroren, und eine Umstellung im
 * Setup bräuchte einen Neustart.
 */
const BattleNetProvider: OAuthConfig<BattleNetProfile> = {
  id: "battlenet",
  name: "Battle.net",
  type: "oauth",
  get clientId() {
    return credentials().id
  },
  get clientSecret() {
    return credentials().secret
  },
  get authorization() {
    return {
      url: `${oauthBase()}/oauth/authorize`,
      params: { scope: "wow.profile" },
    }
  },
  get token() {
    return `${oauthBase()}/oauth/token`
  },
  get userinfo() {
    return `${oauthBase()}/oauth/userinfo`
  },
  checks: ["state"],
  profile(profile) {
    return {
      id: String(profile.id ?? profile.sub),
      name: profile.battletag,
      email: null,
      image: null,
    }
  },
}

// ─── Auth-Konfiguration ───────────────────────────────────────────────────────

/** Rückfall, den NextAuth selbst setzt – siehe Setter unten. */
let secretFallback: string | undefined

export const authOptions: AuthOptions = {
  providers: [BattleNetProvider],
  /**
   * Sitzungsschlüssel aus der Konfiguration – beim Setup einmal erzeugt und
   * danach nie ersetzt, weil ein Wechsel alle Anmeldungen ungültig machte.
   */
  get secret() {
    return configSnapshot()?.authSecret ?? secretFallback
  },
  /**
   * NextAuth führt in der Route `options.secret ??= process.env.NEXTAUTH_SECRET`
   * aus. Ohne Setter wirft das bei frischer Datenbank (noch kein Schlüssel)
   * „Cannot set property secret … which has only a getter", und jede
   * Auth-Route antwortet 500. Der Wert aus der Datenbank geht weiterhin vor.
   */
  set secret(value: string | undefined) {
    secretFallback = value
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // Beim ersten Login
      if (account) {
        token.accessToken = account.access_token
        token.expiresAt = account.expires_at
        token.error = undefined
        const p = profile as unknown as BattleNetProfile | undefined
        if (p?.battletag) token.battleTag = p.battletag
      }

      // Battle.net stellt keine Refresh-Tokens aus: ein Nutzertoken lebt
      // 24 Stunden, danach geht es nur über eine neue Anmeldung. Früher stand
      // hier ein Refresh-Versuch, der nie gelingen konnte – die Sitzung lief
      // dann mit einem toten Token weiter, und jede Ansicht scheiterte für sich.
      // Jetzt wird das Token verworfen; die Schranke im Dashboard-Layout
      // schickt zur Anmeldung (siehe `/login?expired=1`).
      if (token.expiresAt && Date.now() >= token.expiresAt * 1000) {
        return { ...token, accessToken: undefined, error: "SessionExpired" }
      }
      return token
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.battleTag = token.battleTag
      session.error = token.error
      return session
    },
  },
}

/**
 * Für `getServerSession` und die Auth-Route: stellt sicher, dass die
 * Konfiguration geladen ist, bevor die Getter oben gelesen werden.
 */
export async function getAuthOptions(): Promise<AuthOptions> {
  const { loadConfig } = await import("./config")
  await loadConfig()
  return authOptions
}
