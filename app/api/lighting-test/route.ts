import { type NextRequest, NextResponse } from "next/server"
import { execFile } from "child_process"
import path from "path"

function runLed(...args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = path.join(process.cwd(), "led_client.py")
    execFile("python3", [script, ...args], (err, stdout, stderr) => {
      if (err) {
        console.error("[v0] LED command error:", stderr || stdout || err)
        return reject(new Error(String(stderr || stdout || err)))
      }
      console.log("[v0] LED command success:", args.join(" "))
      resolve()
    })
  })
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  hex = hex.replace(/^#/, "")
  if (hex.length === 6) {
    const r = Number.parseInt(hex.substring(0, 2), 16)
    const g = Number.parseInt(hex.substring(2, 4), 16)
    const b = Number.parseInt(hex.substring(4, 6), 16)
    return { r, g, b }
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const { mode, config } = await request.json()

    console.log("[v0] Testing lighting mode:", mode, "with config:", config)

    let testColor = "#ffffff"
    let testBlinking = false

    if (mode === "preparation" && config?.cocktailPreparation) {
      testColor = config.cocktailPreparation.color
      testBlinking = config.cocktailPreparation.blinking
    } else if (mode === "finished" && config?.cocktailFinished) {
      testColor = config.cocktailFinished.color
      testBlinking = config.cocktailFinished.blinking
    } else if (mode === "idle" && config?.idleMode) {
      // Idle-Modus: Verwende das Schema
      if (config.idleMode.scheme === "rainbow") {
        await runLed("RAINBOW", "30")
        return NextResponse.json({ success: true })
      } else if (config.idleMode.scheme === "off") {
        await runLed("OFF")
        return NextResponse.json({ success: true })
      } else if (config.idleMode.scheme === "static" && config.idleMode.colors?.[0]) {
        testColor = config.idleMode.colors[0]
        testBlinking = false
      } else {
        await runLed("IDLE")
        return NextResponse.json({ success: true })
      }
    }

    const rgb = hexToRgb(testColor)
    if (rgb) {
      if (testBlinking) {
        // Für blinkende Tests verwende BUSY (rot blinkend) oder eine benutzerdefinierte Farbe
        if (mode === "preparation") {
          await runLed("BUSY")
        } else {
          // Für andere Modi: Farbe setzen und dann READY (blinkt kurz)
          await runLed("COLOR", String(rgb.r), String(rgb.g), String(rgb.b))
        }
      } else {
        // Statische Farbe
        await runLed("COLOR", String(rgb.r), String(rgb.g), String(rgb.b))
      }
      console.log(`[v0] LED Test: RGB(${rgb.r}, ${rgb.g}, ${rgb.b}), blinking: ${testBlinking}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error testing lighting:", error)
    return NextResponse.json({ error: "Failed to test lighting", detail: String(error) }, { status: 500 })
  }
}
