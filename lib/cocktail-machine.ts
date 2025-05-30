"use server"

import type { Cocktail } from "@/types/cocktail"
import type { PumpConfig } from "@/types/pump"
import { updateLevelsAfterCocktail, updateLevelAfterShot } from "@/lib/ingredient-level-service"
import fs from "fs"
import path from "path"
import { setPinHigh } from "@/lib/gpio-controller"

// Neue Funktion zum Aktivieren einer Pumpe für das Entlüften
export async function activatePumpForPriming(pumpId: number, durationMs: number) {
  try {
    // Finde die Pumpe in der Konfiguration
    const pumpConfig = await getPumpConfig()
    const pump = pumpConfig.find((p) => p.id === pumpId)

    if (!pump) {
      throw new Error(`Pumpe mit ID ${pumpId} nicht gefunden`)
    }

    console.log(`Entlüfte Pumpe ${pumpId} (${pump.ingredient}) an Pin ${pump.pin} für ${durationMs}ms`)

    // Aktiviere die Pumpe für die angegebene Zeit
    await activatePump(pump.pin, durationMs)

    return { success: true }
  } catch (error) {
    console.error(`Fehler beim Entlüften der Pumpe ${pumpId}:`, error)
    throw error
  }
}

// Skaliert die Zutatenmengen proportional zur gewünschten Gesamtmenge
function scaleRecipe(cocktail: Cocktail, targetSize: number) {
  const currentTotal = cocktail.recipe.reduce((total, item) => total + item.amount, 0)

  // Wenn das aktuelle Volumen 0 ist (was nicht sein sollte), vermeide Division durch 0
  if (currentTotal === 0) return cocktail.recipe

  const scaleFactor = targetSize / currentTotal

  return cocktail.recipe.map((item) => ({
    ...item,
    amount: Math.round(item.amount * scaleFactor),
  }))
}

// Diese Funktion würde auf dem Server laufen und die GPIO-Pins des Raspberry Pi steuern
export async function makeCocktail(cocktail: Cocktail, pumpConfig: PumpConfig[], size = 300) {
  console.log(`Bereite Cocktail zu: ${cocktail.name} (${size}ml)`)

  // Log der übergebenen Pumpenkonfiguration für Debugging
  console.log(
    "Verwendete Pumpenkonfiguration:",
    pumpConfig.map((p) => `Pumpe ${p.id}: ${p.ingredient}, Flussrate: ${p.flowRate} ml/s`),
  )

  // Prüfe zuerst, ob genügend von allen Zutaten vorhanden ist
  const levelCheck = await updateLevelsAfterCocktail(cocktail, size)

  if (!levelCheck.success) {
    // Nicht genügend Zutaten vorhanden
    const missingIngredients = levelCheck.insufficientIngredients
    throw new Error(`Nicht genügend Zutaten vorhanden: ${missingIngredients.join(", ")}`)
  }

  // Skaliere das Rezept auf die gewünschte Größe
  const scaledRecipe = scaleRecipe(cocktail, size)

  // Teile die Zutaten in zwei Gruppen auf: Grenadine und alle anderen
  const grenadineItems = scaledRecipe.filter((item) => item.ingredientId === "grenadine")
  const otherItems = scaledRecipe.filter((item) => item.ingredientId !== "grenadine")

  // Aktiviere zuerst alle Zutaten außer Grenadine gleichzeitig
  const otherPumpPromises = otherItems.map((item) => {
    // Finde die Pumpe, die diese Zutat enthält
    const pump = pumpConfig.find((p) => p.ingredient === item.ingredientId)

    if (!pump) {
      console.error(`Keine Pumpe für Zutat ${item.ingredientId} konfiguriert!`)
      return Promise.resolve()
    }

    // Berechne, wie lange die Pumpe laufen muss
    const pumpTimeMs = Math.round((item.amount / pump.flowRate) * 1000)

    console.log(
      `Pumpe ${pump.id} (${pump.ingredient}): ${item.amount}ml für ${pumpTimeMs}ms aktivieren (Flussrate: ${pump.flowRate} ml/s)`,
    )

    // Aktiviere die Pumpe
    return activatePump(pump.pin, pumpTimeMs)
  })

  // Warte, bis alle Pumpen außer Grenadine aktiviert wurden
  await Promise.all(otherPumpPromises)

  // Wenn Grenadine im Rezept ist, warte 2 Sekunden und füge es dann hinzu
  if (grenadineItems.length > 0) {
    console.log("Warte 2 Sekunden vor dem Hinzufügen von Grenadine...")
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Füge Grenadine hinzu
    for (const item of grenadineItems) {
      const pump = pumpConfig.find((p) => p.ingredient === item.ingredientId)

      if (!pump) {
        console.error(`Keine Pumpe für Zutat ${item.ingredientId} konfiguriert!`)
        continue
      }

      // Berechne, wie lange die Pumpe laufen muss
      const pumpTimeMs = Math.round((item.amount / pump.flowRate) * 1000)

      console.log(`Pumpe ${pump.id} (${pump.ingredient}): ${item.amount}ml für ${pumpTimeMs}ms aktivieren`)

      // Aktiviere die Pumpe
      await activatePump(pump.pin, pumpTimeMs)
    }
  }

  return { success: true }
}

// Funktion zum Zubereiten eines einzelnen Shots
export async function makeSingleShot(ingredientId: string, amount = 40) {
  console.log(`Bereite Shot zu: ${ingredientId} (${amount}ml)`)

  // Prüfe zuerst, ob genügend von der Zutat vorhanden ist
  const levelCheck = await updateLevelAfterShot(ingredientId, amount)

  if (!levelCheck.success) {
    throw new Error(`Nicht genügend ${ingredientId} vorhanden!`)
  }

  // Finde die Pumpe für diese Zutat - Lade die aktuellste Konfiguration
  const pumpConfig = await getPumpConfig()
  const pump = pumpConfig.find((p) => p.ingredient === ingredientId)

  if (!pump) {
    throw new Error(`Keine Pumpe für Zutat ${ingredientId} konfiguriert!`)
  }

  // Berechne, wie lange die Pumpe laufen muss
  const pumpTimeMs = Math.round((amount / pump.flowRate) * 1000)

  console.log(
    `Pumpe ${pump.id} (${pump.ingredient}): ${amount}ml für ${pumpTimeMs}ms aktivieren (Flussrate: ${pump.flowRate} ml/s)`,
  )

  // Aktiviere die Pumpe
  await activatePump(pump.pin, pumpTimeMs)

  return { success: true }
}

// Diese Funktion würde die GPIO-Pins des Raspberry Pi steuern
async function activatePump(pin: number, durationMs: number) {
  try {
    // Direkte Steuerung über das GPIO-Modul
    await setPinHigh(pin, durationMs)
    return true
  } catch (error) {
    console.error(`Fehler beim Aktivieren der Pumpe an Pin ${pin}:`, error)
    throw error
  }
}

// Funktion zum Testen einer einzelnen Pumpe
export async function testPump(pumpId: number) {
  try {
    // Finde die Pumpe in der Konfiguration
    const pumpConfig = await getPumpConfig()
    const pump = pumpConfig.find((p) => p.id === pumpId)

    if (!pump) {
      throw new Error(`Pumpe mit ID ${pumpId} nicht gefunden`)
    }

    console.log(`Teste Pumpe ${pumpId} an Pin ${pump.pin}`)

    // Aktiviere die Pumpe für 1 Sekunde
    await activatePump(pump.pin, 1000)

    return { success: true }
  } catch (error) {
    console.error(`Fehler beim Testen der Pumpe ${pumpId}:`, error)
    throw error
  }
}

// Funktion zur Kalibrierung einer Pumpe (läuft für exakt 2 Sekunden)
export async function calibratePump(pumpId: number, durationMs: number) {
  try {
    // Finde die Pumpe in der Konfiguration
    const pumpConfig = await getPumpConfig()
    const pump = pumpConfig.find((p) => p.id === pumpId)

    if (!pump) {
      throw new Error(`Pumpe mit ID ${pumpId} nicht gefunden`)
    }

    console.log(`Kalibriere Pumpe ${pumpId} an Pin ${pump.pin} für ${durationMs}ms`)

    // Aktiviere die Pumpe für die angegebene Zeit
    await activatePump(pump.pin, durationMs)

    return { success: true }
  } catch (error) {
    console.error(`Fehler bei der Kalibrierung der Pumpe ${pumpId}:`, error)
    throw error
  }
}

// Funktion zum Reinigen einer Pumpe
export async function cleanPump(pumpId: number, durationMs: number) {
  try {
    // Finde die Pumpe in der Konfiguration
    const pumpConfig = await getPumpConfig()
    const pump = pumpConfig.find((p) => p.id === pumpId)

    if (!pump) {
      throw new Error(`Pumpe mit ID ${pumpId} nicht gefunden`)
    }

    console.log(`Reinige Pumpe ${pumpId} an Pin ${pump.pin} für ${durationMs}ms`)

    // Aktiviere die Pumpe für die angegebene Zeit
    await activatePump(pump.pin, durationMs)

    return { success: true }
  } catch (error) {
    console.error(`Fehler bei der Reinigung der Pumpe ${pumpId}:`, error)
    throw error
  }
}

// Pfad zur JSON-Datei für die Pumpenkonfiguration
const PUMP_CONFIG_PATH = path.join(process.cwd(), "data", "pump-config.json")

// Pfad zur JSON-Datei für die Cocktail-Rezepte
const COCKTAILS_PATH = path.join(process.cwd(), "data", "custom-cocktails.json")

// Funktion zum Laden der Pumpenkonfiguration
export async function getPumpConfig(): Promise<PumpConfig[]> {
  try {
    // Prüfe, ob die Datei existiert
    if (fs.existsSync(PUMP_CONFIG_PATH)) {
      // Lese die Datei
      const data = fs.readFileSync(PUMP_CONFIG_PATH, "utf8")
      const config = JSON.parse(data) as PumpConfig[]

      // Protokolliere die geladene Konfiguration für Debugging-Zwecke
      // console.log("Pumpenkonfiguration geladen:")
      // config.forEach((pump) => {
      //   console.log(`Pumpe ${pump.id} (${pump.ingredient}): Pin ${pump.pin}, Durchflussrate ${pump.flowRate} ml/s`)
      // })

      return config
    } else {
      // Wenn die Datei nicht existiert, lade die Standardkonfiguration
      const { pumpConfig } = await import("@/data/pump-config")

      // Speichere die Standardkonfiguration in der JSON-Datei
      fs.mkdirSync(path.dirname(PUMP_CONFIG_PATH), { recursive: true })
      fs.writeFileSync(PUMP_CONFIG_PATH, JSON.stringify(pumpConfig, null, 2), "utf8")

      // Protokolliere die Standardkonfiguration
      // console.log("Standard-Pumpenkonfiguration geladen:")
      // pumpConfig.forEach((pump) => {
      //   console.log(`Pumpe ${pump.id} (${pump.ingredient}): Pin ${pump.pin}, Durchflussrate ${pump.flowRate} ml/s`)
      // })

      return pumpConfig
    }
  } catch (error) {
    console.error("Fehler beim Laden der Pumpenkonfiguration:", error)

    // Fallback: Lade die Standardkonfiguration
    const { pumpConfig } = await import("@/data/pump-config")
    return pumpConfig
  }
}

// Funktion zum Speichern der Pumpen-Konfiguration
export async function savePumpConfig(pumpConfig: PumpConfig[]) {
  try {
    console.log("Speichere Pumpen-Konfiguration:", pumpConfig)

    // Stelle sicher, dass das Verzeichnis existiert
    fs.mkdirSync(path.dirname(PUMP_CONFIG_PATH), { recursive: true })

    // Speichere die Konfiguration in der JSON-Datei
    fs.writeFileSync(PUMP_CONFIG_PATH, JSON.stringify(pumpConfig, null, 2), "utf8")

    // Protokolliere die gespeicherte Konfiguration für Debugging-Zwecke
    // console.log("Pumpenkonfiguration erfolgreich gespeichert:")
    // pumpConfig.forEach((pump) => {
    //   console.log(`Pumpe ${pump.id} (${pump.ingredient}): Pin ${pump.pin}, Durchflussrate ${pump.flowRate} ml/s`)
    // })

    return { success: true }
  } catch (error) {
    console.error("Fehler beim Speichern der Pumpen-Konfiguration:", error)
    throw error
  }
}

// Funktion zum Laden aller Cocktails (Standard + benutzerdefinierte)
export async function getAllCocktails(): Promise<Cocktail[]> {
  try {
    // Lade die Standard-Cocktails
    const { cocktails: defaultCocktailsSource } = await import("@/data/cocktails")

    // Stelle sicher, dass alle Standard-Cocktails `isActive` haben und Bildpfade normalisiert sind
    const defaultCocktails = defaultCocktailsSource.map((cocktail) => {
      let image = cocktail.image || ""
      if (image && !image.startsWith("http") && !image.startsWith("/")) {
        image = `/${image}`
      }
      return {
        ...cocktail,
        image,
        isActive: cocktail.isActive === undefined ? true : cocktail.isActive,
      }
    })

    // Definiere die zusätzlichen Cocktails direkt mit `isActive: true`
    const additionalCocktails: Cocktail[] = [
      {
        id: "long-island-iced-tea",
        name: "Long Island Iced Tea",
        description: "Klassischer, starker Cocktail mit fünf verschiedenen Spirituosen und Cola",
        image: "/images/cocktails/long_island_iced_tea.jpg",
        alcoholic: true,
        ingredients: [
          "15ml Brauner Rum",
          "15ml Triple Sec",
          "15ml Vodka",
          "15ml Tequila",
          "30ml Limettensaft",
          "150ml Cola (selbst hinzufügen)",
        ],
        recipe: [
          { ingredientId: "dark-rum", amount: 15 },
          { ingredientId: "triple-sec", amount: 15 },
          { ingredientId: "vodka", amount: 15 },
          { ingredientId: "tequila", amount: 15 },
          { ingredientId: "lime-juice", amount: 30 },
        ],
        isActive: true,
      },
      {
        id: "bahama-mama",
        name: "Bahama Mama",
        description: "Tropischer Cocktail mit Braunem Rum, Malibu und Fruchtsäften",
        image: "/images/cocktails/bahama_mama.jpg",
        alcoholic: true,
        ingredients: [
          "50ml Brauner Rum",
          "40ml Malibu",
          "80ml Orangensaft",
          "80ml Ananassaft",
          "20ml Limettensaft",
          "20ml Grenadine",
        ],
        recipe: [
          { ingredientId: "dark-rum", amount: 50 },
          { ingredientId: "malibu", amount: 40 },
          { ingredientId: "orange-juice", amount: 80 },
          { ingredientId: "pineapple-juice", amount: 80 },
          { ingredientId: "lime-juice", amount: 20 },
          { ingredientId: "grenadine", amount: 20 },
        ],
        isActive: true,
      },
      {
        id: "malibu-ananas-updated",
        name: "Malibu Ananas",
        description: "Süßer Kokoslikör mit Ananassaft",
        image: "/images/cocktails/malibu_ananas.jpg",
        alcoholic: true,
        ingredients: ["80ml Malibu", "220ml Ananassaft"],
        recipe: [
          { ingredientId: "malibu", amount: 80 },
          { ingredientId: "pineapple-juice", amount: 220 },
        ],
        isActive: true,
      },
      {
        id: "swimmingpool",
        name: "Swimmingpool",
        description: "Blauer, tropischer Cocktail mit Vodka und Ananassaft",
        image: "/images/cocktails/swimmingpool.jpg",
        alcoholic: true,
        ingredients: [
          "60ml Vodka",
          "30ml Blue Curacao",
          "180ml Ananassaft",
          "40ml Cream of Coconut (selbst hinzufügen)",
        ],
        recipe: [
          { ingredientId: "vodka", amount: 60 },
          { ingredientId: "blue-curacao", amount: 30 },
          { ingredientId: "pineapple-juice", amount: 180 },
        ],
        isActive: true,
      },
      {
        id: "tequila-sunrise",
        name: "Tequila Sunrise",
        description: "Klassischer Cocktail mit Tequila, Orangensaft und Grenadine",
        image: "/images/cocktails/tequila_sunrise.jpg",
        alcoholic: true,
        ingredients: ["60ml Tequila", "220ml Orangensaft", "20ml Grenadine"],
        recipe: [
          { ingredientId: "tequila", amount: 60 },
          { ingredientId: "orange-juice", amount: 220 },
          { ingredientId: "grenadine", amount: 20 },
        ],
        isActive: true,
      },
      {
        id: "touch-down",
        name: "Touch Down",
        description: "Fruchtiger Cocktail mit Braunem Rum, Triple Sec und Maracujasaft",
        image: "/images/cocktails/touch_down.jpg",
        alcoholic: true,
        ingredients: [
          "60ml Brauner Rum",
          "40ml Triple Sec",
          "140ml Maracujasaft",
          "10ml Limettensaft",
          "20ml Grenadine",
        ],
        recipe: [
          { ingredientId: "dark-rum", amount: 60 },
          { ingredientId: "triple-sec", amount: 40 },
          { ingredientId: "passion-fruit-juice", amount: 140 },
          { ingredientId: "lime-juice", amount: 10 },
          { ingredientId: "grenadine", amount: 20 },
        ],
        isActive: true,
      },
      {
        id: "zombie",
        name: "Zombie",
        description: "Starker, fruchtiger Cocktail mit Braunem Rum und verschiedenen Fruchtsäften",
        image: "/images/cocktails/zombie.jpg",
        alcoholic: true,
        ingredients: [
          "40ml Brauner Rum",
          "30ml Triple Sec",
          "80ml Ananassaft",
          "50ml Orangensaft",
          "20ml Limettensaft",
          "50ml Maracujasaft",
          "20ml Grenadine",
        ],
        recipe: [
          { ingredientId: "dark-rum", amount: 40 },
          { ingredientId: "triple-sec", amount: 30 },
          { ingredientId: "pineapple-juice", amount: 80 },
          { ingredientId: "orange-juice", amount: 50 },
          { ingredientId: "lime-juice", amount: 20 },
          { ingredientId: "passion-fruit-juice", amount: 50 },
          { ingredientId: "grenadine", amount: 20 },
        ],
        isActive: true,
      },
      {
        id: "fruchtpunsch",
        name: "Fruchtpunsch",
        description: "Erfrischender Mix aus Ananas, Orange und Maracuja",
        image: "/palm-glow.png",
        alcoholic: false,
        ingredients: ["100ml Ananassaft", "100ml Orangensaft", "100ml Maracujasaft"],
        recipe: [
          { ingredientId: "pineapple-juice", amount: 100 },
          { ingredientId: "orange-juice", amount: 100 },
          { ingredientId: "passion-fruit-juice", amount: 100 },
        ],
        isActive: true,
      },
      {
        id: "suess-sauer-mix",
        name: "Süß-Sauer Mix",
        description: "Ausgewogene Mischung aus süßen und sauren Fruchtsäften",
        image: "/vibrant-passion-fizz.png",
        alcoholic: false,
        ingredients: ["150ml Ananassaft", "50ml Limettensaft", "20ml Grenadine"],
        recipe: [
          { ingredientId: "pineapple-juice", amount: 150 },
          { ingredientId: "lime-juice", amount: 50 },
          { ingredientId: "grenadine", amount: 20 },
        ],
        isActive: true,
      },
      {
        id: "vanille-orange",
        name: "Vanille Orange",
        description: "Cremiger Orangensaft mit feiner Vanillenote",
        image: "/citrus-swirl-sunset.png",
        alcoholic: false,
        ingredients: ["200ml Orangensaft", "30ml Vanillesirup"],
        recipe: [
          { ingredientId: "orange-juice", amount: 200 },
          { ingredientId: "vanilla-syrup", amount: 30 },
        ],
        isActive: true,
      },
      {
        id: "maracuja-traum",
        name: "Maracuja Traum",
        description: "Exotischer Cocktail mit Maracuja und Vanille",
        image: "/tropical-blend.png",
        alcoholic: false,
        ingredients: ["200ml Maracujasaft", "20ml Vanillesirup", "10ml Limettensaft"],
        recipe: [
          { ingredientId: "passion-fruit-juice", amount: 200 },
          { ingredientId: "vanilla-syrup", amount: 20 },
          { ingredientId: "lime-juice", amount: 10 },
        ],
        isActive: true,
      },
      {
        id: "grenadine-splash",
        name: "Grenadine Splash",
        description: "Fruchtig-süßer Mix mit Grenadine und Orangensaft",
        image: "/bursting-berries.png",
        alcoholic: false,
        ingredients: ["150ml Orangensaft", "50ml Ananassaft", "30ml Grenadine"],
        recipe: [
          { ingredientId: "orange-juice", amount: 150 },
          { ingredientId: "pineapple-juice", amount: 50 },
          { ingredientId: "grenadine", amount: 30 },
        ],
        isActive: true,
      },
    ].map((cocktail) => {
      // Ensure image paths are correct for additional cocktails too
      let image = cocktail.image || ""
      if (image && !image.startsWith("http") && !image.startsWith("/")) {
        image = `/${image}`
      }
      return { ...cocktail, image }
    })

    // Erstelle eine Map für die Cocktails, um Duplikate zu vermeiden
    const cocktailMap = new Map<string, Cocktail>()

    // Füge zuerst die Standard-Cocktails hinzu (bereits normalisiert)
    for (const cocktail of defaultCocktails) {
      if (
        cocktail.id === "malibu-ananas" || // Wird durch malibu-ananas-updated ersetzt
        cocktail.id === "gin-tonic" ||
        cocktail.id === "cuba-libre" || // Werden nicht mehr verwendet
        !cocktail.alcoholic // Alkoholfreie werden durch additionalCocktails ersetzt
      )
        continue

      const updatedCocktail = { ...cocktail }
      updatedCocktail.ingredients = cocktail.ingredients.map((ingredient) =>
        ingredient.includes("Rum") && !ingredient.includes("Brauner Rum")
          ? ingredient.replace("Rum", "Brauner Rum")
          : ingredient,
      )
      cocktailMap.set(cocktail.id, updatedCocktail)
    }

    // Füge die zusätzlichen Cocktails hinzu (bereits normalisiert)
    for (const cocktail of additionalCocktails) {
      cocktailMap.set(cocktail.id, cocktail)
    }

    // Prüfe, ob die Datei für benutzerdefinierte Cocktails existiert
    if (fs.existsSync(COCKTAILS_PATH)) {
      const data = fs.readFileSync(COCKTAILS_PATH, "utf8")
      const customCocktailsData: any[] = JSON.parse(data)

      for (const cocktailData of customCocktailsData) {
        if (!cocktailData.alcoholic && !additionalCocktails.find((ac) => ac.id === cocktailData.id)) continue // Nur alkoholische oder nicht bereits ersetzte alkoholfreie

        let image = cocktailData.image || ""
        if (image && !image.startsWith("http") && !image.startsWith("/")) {
          image = `/${image}`
        }

        const updatedCocktail: Cocktail = {
          ...cocktailData,
          image,
          isActive: cocktailData.isActive === undefined ? true : cocktailData.isActive,
          ingredients: cocktailData.ingredients.map((ingredient: string) =>
            ingredient.includes("Rum") && !ingredient.includes("Brauner Rum")
              ? ingredient.replace("Rum", "Brauner Rum")
              : ingredient,
          ),
        }
        cocktailMap.set(cocktailData.id, updatedCocktail)
      }
    }
    // console.log("Final cocktail list from getAllCocktails:", Array.from(cocktailMap.values()).map(c => ({id: c.id, name: c.name, isActive: c.isActive, image: c.image})));
    return Array.from(cocktailMap.values())
  } catch (error) {
    console.error("Fehler beim Laden der Cocktails:", error)
    const { cocktails: defaultCocktailsFallback } = await import("@/data/cocktails")
    return defaultCocktailsFallback.map((c) => ({
      ...c,
      isActive: c.isActive === undefined ? true : c.isActive,
      image: c.image && !c.image.startsWith("http") && !c.image.startsWith("/") ? `/${c.image}` : c.image,
    }))
  }
}

// Funktion zum Speichern eines Cocktail-Rezepts
export async function saveRecipe(cocktail: Cocktail) {
  try {
    // console.log("Speichere Rezept:", cocktail)

    fs.mkdirSync(path.dirname(COCKTAILS_PATH), { recursive: true })
    let customCocktails: Cocktail[] = []
    if (fs.existsSync(COCKTAILS_PATH)) {
      const data = fs.readFileSync(COCKTAILS_PATH, "utf8")
      customCocktails = JSON.parse(data).map((c: any) => ({
        ...c,
        isActive: c.isActive === undefined ? true : c.isActive,
      }))
    }

    const index = customCocktails.findIndex((c) => c.id === cocktail.id)
    const cocktailToSave: Cocktail = {
      // Ensure the cocktail being saved has all properties
      ...cocktail,
      isActive: cocktail.isActive === undefined ? true : cocktail.isActive,
      image:
        cocktail.image && !cocktail.image.startsWith("http") && !cocktail.image.startsWith("/")
          ? `/${cocktail.image}`
          : cocktail.image,
    }

    if (index !== -1) {
      customCocktails[index] = cocktailToSave
    } else {
      customCocktails.push(cocktailToSave)
    }

    fs.writeFileSync(COCKTAILS_PATH, JSON.stringify(customCocktails, null, 2), "utf8")
    // console.log("Rezept erfolgreich gespeichert")
    return { success: true }
  } catch (error) {
    console.error("Fehler beim Speichern des Rezepts:", error)
    throw error
  }
}

// Funktion zum Löschen eines Cocktail-Rezepts
export async function deleteRecipe(cocktailId: string) {
  try {
    // console.log(`Lösche Rezept mit ID: ${cocktailId}`)
    if (!fs.existsSync(COCKTAILS_PATH)) {
      return { success: false, error: "Keine benutzerdefinierten Cocktails gefunden" }
    }
    const data = fs.readFileSync(COCKTAILS_PATH, "utf8")
    const customCocktails: Cocktail[] = JSON.parse(data)
    const index = customCocktails.findIndex((c) => c.id === cocktailId)

    if (index === -1) {
      return { success: false, error: `Cocktail mit ID ${cocktailId} nicht gefunden` }
    }
    customCocktails.splice(index, 1)
    fs.writeFileSync(COCKTAILS_PATH, JSON.stringify(customCocktails, null, 2), "utf8")
    // console.log(`Rezept mit ID ${cocktailId} erfolgreich gelöscht`)
    return { success: true }
  } catch (error) {
    console.error("Fehler beim Löschen des Rezepts:", error)
    throw error
  }
}
