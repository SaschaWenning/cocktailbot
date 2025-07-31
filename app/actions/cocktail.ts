"use server"

import { CocktailStatsService } from "@/lib/cocktail-stats-service"
import { CocktailMachine } from "@/lib/cocktail-machine"
import type { CocktailStat } from "@/lib/cocktail-stats-service"

/**
 * Server Action to get all cocktail statistics.
 * @returns A promise that resolves to an array of CocktailStat.
 */
export async function getStatsAction(): Promise<CocktailStat[]> {
  const statsService = CocktailStatsService.getInstance()
  return await statsService.getStats()
}

/**
 * Server Action to get total cocktail statistics.
 * @returns A promise that resolves to an object containing totalCocktails, uniqueCocktails, and mostPopular.
 */
export async function getTotalStatsAction(): Promise<{
  totalCocktails: number
  uniqueCocktails: number
  mostPopular: CocktailStat | null
}> {
  const statsService = CocktailStatsService.getInstance()
  return await statsService.getTotalStats()
}

/**
 * Server Action to reset statistics for a specific cocktail.
 * @param cocktailId The ID of the cocktail to reset.
 */
export async function resetCocktailStatsAction(cocktailId: string): Promise<void> {
  const statsService = CocktailStatsService.getInstance()
  await statsService.resetCocktailStats(cocktailId)
}

/**
 * Server Action to reset all cocktail statistics.
 */
export async function resetAllStatsAction(): Promise<void> {
  const statsService = CocktailStatsService.getInstance()
  await statsService.resetAllStats()
}

/**
 * Server Action to make a cocktail and increment its statistics.
 * @param cocktailId The ID of the cocktail to make.
 * @param cocktailName The name of the cocktail.
 * @returns A promise that resolves to the result of the cocktail making process.
 */
export async function makeCocktailAction(
  cocktailId: string,
  cocktailName: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const machine = CocktailMachine.getInstance()
    const result = await machine.makeCocktail(cocktailId)

    if (result.success) {
      const statsService = CocktailStatsService.getInstance()
      await statsService.incrementCocktail(cocktailId, cocktailName)
    }
    return result
  } catch (error) {
    console.error("Error in makeCocktailAction:", error)
    return { success: false, message: "Unbekannter Fehler beim Zubereiten des Cocktails." }
  }
}
