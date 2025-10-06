export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import type { Cocktail } from "@/types/cocktail"

export async function GET() {
  try {
    console.log("[v0] API: Loading cocktails dynamically...")

    const cocktailsPath = path.join(process.cwd(), "data", "cocktails.json")

    if (!fs.existsSync(cocktailsPath)) {
      console.log("[v0] cocktails.json nicht gefunden")
      return NextResponse.json([])
    }

    const data = fs.readFileSync(cocktailsPath, "utf-8")
    const cocktails: Cocktail[] = JSON.parse(data)

    console.log("[v0] API: Loaded cocktails:", cocktails?.length || 0)
    return NextResponse.json(Array.isArray(cocktails) ? cocktails : [])
  } catch (error) {
    console.error("[v0] API: Error getting cocktails:", error)
    return NextResponse.json([], { status: 500 })
  }
}
