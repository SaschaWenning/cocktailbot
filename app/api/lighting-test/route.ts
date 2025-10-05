import { type NextRequest, NextResponse } from "next/server"
import { execSync } from "child_process"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const { mode, config } = await request.json()

    console.log("[v0] Testing lighting mode:", mode, "with config:", config)

    await sendLightingTestCommand(mode, config)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error testing lighting:", error)
    return NextResponse.json({ error: "Failed to test lighting" }, { status: 500 })
  }
}

async function sendLightingTestCommand(mode: string, config: any) {
  try {
    const ledClientPath = path.join(process.cwd(), "led_client.py")

    if (config?.color) {
      const rgb = hexToRgb(config.color)
      if (rgb) {
        // Setze Helligkeit falls angegeben
        if (config.brightness !== undefined) {
          execSync(`python3 ${ledClientPath} BRIGHT ${config.brightness}`)
        }
        // Setze Test-Farbe
        execSync(`python3 ${ledClientPath} COLOR ${rgb.r} ${rgb.g} ${rgb.b}`)
        console.log(`[v0] LED Test: RGB(${rgb.r}, ${rgb.g}, ${rgb.b}) für 5 Sekunden`)

        // Nach 5 Sekunden zurück zu Idle
        setTimeout(() => {
          execSync(`python3 ${ledClientPath} IDLE`)
          console.log("[v0] LED Test beendet, zurück zu Idle")
        }, 5000)
      }
    }

    return true
  } catch (error) {
    console.error("[v0] Error sending lighting test command:", error)
    return false
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Entferne # falls vorhanden
  hex = hex.replace(/^#/, "")

  // Parse Hex-Werte
  if (hex.length === 6) {
    const r = Number.parseInt(hex.substring(0, 2), 16)
    const g = Number.parseInt(hex.substring(2, 4), 16)
    const b = Number.parseInt(hex.substring(4, 6), 16)
    return { r, g, b }
  }

  return null
}
