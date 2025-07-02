import type { Cocktail } from "@/types/cocktail"
import type { PumpConfig } from "@/types/pump"
import { cocktails as defaultCocktails } from "@/data/cocktails"

// Dateipfade
const COCKTAILS_FILE = "/home/pi/cocktailbot/cocktailbot-main/data/custom-cocktails.json"
const PUMP_CONFIG_FILE = "/home/pi/cocktailbot/cocktailbot-main/data/pump-config.json"

// Alle Cocktails abrufen (Standard + Benutzerdefiniert)
export async function getAllCocktails(): Promise<Cocktail[]> {
  try {
    // Versuche benutzerdefinierte Cocktails zu lesen
    const response = await fetch("/api/filesystem?action=read&path=" + encodeURIComponent(COCKTAILS_FILE))
    if (response.ok) {
      const data = await response.json()
      const customCocktails: Cocktail[] = JSON.parse(data.content)
      return [...defaultCocktails, ...customCocktails]
    }
  } catch (error) {
    console.log("Keine benutzerdefinierten Cocktails gefunden, verwende nur Standard-Cocktails")
  }
  return defaultCocktails
}

// Rezept speichern (neu oder aktualisiert)
export async function saveRecipe(cocktail: Cocktail): Promise<void> {
  try {
    // Aktuelle benutzerdefinierte Cocktails abrufen
    let customCocktails: Cocktail[] = []
    try {
      const response = await fetch("/api/filesystem?action=read&path=" + encodeURIComponent(COCKTAILS_FILE))
      if (response.ok) {
        const data = await response.json()
        customCocktails = JSON.parse(data.content)
      }
    } catch (error) {
      // Datei existiert noch nicht, beginne mit leerem Array
      customCocktails = []
    }

    // Prüfen ob Cocktail bereits in benutzerdefinierten Cocktails existiert
    const existingIndex = customCocktails.findIndex((c) => c.id === cocktail.id)

    if (existingIndex >= 0) {
      // Bestehenden benutzerdefinierten Cocktail aktualisieren
      customCocktails[existingIndex] = cocktail
    } else {
      // Prüfen ob es ein Standard-Cocktail ist, der modifiziert wird
      const isDefaultCocktail = defaultCocktails.some((c) => c.id === cocktail.id)

      if (isDefaultCocktail) {
        // Modifizierten Standard-Cocktail zu benutzerdefinierten Cocktails hinzufügen
        customCocktails.push(cocktail)
      } else {
        // Neuen benutzerdefinierten Cocktail hinzufügen
        customCocktails.push(cocktail)
      }
    }

    // Benutzerdefinierte Cocktails speichern
    const saveResponse = await fetch("/api/filesystem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "write",
        path: COCKTAILS_FILE,
        content: JSON.stringify(customCocktails, null, 2),
      }),
    })

    if (!saveResponse.ok) {
      throw new Error("Fehler beim Speichern der Datei")
    }

    console.log(`Rezept ${cocktail.name} erfolgreich gespeichert`)
  } catch (error) {
    console.error("Fehler beim Speichern des Rezepts:", error)
    throw new Error(
      `Fehler beim Speichern des Rezepts: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`,
    )
  }
}

// Rezept löschen
export async function deleteRecipe(cocktailId: string): Promise<void> {
  try {
    // Aktuelle benutzerdefinierte Cocktails abrufen
    let customCocktails: Cocktail[] = []
    try {
      const response = await fetch("/api/filesystem?action=read&path=" + encodeURIComponent(COCKTAILS_FILE))
      if (response.ok) {
        const data = await response.json()
        customCocktails = JSON.parse(data.content)
      }
    } catch (error) {
      throw new Error("Keine benutzerdefinierten Cocktails zum Löschen vorhanden")
    }

    // Prüfen ob es ein Standard-Cocktail ist
    const isDefaultCocktail = defaultCocktails.some((c) => c.id === cocktailId)

    if (isDefaultCocktail) {
      throw new Error("Standard-Cocktails können nicht gelöscht werden")
    }

    // Aus benutzerdefinierten Cocktails entfernen
    const filteredCocktails = customCocktails.filter((c) => c.id !== cocktailId)

    if (filteredCocktails.length === customCocktails.length) {
      throw new Error("Cocktail nicht gefunden")
    }

    // Aktualisierte benutzerdefinierte Cocktails speichern
    const saveResponse = await fetch("/api/filesystem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "write",
        path: COCKTAILS_FILE,
        content: JSON.stringify(filteredCocktails, null, 2),
      }),
    })

    if (!saveResponse.ok) {
      throw new Error("Fehler beim Speichern der Datei")
    }

    console.log(`Rezept ${cocktailId} erfolgreich gelöscht`)
  } catch (error) {
    console.error("Fehler beim Löschen des Rezepts:", error)
    throw new Error(`Fehler beim Löschen des Rezepts: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`)
  }
}

// Pumpenkonfiguration abrufen
export async function getPumpConfig(): Promise<PumpConfig[]> {
  try {
    const response = await fetch("/api/filesystem?action=read&path=" + encodeURIComponent(PUMP_CONFIG_FILE))
    if (response.ok) {
      const data = await response.json()
      return JSON.parse(data.content)
    }
  } catch (error) {
    console.error("Fehler beim Laden der Pumpenkonfiguration:", error)
  }

  // Standard-Konfiguration zurückgeben wenn Datei nicht existiert
  const { pumpConfig } = await import("@/data/pump-config")
  return pumpConfig
}

// Pumpenkonfiguration speichern
export async function savePumpConfig(config: PumpConfig[]): Promise<void> {
  try {
    const response = await fetch("/api/filesystem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "write",
        path: PUMP_CONFIG_FILE,
        content: JSON.stringify(config, null, 2),
      }),
    })

    if (!response.ok) {
      throw new Error("Fehler beim Speichern der Datei")
    }

    console.log("Pumpenkonfiguration erfolgreich gespeichert")
  } catch (error) {
    console.error("Fehler beim Speichern der Pumpenkonfiguration:", error)
    throw new Error(
      `Fehler beim Speichern der Pumpenkonfiguration: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`,
    )
  }
}

// Pumpe für bestimmte Dauer aktivieren
export async function activatePumpForDuration(pumpNumber: number, durationMs: number): Promise<void> {
  try {
    console.log(`Aktiviere Pumpe ${pumpNumber} für ${durationMs}ms`)

    const response = await fetch("/api/gpio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "activate_pump",
        pumpNumber,
        duration: durationMs,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`GPIO-Steuerung fehlgeschlagen: ${error}`)
    }

    const result = await response.json()
    console.log("GPIO-Ausgabe:", result)
  } catch (error) {
    console.error("Fehler beim Aktivieren der Pumpe:", error)
    throw new Error(
      `Fehler beim Aktivieren der Pumpe ${pumpNumber}: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`,
    )
  }
}

// Einzelnen Shot zubereiten
export async function makeSingleShot(ingredientId: string, amount: number, pumpConfig: PumpConfig[]): Promise<void> {
  try {
    // Pumpe für diese Zutat finden
    const pump = pumpConfig.find((p) => p.ingredient === ingredientId)
    if (!pump) {
      throw new Error(`Keine Pumpe für Zutat konfiguriert: ${ingredientId}`)
    }

    // Dauer basierend auf Pumpenkalibrierung berechnen
    const durationMs = Math.round((amount / pump.flowRate) * 1000)

    console.log(`Bereite ${amount}ml von ${ingredientId} mit Pumpe ${pump.id} für ${durationMs}ms zu`)

    // Pumpe aktivieren
    await activatePumpForDuration(pump.id, durationMs)
  } catch (error) {
    console.error("Fehler beim Zubereiten des Shots:", error)
    throw new Error(
      `Fehler beim Zubereiten des Shots: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`,
    )
  }
}

// Cocktail zubereiten
export async function makeCocktail(
  cocktail: Cocktail,
  targetSize = 300,
  onProgress?: (progress: number, message: string) => void,
): Promise<void> {
  try {
    console.log(`Bereite Cocktail zu: ${cocktail.name} (${targetSize}ml)`)

    // Aktuelle Pumpenkonfiguration laden
    const pumpConfig = await getPumpConfig()

    // Gesamtvolumen des ursprünglichen Rezepts berechnen
    const originalVolume = cocktail.recipe.reduce((total, item) => total + item.amount, 0)
    const scaleFactor = targetSize / originalVolume

    // Rezept auf Zielgröße skalieren
    const scaledRecipe = cocktail.recipe.map((item) => ({
      ...item,
      amount: Math.round(item.amount * scaleFactor),
    }))

    console.log("Skaliertes Rezept:", scaledRecipe)

    onProgress?.(10, "Bereite Zutaten vor...")

    // Jede Zutat verarbeiten
    for (let i = 0; i < scaledRecipe.length; i++) {
      const item = scaledRecipe[i]
      const pump = pumpConfig.find((p) => p.ingredient === item.ingredientId)

      if (!pump) {
        console.warn(`Keine Pumpe für Zutat konfiguriert: ${item.ingredientId}`)
        continue
      }

      // Dauer basierend auf Pumpenkalibrierung berechnen
      const durationMs = Math.round((item.amount / pump.flowRate) * 1000)

      const progress = 20 + (i / scaledRecipe.length) * 70
      onProgress?.(progress, `Gebe ${item.amount}ml ${item.ingredientId} hinzu...`)

      console.log(`Gebe ${item.amount}ml von ${item.ingredientId} mit Pumpe ${pump.id} für ${durationMs}ms hinzu`)

      // Pumpe aktivieren
      await activatePumpForDuration(pump.id, durationMs)

      // Kleine Pause zwischen Zutaten
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    onProgress?.(100, `${cocktail.name} ist fertig!`)
    console.log(`Cocktail ${cocktail.name} fertiggestellt!`)
  } catch (error) {
    console.error("Fehler beim Zubereiten des Cocktails:", error)
    throw new Error(
      `Fehler beim Zubereiten des Cocktails: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`,
    )
  }
}

// Pumpe reinigen
export async function cleanPump(pumpNumber: number, durationMs = 10000): Promise<void> {
  try {
    console.log(`Reinige Pumpe ${pumpNumber} für ${durationMs}ms`)

    const response = await fetch("/api/gpio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "clean_pump",
        pumpNumber,
        duration: durationMs,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`GPIO-Steuerung fehlgeschlagen: ${error}`)
    }

    const result = await response.json()
    console.log("GPIO-Ausgabe:", result)
  } catch (error) {
    console.error("Fehler beim Reinigen der Pumpe:", error)
    throw new Error(
      `Fehler beim Reinigen der Pumpe ${pumpNumber}: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`,
    )
  }
}

// Alle Pumpen reinigen
export async function cleanAllPumps(durationMs = 10000): Promise<void> {
  try {
    console.log(`Reinige alle Pumpen für ${durationMs}ms`)

    const response = await fetch("/api/gpio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "clean_all_pumps",
        duration: durationMs,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`GPIO-Steuerung fehlgeschlagen: ${error}`)
    }

    const result = await response.json()
    console.log("GPIO-Ausgabe:", result)
  } catch (error) {
    console.error("Fehler beim Reinigen aller Pumpen:", error)
    throw new Error(
      `Fehler beim Reinigen aller Pumpen: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`,
    )
  }
}

// Pumpe kalibrieren
export async function calibratePump(pumpId: number, durationMs: number): Promise<void> {
  try {
    console.log(`Kalibriere Pumpe ${pumpId} für ${durationMs}ms`)

    const response = await fetch("/api/gpio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "calibrate_pump",
        pumpNumber: pumpId,
        duration: durationMs,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`GPIO-Steuerung fehlgeschlagen: ${error}`)
    }

    const result = await response.json()
    console.log("Kalibrierungs-Ausgabe:", result)
  } catch (error) {
    console.error("Fehler beim Kalibrieren der Pumpe:", error)
    throw new Error(
      `Fehler beim Kalibrieren der Pumpe ${pumpId}: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`,
    )
  }
}
