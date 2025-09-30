"use server"

import type { Cocktail } from "@/types/cocktail"
import fs from "fs"
import path from "path"

// Path to the dynamic cocktails JSON file
const DYNAMIC_COCKTAILS_PATH = path.join(process.cwd(), "data", "cocktails.json")

/**
 * Initialize the cocktails.json file with default cocktails if it doesn't exist
 * This ensures all cocktails are editable and persistent across restarts
 */
export async function initializeCocktailsJSON(): Promise<void> {
  try {
    console.log("[v0] Initializing cocktails JSON system...")

    // Ensure the data directory exists
    const dataDir = path.dirname(DYNAMIC_COCKTAILS_PATH)
    if (!fs.existsSync(dataDir)) {
      console.log("[v0] Creating data directory:", dataDir)
      fs.mkdirSync(dataDir, { recursive: true })
    }

    // Check if the dynamic cocktails file already exists
    if (fs.existsSync(DYNAMIC_COCKTAILS_PATH)) {
      console.log("[v0] Dynamic cocktails file already exists, skipping initialization")
      return
    }

    console.log("[v0] Creating new dynamic cocktails file...")

    // Load the default cocktails from the static file
    const { cocktails: defaultCocktails } = await import("@/data/cocktails")

    // Create the initial JSON file with all default cocktails
    const initialData = {
      version: "1.0.0",
      lastUpdated: new Date().toISOString(),
      cocktails: defaultCocktails,
    }

    // Write the initial data to the JSON file
    fs.writeFileSync(DYNAMIC_COCKTAILS_PATH, JSON.stringify(initialData, null, 2), "utf8")

    console.log(`[v0] Successfully initialized cocktails.json with ${defaultCocktails.length} cocktails`)
  } catch (error) {
    console.error("[v0] Error initializing cocktails JSON:", error)
    throw error
  }
}

/**
 * Load cocktails from the dynamic JSON file
 */
export async function loadDynamicCocktails(): Promise<Cocktail[]> {
  try {
    // Initialize if file doesn't exist
    if (!fs.existsSync(DYNAMIC_COCKTAILS_PATH)) {
      console.log("[v0] Dynamic cocktails file not found, initializing...")
      await initializeCocktailsJSON()
    }

    // Read the JSON file
    const data = fs.readFileSync(DYNAMIC_COCKTAILS_PATH, "utf8")
    const parsedData = JSON.parse(data)

    // Handle both old format (array) and new format (object with cocktails array)
    const cocktails = Array.isArray(parsedData) ? parsedData : parsedData.cocktails || []

    console.log(`[v0] Loaded ${cocktails.length} cocktails from dynamic JSON`)
    return cocktails
  } catch (error) {
    console.error("[v0] Error loading dynamic cocktails:", error)

    // Fallback to static cocktails
    console.log("[v0] Falling back to static cocktails")
    const { cocktails } = await import("@/data/cocktails")
    return cocktails
  }
}

/**
 * Save cocktails to the dynamic JSON file
 */
export async function saveDynamicCocktails(cocktails: Cocktail[]): Promise<void> {
  try {
    console.log(`[v0] Saving ${cocktails.length} cocktails to dynamic JSON`)

    // Ensure the data directory exists
    const dataDir = path.dirname(DYNAMIC_COCKTAILS_PATH)
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    // Create the data structure
    const data = {
      version: "1.0.0",
      lastUpdated: new Date().toISOString(),
      cocktails: cocktails,
    }

    // Write to file
    fs.writeFileSync(DYNAMIC_COCKTAILS_PATH, JSON.stringify(data, null, 2), "utf8")

    console.log("[v0] Successfully saved cocktails to dynamic JSON")
  } catch (error) {
    console.error("[v0] Error saving dynamic cocktails:", error)
    throw error
  }
}

/**
 * Add or update a single cocktail in the dynamic JSON
 */
export async function saveOrUpdateCocktail(cocktail: Cocktail): Promise<void> {
  try {
    console.log(`[v0] Saving/updating cocktail: ${cocktail.name}`)

    // Load current cocktails
    const currentCocktails = await loadDynamicCocktails()

    // Find existing cocktail or add new one
    const existingIndex = currentCocktails.findIndex((c) => c.id === cocktail.id)

    if (existingIndex !== -1) {
      // Update existing cocktail
      currentCocktails[existingIndex] = cocktail
      console.log(`[v0] Updated existing cocktail: ${cocktail.name}`)
    } else {
      // Add new cocktail
      currentCocktails.push(cocktail)
      console.log(`[v0] Added new cocktail: ${cocktail.name}`)
    }

    // Save back to file
    await saveDynamicCocktails(currentCocktails)
  } catch (error) {
    console.error(`[v0] Error saving/updating cocktail ${cocktail.name}:`, error)
    throw error
  }
}

/**
 * Delete a cocktail from the dynamic JSON (actually removes it, not just hides)
 */
export async function deleteCocktailFromJSON(cocktailId: string): Promise<void> {
  try {
    console.log(`[v0] Deleting cocktail from JSON: ${cocktailId}`)

    // Load current cocktails
    const currentCocktails = await loadDynamicCocktails()

    // Filter out the cocktail to delete
    const filteredCocktails = currentCocktails.filter((c) => c.id !== cocktailId)

    if (filteredCocktails.length === currentCocktails.length) {
      console.log(`[v0] Cocktail ${cocktailId} not found in JSON`)
      return
    }

    // Save the filtered list
    await saveDynamicCocktails(filteredCocktails)

    console.log(`[v0] Successfully deleted cocktail ${cocktailId} from JSON`)
  } catch (error) {
    console.error(`[v0] Error deleting cocktail ${cocktailId}:`, error)
    throw error
  }
}
