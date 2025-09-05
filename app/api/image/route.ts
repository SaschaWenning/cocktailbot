import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

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

    let publicPath = imagePath

    // Handle absolute filesystem paths from Raspberry Pi
    if (imagePath.includes("/home/pi/cocktailbot/cocktailbot-main/public/")) {
      publicPath = imagePath.split("/home/pi/cocktailbot/cocktailbot-main/public")[1]
    }
    // Handle relative paths starting with /public/
    else if (imagePath.startsWith("/public/")) {
      publicPath = imagePath.substring(7) // Remove "/public" prefix
    }
    // Ensure path starts with /
    if (!publicPath.startsWith("/")) {
      publicPath = "/" + publicPath
    }

    console.log("[v0] Converted to public path:", publicPath)

    if (!isPathSafe(publicPath)) {
      return NextResponse.json({ error: "Ungültiger Pfad" }, { status: 400 })
    }

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
