import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import { join } from "path"
import type { Cocktail } from "@/types/cocktail"
import type { PumpConfig } from "@/types/pump"
import { cocktails as defaultCocktails } from "@/data/cocktails"

const COCKTAILS_FILE = join(process.cwd(), "data", "user-cocktails.json")
const DELETED_COCKTAILS_FILE = join(process.cwd(), "data", "deleted-cocktails.json")
const PUMP_CONFIG_FILE = join(process.cwd(), "data", "user-pump-config.json")

// Stelle sicher, dass das data Verzeichnis existiert
const dataDir = join(process.cwd(), "data")
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
}

// Lade gelöschte Cocktail-IDs
function getDeletedCocktailIds(): string[] {
  try {
    if (!existsSync(DELETED_COCKTAILS_FILE)) {
      return []
    }
    const data = readFileSync(DELETED_COCKTAILS_FILE, "utf-8")
    return JSON.parse(data) as string[]
  } catch (error) {
    console.error("Fehler beim Laden der gelöschten Cocktails:", error)
    return []
  }
}

// Speichere gelöschte Cocktail-ID
function addDeletedCocktailId(cocktailId: string): void {
  try {
    const deletedIds = getDeletedCocktailIds()
    if (!deletedIds.includes(cocktailId)) {
      deletedIds.push(cocktailId)
      writeFileSync(DELETED_COCKTAILS_FILE, JSON.stringify(deletedIds, null, 2), "utf-8")
    }
  } catch (error) {
    console.error("Fehler beim Speichern der gelöschten Cocktail-ID:", error)
  }
}

// Entferne gelöschte Cocktail-ID (falls Cocktail wieder hinzugefügt wird)
function removeDeletedCocktailId(cocktailId: string): void {
  try {
    const deletedIds = getDeletedCocktailIds()
    const filteredIds = deletedIds.filter((id) => id !== cocktailId)
    writeFileSync(DELETED_COCKTAILS_FILE, JSON.stringify(filteredIds, null, 2), "utf-8")
  } catch (error) {
    console.error("Fehler beim Entfernen der gelöschten Cocktail-ID:", error)
  }
}

// Lade alle Cocktails (Benutzer + Standard, aber ohne gelöschte)
export async function getAllCocktails(): Promise<Cocktail[]> {
  try {
    let userCocktails: Cocktail[] = []

    // Lade Benutzer-Cocktails falls vorhanden
    if (existsSync(COCKTAILS_FILE)) {
      const data = readFileSync(COCKTAILS_FILE, "utf-8")
      userCocktails = JSON.parse(data) as Cocktail[]
    }

    // Lade gelöschte Cocktail-IDs
    const deletedIds = getDeletedCocktailIds()

    // Filtere Standard-Cocktails (entferne gelöschte)
    const filteredDefaultCocktails = defaultCocktails.filter((cocktail) => !deletedIds.includes(cocktail.id))

    // Kombiniere Standard-Cocktails mit Benutzer-Cocktails
    // Benutzer-Cocktails überschreiben Standard-Cocktails mit gleicher ID
    const allCocktails = [...filteredDefaultCocktails]

    userCocktails.forEach((userCocktail) => {
      const existingIndex = allCocktails.findIndex((c) => c.id === userCocktail.id)
      if (existingIndex >= 0) {
        // Überschreibe Standard-Cocktail
        allCocktails[existingIndex] = userCocktail
      } else {
        // Füge neuen Benutzer-Cocktail hinzu
        allCocktails.push(userCocktail)
      }
    })

    return allCocktails
  } catch (error) {
    console.error("Fehler beim Laden der Cocktails:", error)
    // Fallback auf Standard-Cocktails (ohne gelöschte)
    const deletedIds = getDeletedCocktailIds()
    return defaultCocktails.filter((cocktail) => !deletedIds.includes(cocktail.id))
  }
}

// Speichere ein Rezept
export async function saveRecipe(cocktail: Cocktail): Promise<void> {
  try {
    let userCocktails: Cocktail[] = []

    // Lade existierende Benutzer-Cocktails
    if (existsSync(COCKTAILS_FILE)) {
      const data = readFileSync(COCKTAILS_FILE, "utf-8")
      userCocktails = JSON.parse(data) as Cocktail[]
    }

    // Finde existierenden Cocktail oder füge neuen hinzu
    const existingIndex = userCocktails.findIndex((c) => c.id === cocktail.id)
    if (existingIndex >= 0) {
      userCocktails[existingIndex] = cocktail
    } else {
      userCocktails.push(cocktail)
    }

    // Speichere Benutzer-Cocktails
    writeFileSync(COCKTAILS_FILE, JSON.stringify(userCocktails, null, 2), "utf-8")

    // Entferne aus gelöschten Cocktails falls vorhanden
    removeDeletedCocktailId(cocktail.id)

    console.log(`Cocktail ${cocktail.name} gespeichert`)
  } catch (error) {
    console.error("Fehler beim Speichern des Cocktails:", error)
    throw error
  }
}

// Lösche ein Rezept
export async function deleteRecipe(cocktailId: string): Promise<void> {
  try {
    // Prüfe ob es ein Standard-Cocktail ist
    const isDefaultCocktail = defaultCocktails.some((c) => c.id === cocktailId)

    if (isDefaultCocktail) {
      // Für Standard-Cocktails: Füge zur gelöschten Liste hinzu
      addDeletedCocktailId(cocktailId)
      console.log(`Standard-Cocktail ${cocktailId} als gelöscht markiert`)
    }

    // Entferne aus Benutzer-Cocktails falls vorhanden
    if (existsSync(COCKTAILS_FILE)) {
      const data = readFileSync(COCKTAILS_FILE, "utf-8")
      const userCocktails = JSON.parse(data) as Cocktail[]
      const filteredCocktails = userCocktails.filter((c) => c.id !== cocktailId)
      writeFileSync(COCKTAILS_FILE, JSON.stringify(filteredCocktails, null, 2), "utf-8")
    }

    console.log(`Cocktail ${cocktailId} gelöscht`)
  } catch (error) {
    console.error("Fehler beim Löschen des Cocktails:", error)
    throw error
  }
}

// Lade Pumpenkonfiguration
export async function getPumpConfig(): Promise<PumpConfig[]> {
  try {
    if (existsSync(PUMP_CONFIG_FILE)) {
      const data = readFileSync(PUMP_CONFIG_FILE, "utf-8")
      return JSON.parse(data) as PumpConfig[]
    }

    // Fallback auf Standard-Konfiguration
    const { pumpConfig } = await import("@/data/pump-config")
    return pumpConfig
  } catch (error) {
    console.error("Fehler beim Laden der Pumpenkonfiguration:", error)
    const { pumpConfig } = await import("@/data/pump-config")
    return pumpConfig
  }
}

// Speichere Pumpenkonfiguration
export async function savePumpConfig(config: PumpConfig[]): Promise<void> {
  try {
    writeFileSync(PUMP_CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8")
    console.log("Pumpenkonfiguration gespeichert")
  } catch (error) {
    console.error("Fehler beim Speichern der Pumpenkonfiguration:", error)
    throw error
  }
}

// Aktiviere eine Pumpe für eine bestimmte Dauer
export async function activatePumpForDuration(pumpId: number, durationMs: number): Promise<void> {
  try {
    console.log(`Aktiviere Pumpe ${pumpId} für ${durationMs}ms`)

    // API-Aufruf an den GPIO-Controller
    const response = await fetch("/api/gpio", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "activate_pump",
        pump_id: pumpId,
        duration_ms: durationMs,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Fehler beim Aktivieren der Pumpe")
    }

    const result = await response.json()
    console.log(`Pumpe ${pumpId} aktiviert:`, result)
  } catch (error) {
    console.error(`Fehler beim Aktivieren der Pumpe ${pumpId}:`, error)
    throw error
  }
}

// Erstelle einen einzelnen Shot
export async function makeSingleShot(ingredientId: string, amount: number, pumpConfig: PumpConfig[]): Promise<void> {
  try {
    console.log(`Erstelle ${amount}ml Shot von ${ingredientId}`)

    // Finde die entsprechende Pumpe
    const pump = pumpConfig.find((p) => p.ingredientId === ingredientId)
    if (!pump) {
      throw new Error(`Keine Pumpe für Zutat ${ingredientId} konfiguriert`)
    }

    // Berechne die Aktivierungszeit basierend auf der Kalibrierung
    const durationMs = Math.round((amount / pump.mlPerSecond) * 1000)

    // Aktiviere die Pumpe
    await activatePumpForDuration(pump.pumpId, durationMs)

    console.log(`Shot von ${amount}ml ${ingredientId} erstellt`)
  } catch (error) {
    console.error("Fehler beim Erstellen des Shots:", error)
    throw error
  }
}

// Erstelle einen Cocktail
export async function makeCocktail(cocktail: Cocktail, pumpConfig: PumpConfig[], targetSize = 300): Promise<void> {
  try {
    console.log(`Erstelle Cocktail: ${cocktail.name} (${targetSize}ml)`)

    // Berechne das Originalvolumen
    const originalVolume = cocktail.recipe.reduce((total, item) => total + item.amount, 0)
    const scaleFactor = targetSize / originalVolume

    // Skaliere das Rezept
    const scaledRecipe = cocktail.recipe.map((item) => ({
      ...item,
      amount: Math.round(item.amount * scaleFactor),
    }))

    console.log("Skaliertes Rezept:", scaledRecipe)

    // Erstelle jeden Bestandteil nacheinander
    for (const item of scaledRecipe) {
      const pump = pumpConfig.find((p) => p.ingredientId === item.ingredientId)
      if (!pump) {
        console.warn(`Keine Pumpe für Zutat ${item.ingredientId} konfiguriert - überspringe`)
        continue
      }

      // Berechne die Aktivierungszeit
      const durationMs = Math.round((item.amount / pump.mlPerSecond) * 1000)

      console.log(`Gebe ${item.amount}ml ${item.ingredientId} hinzu (${durationMs}ms)`)

      // Aktiviere die Pumpe
      await activatePumpForDuration(pump.pumpId, durationMs)

      // Kurze Pause zwischen den Zutaten
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    console.log(`Cocktail ${cocktail.name} fertig!`)
  } catch (error) {
    console.error("Fehler beim Erstellen des Cocktails:", error)
    throw error
  }
}
