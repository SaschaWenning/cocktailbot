import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export const dynamic = "force-dynamic"

const HIDDEN_COCKTAILS_FILE = path.join(process.cwd(), "data", "hidden-cocktails.json")

export async function GET() {
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(HIDDEN_COCKTAILS_FILE)
    try {
      await fs.access(dataDir)
    } catch {
      await fs.mkdir(dataDir, { recursive: true })
    }

    // Try to read existing hidden cocktails file
    try {
      const data = await fs.readFile(HIDDEN_COCKTAILS_FILE, "utf-8")
      const hiddenCocktails = JSON.parse(data)
      return NextResponse.json({ hiddenCocktails })
    } catch {
      // File doesn't exist or is invalid, return empty array
      return NextResponse.json({ hiddenCocktails: [] })
    }
  } catch (error) {
    console.error("Error reading hidden cocktails:", error)
    return NextResponse.json({ hiddenCocktails: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { hiddenCocktails } = await request.json()

    // Ensure data directory exists
    const dataDir = path.dirname(HIDDEN_COCKTAILS_FILE)
    try {
      await fs.access(dataDir)
    } catch {
      await fs.mkdir(dataDir, { recursive: true })
    }

    // Write hidden cocktails to file
    await fs.writeFile(HIDDEN_COCKTAILS_FILE, JSON.stringify(hiddenCocktails, null, 2))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving hidden cocktails:", error)
    return NextResponse.json({ error: "Failed to save hidden cocktails" }, { status: 500 })
  }
}
