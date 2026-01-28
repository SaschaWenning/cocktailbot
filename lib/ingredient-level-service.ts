"use client"

export interface IngredientLevel {
  pumpId: number
  ingredient: string
  ingredientId: string
  currentLevel: number
  containerSize: number
  lastUpdated: Date
}

const STORAGE_KEY = "cocktail-ingredient-levels"
const STORAGE_VERSION_KEY = "cocktail-ingredient-levels-version"
const CURRENT_VERSION = "2.1"

// In-memory cache to prevent excessive localStorage reads
let memoryCache: IngredientLevel[] | null = null
let saveTimeout: NodeJS.Timeout | null = null

// Default levels for all 18 pumps
const getDefaultLevels = (): IngredientLevel[] => {
  return Array.from({ length: 18 }, (_, i) => ({
    pumpId: i + 1,
    ingredient: `Zutat ${i + 1}`,
    ingredientId: `ingredient-${i + 1}`,
    currentLevel: 1000,
    containerSize: 1000,
    lastUpdated: new Date(),
  }))
}

const LEVELS_UPDATED_EVENT = "ingredient-levels:updated"
function emitLevelsUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(LEVELS_UPDATED_EVENT))
  }
}

export function onIngredientLevelsUpdated(cb: () => void) {
  if (typeof window === "undefined") return () => {}
  const handler = () => {
    cb()
  }
  window.addEventListener(LEVELS_UPDATED_EVENT, handler)
  return () => window.removeEventListener(LEVELS_UPDATED_EVENT, handler)
}

// Load levels from localStorage with fallback to defaults
export const getIngredientLevels = (): IngredientLevel[] => {
  if (typeof window === "undefined") {
    console.log("[v0] Server-side call to getIngredientLevels - returning defaults")
    return getDefaultLevels()
  }

  // Return from memory cache if available
  if (memoryCache) {
    return memoryCache
  }

  try {
    // Check version
    const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY)
    if (storedVersion !== CURRENT_VERSION) {
      console.log(`[v0] Storage version mismatch (${storedVersion} vs ${CURRENT_VERSION}) - using defaults`)
      const defaults = getDefaultLevels()
      memoryCache = defaults
      // Save defaults with new version
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults))
      localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION)
      return defaults
    }

    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const levels = JSON.parse(stored)
      
      // Validate data integrity
      if (!Array.isArray(levels) || levels.length === 0) {
        console.warn("[v0] Invalid levels data in localStorage - using defaults")
        const defaults = getDefaultLevels()
        memoryCache = defaults
        return defaults
      }

      // Ensure we have all 18 pumps
      const defaults = getDefaultLevels()
      const merged = defaults.map((defaultLevel) => {
        const existing = levels.find((l: IngredientLevel) => l.pumpId === defaultLevel.pumpId)
        if (existing) {
          return {
            ...existing,
            lastUpdated: new Date(existing.lastUpdated),
            // Ensure valid values
            currentLevel: Math.max(0, Math.min(existing.currentLevel || 0, existing.containerSize || 1000)),
            containerSize: existing.containerSize || 1000,
          }
        }
        return defaultLevel
      })
      
      console.log("[v0] Loaded levels from localStorage:", merged.map(l => `P${l.pumpId}:${l.currentLevel}ml`).join(", "))
      memoryCache = merged
      return merged
    }
  } catch (error) {
    console.error("[v0] Error loading ingredient levels from localStorage:", error)
    // Clear corrupted data
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(STORAGE_VERSION_KEY)
    } catch {}
  }

  console.log("[v0] No stored levels found - initializing with defaults")
  const defaults = getDefaultLevels()
  memoryCache = defaults
  // Save defaults immediately
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults))
    localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION)
  } catch (error) {
    console.error("[v0] Failed to save default levels:", error)
  }
  return defaults
}

// Save levels to localStorage with debouncing
export const saveIngredientLevels = async (levels: IngredientLevel[]): Promise<void> => {
  if (typeof window === "undefined") {
    console.warn("[v0] Cannot save ingredient levels on server-side")
    return
  }

  // Validate input
  if (!Array.isArray(levels) || levels.length === 0) {
    console.error("[v0] Invalid levels data - cannot save")
    return
  }

  try {
    // Update memory cache immediately
    memoryCache = levels

    // Debounce localStorage writes (prevent excessive writes)
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }

    saveTimeout = setTimeout(async () => {
      try {
        console.log("[v0] Saving levels to localStorage:", levels.map(l => `P${l.pumpId}:${l.currentLevel}ml`).join(", "))
        localStorage.setItem(STORAGE_KEY, JSON.stringify(levels))
        localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION)
        emitLevelsUpdated()
        console.log("[v0] Successfully saved levels to localStorage")
      } catch (error) {
        console.error("[v0] Error saving to localStorage:", error)
      }
    }, 500) // Debounce 500ms
  } catch (error) {
    console.error("[v0] Error in saveIngredientLevels:", error)
    throw error
  }
}

// Update level for a specific pump
export const updateIngredientLevel = async (pumpId: number, newLevel: number): Promise<void> => {
  const levels = getIngredientLevels()
  const levelIndex = levels.findIndex((l) => l.pumpId === pumpId)

  if (levelIndex !== -1) {
    levels[levelIndex].currentLevel = Math.max(0, Math.min(newLevel, levels[levelIndex].containerSize))
    levels[levelIndex].lastUpdated = new Date()
    await saveIngredientLevels(levels)
  }
}

// Update container size for a specific pump
export const updateContainerSize = async (pumpId: number, newSize: number): Promise<void> => {
  const levels = getIngredientLevels()
  const levelIndex = levels.findIndex((l) => l.pumpId === pumpId)

  if (levelIndex !== -1) {
    const validSize = Math.max(100, Math.min(newSize, 5000))
    levels[levelIndex].containerSize = validSize
    // Ensure current level doesn't exceed new container size
    levels[levelIndex].currentLevel = Math.min(levels[levelIndex].currentLevel, validSize)
    levels[levelIndex].lastUpdated = new Date()
    await saveIngredientLevels(levels)
  }
}

// Update ingredient name for a specific pump
export const updateIngredientName = async (pumpId: number, newName: string): Promise<void> => {
  const levels = getIngredientLevels()
  const levelIndex = levels.findIndex((l) => l.pumpId === pumpId)

  if (levelIndex !== -1) {
    levels[levelIndex].ingredient = newName || `Zutat ${pumpId}`
    levels[levelIndex].ingredientId = newName || `ingredient-${pumpId}`
    levels[levelIndex].lastUpdated = new Date()
    await saveIngredientLevels(levels)
  }
}

// Reduce level after cocktail making
export const updateLevelsAfterCocktail = async (ingredients: { pumpId: number; amount: number }[]): Promise<void> => {
  console.log("[v0] Updating levels after cocktail:", ingredients.map(i => `P${i.pumpId}:-${i.amount}ml`).join(", "))
  const levels = getIngredientLevels()
  let updated = false

  for (const ingredient of ingredients) {
    const levelIndex = levels.findIndex((l) => l.pumpId === ingredient.pumpId)
    if (levelIndex !== -1) {
      const oldLevel = levels[levelIndex].currentLevel
      levels[levelIndex].currentLevel = Math.max(0, oldLevel - ingredient.amount)
      levels[levelIndex].lastUpdated = new Date()
      console.log(`[v0] P${ingredient.pumpId}: ${oldLevel}ml → ${levels[levelIndex].currentLevel}ml`)
      updated = true
    }
  }

  if (updated) {
    await saveIngredientLevels(levels)
  }
}

// Reduce level after single shot
export const updateLevelAfterShot = async (pumpId: number, amount: number): Promise<void> => {
  await updateLevelsAfterCocktail([{ pumpId, amount }])
}

// Reset all levels to full
export const resetAllLevels = async (): Promise<void> => {
  const levels = getIngredientLevels()
  const resetLevels = levels.map((level) => ({
    ...level,
    currentLevel: level.containerSize,
    lastUpdated: new Date(),
  }))
  console.log("[v0] Resetting all levels to full capacity")
  await saveIngredientLevels(resetLevels)
}

// Update ingredient capacity for a specific pump
export const updateIngredientCapacity = async (pumpId: number, newCapacity: number): Promise<void> => {
  await updateContainerSize(pumpId, newCapacity)
}

// Refill all ingredients to full capacity
export const refillAllIngredients = async (): Promise<void> => {
  await resetAllLevels()
}

// Set levels from external source (API load)
export const setIngredientLevels = async (newLevels: IngredientLevel[]): Promise<void> => {
  if (!Array.isArray(newLevels) || newLevels.length === 0) {
    console.error("[v0] Invalid levels provided to setIngredientLevels")
    return
  }
  console.log("[v0] Setting ingredient levels from external source:", newLevels.length, "levels")
  await saveIngredientLevels(newLevels)
}

export async function restoreIngredientLevelsFromFile(): Promise<IngredientLevel[]> {
  try {
    const res = await fetch("/api/load-from-file", { method: "POST" })
    if (!res.ok) throw new Error("Restore fehlgeschlagen")
    const { levels } = (await res.json()) as { levels: IngredientLevel[] }
    await setIngredientLevels(levels)
    return levels
  } catch (error) {
    console.error("[v0] Failed to restore levels from file:", error)
    throw error
  }
}

// Clear memory cache to force reload from localStorage
export const resetCache = (): void => {
  console.log("[v0] Resetting memory cache")
  memoryCache = null
}

export const syncLevelsWithPumpConfig = async (pumpConfig: any[]): Promise<void> => {
  console.log("[v0] Syncing levels with pump config")
  const levels = getIngredientLevels()
  let updated = false

  for (const pump of pumpConfig) {
    const levelIndex = levels.findIndex((l) => l.pumpId === pump.id)
    if (levelIndex !== -1) {
      // Update ingredientId from pump config
      if (levels[levelIndex].ingredientId !== pump.ingredient) {
        console.log(`[v0] P${pump.id}: ${levels[levelIndex].ingredientId} → ${pump.ingredient}`)
        levels[levelIndex].ingredientId = pump.ingredient
        levels[levelIndex].ingredient = pump.ingredient.replace(/^custom-\d+-/, "")
        updated = true
      }
    }
  }

  if (updated) {
    await saveIngredientLevels(levels)
  }
}
