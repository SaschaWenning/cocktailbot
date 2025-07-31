import { promises as fs } from "fs"
import path from "path"

export interface CocktailStat {
  id: string
  name: string
  count: number
  lastMade: string
}

export interface CocktailStats {
  [cocktailId: string]: CocktailStat
}

const STATS_FILE = path.join(process.cwd(), "data", "cocktail-stats.json")

export class CocktailStatsService {
  private static instance: CocktailStatsService
  private stats: CocktailStats = {}

  private constructor() {}

  static getInstance(): CocktailStatsService {
    if (!CocktailStatsService.instance) {
      CocktailStatsService.instance = new CocktailStatsService()
    }
    return CocktailStatsService.instance
  }

  async loadStats(): Promise<CocktailStats> {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(STATS_FILE)
      await fs.mkdir(dataDir, { recursive: true })

      const data = await fs.readFile(STATS_FILE, "utf-8")
      this.stats = JSON.parse(data)
    } catch (error) {
      // File doesn't exist or is invalid, start with empty stats
      this.stats = {}
    }
    return this.stats
  }

  async saveStats(): Promise<void> {
    try {
      const dataDir = path.dirname(STATS_FILE)
      await fs.mkdir(dataDir, { recursive: true })
      await fs.writeFile(STATS_FILE, JSON.stringify(this.stats, null, 2))
    } catch (error) {
      console.error("Error saving cocktail stats:", error)
    }
  }

  async incrementCocktail(cocktailId: string, cocktailName: string): Promise<void> {
    await this.loadStats()

    if (!this.stats[cocktailId]) {
      this.stats[cocktailId] = {
        id: cocktailId,
        name: cocktailName,
        count: 0,
        lastMade: new Date().toISOString(),
      }
    }

    this.stats[cocktailId].count++
    this.stats[cocktailId].lastMade = new Date().toISOString()
    this.stats[cocktailId].name = cocktailName // Update name in case it changed

    await this.saveStats()
  }

  async getStats(): Promise<CocktailStat[]> {
    await this.loadStats()
    return Object.values(this.stats).sort((a, b) => b.count - a.count)
  }

  async resetCocktailStats(cocktailId: string): Promise<void> {
    await this.loadStats()
    if (this.stats[cocktailId]) {
      delete this.stats[cocktailId]
      await this.saveStats()
    }
  }

  async resetAllStats(): Promise<void> {
    this.stats = {}
    await this.saveStats()
  }

  async getTotalStats(): Promise<{
    totalCocktails: number
    uniqueCocktails: number
    mostPopular: CocktailStat | null
  }> {
    await this.loadStats()
    const statsArray = Object.values(this.stats)

    const totalCocktails = statsArray.reduce((sum, stat) => sum + stat.count, 0)
    const uniqueCocktails = statsArray.length
    const mostPopular =
      statsArray.length > 0 ? statsArray.reduce((max, stat) => (stat.count > max.count ? stat : max)) : null

    return {
      totalCocktails,
      uniqueCocktails,
      mostPopular,
    }
  }
}
