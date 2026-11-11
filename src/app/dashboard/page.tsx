import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth"
import { DashboardShell } from "@/components/DashboardShell"
import { isOwner, loadConfig, toView } from "@/lib/config"

export default async function DashboardPage() {
  const session = await getServerSession(await getAuthOptions())
  const config = await loadConfig()

  return (
    <DashboardShell
      battleTag={session?.battleTag}
      pollSeconds={config.pollSeconds}
      isOwner={isOwner(toView(config), session?.battleTag)}
    />
  )
}
