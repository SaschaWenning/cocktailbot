// Lighting control -> forwards commands to Pico via led_client.py (serial)
import { type NextRequest, NextResponse } from "next/server"
import { execFile } from "child_process"
import path from "path"

function runLed(...args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const script = path.join(process.cwd(), "led_client.py")
    execFile("python3", [script, ...args], (err, stdout, stderr) => {
      if (err) {
        return reject(new Error((stderr && stderr.toString()) || (stdout && stdout.toString()) || String(err)))
      }
      resolve()
    })
  })
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "")
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error("Invalid hex color")
  const n = Number.parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const
}

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const {
      mode,
      color,
      blinking,
      brightness,
    }: {
      mode: "cocktailPreparation" | "cocktailFinished" | "idle" | "off" | "color"
      color?: string // #RRGGBB
      blinking?: boolean
      brightness?: number // 0..255
    } = await req.json()

    if (typeof brightness === "number" && brightness >= 0 && brightness <= 255) {
      await runLed("BRIGHT", String(Math.round(brightness)))
    }

    if (mode === "off") {
      await runLed("OFF")
    } else if (mode === "idle") {
      await runLed("RAINBOW", "30")
    } else if (mode === "color") {
      if (!color) throw new Error("color mode requires 'color'")
      const [r, g, b] = hexToRgb(color)
      await runLed("COLOR", String(r), String(g), String(b))
    } else if (mode === "cocktailPreparation") {
      if (blinking) {
        await runLed("BUSY")
      } else if (color) {
        const [r, g, b] = hexToRgb(color)
        await runLed("COLOR", String(r), String(g), String(b))
      } else {
        await runLed("BUSY")
      }
    } else if (mode === "cocktailFinished") {
      if (color) {
        const [r, g, b] = hexToRgb(color)
        await runLed("COLOR", String(r), String(g), String(b))
      }
      await runLed("READY")
    } else {
      await runLed("RAINBOW", "30")
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[lighting-control] error:", error)
    return NextResponse.json(
      { error: "Failed to control lighting", detail: String(error?.message || error) },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    await runLed("RAINBOW", "15")
    return NextResponse.json({ success: true, sent: "RAINBOW 15" })
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
