import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

// Pfad zum Python-Skript
const PYTHON_SCRIPT = "scripts/gpio_controller.py"

// Hilfsfunktion zum Ausführen des Python-Skripts
async function runPythonScript(command: string, args: string[] = []): Promise<any> {
  try {
    const cmdArgs = [command, ...args].join(" ")
    console.log(`Führe Python-Skript aus: python3 ${PYTHON_SCRIPT} ${cmdArgs}`)

    const { stdout } = await execAsync(`python3 ${PYTHON_SCRIPT} ${cmdArgs}`)
    return JSON.parse(stdout)
  } catch (error) {
    console.error(`Fehler beim Ausführen des Python-Skripts:`, error)
    throw error
  }
}

// API-Route für die GPIO-Steuerung
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { action, pin, duration } = data

    let result

    switch (action) {
      case "setup":
        result = await runPythonScript("setup")
        break
      case "activate":
        if (!pin || !duration) {
          return NextResponse.json({ success: false, error: "Pin und Dauer sind erforderlich" }, { status: 400 })
        }
        result = await runPythonScript("activate", [pin.toString(), duration.toString()])
        break
      case "cleanup":
        result = await runPythonScript("cleanup")
        break
      default:
        return NextResponse.json({ success: false, error: "Ungültige Aktion" }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Fehler in der GPIO API-Route:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unbekannter Fehler" },
      { status: 500 },
    )
  }
}
