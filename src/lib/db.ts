import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  })

// Auch in Produktion merken: Next bündelt dieses Modul in jede Seite und
// jede Route einzeln, ohne `globalThis` entstünde je Bündel ein eigener
// Client mit eigener Verbindung. Siehe `config-cache.ts`.
globalForPrisma.prisma = prisma

// ─── Typen ────────────────────────────────────────────────────────────────────

export interface FavoriteRecord {
  id: string
  userId: string
  region: string
  /** `{name}-{surname}` – Forever-Charaktere haben keinen Realm */
  charSlug: string
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

/** Favoriten eines Nutzers in einer Region – Slugs sind nur je Region eindeutig. */
export async function getFavorites(
  userId: string,
  region: string
): Promise<FavoriteRecord[]> {
  return prisma.favorite.findMany({ where: { userId, region } })
}

export async function toggleFavorite(
  userId: string,
  region: string,
  charSlug: string
): Promise<boolean> {
  const key = { userId_region_charSlug: { userId, region, charSlug } }
  const existing = await prisma.favorite.findUnique({ where: key })

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } })
    return false
  }

  await prisma.favorite.create({ data: { userId, region, charSlug } })
  return true
}
