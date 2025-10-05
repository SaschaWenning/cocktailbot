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

async function runLedCommand(...args: string[]) {
  try {
    const { path: pathModule, execPromise: exec } = await getNodeModules()
    const ledClientPath = pathModule.join(process.cwd(), "led_client.py")
    const command = `python3 ${ledClientPath} ${args.join(" ")}`
    await exec(command)
  } catch (error) {
    console.error("[v0] Error running LED command:", error)
  }
}

export async function makeCocktailAction(cocktail: Cocktail, pumpConfig: PumpConfig[], size = 300) {
  try {
    console.log(`[v0] Starte Cocktail-Zubereitung: ${cocktail.name} (${size}ml)`)

    // LED: Zubereitung startet (rot blinkend)
    await runLedCommand("BUSY")

    const { path: pathModule, execPromise: exec } = await getNodeModules()

    // Berechne die Mengen basierend auf der Größe
    const scaleFactor = size / 300 // Standard ist 300ml

    for (const ingredient of cocktail.recipe) {
      if (ingredient.manual) {
        console.log(`[v0] Manuelle Zutat: ${ingredient.ingredientId} (${ingredient.amount * scaleFactor}ml)`)
        continue
      }

      const pump = pumpConfig.find((p) => p.ingredient === ingredient.ingredientId && p.enabled)

      if (!pump) {
        console.log(`[v0] Keine Pumpe für ${ingredient.ingredientId} gefunden`)
        continue
      }

      const amount = ingredient.amount * scaleFactor
      const durationMs = (amount / pump.flowRate) * 1000

      console.log(`[v0] Pumpe ${pump.id} (Pin ${pump.pin}): ${amount}ml für ${durationMs}ms`)

      const pumpScript = pathModule.join(process.cwd(), "pump_control.py")
      const command = `python3 ${pumpScript} activate ${pump.pin} ${Math.round(durationMs)}`

      await exec(command)

      // Kurze Pause zwischen den Pumpen
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    console.log(`[v0] Cocktail ${cocktail.name} fertig!`)

    // LED: Fertig (grün, dann automatisch Idle)
    await runLedCommand("READY")

    return { success: true, message: `${cocktail.name} wurde erfolgreich zubereitet!` }
  } catch (error) {
    console.error("[v0] Fehler bei der Cocktail-Zubereitung:", error)

    // LED: Fehler (aus)
    await runLedCommand("OFF")

    throw error
  }
}

export async function makeShotAction(ingredientId: string, amount: number, pumpConfig: PumpConfig[]) {
  try {
    console.log(`[v0] Starte Shot: ${ingredientId} (${amount}ml)`)

    await runLedCommand("BUSY")

    const pump = pumpConfig.find((p) => p.ingredient === ingredientId && p.enabled)

    if (!pump) {
      throw new Error(`Keine Pumpe für ${ingredientId} gefunden`)
    }

    const durationMs = (amount / pump.flowRate) * 1000

    const { path: pathModule, execPromise: exec } = await getNodeModules()
    const pumpScript = pathModule.join(process.cwd(), "pump_control.py")
    const command = `python3 ${pumpScript} activate ${pump.pin} ${Math.round(durationMs)}`

    await exec(command)

    console.log(`[v0] Shot ${ingredientId} fertig!`)

    await runLedCommand("READY")

    return { success: true, message: `${ingredientId} Shot wurde erfolgreich zubereitet!` }
  } catch (error) {
    console.error("[v0] Fehler bei der Shot-Zubereitung:", error)
    await runLedCommand("OFF")
    throw error
  }
}

export async function calibratePumpAction(pumpId: number, durationMs: number) {
  try {
    console.log(`[v0] Kalibriere Pumpe ${pumpId} für ${durationMs}ms`)

    const { path: pathModule, execPromise: exec } = await getNodeModules()
    const pumpScript = pathModule.join(process.cwd(), "pump_control.py")

    // Finde die Pumpe in der Konfiguration
    const config = await getPumpConfig()
    const pump = config.find((p) => p.id === pumpId)

    if (!pump) {
      throw new Error(`Pumpe ${pumpId} nicht gefunden`)
    }

    const command = `python3 ${pumpScript} activate ${pump.pin} ${durationMs}`
    await exec(command)

    console.log(`[v0] Pumpe ${pumpId} kalibriert`)

    return { success: true, message: `Pumpe ${pumpId} wurde kalibriert` }
  } catch (error) {
    console.error("[v0] Fehler bei der Kalibrierung:", error)
    throw error
  }
}

export async function ventPumpAction(pumpId: number, durationMs: number) {
  try {
    console.log(`[v0] Entlüfte Pumpe ${pumpId} für ${durationMs}ms`)

    const { path: pathModule, execPromise: exec } = await getNodeModules()
    const pumpScript = pathModule.join(process.cwd(), "pump_control.py")

    const config = await getPumpConfig()
    const pump = config.find((p) => p.id === pumpId)

    if (!pump) {
      throw new Error(`Pumpe ${pumpId} nicht gefunden`)
    }

    const command = `python3 ${pumpScript} activate ${pump.pin} ${durationMs}`
    await exec(command)

    console.log(`[v0] Pumpe ${pumpId} entlüftet`)

    return { success: true, message: `Pumpe ${pumpId} wurde entlüftet` }
  } catch (error) {
    console.error("[v0] Fehler beim Entlüften:", error)
    throw error
  }
}

export async function getPumpConfig(): Promise<PumpConfig[]> {
  try {
    const { fs: fsModule, path: pathModule } = await getNodeModules()
    const configPath = pathModule.join(process.cwd(), "data", "pump-config.json")

    if (!fsModule.existsSync(configPath)) {
      console.log("[v0] pump-config.json nicht gefunden, verwende Standard-Konfiguration")
      return []
    }

    const data = fsModule.readFileSync(configPath, "utf-8")
    const config = JSON.parse(data)

    return config.pumpConfig || []
  } catch (error) {
    console.error("[v0] Fehler beim Laden der Pumpen-Konfiguration:", error)
    return []
  }
}

export async function savePumpConfig(pumpConfig: PumpConfig[]) {
  try {
    const { fs: fsModule, path: pathModule } = await getNodeModules()
    const configPath = pathModule.join(process.cwd(), "data", "pump-config.json")

    const data = JSON.stringify({ pumpConfig }, null, 2)
    fsModule.writeFileSync(configPath, data, "utf-8")

    console.log("[v0] Pumpen-Konfiguration gespeichert")

    return { success: true, message: "Pumpen-Konfiguration wurde gespeichert" }
  } catch (error) {
    console.error("[v0] Fehler beim Speichern der Pumpen-Konfiguration:", error)
    throw error
  }
}

export async function getAllCocktails(): Promise<Cocktail[]> {
  try {
    const { fs: fsModule, path: pathModule } = await getNodeModules()
    const cocktailsPath = pathModule.join(process.cwd(), "data", "cocktails.json")

    if (!fsModule.existsSync(cocktailsPath)) {
      console.log("[v0] cocktails.json nicht gefunden")
      return []
    }

    const data = fsModule.readFileSync(cocktailsPath, "utf-8")
    const cocktails = JSON.parse(data)

    console.log(`[v0] ${cocktails.length} Cocktails geladen`)

    return Array.isArray(cocktails) ? cocktails : []
  } catch (error) {
    console.error("[v0] Fehler beim Laden der Cocktails:", error)
    return []
  }
}

export async function saveRecipe(cocktail: Cocktail) {
  try {
    const { fs: fsModule, path: pathModule } = await getNodeModules()
    const cocktailsPath = pathModule.join(process.cwd(), "data", "cocktails.json")

    let cocktails: Cocktail[] = []

    if (fsModule.existsSync(cocktailsPath)) {
      const data = fsModule.readFileSync(cocktailsPath, "utf-8")
      cocktails = JSON.parse(data)
    }

    // Prüfe, ob das Rezept bereits existiert
    const existingIndex = cocktails.findIndex((c) => c.id === cocktail.id)

    if (existingIndex >= 0) {
      // Aktualisiere bestehendes Rezept
      cocktails[existingIndex] = cocktail
      console.log(`[v0] Rezept ${cocktail.name} aktualisiert`)
    } else {
      // Füge neues Rezept hinzu
      cocktails.push(cocktail)
      console.log(`[v0] Neues Rezept ${cocktail.name} hinzugefügt`)
    }

    // Speichere die aktualisierte Liste
    const data = JSON.stringify(cocktails, null, 2)
    fsModule.writeFileSync(cocktailsPath, data, "utf-8")

    return { success: true, message: `Rezept ${cocktail.name} wurde gespeichert` }
  } catch (error) {
    console.error("[v0] Fehler beim Speichern des Rezepts:", error)
    throw error
  }
}

export async function deleteRecipe(cocktailId: string) {
  try {
    const { fs: fsModule, path: pathModule } = await getNodeModules()
    const cocktailsPath = pathModule.join(process.cwd(), "data", "cocktails.json")

    if (!fsModule.existsSync(cocktailsPath)) {
      throw new Error("cocktails.json nicht gefunden")
    }

    const data = fsModule.readFileSync(cocktailsPath, "utf-8")
    let cocktails: Cocktail[] = JSON.parse(data)

    const cocktail = cocktails.find((c) => c.id === cocktailId)

    if (!cocktail) {
      throw new Error(`Cocktail ${cocktailId} nicht gefunden`)
    }

    // Filtere den Cocktail heraus
    cocktails = cocktails.filter((c) => c.id !== cocktailId)

    // Speichere die aktualisierte Liste
    const updatedData = JSON.stringify(cocktails, null, 2)
    fsModule.writeFileSync(cocktailsPath, updatedData, "utf-8")

    console.log(`[v0] Rezept ${cocktail.name} gelöscht`)

    return { success: true, message: `Rezept ${cocktail.name} wurde gelöscht` }
  } catch (error) {
    console.error("[v0] Fehler beim Löschen des Rezepts:", error)
    throw error
  }
}
