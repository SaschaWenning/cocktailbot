import type { IngredientLevel } from "@/types/ingredient-level"
import { ingredients } from "@/data/ingredients"
import { pumpConfig } from "@/data/pump-config"

// Initialisiere Füllstände nur für angeschlossene Zutaten
const connectedIngredientIds = pumpConfig.map((pump) => pump.ingredient)

export const initialIngredientLevels: IngredientLevel[] = ingredients
  .filter((ingredient) => connectedIngredientIds.includes(ingredient.id))
  .map((ingredient) => ({
    ingredientId: ingredient.id,
    currentAmount: 700, // Standard-Startmenge
    capacity: 1000, // Standard-Kapazität
    lastRefill: new Date(),
  }))
