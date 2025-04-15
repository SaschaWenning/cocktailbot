"use server"

import type { Cocktail } from "@/types/cocktail"
import type { PumpConfig } from "@/types/pump"
import { updateLevelsAfterCocktail, updateLevelAfterShot } from "@/lib/ingredient-level-service"
import fs from "fs"
import path from "path"

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
    const pumpTimeMs = (item.amount / pump.flowRate) * 1000

    console.log(`Pumpe ${pump.id} (${pump.ingredient}): ${item.amount}ml für ${pumpTimeMs}ms aktivieren`)

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
      const pumpTimeMs = (item.amount / pump.flowRate) * 1000

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

  // Finde die Pumpe für diese Zutat
  const pumpConfig = await getPumpConfig()
  const pump = pumpConfig.find((p) => p.ingredient === ingredientId)

  if (!pump) {
    throw new Error(`Keine Pumpe für Zutat ${ingredientId} konfiguriert!`)
  }

  // Berechne, wie lange die Pumpe laufen muss
  const pumpTimeMs = (amount / pump.flowRate) * 1000

  console.log(`Pumpe ${pump.id} (${pump.ingredient}): ${amount}ml für ${pumpTimeMs}ms aktivieren`)

  // Aktiviere die Pumpe
  await activatePump(pump.pin, pumpTimeMs)

  return { success: true }
}

// Diese Funktion würde die GPIO-Pins des Raspberry Pi steuern
async function activatePump(pin: number, durationMs: number) {
  try {
    // In einer echten Implementierung würden wir hier die GPIO-Pins steuern
    // Für diese Demo simulieren wir nur die Verzögerung

    // Simuliere das Einschalten der Pumpe
    console.log(`GPIO Pin ${pin} eingeschaltet`)

    // Warte für die angegebene Dauer
    await new Promise((resolve) => setTimeout(resolve, durationMs))

    // Simuliere das Ausschalten der Pumpe
    console.log(`GPIO Pin ${pin} ausgeschaltet`)

    return true
  } catch (error) {
    console.error(`Fehler beim Aktivieren der Pumpe an Pin ${pin}:`, error)
    throw error
  }
}

// Funktion zum Testen einer einzelnen Pumpe
export async function testPump(pumpId: number) {
  try {
    // In einer echten Implementierung würden wir hier die entsprechende Pumpe für eine kurze Zeit aktivieren
    console.log(`Teste Pumpe ${pumpId}`)

    // Simuliere eine kurze Verzögerung
    await new Promise((resolve) => setTimeout(resolve, 2000))

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
    console.log(`Kalibriere Pumpe ${pumpId} für ${durationMs}ms`)

    // In einer echten Implementierung würden wir hier die entsprechende Pumpe aktivieren
    // und nach der angegebenen Zeit wieder deaktivieren

    // Simuliere die Aktivierung der Pumpe
    console.log(`Pumpe ${pumpId} eingeschaltet`)

    // Warte für die angegebene Dauer
    await new Promise((resolve) => setTimeout(resolve, durationMs))

    // Simuliere das Ausschalten der Pumpe
    console.log(`Pumpe ${pumpId} ausgeschaltet`)

    return { success: true }
  } catch (error) {
    console.error(`Fehler bei der Kalibrierung der Pumpe ${pumpId}:`, error)
    throw error
  }
}

// Funktion zum Reinigen einer Pumpe
export async function cleanPump(pumpId: number, durationMs: number) {
  try {
    console.log(`Reinige Pumpe ${pumpId} für ${durationMs}ms`)

    // In einer echten Implementierung würden wir hier die entsprechende Pumpe aktivieren
    // und nach der angegebenen Zeit wieder deaktivieren

    // Simuliere die Aktivierung der Pumpe
    console.log(`Pumpe ${pumpId} eingeschaltet für Reinigung`)

    // Warte für die angegebene Dauer
    await new Promise((resolve) => setTimeout(resolve, durationMs))

    // Simuliere das Ausschalten der Pumpe
    console.log(`Pumpe ${pumpId} ausgeschaltet nach Reinigung`)

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
      return JSON.parse(data)
    } else {
      // Wenn die Datei nicht existiert, lade die Standardkonfiguration
      const { pumpConfig } = await import("@/data/pump-config")

      // Speichere die Standardkonfiguration in der JSON-Datei
      fs.mkdirSync(path.dirname(PUMP_CONFIG_PATH), { recursive: true })
      fs.writeFileSync(PUMP_CONFIG_PATH, JSON.stringify(pumpConfig, null, 2), "utf8")

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

    console.log("Pumpen-Konfiguration erfolgreich gespeichert")
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
    const { cocktails: defaultCocktails } = await import("@/data/cocktails")

    // Suche nach dem Abschnitt mit den zusätzlichen Cocktails und aktualisiere die Bildpfade

    // Definiere die zusätzlichen Cocktails
    const additionalCocktails: Cocktail[] = [
      // Long Island Iced Tea
      {
        id: "long-island-iced-tea",
        name: "Long Island Iced Tea",
        description: "Klassischer, starker Cocktail mit fünf verschiedenen Spirituosen und Cola",
        image: "/images/cocktails/long_island_iced_tea.jpg", // Aktualisierter Bildpfad
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
          // Cola wird manuell hinzugefügt
        ],
      },

      // Bahama Mama
      {
        id: "bahama-mama",
        name: "Bahama Mama",
        description: "Tropischer Cocktail mit Braunem Rum, Malibu und Fruchtsäften",
        image: "/images/cocktails/bahama_mama.jpg", // Aktualisierter Bildpfad
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
      },

      // Malibu Ananas (aktualisierte Version)
      {
        id: "malibu-ananas-updated",
        name: "Malibu Ananas",
        description: "Süßer Kokoslikör mit Ananassaft",
        image: "/images/cocktails/malibu_ananas.jpg", // Aktualisierter Bildpfad
        alcoholic: true,
        ingredients: ["80ml Malibu", "220ml Ananassaft"],
        recipe: [
          { ingredientId: "malibu", amount: 80 },
          { ingredientId: "pineapple-juice", amount: 220 },
        ],
      },

      // Swimmingpool
      {
        id: "swimmingpool",
        name: "Swimmingpool",
        description: "Blauer, tropischer Cocktail mit Vodka und Ananassaft",
        image: "/images/cocktails/swimmingpool.jpg", // Aktualisierter Bildpfad
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
          // Cream of Coconut manuell hinzufügen
        ],
      },

      // Tequila Sunrise
      {
        id: "tequila-sunrise",
        name: "Tequila Sunrise",
        description: "Klassischer Cocktail mit Tequila, Orangensaft und Grenadine",
        image: "/images/cocktails/tequila_sunrise.jpg", // Aktualisierter Bildpfad
        alcoholic: true,
        ingredients: ["60ml Tequila", "220ml Orangensaft", "20ml Grenadine"],
        recipe: [
          { ingredientId: "tequila", amount: 60 },
          { ingredientId: "orange-juice", amount: 220 },
          { ingredientId: "grenadine", amount: 20 },
        ],
      },

      // Touch Down
      {
        id: "touch-down",
        name: "Touch Down",
        description: "Fruchtiger Cocktail mit Braunem Rum, Triple Sec und Maracujasaft",
        image: "/images/cocktails/touch_down.jpg", // Aktualisierter Bildpfad
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
      },

      // Zombie
      {
        id: "zombie",
        name: "Zombie",
        description: "Starker, fruchtiger Cocktail mit Braunem Rum und verschiedenen Fruchtsäften",
        image: "/images/cocktails/zombie.jpg", // Aktualisierter Bildpfad
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
      },

      // Neue alkoholfreie Cocktails
      // Tropical Sunrise
      {
        id: "tropical-sunrise",
        name: "Tropical Sunrise",
        description: "Erfrischender alkoholfreier Cocktail mit Ananas, Orange und Grenadine",
        image: "/placeholder.svg?height=200&width=400",
        alcoholic: false,
        ingredients: ["120ml Ananassaft", "120ml Orangensaft", "20ml Grenadine", "10ml Limettensaft"],
        recipe: [
          { ingredientId: "pineapple-juice", amount: 120 },
          { ingredientId: "orange-juice", amount: 120 },
          { ingredientId: "grenadine", amount: 20 },
          { ingredientId: "lime-juice", amount: 10 },
        ],
      },

      // Passion Fizz
      {
        id: "passion-fizz",
        name: "Passion Fizz",
        description: "Sprudelnder alkoholfreier Cocktail mit Maracuja und Sodawasser",
        image: "/placeholder.svg?height=200&width=400",
        alcoholic: false,
        ingredients: ["150ml Maracujasaft", "100ml Sodawasser", "20ml Vanillesirup", "10ml Limettensaft"],
        recipe: [
          { ingredientId: "passion-fruit-juice", amount: 150 },
          { ingredientId: "soda-water", amount: 100 },
          { ingredientId: "vanilla-syrup", amount: 20 },
          { ingredientId: "lime-juice", amount: 10 },
        ],
      },

      // Orange Vanilla Dream
      {
        id: "orange-vanilla-dream",
        name: "Orange Vanilla Dream",
        description: "Cremiger alkoholfreier Cocktail mit Orange und Vanille",
        image: "/placeholder.svg?height=200&width=400",
        alcoholic: false,
        ingredients: ["200ml Orangensaft", "30ml Vanillesirup", "70ml Sodawasser"],
        recipe: [
          { ingredientId: "orange-juice", amount: 200 },
          { ingredientId: "vanilla-syrup", amount: 30 },
          { ingredientId: "soda-water", amount: 70 },
        ],
      },

      // Berry Splash
      {
        id: "berry-splash",
        name: "Berry Splash",
        description: "Fruchtiger alkoholfreier Cocktail mit Grenadine und Zitrusfrüchten",
        image: "/placeholder.svg?height=200&width=400",
        alcoholic: false,
        ingredients: [
          "30ml Grenadine",
          "100ml Orangensaft",
          "100ml Ananassaft",
          "20ml Limettensaft",
          "50ml Sodawasser",
        ],
        recipe: [
          { ingredientId: "grenadine", amount: 30 },
          { ingredientId: "orange-juice", amount: 100 },
          { ingredientId: "pineapple-juice", amount: 100 },
          { ingredientId: "lime-juice", amount: 20 },
          { ingredientId: "soda-water", amount: 50 },
        ],
      },

      // Pineapple Passion
      {
        id: "pineapple-passion",
        name: "Pineapple Passion",
        description: "Exotischer alkoholfreier Cocktail mit Ananas und Maracuja",
        image: "/placeholder.svg?height=200&width=400",
        alcoholic: false,
        ingredients: ["150ml Ananassaft", "100ml Maracujasaft", "15ml Limettensaft", "15ml Vanillesirup"],
        recipe: [
          { ingredientId: "pineapple-juice", amount: 150 },
          { ingredientId: "passion-fruit-juice", amount: 100 },
          { ingredientId: "lime-juice", amount: 15 },
          { ingredientId: "vanilla-syrup", amount: 15 },
        ],
      },

      // Citrus Cooler
      {
        id: "citrus-cooler",
        name: "Citrus Cooler",
        description: "Erfrischender alkoholfreier Cocktail mit Limette und Sodawasser",
        image: "/placeholder.svg?height=200&width=400",
        alcoholic: false,
        ingredients: ["40ml Limettensaft", "20ml Vanillesirup", "200ml Sodawasser", "10ml Grenadine"],
        recipe: [
          { ingredientId: "lime-juice", amount: 40 },
          { ingredientId: "vanilla-syrup", amount: 20 },
          { ingredientId: "soda-water", amount: 200 },
          { ingredientId: "grenadine", amount: 10 },
        ],
      },
    ]

    // Erstelle eine Map für die Cocktails, um Duplikate zu vermeiden
    const cocktailMap = new Map<string, Cocktail>()

    // Füge zuerst die Standard-Cocktails hinzu und ersetze "rum" durch "brauner rum"
    for (const cocktail of defaultCocktails) {
      // Überspringe den ursprünglichen Malibu Ananas, da wir eine aktualisierte Version haben
      // Überspringe auch Gin Tonic und Cuba Libre
      if (cocktail.id === "malibu-ananas" || cocktail.id === "gin-tonic" || cocktail.id === "cuba-libre") continue

      // Erstelle eine Kopie des Cocktails
      const updatedCocktail = { ...cocktail }

      // Aktualisiere die Zutaten-Textliste
      updatedCocktail.ingredients = cocktail.ingredients.map((ingredient) =>
        ingredient.includes("Rum") && !ingredient.includes("Brauner Rum")
          ? ingredient.replace("Rum", "Brauner Rum")
          : ingredient,
      )

      // Aktualisiere das Rezept (ingredientId bleibt gleich, da wir bereits dark-rum verwenden)
      // Wir müssen hier nichts ändern, da die ingredientId bereits "dark-rum" ist

      // Füge den aktualisierten Cocktail zur Map hinzu
      cocktailMap.set(cocktail.id, updatedCocktail)
    }

    // Füge die zusätzlichen Cocktails hinzu
    for (const cocktail of additionalCocktails) {
      cocktailMap.set(cocktail.id, cocktail)
    }

    // Prüfe, ob die Datei für benutzerdefinierte Cocktails existiert
    if (fs.existsSync(COCKTAILS_PATH)) {
      // Lese die Datei
      const data = fs.readFileSync(COCKTAILS_PATH, "utf8")
      const customCocktails: Cocktail[] = JSON.parse(data)

      // Aktualisiere und füge benutzerdefinierte Cocktails hinzu
      for (const cocktail of customCocktails) {
        // Erstelle eine Kopie des Cocktails
        const updatedCocktail = { ...cocktail }

        // Aktualisiere die Zutaten-Textliste
        updatedCocktail.ingredients = cocktail.ingredients.map((ingredient) =>
          ingredient.includes("Rum") && !ingredient.includes("Brauner Rum")
            ? ingredient.replace("Rum", "Brauner Rum")
            : ingredient,
        )

        // Füge den aktualisierten Cocktail zur Map hinzu
        cocktailMap.set(cocktail.id, updatedCocktail)
      }
    }

    // Konvertiere die Map zurück in ein Array
    return Array.from(cocktailMap.values())
  } catch (error) {
    console.error("Fehler beim Laden der Cocktails:", error)

    // Fallback: Lade nur die Standard-Cocktails
    const { cocktails } = await import("@/data/cocktails")
    return cocktails
  }
}

// Funktion zum Speichern eines Cocktail-Rezepts
export async function saveRecipe(cocktail: Cocktail) {
  try {
    console.log("Speichere Rezept:", cocktail)

    // Stelle sicher, dass das Verzeichnis existiert
    fs.mkdirSync(path.dirname(COCKTAILS_PATH), { recursive: true })

    // Lade bestehende benutzerdefinierte Cocktails oder erstelle ein leeres Array
    let customCocktails: Cocktail[] = []
    if (fs.existsSync(COCKTAILS_PATH)) {
      const data = fs.readFileSync(COCKTAILS_PATH, "utf8")
      customCocktails = JSON.parse(data)
    }

    // Prüfe, ob der Cocktail bereits existiert
    const index = customCocktails.findIndex((c) => c.id === cocktail.id)

    if (index !== -1) {
      // Aktualisiere den bestehenden Cocktail
      customCocktails[index] = cocktail
    } else {
      // Füge den neuen Cocktail hinzu
      customCocktails.push(cocktail)
    }

    // Speichere die aktualisierten Cocktails
    fs.writeFileSync(COCKTAILS_PATH, JSON.stringify(customCocktails, null, 2), "utf8")

    console.log("Rezept erfolgreich gespeichert")
    return { success: true }
  } catch (error) {
    console.error("Fehler beim Speichern des Rezepts:", error)
    throw error
  }
}

// Funktion zum Löschen eines Cocktail-Rezepts
export async function deleteRecipe(cocktailId: string) {
  try {
    console.log(`Lösche Rezept mit ID: ${cocktailId}`)

    // Prüfe, ob die Datei existiert
    if (!fs.existsSync(COCKTAILS_PATH)) {
      return { success: false, error: "Keine benutzerdefinierten Cocktails gefunden" }
    }

    // Lade bestehende benutzerdefinierte Cocktails
    const data = fs.readFileSync(COCKTAILS_PATH, "utf8")
    const customCocktails: Cocktail[] = JSON.parse(data)

    // Prüfe, ob der Cocktail existiert
    const index = customCocktails.findIndex((c) => c.id === cocktailId)

    if (index === -1) {
      return { success: false, error: `Cocktail mit ID ${cocktailId} nicht gefunden` }
    }

    // Entferne den Cocktail
    customCocktails.splice(index, 1)

    // Speichere die aktualisierten Cocktails
    fs.writeFileSync(COCKTAILS_PATH, JSON.stringify(customCocktails, null, 2), "utf8")

    console.log(`Rezept mit ID ${cocktailId} erfolgreich gelöscht`)
    return { success: true }
  } catch (error) {
    console.error("Fehler beim Löschen des Rezepts:", error)
    throw error
  }
}
