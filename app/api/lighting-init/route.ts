import { NextResponse } from "next/server"
import { loadLightingConfig } from "@/lib/lighting-config"
import { execFile } from "child_process"
import path from "path"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function runLed(...args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = path.join(process.cwd(), "led_client.py")
    console.log("[v0] LED init command:", { script, args })
    execFile("python3", [script, ...args], (err, stdout, stderr) => {
      if (err) {
        console.error("[v0] LED init command failed:", { err, stdout, stderr })
        reject(err)
      } else {
        console.log("[v0] LED init command success:", { stdout, stderr })
        resolve()
      }
    })
  })
}

export async function GET() {
  try {
    console.log("[v0] Initializing lighting on app start")
    const config = await loadLightingConfig()
    console.log("[v0] Loaded lighting config:", config)

    // Apply idle mode from config (or default blue if no config)
    if (config.idleMode.scheme === "static" && config.idleMode.colors.length > 0) {
      const color = config.idleMode.colors[0]
      const rgb = await hexToRgb(color)
      if (rgb) {
        console.log("[v0] Setting static color:", rgb)
        await runLed("COLOR", String(rgb.r), String(rgb.g), String(rgb.b))
      }
    } else if (config.idleMode.scheme === "rainbow") {
      console.log("[v0] Setting rainbow mode")
      await runLed("RAINBOW", "30")
    } else if (config.idleMode.scheme === "off") {
      console.log("[v0] Turning LEDs off")
      await runLed("OFF")
    } else {
      // Default: Blue
      console.log("[v0] Setting default blue color")
      await runLed("COLOR", "0", "0", "255")
    }

    console.log("[v0] Lighting initialized successfully")
    return NextResponse.json({ success: true, config })
  } catch (error) {
    console.error("[v0] Error initializing lighting:", error)
    return NextResponse.json({ error: "Failed to initialize lighting" }, { status: 500 })
  }
}

async function hexToRgb(hex: string): Promise<{ r: number; g: number; b: number } | null> {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: Number.parseInt(result[1], 16),
        g: Number.parseInt(result[2], 16),
        b: Number.parseInt(result[3], 16),
      }
    : null
}
