// lib/cocktail-machine.ts

import type { Ingredient } from "./ingredient"

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
