import { type NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export const dynamic = "force-dynamic"

function isPathSafe(requestedPath: string): boolean {
  const normalizedPath = path.normalize(requestedPath)
  return !normalizedPath.includes("..")
}

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  const mimeTypes: { [key: string]: string } = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".bmp": "image/bmp",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
  }
  return mimeTypes[ext] || "application/octet-stream"
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const imagePath = searchParams.get("path")

    if (!imagePath) {
      return NextResponse.json({ error: "Bildpfad ist erforderlich" }, { status: 400 })
    }

    if (!isPathSafe(imagePath)) {
      return NextResponse.json({ error: "Ungültiger Pfad" }, { status: 400 })
    }

    if (!fs.existsSync(imagePath)) {
      return NextResponse.json({ error: "Bild nicht gefunden" }, { status: 404 })
    }

    const stats = fs.statSync(imagePath)
    if (!stats.isFile()) {
      return NextResponse.json({ error: "Pfad ist keine Datei" }, { status: 400 })
    }

    // Lese die Bilddatei
    const imageBuffer = fs.readFileSync(imagePath)
    const mimeType = getMimeType(imagePath)

    // Erstelle Response mit korrekten Headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": imageBuffer.length.toString(),
        "Cache-Control": "public, max-age=3600", // 1 Stunde Cache
      },
    })
  } catch (error) {
    console.error("Image API Error:", error)
    return NextResponse.json({ error: "Fehler beim Laden des Bildes" }, { status: 500 })
  }
}
