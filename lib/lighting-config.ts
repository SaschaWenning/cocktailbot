import { type LightingConfig, defaultConfig } from "./lighting-config-types"
import fs from "fs"
import path from "path"

export type { LightingConfig }
export { defaultConfig }

const CONFIG_FILE = path.join(process.cwd(), "data", "lighting-config.json")

export async function loadLightingConfig(): Promise<LightingConfig> {
  try {
    // Check if running in Node environment
    if (typeof window === "undefined") {
      // Server-side: Read from file
      if (fs.existsSync(CONFIG_FILE)) {
        const data = fs.readFileSync(CONFIG_FILE, "utf-8")
        const config = JSON.parse(data)
        console.log("[v0] Loaded lighting config from file:", config)
        return config
      }
      console.log("[v0] No lighting config file found, using default")
    } else {
      // Client-side: Read from localStorage
      const stored = localStorage.getItem("lighting-config")
      if (stored) {
        const config = JSON.parse(stored)
        console.log("[v0] Loaded lighting config from localStorage:", config)
        return config
      }
      console.log("[v0] No lighting config in localStorage, using default")
    }
  } catch (error) {
    console.error("[v0] Error loading lighting config:", error)
  }
  return defaultConfig
}

export async function saveLightingConfig(config: LightingConfig): Promise<void> {
  try {
    // Check if running in Node environment
    if (typeof window === "undefined") {
      // Server-side: Save to file
      const dataDir = path.join(process.cwd(), "data")
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
      }
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
      console.log("[v0] Lighting config saved to file successfully")
    } else {
      // Client-side: Save to localStorage
      localStorage.setItem("lighting-config", JSON.stringify(config))
      console.log("[v0] Lighting config saved to localStorage successfully")
    }
  } catch (error) {
    console.error("[v0] Error saving lighting config:", error)
    throw error
  }
}

export async function hexToRgb(hex: string): Promise<{ r: number; g: number; b: number } | null> {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: Number.parseInt(result[1], 16),
        g: Number.parseInt(result[2], 16),
        b: Number.parseInt(result[3], 16),
      }
    : null
}
