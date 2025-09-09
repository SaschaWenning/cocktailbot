"use server"

import type { IngredientLevel } from "@/types/ingredient-level"
import { initialIngredientLevels } from "@/data/ingredient-levels"

// In einer echten Anwendung würden wir diese Daten in einer Datenbank speichern
const ingredientLevels = [...initialIngredientLevels]

// Füllstände abrufen und automatisch neue Zutaten initialisieren
export async function getIngredientLevels(): Promise<IngredientLevel[]> {
  // Hole alle Cocktails und extrahiere verwendete Zutaten
  const { getAllCocktails } = await import("@/lib/cocktail-machine")
  const cocktails = await getAllCocktails()

  const usedIngredients = new Set<string>()
  cocktails.forEach((cocktail) => {
    cocktail.recipe.forEach((item) => {
      usedIngredients.add(item.ingredientId)
    })
  })

  // Initialisiere fehlende Zutaten
  for (const ingredientId of usedIngredients) {
    const existingIndex = ingredientLevels.findIndex((level) => level.ingredientId === ingredientId)

    if (existingIndex === -1) {
      const newLevel: IngredientLevel = {
        ingredientId,
        currentAmount: 700, // Standard-Startmenge
        capacity: 1000, // Standard-Kapazität (kann später geändert werden)
        lastRefill: new Date(),
      }
      ingredientLevels.push(newLevel)
    }
  }

  return ingredientLevels
}

// Füllstand und optional Kapazität für eine bestimmte Zutat aktualisieren
export async function updateIngredientLevel(
  ingredientId: string,
  newAmount: number,
  newCapacity?: number,
): Promise<IngredientLevel> {
  const index = ingredientLevels.findIndex((level) => level.ingredientId === ingredientId)

  if (index === -1) {
    // Erstelle neue Zutat wenn sie nicht existiert
    const newLevel: IngredientLevel = {
      ingredientId,
      currentAmount: newAmount,
      capacity: newCapacity ?? Math.max(newAmount, 1000),
      lastRefill: new Date(),
    }
    ingredientLevels.push(newLevel)
    return newLevel
  }

  // Falls eine neue Kapazität übergeben wurde → übernehmen
  if (newCapacity) {
    ingredientLevels[index].capacity = newCapacity
  }

  // Füllmenge darf nicht größer als Kapazität sein
  const cappedAmount = Math.min(newAmount, ingredientLevels[index].capacity)

  const updatedLevel: IngredientLevel = {
    ...ingredientLevels[index],
    currentAmount: cappedAmount,
    lastRefill: new Date(),
  }

  ingredientLevels[index] = updatedLevel
  return updatedLevel
}

// Kapazität separat ändern
export async function updateIngredientCapacity(ingredientId: string, newCapacity: number): Promise<IngredientLevel> {
  const index = ingredientLevels.findIndex((level) => level.ingredientId === ingredientId)
  if (index === -1) throw new Error("Ingredient not found")

  ingredientLevels[index].capacity = newCapacity

  // sicherstellen, dass currentAmount nicht größer ist als neue Kapazität
  if (ingredientLevels[index].currentAmount > newCapacity) {
    ingredientLevels[index].currentAmount = newCapacity
  }

  return ingredientLevels[index]
}

// Neue Zutaten initialisieren
export async function initializeNewIngredientLevel(ingredientId: string, capacity = 1000): Promise<IngredientLevel> {
  const existingIndex = ingredientLevels.findIndex((level) => level.ingredientId === ingredientId)

  if (existingIndex !== -1) {
    return ingredientLevels[existingIndex]
  }

  const newLevel: IngredientLevel = {
    ingredientId,
    currentAmount: Math.min(700, capacity),
    capacity,
    lastRefill: new Date(),
  }

  ingredientLevels.push(newLevel)
  return newLevel
}
