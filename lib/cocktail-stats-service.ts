"use server"

export interface CocktailStat {
  cocktailId: string
  cocktailName: string
  count: number
  lastMade: Date
}

// In einer echten Anwendung würden wir diese Daten in einer Datenbank speichern
let cocktailStats: CocktailStat[] = []

// Statistiken abrufen
export async function getCocktailStats(): Promise<CocktailStat[]> {
  return cocktailStats.sort((a, b) => b.count - a.count) // Sortiert nach Anzahl (höchste zuerst)
}

// Cocktail-Zähler erhöhen
export async function incrementCocktailCount(cocktailId: string, cocktailName: string): Promise<void> {
  const existingIndex = cocktailStats.findIndex((stat) => stat.cocktailId === cocktailId)

  if (existingIndex !== -1) {
    // Existierenden Eintrag aktualisieren
    cocktailStats[existingIndex] = {
      ...cocktailStats[existingIndex],
      count: cocktailStats[existingIndex].count + 1,
      lastMade: new Date(),
      cocktailName: cocktailName, // Name aktualisieren falls er sich geändert hat
    }
  } else {
    // Neuen Eintrag erstellen
    cocktailStats.push({
      cocktailId,
      cocktailName,
      count: 1,
      lastMade: new Date(),
    })
  }
}

// Statistiken zurücksetzen
export async function resetCocktailStats(): Promise<void> {
  cocktailStats = []
}

// Einzelnen Cocktail-Zähler zurücksetzen
export async function resetSingleCocktailStat(cocktailId: string): Promise<void> {
  cocktailStats = cocktailStats.filter((stat) => stat.cocktailId !== cocktailId)
}

// Gesamtanzahl aller zubereiteten Cocktails
export async function getTotalCocktailCount(): Promise<number> {
  return cocktailStats.reduce((total, stat) => total + stat.count, 0)
}

// Top 5 beliebteste Cocktails
export async function getTopCocktails(limit = 5): Promise<CocktailStat[]> {
  return cocktailStats.sort((a, b) => b.count - a.count).slice(0, limit)
}
