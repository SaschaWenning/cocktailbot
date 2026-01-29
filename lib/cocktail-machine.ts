import type { Cocktail } from "@/types/cocktail"
import type { PumpConfig } from "@/types/pump"
import { updateLevelsAfterCocktail } from "@/lib/ingredient-level-service"

// Helper function to save statistics to localStorage
function saveStatistics(
  cocktail: Cocktail,
  size: number,
  ingredientUsage: Array<{ ingredientId: string; amount: number }>,
  category: "cocktails" | "virgin" | "shots" = "cocktails",
) {
  try {
    const statisticsLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      cocktailId: cocktail.id,
      cocktailName: cocktail.name,
      category,
      size,
      timestamp: new Date().toISOString(),
      ingredients: ingredientUsage,
    }

    // Load existing statistics
    const existingData = localStorage.getItem("cocktailbot-statistics")
    const statistics = existingData ? JSON.parse(existingData) : { logs: [] }

    // Add new log
    statistics.logs.push(statisticsLog)

    // Save back to localStorage
    localStorage.setItem("cocktailbot-statistics", JSON.stringify(statistics))
    console.log("[v0] Statistics saved to localStorage:", statisticsLog)
  } catch (error) {
    console.error("[v0] Error saving statistics:", error)
  }
}

// Client-compatible functions that call API endpoints instead of server actions
export async function makeCocktail(
  cocktail: Cocktail,
  pumpConfig: PumpConfig[],
  size = 300,
  category: "cocktails" | "virgin" | "shots" = "cocktails",
) {
  const response = await fetch("/api/make-cocktail", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cocktail, pumpConfig, size }),
  })

  if (!response.ok) {
    throw new Error(`Failed to make cocktail: ${response.statusText}`)
  }

  const result = await response.json()

  if (result.success && result.ingredientUsage) {
    saveStatistics(cocktail, size, result.ingredientUsage, category)
    
    // Update ingredient levels in localStorage (client-side)
    try {
      // Convert ingredientUsage to pumpId-based updates
      const pumpUpdates = result.ingredientUsage.map((usage: { ingredientId: string; amount: number }) => {
        const pump = pumpConfig.find(p => p.ingredient === usage.ingredientId)
        return pump ? { pumpId: pump.id, amount: usage.amount } : null
      }).filter(Boolean) as { pumpId: number; amount: number }[]
      
      console.log("[v0] Updating ingredient levels after cocktail:", pumpUpdates)
      await updateLevelsAfterCocktail(pumpUpdates)
    } catch (error) {
      console.error("[v0] Error updating ingredient levels:", error)
    }
  }

  return result
}

export async function makeSingleShot(ingredientId: string, amount = 40, pumpConfig: PumpConfig[]) {
  const response = await fetch("/api/make-shot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ingredientId, amount, pumpConfig }),
  })

  if (!response.ok) {
    throw new Error(`Failed to make shot: ${response.statusText}`)
  }

  const result = await response.json()

  if (result.success) {
    // Create a simple shot "cocktail" object for statistics
    const shotCocktail = {
      id: `shot-${ingredientId}`,
      name: ingredientId.replace(/^custom-\d+-/, "").replace(/-/g, " "),
      category: "shots" as const,
      ingredients: [ingredientId],
      recipe: [{ ingredientId, amount }],
    }
    
    const ingredientUsage = [{ ingredientId, amount }]
    saveStatistics(shotCocktail, amount, ingredientUsage, "shots")
    
    // Update ingredient levels in localStorage (client-side)
    try {
      const pump = pumpConfig.find(p => p.ingredient === ingredientId)
      if (pump) {
        console.log("[v0] Updating ingredient level after shot:", pump.id, amount)
        await updateLevelsAfterCocktail([{ pumpId: pump.id, amount }])
      }
    } catch (error) {
      console.error("[v0] Error updating ingredient levels:", error)
    }
  }

  return result
}

export async function testPump(pumpId: number) {
  try {
    console.log(`Teste Pumpe ${pumpId}`)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    return { success: true }
  } catch (error) {
    console.error(`Fehler beim Testen der Pumpe ${pumpId}:`, error)
    throw error
  }
}

export async function calibratePump(pumpId: number, durationMs: number) {
  const response = await fetch("/api/calibrate-pump", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pumpId, durationMs }),
  })

  if (!response.ok) {
    throw new Error(`Failed to calibrate pump: ${response.statusText}`)
  }

  return await response.json()
}

export async function cleanPump(pumpId: number, durationMs: number) {
  const response = await fetch("/api/vent-pump", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pumpId, durationMs }),
  })

  if (!response.ok) {
    throw new Error(`Failed to clean pump: ${response.statusText}`)
  }

  return await response.json()
}

export async function getPumpConfig(): Promise<PumpConfig[]> {
  const response = await fetch("/api/pump-config")

  if (!response.ok) {
    throw new Error(`Failed to get pump config: ${response.statusText}`)
  }

  const data = await response.json()
  return data.pumpConfig || []
}

export async function getAllCocktails(): Promise<Cocktail[]> {
  const response = await fetch("/api/cocktails")

  if (!response.ok) {
    throw new Error(`Failed to get cocktails: ${response.statusText}`)
  }

  const data = await response.json()
  const cocktails = Array.isArray(data) ? data : (data?.cocktails ?? [])
  console.log("[v0] Loaded cocktails from getAllCocktails:", cocktails.length)
  return cocktails
}

export async function saveRecipe(cocktail: Cocktail) {
  const response = await fetch("/api/save-recipe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cocktail }),
  })

  if (!response.ok) {
    throw new Error(`Failed to save recipe: ${response.statusText}`)
  }

  return await response.json()
}

export async function deleteRecipe(cocktailId: string) {
  const response = await fetch("/api/delete-recipe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cocktailId }),
  })

  if (!response.ok) {
    throw new Error(`Failed to delete recipe: ${response.statusText}`)
  }

  return await response.json()
}

export const updatePumpConfig = async (config: PumpConfig[]): Promise<void> => {
  await savePumpConfig(config)
}

export const savePumpConfig = async (config: PumpConfig[]): Promise<void> => {
  const response = await fetch("/api/pump-config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pumpConfig: config }),
  })

  if (!response.ok) {
    throw new Error(`Failed to save pump config: ${response.statusText}`)
  }
}

export const activatePumpForDuration = async (
  pumpId: string,
  durationMs: number,
  pumpConfig: PumpConfig[],
): Promise<void> => {
  const response = await fetch("/api/activate-pump", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pumpId, durationMs, pumpConfig }),
  })

  if (!response.ok) {
    throw new Error(`Failed to activate pump: ${response.statusText}`)
  }
}
