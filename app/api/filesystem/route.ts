import { type NextRequest, NextResponse } from "next/server"
import { readdir, stat } from "fs/promises"
import { join } from "path"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get("path") || "/"

    // Sicherheitscheck: Nur bestimmte Pfade erlauben
    const allowedBasePaths = [
      "/",
      "/home",
      "/media",
      "/mnt",
      "/opt",
      "/var/www",
      process.cwd(), // Das aktuelle Projektverzeichnis
    ]

    // Normalisiere den Pfad
    const normalizedPath = path === "/" ? "/" : path

    try {
      const items = await readdir(normalizedPath)
      const itemsWithStats = await Promise.all(
        items.map(async (item) => {
          try {
            const itemPath = join(normalizedPath, item)
            const stats = await stat(itemPath)

            return {
              name: item,
              path: itemPath,
              isDirectory: stats.isDirectory(),
              isFile: stats.isFile(),
              size: stats.size,
              modified: stats.mtime.toISOString(),
              // Prüfe ob es ein Bild ist
              isImage: stats.isFile() && /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(item),
            }
          } catch (error) {
            // Wenn wir keine Berechtigung haben, überspringe das Element
            return null
          }
        }),
      )

      // Filtere null-Werte heraus und sortiere: Ordner zuerst, dann Dateien
      const validItems = itemsWithStats
        .filter((item) => item !== null)
        .sort((a, b) => {
          if (a!.isDirectory && !b!.isDirectory) return -1
          if (!a!.isDirectory && b!.isDirectory) return 1
          return a!.name.localeCompare(b!.name)
        })

      // Füge Parent-Directory hinzu, wenn wir nicht im Root sind
      const result = {
        currentPath: normalizedPath,
        parentPath: normalizedPath === "/" ? null : join(normalizedPath, ".."),
        items: validItems,
      }

      return NextResponse.json(result)
    } catch (error) {
      console.error("Error reading directory:", error)
      return NextResponse.json({ error: "Zugriff verweigert oder Ordner nicht gefunden" }, { status: 403 })
    }
  } catch (error) {
    console.error("Filesystem API error:", error)
    return NextResponse.json({ error: "Interner Server-Fehler" }, { status: 500 })
  }
}
