// Hilfsfunktionen für die GPIO-Steuerung über die API

// Initialisiere die GPIO-Pins
export async function setupGPIO() {
  try {
    console.log("GPIO-Pins werden initialisiert")
    const response = await fetch("/api/gpio", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "setup" }),
      cache: "no-store", // Verhindert Caching
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP-Fehler: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log("Setup-Ergebnis:", result)

    if (!result.success) {
      throw new Error(result.error || "Unbekannter Fehler bei der Initialisierung")
    }

    console.log("GPIO-Pins erfolgreich initialisiert")
    return result
  } catch (error) {
    console.error("Fehler bei der Initialisierung der GPIO-Pins:", error)
    throw error
  }
}

// Aktiviere einen Pin für eine bestimmte Dauer
export async function activatePinForDuration(pin: number, durationMs: number) {
  try {
    console.log(`Aktiviere Pin ${pin} für ${durationMs}ms`)

    // Füge eine kurze Verzögerung hinzu, bevor der Pin aktiviert wird
    await new Promise((resolve) => setTimeout(resolve, 50))

    const response = await fetch("/api/gpio", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "activate", pin, duration: durationMs }),
      cache: "no-store", // Verhindert Caching
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP-Fehler: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log("Aktivierungs-Ergebnis:", result)

    if (!result.success) {
      throw new Error(result.error || "Unbekannter Fehler beim Aktivieren des Pins")
    }

    return result
  } catch (error) {
    console.error(`Fehler beim Aktivieren von Pin ${pin}:`, error)
    throw error
  }
}

// Bereinige die GPIO-Pins
export async function cleanupGPIO() {
  try {
    console.log("GPIO-Pins werden bereinigt")
    const response = await fetch("/api/gpio", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "cleanup" }),
      cache: "no-store", // Verhindert Caching
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP-Fehler: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log("Cleanup-Ergebnis:", result)

    if (!result.success) {
      throw new Error(result.error || "Unbekannter Fehler bei der Bereinigung")
    }

    return result
  } catch (error) {
    console.error("Fehler beim Bereinigen der GPIO-Pins:", error)
    throw error
  }
}

// Einfacher Test der API
export async function testGPIOAPI() {
  try {
    console.log("Teste GPIO API")
    const response = await fetch("/api/gpio", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "test" }),
      cache: "no-store", // Verhindert Caching
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP-Fehler: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log("Test-Ergebnis:", result)

    return result
  } catch (error) {
    console.error("Fehler beim Testen der GPIO API:", error)
    throw error
  }
}
