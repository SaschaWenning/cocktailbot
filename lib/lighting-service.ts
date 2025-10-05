// Service für LED-Beleuchtungssteuerung während Cocktail-Zubereitung

interface LightingConfig {
  cocktailPreparation: {
    color: string
    blinking: boolean
  }
  cocktailFinished: {
    color: string
    blinking: boolean
  }
  idleMode: {
    scheme: string
    colors: string[]
  }
}

let currentConfig: LightingConfig | null = null

export async function loadLightingConfig(): Promise<LightingConfig> {
  if (currentConfig) {
    return currentConfig
  }

  try {
    const response = await fetch("/api/lighting-config")
    if (response.ok) {
      currentConfig = await response.json()
      return currentConfig!
    }
  } catch (error) {
    console.error("[v0] Error loading lighting config:", error)
  }

  // Fallback to default config
  currentConfig = {
    cocktailPreparation: {
      color: "#00ff00",
      blinking: false,
    },
    cocktailFinished: {
      color: "#0000ff",
      blinking: true,
    },
    idleMode: {
      scheme: "rainbow",
      colors: ["#ff0000", "#00ff00", "#0000ff"],
    },
  }

  return currentConfig
}

export async function setLightingMode(mode: "preparation" | "finished" | "idle") {
  try {
    const apiMode = mode === "finished" ? "cocktailFinished" : mode

    await fetch("/api/lighting-control", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: apiMode,
      }),
    })

    console.log("[v0] Lighting mode set to:", apiMode)
  } catch (error) {
    console.error("[v0] Error setting lighting mode:", error)
  }
}

// Invalidate cache when config changes
export function invalidateLightingConfig() {
  currentConfig = null
}
