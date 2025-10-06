import { type NextRequest, NextResponse } from "next/server"

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
    color: "#00ff00",
    blinking: false,
  },
  cocktailFinished: {
    color: "#0000ff",
    blinking: true,
  },
  idleMode: {
    scheme: "rainbow",
    colors: ["#ff0000", "#00ff00", "#0000ff"],
  },
}

// In-memory storage for lighting config
let storedLightingConfig: LightingConfig = defaultConfig

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

    // Send command to Raspberry Pico 2 via serial
    await sendLightingCommand("update_config", config)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error saving lighting config:", error)
    return NextResponse.json({ error: "Failed to save config" }, { status: 500 })
  }
}

async function sendLightingCommand(command: string, data?: any) {
  try {
    // This would communicate with the Raspberry Pico 2
    // For now, we'll just log the command
    console.log("[v0] Sending lighting command to Pico 2:", { command, data })

    // In a real implementation, this would use serial communication:
    // const serialPort = new SerialPort('/dev/ttyUSB0', { baudRate: 115200 })
    // serialPort.write(JSON.stringify({ command, data }))

    return true
  } catch (error) {
    console.error("[v0] Error sending lighting command:", error)
    return false
  }
}
