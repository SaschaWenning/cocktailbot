import { type NextRequest, NextResponse } from "next/server"
import { execFile } from "child_process"
import path from "path"

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

const defaultConfig: LightingConfig = {
  cocktailPreparation: {
    color: "#ff0000",
    blinking: true,
  },
  cocktailFinished: {
    color: "#00ff00",
    blinking: false,
  },
  idleMode: {
    scheme: "rainbow",
    colors: ["#ff0000", "#00ff00", "#0000ff"],
  },
}

// In-memory storage for lighting config
let storedLightingConfig: LightingConfig = defaultConfig

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

export async function GET() {
  try {
    return NextResponse.json(storedLightingConfig)
  } catch (error) {
    console.error("[v0] Error reading lighting config:", error)
    return NextResponse.json(defaultConfig, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const config: LightingConfig = await request.json()

    storedLightingConfig = config

    console.log("[v0] Saving lighting config:", config)

    // Setze den Idle-Modus basierend auf der Konfiguration
    if (config.idleMode.scheme === "rainbow") {
      await runLed("RAINBOW", "30")
    } else if (config.idleMode.scheme === "off") {
      await runLed("OFF")
    } else if (config.idleMode.scheme === "static" && config.idleMode.colors?.[0]) {
      const hex = config.idleMode.colors[0].replace("#", "")
      const r = Number.parseInt(hex.substring(0, 2), 16)
      const g = Number.parseInt(hex.substring(2, 4), 16)
      const b = Number.parseInt(hex.substring(4, 6), 16)
      await runLed("COLOR", String(r), String(g), String(b))
    } else {
      await runLed("IDLE")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error saving lighting config:", error)
    return NextResponse.json({ error: "Failed to save config", detail: String(error) }, { status: 500 })
  }
}
