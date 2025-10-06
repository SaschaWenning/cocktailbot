import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { mode, color, blinking } = await request.json()

    console.log("[v0] Setting lighting mode:", { mode, color, blinking })

    // Send lighting control command to Raspberry Pico 2
    await sendLightingControlCommand(mode, color, blinking)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error controlling lighting:", error)
    return NextResponse.json({ error: "Failed to control lighting" }, { status: 500 })
  }
}

async function sendLightingControlCommand(mode: string, color?: string, blinking?: boolean) {
  try {
    const command = {
      command: "set_lighting",
      mode,
      color,
      blinking,
      timestamp: Date.now(),
    }

    console.log("[v0] Sending lighting control command to Pico 2:", command)

    // In a real implementation:
    // const serialPort = new SerialPort('/dev/ttyUSB0', { baudRate: 115200 })
    // serialPort.write(JSON.stringify(command))

    return true
  } catch (error) {
    console.error("[v0] Error sending lighting control command:", error)
    return false
  }
}
