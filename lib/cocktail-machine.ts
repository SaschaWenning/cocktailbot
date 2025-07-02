import type { Cocktail } from "@/types/cocktail"
import type { PumpConfig } from "@/types/pump"
import { cocktails as defaultCocktails } from "@/data/cocktails"
import type { Ingredient } from "./ingredient"
import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs/promises"
import path from "path"

const execAsync = promisify(exec)

// File paths
const COCKTAILS_FILE = "/home/pi/cocktailbot/cocktailbot-main/data/custom-cocktails.json"
const PUMP_CONFIG_FILE = "/home/pi/cocktailbot/cocktailbot-main/data/pump-config.json"

export class CocktailMachine {
  private pumps: { [ingredientName: string]: number } = {}
  private ingredients: { [ingredientName: string]: Ingredient } = {}

  constructor() {
    // Initialize pumps and ingredients here, or load from a configuration.
    this.loadPumpConfig()
  }

  private async loadPumpConfig(): Promise<void> {
    try {
      const configData = await fs.readFile(PUMP_CONFIG_FILE, "utf-8")
      const pumpConfig: PumpConfig[] = JSON.parse(configData)
      pumpConfig.forEach((pump) => {
        this.pumps[pump.ingredientId] = pump.pumpNumber
      })
    } catch (error) {
      console.error("Error loading pump config:", error)
      // Return default config if file doesn't exist
      const { pumpConfig } = await import("@/data/pump-config")
      pumpConfig.forEach((pump) => {
        this.pumps[pump.ingredientId] = pump.pumpNumber
      })
    }
  }

  addIngredient(ingredient: Ingredient) {
    this.ingredients[ingredient.name] = ingredient
  }

  async dispense(ingredientName: string, amount: number, pumpConfig: PumpConfig[]): Promise<void> {
    const pumpNumber = this.pumps[ingredientName]
    const ingredient = this.ingredients[ingredientName]

    if (!pumpNumber) {
      throw new Error(`No pump configured for ingredient: ${ingredientName}`)
    }

    if (!ingredient) {
      throw new Error(`No ingredient found: ${ingredientName}`)
    }

    const pump = pumpConfig.find((p) => p.ingredientId === ingredientName)
    if (!pump) {
      throw new Error(`No pump configuration found for ingredient: ${ingredientName}`)
    }

    const dispenseTimeMs = Math.round((amount / pump.flowRate) * 1000) // Calculate dispense time based on flow rate

    console.log(`Dispensing ${amount}ml of ${ingredientName} using pump ${pumpNumber} for ${dispenseTimeMs}ms`)
    await activatePumpForDuration(pumpNumber, dispenseTimeMs)
  }

  async createCocktail(
    recipe: { [ingredientName: string]: number },
    pumpConfig: PumpConfig[],
    targetSize = 300,
  ): Promise<void> {
    try {
      console.log(`Making cocktail with recipe: ${JSON.stringify(recipe)} (${targetSize}ml)`)

      // Calculate total volume of original recipe
      const originalVolume = Object.values(recipe).reduce((total, amount) => total + amount, 0)
      const scaleFactor = targetSize / originalVolume

      // Scale recipe to target size
      const scaledRecipe: { [ingredientName: string]: number } = {}
      for (const ingredientName in recipe) {
        if (recipe.hasOwnProperty(ingredientName)) {
          scaledRecipe[ingredientName] = Math.round(recipe[ingredientName] * scaleFactor)
        }
      }

      console.log("Scaled recipe:", scaledRecipe)

      // Process each ingredient
      for (const ingredientName in scaledRecipe) {
        if (scaledRecipe.hasOwnProperty(ingredientName)) {
          const amount = scaledRecipe[ingredientName]
          await this.dispense(ingredientName, amount, pumpConfig)

          // Small delay between ingredients
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      }

      console.log(`Cocktail completed!`)
    } catch (error) {
      console.error("Error making cocktail:", error)
      throw new Error(`Failed to make cocktail: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // You might want to add methods for cleaning, calibration, etc.
}

export class Pump {
  private gpioPin: number

  constructor(gpioPin: number) {
    this.gpioPin = gpioPin
    // Initialize GPIO pin here (e.g., using a library like rpio or pigpio)
    console.log(`Initializing pump on GPIO pin: ${gpioPin}`)
  }

  async activatePump(durationMs: number): Promise<void> {
    // Activate the pump for the specified duration
    console.log(`Activating pump on GPIO pin ${this.gpioPin} for ${durationMs}ms`)
    return new Promise((resolve) => setTimeout(resolve, durationMs))
  }
}

// Get all cocktails (default + custom)
export async function getAllCocktails(): Promise<Cocktail[]> {
  try {
    // Try to read custom cocktails
    const customCocktailsData = await fs.readFile(COCKTAILS_FILE, "utf-8")
    const customCocktails: Cocktail[] = JSON.parse(customCocktailsData)

    // Combine default and custom cocktails
    return [...defaultCocktails, ...customCocktails]
  } catch (error) {
    // If custom cocktails file doesn't exist or is invalid, return only default cocktails
    console.log("No custom cocktails found, using default cocktails only")
    return defaultCocktails
  }
}

// Save a recipe (new or updated)
export async function saveRecipe(cocktail: Cocktail): Promise<void> {
  try {
    // Get current custom cocktails
    let customCocktails: Cocktail[] = []
    try {
      const customCocktailsData = await fs.readFile(COCKTAILS_FILE, "utf-8")
      customCocktails = JSON.parse(customCocktailsData)
    } catch (error) {
      // File doesn't exist yet, start with empty array
      customCocktails = []
    }

    // Check if cocktail already exists in custom cocktails
    const existingIndex = customCocktails.findIndex((c) => c.id === cocktail.id)

    if (existingIndex >= 0) {
      // Update existing custom cocktail
      customCocktails[existingIndex] = cocktail
    } else {
      // Check if it's a default cocktail being modified
      const isDefaultCocktail = defaultCocktails.some((c) => c.id === cocktail.id)

      if (isDefaultCocktail) {
        // Add modified default cocktail to custom cocktails
        customCocktails.push(cocktail)
      } else {
        // Add new custom cocktail
        customCocktails.push(cocktail)
      }
    }

    // Ensure directory exists
    const dir = path.dirname(COCKTAILS_FILE)
    await fs.mkdir(dir, { recursive: true })

    // Save custom cocktails
    await fs.writeFile(COCKTAILS_FILE, JSON.stringify(customCocktails, null, 2))

    console.log(`Recipe ${cocktail.name} saved successfully`)
  } catch (error) {
    console.error("Error saving recipe:", error)
    throw new Error(`Failed to save recipe: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Delete a recipe
export async function deleteRecipe(cocktailId: string): Promise<void> {
  try {
    // Get current custom cocktails
    let customCocktails: Cocktail[] = []
    try {
      const customCocktailsData = await fs.readFile(COCKTAILS_FILE, "utf-8")
      customCocktails = JSON.parse(customCocktailsData)
    } catch (error) {
      // No custom cocktails file
      throw new Error("No custom cocktails to delete")
    }

    // Check if it's a default cocktail
    const isDefaultCocktail = defaultCocktails.some((c) => c.id === cocktailId)

    if (isDefaultCocktail) {
      throw new Error("Cannot delete default cocktails")
    }

    // Remove from custom cocktails
    const filteredCocktails = customCocktails.filter((c) => c.id !== cocktailId)

    if (filteredCocktails.length === customCocktails.length) {
      throw new Error("Cocktail not found")
    }

    // Save updated custom cocktails
    await fs.writeFile(COCKTAILS_FILE, JSON.stringify(filteredCocktails, null, 2))

    console.log(`Recipe ${cocktailId} deleted successfully`)
  } catch (error) {
    console.error("Error deleting recipe:", error)
    throw new Error(`Failed to delete recipe: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Get pump configuration
export async function getPumpConfig(): Promise<PumpConfig[]> {
  try {
    const configData = await fs.readFile(PUMP_CONFIG_FILE, "utf-8")
    return JSON.parse(configData)
  } catch (error) {
    console.error("Error loading pump config:", error)
    // Return default config if file doesn't exist
    const { pumpConfig } = await import("@/data/pump-config")
    return pumpConfig
  }
}

// Save pump configuration
export async function savePumpConfig(config: PumpConfig[]): Promise<void> {
  try {
    // Ensure directory exists
    const dir = path.dirname(PUMP_CONFIG_FILE)
    await fs.mkdir(dir, { recursive: true })

    await fs.writeFile(PUMP_CONFIG_FILE, JSON.stringify(config, null, 2))
    console.log("Pump configuration saved successfully")
  } catch (error) {
    console.error("Error saving pump config:", error)
    throw new Error(`Failed to save pump configuration: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Activate pump for specific duration
export async function activatePumpForDuration(pumpNumber: number, durationMs: number): Promise<void> {
  try {
    console.log(`Activating pump ${pumpNumber} for ${durationMs}ms`)

    // Call Python script to control GPIO
    const { stdout, stderr } = await execAsync(
      `python3 /home/pi/cocktailbot/cocktailbot-main/scripts/gpio_controller.py activate_pump ${pumpNumber} ${durationMs}`,
    )

    if (stderr) {
      console.error("GPIO Error:", stderr)
      throw new Error(`GPIO control failed: ${stderr}`)
    }

    console.log("GPIO Output:", stdout)
  } catch (error) {
    console.error("Error activating pump:", error)
    throw new Error(
      `Failed to activate pump ${pumpNumber}: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}

// Make a single shot
export async function makeSingleShot(ingredientId: string, amount: number, pumpConfig: PumpConfig[]): Promise<void> {
  try {
    // Find pump for this ingredient
    const pump = pumpConfig.find((p) => p.ingredientId === ingredientId)
    if (!pump) {
      throw new Error(`No pump configured for ingredient: ${ingredientId}`)
    }

    // Calculate duration based on pump calibration
    const durationMs = Math.round((amount / pump.flowRate) * 1000)

    console.log(`Making ${amount}ml of ${ingredientId} using pump ${pump.pumpNumber} for ${durationMs}ms`)

    // Activate pump
    await activatePumpForDuration(pump.pumpNumber, durationMs)
  } catch (error) {
    console.error("Error making single shot:", error)
    throw new Error(`Failed to make shot: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Make a cocktail
export async function makeCocktail(cocktail: Cocktail, pumpConfig: PumpConfig[], targetSize = 300): Promise<void> {
  try {
    console.log(`Making cocktail: ${cocktail.name} (${targetSize}ml)`)

    // Calculate total volume of original recipe
    const originalVolume = cocktail.recipe.reduce((total, item) => total + item.amount, 0)
    const scaleFactor = targetSize / originalVolume

    // Scale recipe to target size
    const scaledRecipe = cocktail.recipe.map((item) => ({
      ...item,
      amount: Math.round(item.amount * scaleFactor),
    }))

    console.log("Scaled recipe:", scaledRecipe)

    // Process each ingredient
    for (const item of scaledRecipe) {
      const pump = pumpConfig.find((p) => p.ingredientId === item.ingredientId)
      if (!pump) {
        console.warn(`No pump configured for ingredient: ${item.ingredientId}`)
        continue
      }

      // Calculate duration based on pump calibration
      const durationMs = Math.round((item.amount / pump.flowRate) * 1000)

      console.log(
        `Dispensing ${item.amount}ml of ${item.ingredientId} using pump ${pump.pumpNumber} for ${durationMs}ms`,
      )

      // Activate pump
      await activatePumpForDuration(pump.pumpNumber, durationMs)

      // Small delay between ingredients
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    console.log(`Cocktail ${cocktail.name} completed!`)
  } catch (error) {
    console.error("Error making cocktail:", error)
    throw new Error(`Failed to make cocktail: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Clean pump
export async function cleanPump(pumpNumber: number, durationMs = 10000): Promise<void> {
  try {
    console.log(`Cleaning pump ${pumpNumber} for ${durationMs}ms`)

    // Call Python script to control GPIO
    const { stdout, stderr } = await execAsync(
      `python3 /home/pi/cocktailbot/cocktailbot-main/scripts/gpio_controller.py clean_pump ${pumpNumber} ${durationMs}`,
    )

    if (stderr) {
      console.error("GPIO Error:", stderr)
      throw new Error(`GPIO control failed: ${stderr}`)
    }

    console.log("GPIO Output:", stdout)
  } catch (error) {
    console.error("Error cleaning pump:", error)
    throw new Error(`Failed to clean pump ${pumpNumber}: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Clean all pumps
export async function cleanAllPumps(durationMs = 10000): Promise<void> {
  try {
    console.log(`Cleaning all pumps for ${durationMs}ms`)

    // Call Python script to control GPIO
    const { stdout, stderr } = await execAsync(
      `python3 /home/pi/cocktailbot/cocktailbot-main/scripts/gpio_controller.py clean_all_pumps ${durationMs}`,
    )

    if (stderr) {
      console.error("GPIO Error:", stderr)
      throw new Error(`GPIO control failed: ${stderr}`)
    }

    console.log("GPIO Output:", stdout)
  } catch (error) {
    console.error("Error cleaning all pumps:", error)
    throw new Error(`Failed to clean all pumps: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Calibrate pump
export async function calibratePump(pumpId: number, durationMs: number): Promise<void> {
  try {
    console.log(`Calibrating pump ${pumpId} for ${durationMs}ms`)

    // Call Python script to control GPIO
    const { stdout, stderr } = await execAsync(
      `python3 /home/pi/cocktailbot/cocktailbot-main/scripts/gpio_controller.py activate_pump ${pumpId} ${durationMs}`,
    )

    if (stderr) {
      console.error("GPIO Error:", stderr)
      throw new Error(`GPIO control failed: ${stderr}`)
    }

    console.log("GPIO Output:", stdout)
  } catch (error) {
    console.error("Error calibrating pump:", error)
    throw new Error(`Failed to calibrate pump ${pumpId}: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
