import { type NextRequest, NextResponse } from "next/server"

function isPathSafe(requestedPath: string): boolean {
  return !requestedPath.includes("..") && requestedPath.startsWith("/")
}

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Image API called")
    const { searchParams } = new URL(request.url)
    const imagePath = searchParams.get("path")

    console.log("[v0] Requested image path:", imagePath)

    if (!imagePath) {
      return NextResponse.json({ error: "Bildpfad ist erforderlich" }, { status: 400 })
    }

    if (!isPathSafe(imagePath)) {
      return NextResponse.json({ error: "Ungültiger Pfad" }, { status: 400 })
    }

    // Convert absolute paths to relative public paths
    let publicPath = imagePath
    if (imagePath.startsWith("/public/")) {
      publicPath = imagePath.substring(7) // Remove "/public" prefix
    }

    console.log("[v0] Redirecting to public path:", publicPath)

    // Redirect to the actual image in the public folder
    return NextResponse.redirect(new URL(publicPath, request.url))
  } catch (error) {
    console.error("[v0] Image API Error:", error)
    return NextResponse.json(
      {
        error: "Fehler beim Laden des Bildes",
        details: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      { status: 500 },
    )
  }
}
