import { type NextRequest, NextResponse } from "next/server"
import { deleteCocktailFromJSON } from "@/lib/cocktail-initialization"

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cocktailId = searchParams.get("id")

    if (!cocktailId) {
      return NextResponse.json({ success: false, error: "Cocktail ID is required" }, { status: 400 })
    }

    console.log(`[v0] API: Deleting cocktail ${cocktailId}`)

    // Delete the cocktail from the JSON file
    await deleteCocktailFromJSON(cocktailId)

    return NextResponse.json({
      success: true,
      message: `Cocktail ${cocktailId} successfully deleted`,
    })
  } catch (error) {
    console.error("[v0] API Error deleting cocktail:", error)
    return NextResponse.json({ success: false, error: "Failed to delete cocktail" }, { status: 500 })
  }
}
