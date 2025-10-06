import { type NextRequest, NextResponse } from "next/server"
import { execFile } from "child_process"
import path from "path"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function runLed(...args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = path.join(process.cwd(), "led_client.py")
    console.log("[v0] LED test command:", { script, args })
    execFile("python3", [script, ...args], (err, stdout, stderr) => {
      if (err) {
        console.error("[v0] LED test command failed:", { err, stdout, stderr })
        reject(err)
      } else {
        console.log("[v0] LED test command success:", { stdout, stderr })
        resolve()
      }
    })
  })
}

export async function POST(request: NextRequest) {
  try {
    const { mode, config } = await request.json()

    console.log("[v0] Lighting test POST request:", { mode, config })

    if (typeof (config as any)?.brightness === "number") {
      const b = Math.max(0, Math.min(255, Number((config as any).brightness)))
      await runLed("BRIGHT", String(b))
    }

    if (mode === "preparation") {
      const color = config?.cocktailPreparation?.color || "#ff0000"
      const rgb = hexToRgb(color)
      if (rgb) {
        if (config?.cocktailPreparation?.blinking) {
          await runLed("BUSY") // Red blinking
        } else {
          await runLed("COLOR", String(rgb.r), String(rgb.g), String(rgb.b))
        }
      }
    } else if (mode === "finished") {
      const color = config?.cocktailFinished?.color || "#00ff00"
      const rgb = hexToRgb(color)
      if (rgb) {
        if (config?.cocktailFinished?.blinking) {
          await runLed("READY") // Green with auto-return to idle
        } else {
          await runLed("COLOR", String(rgb.r), String(rgb.g), String(rgb.b))
        }
      }
    } else if (mode === "idle") {
      const scheme = config?.idleMode?.scheme || "rainbow"
      if (scheme === "static" && config?.idleMode?.colors?.length > 0) {
        const color = config.idleMode.colors[0]
        const rgb = hexToRgb(color)
        if (rgb) {
          await runLed("COLOR", String(rgb.r), String(rgb.g), String(rgb.b))
        }
      } else if (scheme === "rainbow") {
        await runLed("RAINBOW", "30")
      } else if (scheme === "off") {
        await runLed("OFF")
      } else {
        await runLed("IDLE")
      }
    }

    setTimeout(async () => {
      try {
        const scheme = config?.idleMode?.scheme || "rainbow"
        if (scheme === "static" && config?.idleMode?.colors?.length > 0) {
          const color = config.idleMode.colors[0]
          const rgb = hexToRgb(color)
          if (rgb) {
            await runLed("COLOR", String(rgb.r), String(rgb.g), String(rgb.b))
          }
        } else {
          await runLed("IDLE")
        }
      } catch (error) {
        console.error("[v0] Error returning to idle:", error)
      }
    }, 5000)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error testing lighting:", error)
    return NextResponse.json({ error: "Failed to test lighting" }, { status: 500 })
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: Number.parseInt(result[1], 16),
        g: Number.parseInt(result[2], 16),
        b: Number.parseInt(result[3], 16),
      }
    : null
}
