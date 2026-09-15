import { AuthOptions } from "next-auth"
import type { OAuthConfig } from "next-auth/providers/oauth"
import { JWT } from "next-auth/jwt"

const region = process.env.BNET_REGION || "eu"

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
 * Battle.net als reiner OAuth2-Provider (NICHT OIDC).
 *
 * Grund: Battle.net setzt im ID-Token einen eigenen nonce, den next-auth
 * nie angefordert hat → "nonce mismatch" bei der OIDC-Validierung.
 * Ohne den openid-Scope wird kein ID-Token ausgestellt und next-auth
 * holt das Profil stattdessen vom userinfo-Endpoint. Kein nonce, kein Problem.
 */
const BattleNetProvider: OAuthConfig<BattleNetProfile> = {
  id: "battlenet",
  name: "Battle.net",
  type: "oauth",
  clientId: process.env.BNET_CLIENT_ID,
  clientSecret: process.env.BNET_CLIENT_SECRET,
  authorization: {
    url: `https://${region}.battle.net/oauth/authorize`,
    params: { scope: "wow.profile" },
  },
  token: `https://${region}.battle.net/oauth/token`,
  userinfo: `https://${region}.battle.net/oauth/userinfo`,
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

// ─── Token-Refresh ────────────────────────────────────────────────────────────

async function refreshBattleNetToken(token: JWT): Promise<JWT> {
  if (!token.refreshToken) {
    return { ...token, error: "NoRefreshToken" }
  }

  try {
    const response = await fetch(`https://${region}.battle.net/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(
            `${process.env.BNET_CLIENT_ID}:${process.env.BNET_CLIENT_SECRET}`
          ).toString("base64"),
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    })

    const refreshed = await response.json()
    if (!response.ok) throw refreshed

    return {
      ...token,
      accessToken: refreshed.access_token,
      expiresAt: Math.floor(Date.now() / 1000 + refreshed.expires_in),
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      error: undefined,
    }
  } catch {
    return { ...token, error: "RefreshAccessTokenError" }
  }
}

// ─── Auth-Konfiguration ───────────────────────────────────────────────────────

export const authOptions: AuthOptions = {
  providers: [BattleNetProvider],
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
        token.refreshToken = account.refresh_token
        const p = profile as unknown as BattleNetProfile | undefined
        if (p?.battletag) token.battleTag = p.battletag
      }

      // Token noch gültig → unverändert zurück
      if (token.expiresAt && Date.now() < token.expiresAt * 1000) {
        return token
      }

      // Abgelaufen → Refresh versuchen
      return refreshBattleNetToken(token)
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.battleTag = token.battleTag
      session.error = token.error
      return session
    },
  },
}
