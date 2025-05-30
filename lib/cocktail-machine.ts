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
      const { pumpConfig: defaultConfig } = await import("@/data/pump-config")

      // Speichere die Standardkonfiguration in der JSON-Datei
      fs.mkdirSync(path.dirname(PUMP_CONFIG_PATH), { recursive: true })
      fs.writeFileSync(PUMP_CONFIG_PATH, JSON.stringify(defaultConfig, null, 2), "utf8")

      // Protokolliere die Standardkonfiguration
      // console.log("Standard-Pumpenkonfiguration geladen:")
      // defaultConfig.forEach((pump) => {
      //   console.log(`Pumpe ${pump.id} (${pump.ingredient}): Pin ${pump.pin}, Durchflussrate ${pump.flowRate} ml/s`)
      // })

      return defaultConfig
    }
  } catch (error) {
    console.error("Fehler beim Laden der Pumpenkonfiguration:", error)

    // Fallback: Lade die Standardkonfiguration
    const { pumpConfig: defaultConfig } = await import("@/data/pump-config")
    return defaultConfig
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
    // Lade die Standard-Cocktails (deine ursprüngliche Liste)
    const { cocktails: defaultCocktailsSource } = await import("@/data/cocktails")

    // Stelle sicher, dass alle Standard-Cocktails `isActive` haben und Bildpfade normalisiert sind
    const defaultCocktails = defaultCocktailsSource.map((cocktail) => {
      let image = cocktail.image || ""
      if (image && !image.startsWith("http") && !image.startsWith("/")) {
        image = `/${image}`
      }
      // Ersetze "Rum" durch "Brauner Rum" in der Zutatenliste für Konsistenz, falls nötig
      const updatedIngredients = cocktail.ingredients.map((ingredient) =>
        ingredient.toLowerCase().includes(" rum") &&
        !ingredient.toLowerCase().includes("brauner rum") &&
        !ingredient.toLowerCase().includes("weißer rum")
          ? ingredient.replace(/rum/gi, "Brauner Rum")
          : ingredient,
      )
      return {
        ...cocktail,
        image,
        ingredients: updatedIngredients,
        isActive: cocktail.isActive === undefined ? true : cocktail.isActive,
      }
    })

    // Definiere zusätzliche Cocktails (hauptsächlich neue alkoholfreie und explizite Updates)
    const additionalCocktails: Cocktail[] = [
      {
        // Explizites Update für Malibu Ananas, falls gewünscht
        id: "malibu-ananas-updated", // Diese ID wird verwendet, um die Standard "malibu-ananas" zu überschreiben
        name: "Malibu Ananas (Neu)",
        description: "Süßer Kokoslikör mit Ananassaft - optimierte Version",
        image: "/images/cocktails/malibu_ananas.jpg",
        alcoholic: true,
        ingredients: ["80ml Malibu", "220ml Ananassaft"],
        recipe: [
          { ingredientId: "malibu", amount: 80 },
          { ingredientId: "pineapple-juice", amount: 220 },
        ],
        isActive: true,
      },
      // Neue alkoholfreie Cocktails
      {
        id: "fruchtpunsch",
        name: "Fruchtpunsch",
        description: "Erfrischender Mix aus Ananas, Orange und Maracuja",
        image: "/palm-glow.png", // Stelle sicher, dass dieses Bild existiert
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
        image: "/vibrant-passion-fizz.png", // Stelle sicher, dass dieses Bild existiert
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
        image: "/citrus-swirl-sunset.png", // Stelle sicher, dass dieses Bild existiert
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
        image: "/tropical-blend.png", // Stelle sicher, dass dieses Bild existiert
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
        image: "/bursting-berries.png", // Stelle sicher, dass dieses Bild existiert
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
      let image = cocktail.image || ""
      if (image && !image.startsWith("http") && !image.startsWith("/")) {
        image = `/${image}`
      }
      return { ...cocktail, image }
    })

    const cocktailMap = new Map<string, Cocktail>()

    // 1. Füge deine Standard-Cocktails hinzu
    for (const cocktail of defaultCocktails) {
      // Filterung: Entferne den Standard 'malibu-ananas', da 'malibu-ananas-updated' ihn ersetzen soll.
      if (cocktail.id === "malibu-ananas") {
        // Wenn du die Originalversion von Malibu Ananas behalten willst und die neue zusätzlich,
        // dann kommentiere diese if-Bedingung aus oder benenne 'malibu-ananas-updated' anders.
        // Aktuell wird der Standard 'malibu-ananas' übersprungen, damit die 'updated' Version aus additionalCocktails greift.
        // Wenn 'malibu-ananas-updated' nicht existiert oder anders heißt, wird der Standard hier hinzugefügt.
        const updatedVersionExists = additionalCocktails.some((ac) => ac.id === "malibu-ananas-updated")
        if (updatedVersionExists) continue // Überspringe Standard, wenn Update existiert
      }
      cocktailMap.set(cocktail.id, cocktail)
    }

    // 2. Füge zusätzliche Cocktails hinzu (diese können Standard-Cocktails überschreiben, wenn die ID gleich ist,
    // oder neue hinzufügen, wenn die ID einzigartig ist)
    for (const cocktail of additionalCocktails) {
      // Wenn die ID "malibu-ananas-updated" ist, setze sie mit der ID "malibu-ananas" in die Map,
      // um den Standard-Cocktail effektiv zu überschreiben.
      if (cocktail.id === "malibu-ananas-updated") {
        cocktailMap.set("malibu-ananas", { ...cocktail, id: "malibu-ananas", name: "Malibu Ananas" }) // Name ggf. anpassen
      } else {
        cocktailMap.set(cocktail.id, cocktail)
      }
    }

    // 3. Lade benutzerdefinierte Cocktails und überschreibe ggf. vorhandene
    if (fs.existsSync(COCKTAILS_PATH)) {
      const data = fs.readFileSync(COCKTAILS_PATH, "utf8")
      const customCocktailsData: any[] = JSON.parse(data)

      for (const cocktailData of customCocktailsData) {
        let image = cocktailData.image || ""
        if (image && !image.startsWith("http") && !image.startsWith("/")) {
          image = `/${image}`
        }
        const updatedIngredientsCustom = (cocktailData.ingredients || []).map((ingredient: string) =>
          ingredient.toLowerCase().includes(" rum") &&
          !ingredient.toLowerCase().includes("brauner rum") &&
          !ingredient.toLowerCase().includes("weißer rum")
            ? ingredient.replace(/rum/gi, "Brauner Rum")
            : ingredient,
        )

        const updatedCocktail: Cocktail = {
          ...cocktailData,
          image,
          ingredients: updatedIngredientsCustom,
          isActive: cocktailData.isActive === undefined ? true : cocktailData.isActive,
        }
        cocktailMap.set(cocktailData.id, updatedCocktail) // Überschreibt Standard oder Zusätzliche mit gleicher ID
      }
    }
    // console.log("Final cocktail list from getAllCocktails:", Array.from(cocktailMap.values()).map(c => ({id: c.id, name: c.name, isActive: c.isActive})));
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
