import { NextResponse } from "next/server"
import { initializeCocktailsJSON } from "@/lib/cocktail-initialization"

export async function POST() {
  try {
    console.log("[v0] API: Initializing cocktails JSON system")

    await initializeCocktailsJSON()

    return NextResponse.json({
      success: true,
      message: "Cocktails JSON system successfully initialized",
    })
  } catch (error) {
    console.error("[v0] API Error initializing cocktails:", error)
    return NextResponse.json({ success: false, error: "Failed to initialize cocktails system" }, { status: 500 })
  }
}
