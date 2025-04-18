import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

// Pfad zum Python-Skript
const PYTHON_SCRIPT = "scripts/gpio_controller.py"

export function setupGPIO() {
  // Initialisiere die GPIO-Pins
  console.log("GPIO-Pins werden initialisiert")
  // Keine spezielle Initialisierung erforderlich, da das Python-Skript die Pins bei Bedarf konfiguriert
}

export async function setPinHigh(pin: number) {
  // Setze den Pin auf HIGH (3.3V) für eine sehr kurze Zeit (100ms)
  // Dies ist nur ein Test, um zu prüfen, ob der Pin funktioniert
  try {
    console.log(`Setze Pin ${pin} auf HIGH`)
    await execAsync(`python3 ${PYTHON_SCRIPT} activate ${pin} 100`)
  } catch (error) {
    console.error(`Fehler beim Setzen von Pin ${pin} auf HIGH:`, error)
    throw error
  }
}

export async function setPinLow(pin: number) {
  // Setze den Pin auf LOW (0V)
  // In unserem Fall wird der Pin automatisch auf LOW gesetzt, nachdem die Zeit abgelaufen ist
  console.log(`Pin ${pin} wurde bereits auf LOW gesetzt`)
}

export async function activatePinForDuration(pin: number, durationMs: number) {
  // Aktiviere den Pin für die angegebene Dauer
  try {
    console.log(`Aktiviere Pin ${pin} für ${durationMs}ms`)
    const { stdout } = await execAsync(`python3 ${PYTHON_SCRIPT} activate ${pin} ${durationMs}`)
    return JSON.parse(stdout)
  } catch (error) {
    console.error(`Fehler beim Aktivieren von Pin ${pin}:`, error)
    throw error
  }
}

export function cleanupGPIO() {
  // Bereinige die GPIO-Pins
  console.log("GPIO-Pins werden bereinigt")
  try {
    exec(`python3 ${PYTHON_SCRIPT} cleanup`)
  } catch (error) {
    console.error("Fehler beim Bereinigen der GPIO-Pins:", error)
  }
}
