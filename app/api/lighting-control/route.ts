import { type NextRequest, NextResponse } from "next/server"
import { execSync } from "child_process"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const { mode, color, brightness } = await request.json()

    console.log("[v0] Setting lighting mode:", { mode, color, brightness })

    // Sende Befehle an das Pico über led_client.py
    await sendLightingControlCommand(mode, color, brightness)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error controlling lighting:", error)
    return NextResponse.json({ error: "Failed to control lighting" }, { status: 500 })
  }
}

async function sendLightingControlCommand(mode: string, color?: string, brightness?: number) {
  try {
    const ledClientPath = path.join(process.cwd(), "led_client.py")

    switch (mode) {
      case "color":
        // Konvertiere Hex-Farbe zu RGB
        if (color) {
          const rgb = hexToRgb(color)
          if (rgb) {
            // Setze Helligkeit falls angegeben
            if (brightness !== undefined) {
              execSync(`python3 ${ledClientPath} BRIGHT ${brightness}`)
            }
            // Setze Farbe
            execSync(`python3 ${ledClientPath} COLOR ${rgb.r} ${rgb.g} ${rgb.b}`)
            console.log(`[v0] LED Farbe gesetzt: RGB(${rgb.r}, ${rgb.g}, ${rgb.b})`)
          }
        }
        break

      case "preparation":
        // Während der Zubereitung - z.B. blaues Licht
        execSync(`python3 ${ledClientPath} COLOR 0 0 255`)
        console.log("[v0] LED Modus: Zubereitung (Blau)")
        break

      case "cocktailFinished":
      case "finished":
        // Cocktail fertig - grünes Licht mit Auto-Rückkehr zu Idle
        execSync(`python3 ${ledClientPath} READY`)
        console.log("[v0] LED Modus: Fertig (Grün → Idle)")
        break

      case "idle":
        // Idle-Modus
        execSync(`python3 ${ledClientPath} IDLE`)
        console.log("[v0] LED Modus: Idle")
        break

      default:
        console.warn(`[v0] Unbekannter LED-Modus: ${mode}`)
    }

    return true
  } catch (error) {
    console.error("[v0] Error sending lighting control command:", error)
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
