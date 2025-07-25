import { readFileSync, writeFileSync, existsSync } from "fs"
import { join } from "path"

interface CocktailStat {
  cocktailId: string
  cocktailName: string
  count: number
  lastMade: string
}

const STATS_FILE = join(process.cwd(), "data", "cocktail-stats.json")

// Lade Cocktail-Statistiken
export async function getCocktailStats(): Promise<CocktailStat[]> {
  try {
    if (!existsSync(STATS_FILE)) {
      return []
    }

    const data = readFileSync(STATS_FILE, "utf-8")
    const stats = JSON.parse(data) as CocktailStat[]

    // Sortiere nach Anzahl (absteigend)
    return stats.sort((a, b) => b.count - a.count)
  } catch (error) {
    console.error("Fehler beim Laden der Cocktail-Statistiken:", error)
    return []
  }
}

// Erhöhe den Zähler für einen Cocktail
export async function incrementCocktailCount(cocktailId: string, cocktailName: string): Promise<void> {
  try {
    const stats = await getCocktailStats()
    const existingIndex = stats.findIndex((stat) => stat.cocktailId === cocktailId)

    if (existingIndex >= 0) {
      // Cocktail existiert bereits, erhöhe Zähler
      stats[existingIndex].count += 1
      stats[existingIndex].lastMade = new Date().toISOString()
      stats[existingIndex].cocktailName = cocktailName // Update name falls geändert
    } else {
      // Neuer Cocktail
      stats.push({
        cocktailId,
        cocktailName,
        count: 1,
        lastMade: new Date().toISOString(),
      })
    }

    // Speichere die aktualisierten Statistiken
    writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), "utf-8")
  } catch (error) {
    console.error("Fehler beim Aktualisieren der Cocktail-Statistiken:", error)
    throw error
  }
}

// Setze den Zähler für einen bestimmten Cocktail zurück
export async function resetCocktailCount(cocktailId: string): Promise<void> {
  try {
    const stats = await getCocktailStats()
    const filteredStats = stats.filter((stat) => stat.cocktailId !== cocktailId)

    writeFileSync(STATS_FILE, JSON.stringify(filteredStats, null, 2), "utf-8")
  } catch (error) {
    console.error("Fehler beim Zurücksetzen der Cocktail-Statistik:", error)
    throw error
  }
}

// Setze alle Statistiken zurück
export async function resetCocktailStats(): Promise<void> {
  try {
    writeFileSync(STATS_FILE, JSON.stringify([], null, 2), "utf-8")
  } catch (error) {
    console.error("Fehler beim Zurücksetzen aller Cocktail-Statistiken:", error)
    throw error
  }
}

// Hole Gesamtstatistiken
export async function getTotalStats(): Promise<{
  totalCocktails: number
  uniqueCocktails: number
  mostPopular: CocktailStat | null
}> {
  try {
    const stats = await getCocktailStats()

    const totalCocktails = stats.reduce((sum, stat) => sum + stat.count, 0)
    const uniqueCocktails = stats.length
    const mostPopular = stats.length > 0 ? stats[0] : null

    return {
      totalCocktails,
      uniqueCocktails,
      mostPopular,
    }
  } catch (error) {
    console.error("Fehler beim Laden der Gesamtstatistiken:", error)
    return {
      totalCocktails: 0,
      uniqueCocktails: 0,
      mostPopular: null,
    }
  }
}
