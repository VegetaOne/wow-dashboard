"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"

export function LoginButton() {
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    await signIn("battlenet", { callbackUrl: "/dashboard" })
  }

  return (
    <button
      onClick={handleLogin}
      disabled={loading}
      className="btn btn-primary w-full justify-center py-3 text-[15px]"
    >
      {loading ? "Verbinde…" : "Mit Battle.net anmelden"}
    </button>
  )
}
