import { promises as fs } from "fs"
import path from "path"
import type { Cocktail } from "@/types/cocktail"
import type { PumpConfig } from "@/types/pump"
import { cocktails as defaultCocktails } from "@/data/cocktails"
import { CocktailStatsService } from "./cocktail-stats-service"

const COCKTAILS_FILE = path.join(process.cwd(), "data", "user-cocktails.json")
const DELETED_COCKTAILS_FILE = path.join(process.cwd(), "data", "deleted-cocktails.json")
const PUMP_CONFIG_FILE = path.join(process.cwd(), "data", "user-pump-config.json")

export class CocktailMachine {
  private static instance: CocktailMachine
  private cocktails: Cocktail[] = []
  private deletedStandardCocktails: string[] = []

  private constructor() {}

  static getInstance(): CocktailMachine {
    if (!CocktailMachine.instance) {
      CocktailMachine.instance = new CocktailMachine()
    }
    return CocktailMachine.instance
  }

  async loadCocktails(): Promise<Cocktail[]> {
    try {
      // Load deleted standard cocktails
      await this.loadDeletedStandardCocktails()

      // Load user cocktails
      const userCocktails = await this.loadUserCocktails()

      // Filter out deleted standard cocktails
      const availableStandardCocktails = defaultCocktails.filter(
        (cocktail) => !this.deletedStandardCocktails.includes(cocktail.id),
      )

      // Combine standard and user cocktails, with user cocktails overriding standard ones
      const cocktailMap = new Map<string, Cocktail>()

      // Add standard cocktails first
      availableStandardCocktails.forEach((cocktail) => {
        cocktailMap.set(cocktail.id, cocktail)
      })

      // Add/override with user cocktails
      userCocktails.forEach((cocktail) => {
        cocktailMap.set(cocktail.id, cocktail)
      })

      this.cocktails = Array.from(cocktailMap.values())
      return this.cocktails
    } catch (error) {
      console.error("Error loading cocktails:", error)
      return defaultCocktails
    }
  }

  private async loadUserCocktails(): Promise<Cocktail[]> {
    try {
      const dataDir = path.dirname(COCKTAILS_FILE)
      await fs.mkdir(dataDir, { recursive: true })

      const data = await fs.readFile(COCKTAILS_FILE, "utf-8")
      return JSON.parse(data)
    } catch (error) {
      // File doesn't exist, return empty array
      return []
    }
  }

  private async loadDeletedStandardCocktails(): Promise<void> {
    try {
      const dataDir = path.dirname(DELETED_COCKTAILS_FILE)
      await fs.mkdir(dataDir, { recursive: true })

      const data = await fs.readFile(DELETED_COCKTAILS_FILE, "utf-8")
      this.deletedStandardCocktails = JSON.parse(data)
    } catch (error) {
      // File doesn't exist, start with empty array
      this.deletedStandardCocktails = []
    }
  }

  private async saveUserCocktails(): Promise<void> {
    try {
      const dataDir = path.dirname(COCKTAILS_FILE)
      await fs.mkdir(dataDir, { recursive: true })

      // Only save user-created cocktails (not standard ones)
      const userCocktails = this.cocktails.filter(
        (cocktail) =>
          !defaultCocktails.some((defaultCocktail) => defaultCocktail.id === cocktail.id) ||
          this.deletedStandardCocktails.includes(cocktail.id),
      )

      await fs.writeFile(COCKTAILS_FILE, JSON.stringify(userCocktails, null, 2))
    } catch (error) {
      console.error("Error saving user cocktails:", error)
    }
  }

  private async saveDeletedStandardCocktails(): Promise<void> {
    try {
      const dataDir = path.dirname(DELETED_COCKTAILS_FILE)
      await fs.mkdir(dataDir, { recursive: true })

      await fs.writeFile(DELETED_COCKTAILS_FILE, JSON.stringify(this.deletedStandardCocktails, null, 2))
    } catch (error) {
      console.error("Error saving deleted standard cocktails:", error)
    }
  }

  async addCocktail(cocktail: Cocktail): Promise<void> {
    await this.loadCocktails()

    // Check if cocktail already exists
    const existingIndex = this.cocktails.findIndex((c) => c.id === cocktail.id)
    if (existingIndex >= 0) {
      this.cocktails[existingIndex] = cocktail
    } else {
      this.cocktails.push(cocktail)
    }

    await this.saveUserCocktails()
  }

  async deleteCocktail(cocktailId: string): Promise<void> {
    await this.loadCocktails()

    // Check if it's a standard cocktail
    const isStandardCocktail = defaultCocktails.some((cocktail) => cocktail.id === cocktailId)

    if (isStandardCocktail) {
      // Add to deleted standard cocktails list
      if (!this.deletedStandardCocktails.includes(cocktailId)) {
        this.deletedStandardCocktails.push(cocktailId)
        await this.saveDeletedStandardCocktails()
      }
    }

    // Remove from current cocktails list
    this.cocktails = this.cocktails.filter((cocktail) => cocktail.id !== cocktailId)
    await this.saveUserCocktails()
  }

  async getCocktails(): Promise<Cocktail[]> {
    if (this.cocktails.length === 0) {
      await this.loadCocktails()
    }
    return this.cocktails
  }

  async getCocktailById(id: string): Promise<Cocktail | undefined> {
    const cocktails = await this.getCocktails()
    return cocktails.find((cocktail) => cocktail.id === id)
  }

  async makeCocktail(cocktailId: string): Promise<{ success: boolean; message: string }> {
    try {
      const cocktail = await this.getCocktailById(cocktailId)
      if (!cocktail) {
        return { success: false, message: "Cocktail nicht gefunden" }
      }

      console.log(`Making cocktail: ${cocktail.name}`)

      // Simulate cocktail making process
      for (const ingredient of cocktail.ingredients) {
        console.log(`Adding ${ingredient.amount}ml of ${ingredient.name}`)
        // Here you would control the actual pumps
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      // Update statistics
      const statsService = CocktailStatsService.getInstance()
      await statsService.incrementCocktail(cocktail.id, cocktail.name)

      return { success: true, message: `${cocktail.name} wurde erfolgreich zubereitet!` }
    } catch (error) {
      console.error("Error making cocktail:", error)
      return { success: false, message: "Fehler beim Zubereiten des Cocktails" }
    }
  }

  async activatePumpForDuration(pumpId: number, duration: number): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`Activating pump ${pumpId} for ${duration}ms`)

      // Here you would control the actual pump
      await new Promise((resolve) => setTimeout(resolve, duration))

      return { success: true, message: `Pumpe ${pumpId} für ${duration}ms aktiviert` }
    } catch (error) {
      console.error("Error activating pump:", error)
      return { success: false, message: "Fehler beim Aktivieren der Pumpe" }
    }
  }

  async makeSingleShot(ingredientName: string, amount: number): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`Making single shot: ${amount}ml of ${ingredientName}`)

      // Here you would control the actual pump for the ingredient
      await new Promise((resolve) => setTimeout(resolve, amount * 10)) // Simulate time based on amount

      return { success: true, message: `${amount}ml ${ingredientName} wurde ausgegeben` }
    } catch (error) {
      console.error("Error making single shot:", error)
      return { success: false, message: "Fehler beim Ausgeben des Shots" }
    }
  }

  async getPumpConfig(): Promise<PumpConfig[]> {
    try {
      if (await fs.exists(PUMP_CONFIG_FILE)) {
        const data = await fs.readFile(PUMP_CONFIG_FILE, "utf-8")
        return JSON.parse(data) as PumpConfig[]
      }

      // Fallback on standard configuration
      const { pumpConfig } = await import("@/data/pump-config")
      return pumpConfig
    } catch (error) {
      console.error("Error loading pump configuration:", error)
      const { pumpConfig } = await import("@/data/pump-config")
      return pumpConfig
    }
  }

  async savePumpConfig(config: PumpConfig[]): Promise<void> {
    try {
      await fs.writeFile(PUMP_CONFIG_FILE, JSON.stringify(config, null, 2))
      console.log("Pump configuration saved")
    } catch (error) {
      console.error("Error saving pump configuration:", error)
      throw error
    }
  }
}
