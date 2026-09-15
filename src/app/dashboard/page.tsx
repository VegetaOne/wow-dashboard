import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { DashboardShell } from "@/components/DashboardShell"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  return <DashboardShell battleTag={session?.battleTag} />
}
