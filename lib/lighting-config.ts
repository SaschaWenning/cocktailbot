import fs from "fs"
import path from "path"
import { type LightingConfig, defaultConfig } from "./lighting-config-types"

export type { LightingConfig }
export { defaultConfig }

const CONFIG_FILE = path.join(process.cwd(), "data", "lighting-config.json")

export async function loadLightingConfig(): Promise<LightingConfig> {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, "utf-8")
      return JSON.parse(data)
    }
  } catch (error) {
    console.error("[v0] Error loading lighting config:", error)
  }
  return defaultConfig
}

export async function saveLightingConfig(config: LightingConfig): Promise<void> {
  try {
    const dataDir = path.dirname(CONFIG_FILE)
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
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
