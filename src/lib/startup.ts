/**
 * Was beim Start des Servers passiert. Aufgerufen aus `src/instrumentation.ts`,
 * nur in der Node-Laufzeit.
 */

import { loadConfig } from "./config"
import { ensureSetupCode } from "./setup-code"

export async function onServerStart(): Promise<void> {
  // Ist der Setup offen, gleich den Einrichtungscode ins Log – dann steht er
  // dort, bevor jemand die Seite öffnet
  const config = await loadConfig(true)
  if (!config.setupComplete) ensureSetupCode()
}
