import type { Cocktail } from "@/types/cocktail"
import type { PumpConfig } from "@/types/pump"
import { ingredients } from "@/data/ingredients"
import { pumpConfig as defaultPumpConfig } from "@/data/pump-config"
import { cocktails as defaultCocktails } from "@/data/cocktails"

// In-memory storage for demonstration purposes
const DELETED_COCKTAILS_KEY = "deleted-cocktails"

// Funktion zum Laden der gelöschten Cocktail-IDs aus localStorage
const getDeletedCocktailIds = (): string[] => {
  if (typeof window === "undefined") return []
  try {
    const deleted = localStorage.getItem(DELETED_COCKTAILS_KEY)
    return deleted ? JSON.parse(deleted) : []
  } catch (error) {
    console.error("Fehler beim Laden der gelöschten Cocktails:", error)
    return []
  }
}

// Funktion zum Speichern der gelöschten Cocktail-IDs in localStorage
const saveDeletedCocktailIds = (deletedIds: string[]): void => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(DELETED_COCKTAILS_KEY, JSON.stringify(deletedIds))
  } catch (error) {
    console.error("Fehler beim Speichern der gelöschten Cocktails:", error)
  }
}

let currentCocktails: Cocktail[] = defaultCocktails
  .filter((cocktail) => !getDeletedCocktailIds().includes(cocktail.id))
  .map((cocktail) => ({
    ...cocktail,
    recipe: cocktail.recipe.map((item) => ({
      ...item,
      type: (item as any).type || "automatic",
      instruction: (item as any).instruction || "",
    })),
  }))

let currentPumpConfig: PumpConfig[] = defaultPumpConfig

// Simulate GPIO control
const simulateGpioControl = async (pin: number, duration: number) => {
  console.log(`Simulating GPIO pin ${pin} ON for ${duration}ms`)
  return new Promise((resolve) => setTimeout(resolve, duration))
}

// Simulate API calls
export const getAllCocktails = async (): Promise<Cocktail[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("Fetching all cocktails (simulated)")
      const deletedIds = getDeletedCocktailIds()

      // Immer von den ursprünglichen defaultCocktails ausgehen und gelöschte herausfiltern
      const filteredCocktails = defaultCocktails
        .filter((cocktail) => !deletedIds.includes(cocktail.id))
        .map((cocktail) => ({
          ...cocktail,
          recipe: cocktail.recipe.map((item) => ({
            ...item,
            type: (item as any).type || "automatic",
            instruction: (item as any).instruction || "",
          })),
        }))

      // Aktualisiere auch currentCocktails für Konsistenz
      currentCocktails = filteredCocktails

      resolve(filteredCocktails)
    }, 500)
  })
}

export const getPumpConfig = async (): Promise<PumpConfig[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("Fetching pump configuration (simulated)")
      resolve(currentPumpConfig)
    }, 300)
  })
}

export const saveRecipe = async (cocktail: Cocktail): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const index = currentCocktails.findIndex((c) => c.id === cocktail.id)
      if (index > -1) {
        currentCocktails[index] = cocktail
        console.log(`Cocktail "${cocktail.name}" updated (simulated)`)
      } else {
        currentCocktails.push(cocktail)
        console.log(`Cocktail "${cocktail.name}" added (simulated)`)
      }
      resolve()
    }, 500)
  })
}

export const deleteRecipe = async (cocktailId: string): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const deletedIds = getDeletedCocktailIds()
      if (!deletedIds.includes(cocktailId)) {
        deletedIds.push(cocktailId)
        saveDeletedCocktailIds(deletedIds)
      }

      // Entferne auch aus der aktuellen Liste
      currentCocktails = currentCocktails.filter((c) => c.id !== cocktailId)
      console.log(`Cocktail with ID "${cocktailId}" deleted permanently (simulated)`)
      resolve()
    }, 300)
  })
}

export const updatePumpConfig = async (config: PumpConfig[]): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      currentPumpConfig = config
      console.log("Pump configuration updated (simulated)")
      resolve()
    }, 300)
  })
}

export const makeCocktail = async (
  cocktail: Cocktail,
  pumpConfig: PumpConfig[],
  selectedSize: number,
): Promise<void> => {
  console.log(`Starting to make cocktail: ${cocktail.name} (${selectedSize}ml)`)

  const totalRecipeVolume = cocktail.recipe.reduce((total, item) => total + item.amount, 0)
  if (totalRecipeVolume === 0) {
    throw new Error("Rezept hat keine Zutaten oder Gesamtvolumen ist Null.")
  }
  const scaleFactor = selectedSize / totalRecipeVolume

  for (const item of cocktail.recipe) {
    const ingredient = ingredients.find((i) => i.id === item.ingredientId)
    const scaledAmount = Math.round(item.amount * scaleFactor)

    if (item.type === "automatic") {
      const pump = pumpConfig.find((p) => p.ingredientId === item.ingredientId)

      if (!pump) {
        throw new Error(`Pumpe für Zutat "${ingredient?.name || item.ingredientId}" nicht konfiguriert.`)
      }

      const duration = (scaledAmount / pump.calibrationValue) * 1000 // ml / (ml/s) * 1000ms/s = ms
      console.log(
        `Dispensing ${scaledAmount}ml of ${ingredient?.name || item.ingredientId} using pump ${pump.pumpId} (GPIO ${pump.gpioPin}) for ${duration}ms`,
      )
      await simulateGpioControl(pump.gpioPin, duration)
    } else {
      console.log(
        `Manuelle Zutat: ${scaledAmount}ml ${ingredient?.name || item.ingredientId}. Anleitung: ${item.instruction || "Keine spezielle Anleitung."}`,
      )
    }
  }

  console.log(`Finished making cocktail: ${cocktail.name}`)
}

// New function to activate a single pump for a duration
export const activatePumpForDuration = async (
  pumpId: string,
  durationMs: number,
  pumpConfig: PumpConfig[],
): Promise<void> => {
  const pump = pumpConfig.find((p) => p.pumpId === pumpId)
  if (!pump) {
    throw new Error(`Pumpe mit ID "${pumpId}" nicht gefunden.`)
  }

  console.log(`Aktivierung von Pumpe ${pump.pumpId} (GPIO ${pump.gpioPin}) für ${durationMs}ms`)
  await simulateGpioControl(pump.gpioPin, durationMs)
  console.log(`Pumpe ${pump.pumpId} deaktiviert.`)
}

// New function to make a single shot
export const makeSingleShot = async (
  ingredientId: string,
  amountMl: number,
  pumpConfig: PumpConfig[],
): Promise<void> => {
  const pump = pumpConfig.find((p) => p.ingredientId === ingredientId)
  if (!pump) {
    throw new Error(`Pumpe für Zutat "${ingredientId}" nicht konfiguriert.`)
  }

  const duration = (amountMl / pump.calibrationValue) * 1000 // ml / (ml/s) * 1000ms/s = ms
  console.log(
    `Zubereitung eines Shots: ${amountMl}ml ${ingredientId} (Pumpe ${pump.pumpId}, GPIO ${pump.gpioPin}) für ${duration}ms`,
  )
  await simulateGpioControl(pump.gpioPin, duration)
  console.log(`Shot von ${ingredientId} fertig.`)
}

// Added functions
export const savePumpConfig = async (config: PumpConfig[]): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      currentPumpConfig = config
      console.log("Pump configuration saved (simulated)")
      resolve()
    }, 300)
  })
}

export const calibratePump = async (pumpId: string, duration: number): Promise<void> => {
  const pump = currentPumpConfig.find((p) => p.pumpId === pumpId)
  if (!pump) {
    throw new Error(`Pumpe mit ID "${pumpId}" nicht gefunden.`)
  }

  console.log(`Kalibrierung von Pumpe ${pump.pumpId} (GPIO ${pump.gpioPin}) für ${duration}ms`)
  await simulateGpioControl(pump.gpioPin, duration)
  console.log(`Kalibrierung von Pumpe ${pump.pumpId} abgeschlossen.`)
}

export const cleanPump = async (pumpId: number, duration: number): Promise<void> => {
  const pump = currentPumpConfig.find((p) => p.pumpId === pumpId.toString())
  if (!pump) {
    throw new Error(`Pumpe mit ID "${pumpId}" nicht gefunden.`)
  }

  console.log(`Reinigung von Pumpe ${pump.pumpId} (GPIO ${pump.gpioPin}) für ${duration}ms`)
  await simulateGpioControl(pump.gpioPin, duration)
  console.log(`Reinigung von Pumpe ${pump.pumpId} abgeschlossen.`)
}
