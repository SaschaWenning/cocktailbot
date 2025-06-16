// lib/cocktail-machine.ts

import type { Ingredient } from "./ingredient"
import { getPumpConfig } from "./config" // Import getPumpConfig from config module
import { activatePumpForDuration } from "./gpio-controller" // Import activatePumpForDuration from gpio-controller module

export class CocktailMachine {
  private pumps: { [ingredientName: string]: Pump } = {}
  private ingredients: { [ingredientName: string]: Ingredient } = {}

  constructor() {
    // Initialize pumps and ingredients here, or load from a configuration.
  }

  addPump(ingredientName: string, pump: Pump) {
    this.pumps[ingredientName] = pump
  }

  addIngredient(ingredient: Ingredient) {
    this.ingredients[ingredient.name] = ingredient
  }

  async dispense(ingredientName: string, amount: number): Promise<void> {
    const pump = this.pumps[ingredientName]
    const ingredient = this.ingredients[ingredientName]

    if (!pump) {
      throw new Error(`No pump configured for ingredient: ${ingredientName}`)
    }

    if (!ingredient) {
      throw new Error(`No ingredient found: ${ingredientName}`)
    }

    const dispenseTimeMs = amount * ingredient.flowRate // Calculate dispense time based on flow rate

    console.log(`Dispensing ${amount}ml of ${ingredientName} for ${dispenseTimeMs}ms`)
    await pump.activatePump(dispenseTimeMs)
  }

  async createCocktail(recipe: { [ingredientName: string]: number }): Promise<void> {
    for (const ingredientName in recipe) {
      if (recipe.hasOwnProperty(ingredientName)) {
        const amount = recipe[ingredientName]
        await this.dispense(ingredientName, amount)
      }
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

// Add this function for single shot preparation
export async function makeSingleShot(ingredientId: string, amount: number): Promise<void> {
  try {
    console.log(`Bereite ${amount}ml von ${ingredientId} zu`)

    // Lade die aktuelle Pumpenkonfiguration
    const currentPumpConfig = await getPumpConfig()

    // Finde die Pumpe für diese Zutat
    const pump = currentPumpConfig.find((p) => p.ingredient === ingredientId)
    if (!pump) {
      throw new Error(`Keine Pumpe für Zutat ${ingredientId} konfiguriert`)
    }

    // Berechne die Laufzeit basierend auf der Kalibrierung
    const durationMs = Math.round((amount / pump.mlPerSecond) * 1000)

    console.log(`Aktiviere Pumpe ${pump.id} (GPIO ${pump.gpioPin}) für ${durationMs}ms`)

    // Aktiviere die Pumpe für die berechnete Zeit
    await activatePumpForDuration(pump.gpioPin, durationMs)

    console.log(`${amount}ml von ${ingredientId} erfolgreich zubereitet`)
  } catch (error) {
    console.error(`Fehler beim Zubereiten von ${ingredientId}:`, error)
    throw error
  }
}
