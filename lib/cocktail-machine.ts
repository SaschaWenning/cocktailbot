import { promises as fs } from "fs"
import path from "path"
import type { Cocktail } from "@/types/cocktail"
import type { PumpConfig } from "@/types/pump-config" // Corrected import path
import { defaultCocktails } from "@/data/cocktails"
import { defaultPumpConfig } from "@/data/pump-config"
import { GpioController } from "./gpio-controller"
import { updateLevelsAfterCocktail, updateLevelAfterShot } from "@/lib/ingredient-level-service" // Added this import

export class CocktailMachine {
  private static instance: CocktailMachine
  private gpioController: GpioController
  private cocktails: Cocktail[] = []
  private pumpConfig: PumpConfig = defaultPumpConfig // Initialize with default
  private userCocktailsFile = path.join(process.cwd(), "data", "user-cocktails.json")
  private deletedCocktailsFile = path.join(process.cwd(), "data", "deleted-cocktails.json")
  private deletedCocktailIds: string[] = []

  private constructor() {
    this.gpioController = GpioController.getInstance()
    this.loadCocktailsAndConfig()
  }

  static getInstance(): CocktailMachine {
    if (!CocktailMachine.instance) {
      CocktailMachine.instance = new CocktailMachine()
    }
    return CocktailMachine.instance
  }

  private async loadCocktailsAndConfig() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.userCocktailsFile)
      await fs.mkdir(dataDir, { recursive: true })

      // Load user-created cocktails
      let userCocktails: Cocktail[] = []
      try {
        const userData = await fs.readFile(this.userCocktailsFile, "utf-8")
        userCocktails = JSON.parse(userData)
      } catch (error) {
        console.log("No user-cocktails.json found, starting with empty user cocktails.")
      }

      // Load deleted cocktail IDs
      try {
        const deletedData = await fs.readFile(this.deletedCocktailsFile, "utf-8")
        this.deletedCocktailIds = JSON.parse(deletedData)
      } catch (error) {
        console.log("No deleted-cocktails.json found, starting with empty deleted list.")
      }

      // Filter out deleted default cocktails
      const filteredDefaultCocktails = defaultCocktails.filter(
        (cocktail) => !this.deletedCocktailIds.includes(cocktail.id),
      )

      this.cocktails = [...filteredDefaultCocktails, ...userCocktails]

      // Load pump config
      try {
        const pumpConfigPath = path.join(process.cwd(), "data", "user-pump-config.json")
        await fs.access(pumpConfigPath, fs.constants.F_OK) // Check if file exists
        const pumpConfigData = await fs.readFile(pumpConfigPath, "utf-8")
        this.pumpConfig = JSON.parse(pumpConfigData) as PumpConfig
      } catch (error) {
        console.warn("User pump configuration not found or invalid, loading default config:", error)
        this.pumpConfig = defaultPumpConfig
      }
    } catch (error) {
      console.error("Error loading cocktails or config:", error)
      this.cocktails = defaultCocktails // Fallback to default if error
      this.pumpConfig = defaultPumpConfig
    }
  }

  private async saveUserCocktails() {
    try {
      const userCreated = this.cocktails.filter((c) => !defaultCocktails.some((dc) => dc.id === c.id))
      await fs.writeFile(this.userCocktailsFile, JSON.stringify(userCreated, null, 2))
    } catch (error) {
      console.error("Error saving user cocktails:", error)
    }
  }

  private async saveDeletedCocktailIds() {
    try {
      await fs.writeFile(this.deletedCocktailsFile, JSON.stringify(this.deletedCocktailIds, null, 2))
    } catch (error) {
      console.error("Error saving deleted cocktail IDs:", error)
    }
  }

  async getAvailableCocktails(): Promise<Cocktail[]> {
    await this.loadCocktailsAndConfig() // Ensure latest state
    return this.cocktails
  }

  async getCocktailById(id: string): Promise<Cocktail | undefined> {
    await this.loadCocktailsAndConfig() // Ensure latest state
    return this.cocktails.find((c) => c.id === id)
  }

  async addOrUpdateCocktail(newCocktail: Cocktail): Promise<void> {
    await this.loadCocktailsAndConfig() // Ensure latest state
    const index = this.cocktails.findIndex((c) => c.id === newCocktail.id)
    if (index > -1) {
      this.cocktails[index] = newCocktail
    } else {
      this.cocktails.push(newCocktail)
    }
    await this.saveUserCocktails()
  }

  async deleteCocktail(id: string): Promise<void> {
    await this.loadCocktailsAndConfig() // Ensure latest state
    const initialLength = this.cocktails.length
    this.cocktails = this.cocktails.filter((c) => c.id !== id)

    // If it was a default cocktail, add its ID to the deleted list
    if (defaultCocktails.some((dc) => dc.id === id) && !this.deletedCocktailIds.includes(id)) {
      this.deletedCocktailIds.push(id)
      await this.saveDeletedCocktailIds()
    }

    if (this.cocktails.length < initialLength) {
      await this.saveUserCocktails()
    }
  }

  async makeCocktail(cocktailId: string): Promise<{ success: boolean; message: string }> {
    await this.loadCocktailsAndConfig() // Ensure latest state
    const cocktail = this.cocktails.find((c) => c.id === cocktailId)

    if (!cocktail) {
      return { success: false, message: "Cocktail nicht gefunden." }
    }

    console.log(`Zubereite Cocktail: ${cocktail.name}`)

    try {
      for (const ingredient of cocktail.ingredients) {
        const pump = this.pumpConfig.pumps.find((p) => p.ingredient === ingredient.name)
        if (!pump) {
          console.warn(`Pumpe für Zutat ${ingredient.name} nicht konfiguriert.`)
          continue
        }

        const durationMs = ingredient.amount * pump.flowRate
        console.log(`Aktiviere Pumpe ${pump.pin} für ${durationMs}ms für ${ingredient.name}`)
        await this.gpioController.activatePumpForDuration(pump.pin, durationMs)
      }
      console.log(`Cocktail ${cocktail.name} erfolgreich zubereitet.`)

      // Update ingredient levels after making cocktail
      await updateLevelsAfterCocktail(cocktail)

      return { success: true, message: `${cocktail.name} wurde erfolgreich zubereitet!` }
    } catch (error) {
      console.error(`Fehler beim Zubereiten von ${cocktail.name}:`, error)
      return { success: false, message: `Fehler beim Zubereiten von ${cocktail.name}.` }
    }
  }

  async makeSingleShot(pumpPin: number, durationMs: number): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`Aktiviere Pumpe ${pumpPin} für ${durationMs}ms für Einzelschuss.`)
      await this.gpioController.activatePumpForDuration(pumpPin, durationMs)

      // Update ingredient level after single shot
      const pump = this.pumpConfig.pumps.find((p) => p.pin === pumpPin)
      if (pump) {
        await updateLevelAfterShot(pump.ingredient, durationMs / pump.flowRate)
      }

      return { success: true, message: `Einzelschuss erfolgreich ausgeführt.` }
    } catch (error) {
      console.error(`Fehler beim Einzelschuss auf Pumpe ${pumpPin}:`, error)
      return { success: false, message: `Fehler beim Einzelschuss auf Pumpe ${pumpPin}.` }
    }
  }

  async activatePumpForDuration(pin: number, duration: number): Promise<void> {
    await this.gpioController.activatePumpForDuration(pin, duration)
  }

  async startPump(pin: number): Promise<void> {
    await this.gpioController.startPump(pin)
  }

  async stopPump(pin: number): Promise<void> {
    await this.gpioController.stopPump(pin)
  }

  async cleanPump(pin: number, durationMs: number): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`Starte Reinigung für Pumpe ${pin} für ${durationMs}ms.`)
      await this.gpioController.activatePumpForDuration(pin, durationMs)
      console.log(`Reinigung für Pumpe ${pin} abgeschlossen.`)
      return { success: true, message: `Pumpe ${pin} erfolgreich gereinigt.` }
    } catch (error) {
      console.error(`Fehler bei der Reinigung von Pumpe ${pin}:`, error)
      return { success: false, message: `Fehler bei der Reinigung von Pumpe ${pin}.` }
    }
  }
}
