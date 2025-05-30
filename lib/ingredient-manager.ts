"use server"

import fs from "fs"
import path from "path"
import type { Ingredient } from "@/types/pump"
import { ingredients as defaultIngredients } from "@/data/ingredients" // Standard-Zutaten

const CUSTOM_INGREDIENTS_PATH = path.join(process.cwd(), "data", "custom-ingredients.json")

function generateIngredientId(name: string): string {
  return `custom-${name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")}`
}

export async function getCustomIngredients(): Promise<Ingredient[]> {
  try {
    if (fs.existsSync(CUSTOM_INGREDIENTS_PATH)) {
      const data = fs.readFileSync(CUSTOM_INGREDIENTS_PATH, "utf8")
      return JSON.parse(data) as Ingredient[]
    }
    return []
  } catch (error) {
    console.error("Error loading custom ingredients:", error)
    return []
  }
}

export async function saveCustomIngredient(newIngredientData: {
  name: string
  alcoholic: boolean
}): Promise<Ingredient> {
  if (!newIngredientData.name || newIngredientData.name.trim() === "") {
    throw new Error("Ingredient name cannot be empty.")
  }

  const customIngredients = await getCustomIngredients()
  const newId = generateIngredientId(newIngredientData.name)

  // Check for ID collision with default and custom ingredients
  const allIds = [...defaultIngredients.map((i) => i.id), ...customIngredients.map((i) => i.id)]
  if (allIds.includes(newId)) {
    // Simple collision handling: append a number. For robust solution, use UUID or more complex logic.
    let i = 1
    let uniqueId = `${newId}-${i}`
    while (allIds.includes(uniqueId)) {
      i++
      uniqueId = `${newId}-${i}`
    }
    // This case (ID collision after generating from name) should be rare if names are somewhat unique.
    // A more robust approach might be to always use UUIDs for custom ingredients.
    // For now, we'll assume generateIngredientId is sufficient for most cases or throw an error.
    console.warn(`Generated ID ${newId} already exists. This should be handled more robustly.`)
    throw new Error(
      `Ingredient with similar name resulting in ID ${newId} might already exist. Please choose a more unique name.`,
    )
  }
  if (customIngredients.some((ing) => ing.name.toLowerCase() === newIngredientData.name.toLowerCase())) {
    throw new Error(`Ingredient with name "${newIngredientData.name}" already exists.`)
  }

  const newIngredient: Ingredient = {
    id: newId,
    name: newIngredientData.name.trim(),
    alcoholic: newIngredientData.alcoholic,
  }

  customIngredients.push(newIngredient)

  try {
    fs.mkdirSync(path.dirname(CUSTOM_INGREDIENTS_PATH), { recursive: true })
    fs.writeFileSync(CUSTOM_INGREDIENTS_PATH, JSON.stringify(customIngredients, null, 2), "utf8")
    return newIngredient
  } catch (error) {
    console.error("Error saving custom ingredient:", error)
    throw new Error("Could not save custom ingredient.")
  }
}

export async function getAllIngredients(): Promise<Ingredient[]> {
  const customIngredients = await getCustomIngredients()
  const combinedIngredients = [...defaultIngredients, ...customIngredients]

  // Remove duplicates by ID, giving preference to custom if IDs were to collide (though unlikely with prefix)
  const uniqueIngredientsMap = new Map<string, Ingredient>()
  combinedIngredients.forEach((ingredient) => {
    uniqueIngredientsMap.set(ingredient.id, ingredient)
  })

  const sortedIngredients = Array.from(uniqueIngredientsMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  return sortedIngredients
}
