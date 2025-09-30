"use server"

import type { Cocktail } from "@/types/cocktail"
import type { PumpConfig } from "@/types/pump"

let fs: typeof import("fs")
let path: typeof import("path")
let execPromise: any

// Lazy loading für Node.js Module nur auf dem Server
async function getNodeModules() {
  if (typeof window !== "undefined") {
    throw new Error("Node.js modules not available in browser")
  }

  if (!fs) {
    fs = await import("fs")
    path = await import("path")
    const { exec } = await import("child_process")
    const { promisify } = await import("util")
    execPromise = promisify(exec)
  }

  return { fs, path, execPromise }
}

// Pfad zur JSON-Datei für die Pumpenkonfiguration
const getPumpConfigPath = () => {
  if (typeof window !== "undefined") return ""
  return require("path").join(process.cwd(), "data", "pump-config.json")
}

const getCocktailsPath = () => {
  if (typeof window !== "undefined") return ""
  return require("path").join(process.cwd(), "data", "cocktails.json")
}

// Funktion zum Laden der Pumpenkonfiguration
export async function getPumpConfig(): Promise<PumpConfig[]> {
  try {
    const { fs, path } = await getNodeModules()
    const PUMP_CONFIG_PATH = getPumpConfigPath()

    // Prüfe, ob die Datei existiert
    if (fs.existsSync(PUMP_CONFIG_PATH)) {
      // Lese die Datei
      const data = fs.readFileSync(PUMP_CONFIG_PATH, "utf8")
      return JSON.parse(data)
    } else {
      // Wenn die Datei nicht existiert, lade die Standardkonfiguration
      const { pumpConfig } = await import("@/data/pump-config")

      // Speichere die Standardkonfiguration in der JSON-Datei
      fs.mkdirSync(path.dirname(PUMP_CONFIG_PATH), { recursive: true })
      fs.writeFileSync(PUMP_CONFIG_PATH, JSON.stringify(pumpConfig, null, 2), "utf8")

      return pumpConfig
    }
  } catch (error) {
    console.error("Fehler beim Laden der Pumpenkonfiguration:", error)

    // Fallback: Lade die Standardkonfiguration
    const { pumpConfig } = await import("@/data/pump-config")
    return pumpConfig
  }
}

// Funktion zum Speichern der Pumpen-Konfiguration
export async function savePumpConfig(pumpConfig: PumpConfig[]) {
  try {
    const { fs, path } = await getNodeModules()
    const PUMP_CONFIG_PATH = getPumpConfigPath()

    console.log("Speichere Pumpen-Konfiguration:", pumpConfig)

    // Stelle sicher, dass das Verzeichnis existiert
    fs.mkdirSync(path.dirname(PUMP_CONFIG_PATH), { recursive: true })

    // Speichere die Konfiguration in der JSON-Datei
    fs.writeFileSync(PUMP_CONFIG_PATH, JSON.stringify(pumpConfig, null, 2), "utf8")

    console.log("Pumpen-Konfiguration erfolgreich gespeichert")
    return { success: true }
  } catch (error) {
    console.error("Fehler beim Speichern der Pumpen-Konfiguration:", error)
    throw error
  }
}

export async function getAllCocktails(): Promise<Cocktail[]> {
  try {
    console.log("[v0] Loading cocktails from getAllCocktails...")

    const { fs, path } = await getNodeModules()
    const COCKTAILS_PATH = getCocktailsPath()

    // Stelle sicher, dass das data Verzeichnis existiert
    const dataDir = path.dirname(COCKTAILS_PATH)
    if (!fs.existsSync(dataDir)) {
      console.log("[v0] Creating data directory:", dataDir)
      fs.mkdirSync(dataDir, { recursive: true })
    }

    // Prüfe, ob die Cocktails-Datei existiert
    if (fs.existsSync(COCKTAILS_PATH)) {
      console.log("[v0] Loading cocktails from:", COCKTAILS_PATH)
      const data = fs.readFileSync(COCKTAILS_PATH, "utf8")
      const cocktails: Cocktail[] = JSON.parse(data)
      console.log("[v0] Total cocktails loaded:", cocktails.length)
      return cocktails
    } else {
      // Erstelle die Datei mit Standard-Cocktails
      console.log("[v0] No cocktails file found, creating with default cocktails")
      const { cocktails: defaultCocktails } = await import("@/data/cocktails")

      // Aktualisiere Rum zu Brauner Rum in den Standard-Cocktails
      const updatedCocktails = defaultCocktails.map((cocktail) => ({
        ...cocktail,
        ingredients: cocktail.ingredients.map((ingredient) =>
          ingredient.includes("Rum") && !ingredient.includes("Brauner Rum")
            ? ingredient.replace("Rum", "Brauner Rum")
            : ingredient,
        ),
      }))

      fs.writeFileSync(COCKTAILS_PATH, JSON.stringify(updatedCocktails, null, 2), "utf8")
      console.log("[v0] Created cocktails file with", updatedCocktails.length, "default cocktails")
      return updatedCocktails
    }
  } catch (error) {
    console.error("[v0] Error in getAllCocktails:", error)

    // Fallback: Lade nur die Standard-Cocktails
    try {
      const { cocktails } = await import("@/data/cocktails")
      console.log("[v0] Fallback: returning default cocktails only:", cocktails.length)
      return cocktails
    } catch (fallbackError) {
      console.error("[v0] Even fallback failed:", fallbackError)
      return []
    }
  }
}

export async function saveRecipe(cocktail: Cocktail) {
  try {
    const { fs, path } = await getNodeModules()
    const COCKTAILS_PATH = getCocktailsPath()

    console.log("Speichere Rezept:", cocktail)

    // Stelle sicher, dass das Verzeichnis existiert
    fs.mkdirSync(path.dirname(COCKTAILS_PATH), { recursive: true })

    // Lade alle bestehenden Cocktails
    let allCocktails: Cocktail[] = []
    if (fs.existsSync(COCKTAILS_PATH)) {
      const data = fs.readFileSync(COCKTAILS_PATH, "utf8")
      allCocktails = JSON.parse(data)
    } else {
      // Falls die Datei nicht existiert, lade Standard-Cocktails
      const { cocktails: defaultCocktails } = await import("@/data/cocktails")
      allCocktails = defaultCocktails.map((c) => ({
        ...c,
        ingredients: c.ingredients.map((ingredient) =>
          ingredient.includes("Rum") && !ingredient.includes("Brauner Rum")
            ? ingredient.replace("Rum", "Brauner Rum")
            : ingredient,
        ),
      }))
    }

    // Prüfe, ob der Cocktail bereits existiert
    const index = allCocktails.findIndex((c) => c.id === cocktail.id)

    if (index !== -1) {
      // Aktualisiere den bestehenden Cocktail
      allCocktails[index] = cocktail
      console.log("Cocktail aktualisiert:", cocktail.id)
    } else {
      // Füge den neuen Cocktail hinzu
      allCocktails.push(cocktail)
      console.log("Neuer Cocktail hinzugefügt:", cocktail.id)
    }

    // Speichere alle Cocktails zurück in die Datei
    fs.writeFileSync(COCKTAILS_PATH, JSON.stringify(allCocktails, null, 2), "utf8")

    console.log("Rezept erfolgreich gespeichert. Total cocktails:", allCocktails.length)
    return { success: true }
  } catch (error) {
    console.error("Fehler beim Speichern des Rezepts:", error)
    throw error
  }
}

export async function deleteRecipe(cocktailId: string) {
  try {
    const { fs, path } = await getNodeModules()
    const COCKTAILS_PATH = getCocktailsPath()

    console.log("[v0] Deleting cocktail from file:", cocktailId)

    // Lade alle bestehenden Cocktails
    let allCocktails: Cocktail[] = []
    if (fs.existsSync(COCKTAILS_PATH)) {
      const data = fs.readFileSync(COCKTAILS_PATH, "utf8")
      allCocktails = JSON.parse(data)
    } else {
      // Falls die Datei nicht existiert, lade Standard-Cocktails
      const { cocktails: defaultCocktails } = await import("@/data/cocktails")
      allCocktails = defaultCocktails.map((c) => ({
        ...c,
        ingredients: c.ingredients.map((ingredient) =>
          ingredient.includes("Rum") && !ingredient.includes("Brauner Rum")
            ? ingredient.replace("Rum", "Brauner Rum")
            : ingredient,
        ),
      }))
    }

    // Finde und entferne den Cocktail
    const initialLength = allCocktails.length
    allCocktails = allCocktails.filter((c) => c.id !== cocktailId)

    if (allCocktails.length === initialLength) {
      console.log("[v0] Cocktail not found in file:", cocktailId)
      return { success: false, message: "Cocktail not found" }
    }

    // Speichere die aktualisierte Liste zurück in die Datei
    fs.writeFileSync(COCKTAILS_PATH, JSON.stringify(allCocktails, null, 2), "utf8")

    console.log("[v0] Cocktail successfully deleted from file. Remaining cocktails:", allCocktails.length)
    return { success: true, message: `Cocktail ${cocktailId} deleted successfully` }
  } catch (error) {
    console.error("[v0] Error deleting cocktail from file:", error)
    throw error
  }
}

// Diese Funktion aktiviert eine Pumpe für eine bestimmte Zeit
async function activatePump(pin: number, durationMs: number) {
  try {
    const { fs, path, execPromise } = await getNodeModules()

    console.log(`[PUMP DEBUG] ==========================================`)
    console.log(`[PUMP DEBUG] Aktiviere Pumpe an GPIO Pin ${pin} für ${durationMs}ms`)
    console.log(`[PUMP DEBUG] Aktueller Arbeitsordner: ${process.cwd()}`)

    // Verwende das Python-Skript zur Steuerung der Pumpe
    const PUMP_CONTROL_SCRIPT = path.join(process.cwd(), "pump_control.py")
    const roundedDuration = Math.round(durationMs)

    if (!fs.existsSync(PUMP_CONTROL_SCRIPT)) {
      console.error(`[PUMP DEBUG] ❌ Python-Skript nicht gefunden: ${PUMP_CONTROL_SCRIPT}`)
      throw new Error(`Python-Skript nicht gefunden: ${PUMP_CONTROL_SCRIPT}`)
    }

    console.log(`[PUMP DEBUG] Python-Skript gefunden: ${PUMP_CONTROL_SCRIPT}`)

    const command = `python3 ${PUMP_CONTROL_SCRIPT} activate ${pin} ${roundedDuration}`
    console.log(`[PUMP DEBUG] Führe Befehl aus: ${command}`)

    const { stdout, stderr } = await execPromise(command)

    console.log(`[PUMP DEBUG] ✅ Befehl erfolgreich ausgeführt`)
    if (stdout) {
      console.log(`[PUMP DEBUG] Python stdout: ${stdout}`)
    }
    if (stderr) {
      console.log(`[PUMP DEBUG] Python stderr: ${stderr}`)
    }
    console.log(`[PUMP DEBUG] ==========================================`)

    return true
  } catch (error) {
    console.error(`[PUMP DEBUG] ❌ FEHLER beim Aktivieren der Pumpe an Pin ${pin}:`)
    console.error(`[PUMP DEBUG] Error message: ${error}`)
    if (error instanceof Error) {
      console.error(`[PUMP DEBUG] Error stack: ${error.stack}`)
    }
    console.error(`[PUMP DEBUG] ==========================================`)
    throw error
  }
}

export async function makeCocktailAction(cocktail: Cocktail, pumpConfig: PumpConfig[], size = 300) {
  console.log(`Bereite Cocktail zu: ${cocktail.name} (${size}ml)`)

  // Skaliere das Rezept auf die gewünschte Größe
  const currentTotal = cocktail.recipe.reduce((total, item) => total + item.amount, 0)
  const scaleFactor = currentTotal === 0 ? 1 : size / currentTotal
  const scaledRecipe = cocktail.recipe.map((item) => ({
    ...item,
    amount: Math.round(item.amount * scaleFactor),
  }))

  const delayedItems = scaledRecipe.filter((item) => item.delayed === true)
  const immediateItems = scaledRecipe.filter((item) => item.delayed !== true)

  console.log(`[v0] Sofortige Zutaten: ${immediateItems.length}, Verzögerte Zutaten: ${delayedItems.length}`)

  // Sammle Pumpen-Updates für Level-Reduktion
  const levelUpdates: { pumpId: number; amount: number }[] = []

  const immediatePumpPromises = immediateItems.map((item) => {
    // Finde die Pumpe, die diese Zutat enthält
    const pump = pumpConfig.find((p) => p.ingredient === item.ingredientId)

    if (!pump) {
      console.error(`Keine Pumpe für Zutat ${item.ingredientId} konfiguriert!`)
      return Promise.resolve()
    }

    // Berechne, wie lange die Pumpe laufen muss
    const pumpTimeMs = (item.amount / pump.flowRate) * 1000

    console.log(`[v0] Sofort: Pumpe ${pump.id} (${pump.ingredient}): ${item.amount}ml für ${pumpTimeMs}ms aktivieren`)

    // Füge zur Level-Update-Liste hinzu
    levelUpdates.push({ pumpId: pump.id, amount: item.amount })

    // Aktiviere die Pumpe
    return activatePump(pump.pin, pumpTimeMs)
  })

  // Warte, bis alle sofortigen Pumpen aktiviert wurden
  await Promise.all(immediatePumpPromises)

  if (delayedItems.length > 0) {
    console.log(`[v0] Warte 2 Sekunden vor dem Hinzufügen von ${delayedItems.length} verzögerten Zutaten...`)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Füge verzögerte Zutaten hinzu
    for (const item of delayedItems) {
      const pump = pumpConfig.find((p) => p.ingredient === item.ingredientId)

      if (!pump) {
        console.error(`Keine Pumpe für Zutat ${item.ingredientId} konfiguriert!`)
        continue
      }

      // Berechne, wie lange die Pumpe laufen muss
      const pumpTimeMs = (item.amount / pump.flowRate) * 1000

      console.log(
        `[v0] Verzögert: Pumpe ${pump.id} (${pump.ingredient}): ${item.amount}ml für ${pumpTimeMs}ms aktivieren`,
      )

      // Füge zur Level-Update-Liste hinzu
      levelUpdates.push({ pumpId: pump.id, amount: item.amount })

      // Aktiviere die Pumpe
      await activatePump(pump.pin, pumpTimeMs)
    }
  }

  // Aktualisiere die Füllstände über API
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/ingredient-levels/update`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: levelUpdates }),
      },
    )

    if (response.ok) {
      const data = await response.json()
      console.log("[v0] Füllstände erfolgreich aktualisiert:", data.levels?.length || 0, "Levels")
    } else {
      console.error("Fehler beim Aktualisieren der Füllstände:", response.statusText)
    }
  } catch (error) {
    console.error("Error updating levels:", error)
  }

  return { success: true }
}

export async function makeSingleShotAction(ingredientId: string, amount = 40, pumpConfig: PumpConfig[]) {
  console.log(`Bereite Shot zu: ${ingredientId} (${amount}ml)`)

  // Finde die Pumpe für diese Zutat
  const pump = pumpConfig.find((p) => p.ingredient === ingredientId)

  if (!pump) {
    throw new Error(`Keine Pumpe für Zutat ${ingredientId} konfiguriert!`)
  }

  // Berechne, wie lange die Pumpe laufen muss
  const pumpTimeMs = (amount / pump.flowRate) * 1000

  console.log(`Pumpe ${pump.id} (${pump.ingredient}): ${amount}ml für ${pumpTimeMs}ms aktivieren`)

  // Aktiviere die Pumpe
  await activatePump(pump.pin, pumpTimeMs)

  // Aktualisiere den Füllstand über API
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/ingredient-levels/update`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: [{ pumpId: pump.id, amount }] }),
      },
    )

    if (response.ok) {
      const data = await response.json()
      console.log("[v0] Füllstände erfolgreich aktualisiert:", data.levels?.length || 0, "Levels")
    } else {
      console.error("Fehler beim Aktualisieren der Füllstände:", response.statusText)
    }
  } catch (error) {
    console.error("Error updating levels:", error)
  }

  return { success: true }
}

export async function calibratePumpAction(pumpId: number, durationMs: number) {
  try {
    console.log(`[CALIBRATE DEBUG] ==========================================`)
    console.log(`[CALIBRATE DEBUG] Kalibriere Pumpe ${pumpId} für ${durationMs}ms`)

    const pumpConfig = await getPumpConfig()
    const pump = pumpConfig.find((p) => p.id === pumpId)

    if (!pump) {
      console.error(`[CALIBRATE DEBUG] ❌ Pumpe mit ID ${pumpId} nicht gefunden`)
      console.error(
        `[CALIBRATE DEBUG] Verfügbare Pumpen: ${pumpConfig.map((p) => `ID:${p.id} GPIO:${p.pin}`).join(", ")}`,
      )
      throw new Error(`Pumpe mit ID ${pumpId} nicht gefunden`)
    }

    console.log(`[CALIBRATE DEBUG] Gefundene Pumpe: ID:${pump.id}, GPIO:${pump.pin}, Enabled:${pump.enabled}`)

    if (!pump.enabled) {
      console.warn(`[CALIBRATE DEBUG] ⚠️  Pumpe ${pumpId} ist deaktiviert (enabled: false)`)
    }

    const { fs, path, execPromise } = await getNodeModules()
    const PUMP_CONTROL_SCRIPT = path.join(process.cwd(), "pump_control.py")
    const roundedDuration = Math.round(durationMs)

    if (!fs.existsSync(PUMP_CONTROL_SCRIPT)) {
      console.error(`[CALIBRATE DEBUG] ❌ Python-Skript nicht gefunden: ${PUMP_CONTROL_SCRIPT}`)
      throw new Error(`Python-Skript nicht gefunden: ${PUMP_CONTROL_SCRIPT}`)
    }

    const command = `python3 ${PUMP_CONTROL_SCRIPT} activate ${pump.pin} ${roundedDuration}`
    console.log(`[CALIBRATE DEBUG] Führe Befehl aus: ${command}`)

    const { stdout, stderr } = await execPromise(command)

    if (stdout) {
      console.log(`[CALIBRATE DEBUG] Python stdout: ${stdout}`)
    }
    if (stderr) {
      console.log(`[CALIBRATE DEBUG] Python stderr: ${stderr}`)
    }

    console.log(`[CALIBRATE DEBUG] ✅ Pumpe ${pumpId} erfolgreich kalibriert`)
    console.log(`[CALIBRATE DEBUG] ==========================================`)

    return { success: true }
  } catch (error) {
    console.error(`[CALIBRATE DEBUG] ❌ FEHLER bei der Kalibrierung der Pumpe ${pumpId}:`)
    console.error(`[CALIBRATE DEBUG] Error message: ${error}`)
    if (error instanceof Error) {
      console.error(`[CALIBRATE DEBUG] Error stack: ${error.stack}`)
    }
    console.error(`[CALIBRATE DEBUG] ==========================================`)
    throw error
  }
}

export async function cleanPumpAction(pumpId: number, durationMs: number) {
  try {
    console.log(`Reinige Pumpe ${pumpId} für ${durationMs}ms`)

    // Finde die Pumpe in der Konfiguration
    const pumpConfig = await getPumpConfig()
    const pump = pumpConfig.find((p) => p.id === pumpId)

    if (!pump) {
      throw new Error(`Pumpe mit ID ${pumpId} nicht gefunden`)
    }

    // Aktiviere die Pumpe über das Python-Skript
    const { fs, path, execPromise } = await getNodeModules()
    const PUMP_CONTROL_SCRIPT = path.join(process.cwd(), "pump_control.py")
    const roundedDuration = Math.round(durationMs)

    await execPromise(`python3 ${PUMP_CONTROL_SCRIPT} activate ${pump.pin} ${roundedDuration}`)

    console.log(`Pumpe ${pumpId} erfolgreich gereinigt`)

    return { success: true }
  } catch (error) {
    console.error(`Fehler bei der Reinigung der Pumpe ${pumpId}:`, error)
    throw error
  }
}

export async function activatePumpForDurationAction(
  pumpId: string,
  durationMs: number,
  pumpConfig: PumpConfig[],
): Promise<void> {
  console.log(`Aktiviere Pumpe mit ID: ${pumpId} für ${durationMs}ms`)
  const pump = pumpConfig.find((p) => p.id.toString() === pumpId)
  if (!pump) {
    throw new Error(`Pumpe mit ID "${pumpId}" nicht gefunden.`)
  }

  console.log(`Gefundene Pumpe: ${pump.id} (GPIO ${pump.pin})`)
  await activatePump(pump.pin, durationMs)
  console.log(`Pumpe ${pump.id} deaktiviert.`)
}

export async function ventPumpAction(pumpId: number, durationMs: number) {
  try {
    const pumpConfig = await getPumpConfig()
    const pump = pumpConfig.find((p) => p.id === pumpId)

    if (!pump) {
      throw new Error(`Pumpe mit ID ${pumpId} nicht gefunden`)
    }

    // Aktiviere die Pumpe über das Python-Skript
    const { fs, path, execPromise } = await getNodeModules()
    const PUMP_CONTROL_SCRIPT = path.join(process.cwd(), "pump_control.py")
    const roundedDuration = Math.round(durationMs)

    await execPromise(`python3 ${PUMP_CONTROL_SCRIPT} activate ${pump.pin} ${roundedDuration}`)

    console.log(`Pumpe ${pumpId} erfolgreich entlüftet`)

    return { success: true }
  } catch (error) {
    console.error(`Fehler beim Entlüften der Pumpe ${pumpId}:`, error)
    throw error
  }
}

export async function makeShotAction(ingredient: string, pumpConfig: PumpConfig[], size = 40) {
  console.log(`Bereite Shot zu: ${ingredient} (${size}ml)`)

  // Finde die Pumpe für diese Zutat
  const pump = pumpConfig.find((p) => p.ingredient === ingredient)

  if (!pump) {
    throw new Error(`Keine Pumpe für Zutat ${ingredient} konfiguriert!`)
  }

  // Berechne, wie lange die Pumpe laufen muss
  const pumpTimeMs = (size / pump.flowRate) * 1000

  console.log(`Pumpe ${pump.id} (${pump.ingredient}): ${size}ml für ${pumpTimeMs}ms aktivieren`)

  // Aktiviere die Pumpe
  await activatePump(pump.pin, pumpTimeMs)

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/ingredient-levels/update`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: [{ pumpId: pump.id, amount: size }] }),
      },
    )
    if (!response.ok) {
      console.error("Failed to update levels after shot:", response.statusText)
    } else {
      const data = await response.json()
      console.log("[v0] Füllstände erfolgreich aktualisiert:", data.levels?.length || 0, "Levels")
    }
  } catch (error) {
    console.error("Error updating levels after shot:", error)
  }

  return { success: true }
}
