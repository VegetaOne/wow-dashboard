import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// ─── Typen ────────────────────────────────────────────────────────────────────

export interface FavoriteRecord {
  id: string
  userId: string
  characterName: string
  realmSlug: string
  gameMode: string
}

// ─── User ─────────────────────────────────────────────────────────────────────

export async function getOrCreateUser(battleTag: string, region = "eu") {
  return prisma.user.upsert({
    where: { battleTag },
    update: { updatedAt: new Date() },
    create: { battleTag, region },
  })
}

// ─── Favoriten ────────────────────────────────────────────────────────────────

export async function getFavorites(userId: string): Promise<FavoriteRecord[]> {
  return prisma.favorite.findMany({ where: { userId } })
}

export async function toggleFavorite(
  userId: string,
  characterName: string,
  realmSlug: string,
  gameMode: string
): Promise<boolean> {
  const key = {
    userId_characterName_realmSlug_gameMode: {
      userId,
      characterName,
      realmSlug,
      gameMode,
    },
  }

  const existing = await prisma.favorite.findUnique({ where: key })

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } })
    return false
  }

  await prisma.favorite.create({
    data: { userId, characterName, realmSlug, gameMode },
  })
  return true
}

// ─── Einstellungen ────────────────────────────────────────────────────────────

export async function setMainChar(
  userId: string,
  characterName: string,
  realmSlug: string,
  gameMode: string
) {
  return prisma.userPreference.upsert({
    where: { userId },
    update: { mainChar: characterName, mainRealm: realmSlug, mainMode: gameMode },
    create: { userId, mainChar: characterName, mainRealm: realmSlug, mainMode: gameMode },
  })
}
