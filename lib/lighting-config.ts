import fs from "fs/promises"
import path from "path"

export type IdleMode = "rainbow" | "color" | "breath" | "off"

export interface LightingConfig {
  preparation: { blinking: boolean; color?: string }
  finished: { color?: string; seconds?: number }
  idle: { mode: IdleMode; color?: string; rainbowMs?: number; breathMs?: number }
  brightness: number
}

const CFG_PATH = path.join(process.cwd(), "data", "lighting-config.json")

export async function readLightingConfig(): Promise<LightingConfig> {
  try {
    const raw = await fs.readFile(CFG_PATH, "utf8")
    return JSON.parse(raw)
  } catch {
    return {
      preparation: { blinking: true, color: "#FF0000" },
      finished: { color: "#00FF00", seconds: 3 },
      idle: { mode: "rainbow", rainbowMs: 30 },
      brightness: 64,
    }
  }
}

export async function writeLightingConfig(cfg: LightingConfig): Promise<void> {
  await fs.mkdir(path.dirname(CFG_PATH), { recursive: true })
  await fs.writeFile(CFG_PATH, JSON.stringify(cfg, null, 2), "utf8")
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  const n = Number.parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
