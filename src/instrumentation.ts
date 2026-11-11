/**
 * Läuft einmal beim Start des Servers – hier hängen Hintergrundaufgaben.
 *
 * Nur in der Node-Laufzeit: der Auffrischer braucht Prisma, `crypto` und
 * `fs`. Die Bedingung muss genau so dastehen – `if (… === "nodejs") { import }`.
 * Next ersetzt `NEXT_RUNTIME` beim Bündeln und wirft den Zweig fürs
 * Edge-Bündel nur in dieser Form weg; mit einem frühen `return` davor
 * versucht es, `crypto` für Edge aufzulösen, und der Bau bricht.
 *
 * Nicht während `next build`: dort gibt es keine Datenbank.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (process.env.NEXT_PHASE !== "phase-production-build") {
      const { startRefresher } = await import("./lib/refresher")
      startRefresher()
    }
  }
}
