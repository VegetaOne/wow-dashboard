import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    accessToken?: string
    battleTag?: string
    error?: string
    user: DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    expiresAt?: number
    refreshToken?: string
    battleTag?: string
    error?: string
  }
}
