import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

interface FileItem {
  name: string
  path: string
  isDirectory: boolean
  isFile: boolean
  size: number
  modified: string
  isImage: boolean
}

interface FileBrowserData {
  currentPath: string
  parentPath: string | null
  items: FileItem[]
}

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg"]

function isImageFile(filename: string): boolean {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf("."))
  return IMAGE_EXTENSIONS.includes(ext)
}

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Filesystem API called")
    const { searchParams } = new URL(request.url)
    const requestedPath = searchParams.get("path") || "/"

    console.log("[v0] Requested path:", requestedPath)

    if (requestedPath.includes("..")) {
      console.log("[v0] Unsafe path detected:", requestedPath)
      return NextResponse.json({ error: "Ungültiger Pfad" }, { status: 400 })
    }

    let items: FileItem[] = []
    let parentPath: string | null = null

    try {
      if (typeof process !== "undefined" && process.versions && process.versions.node) {
        console.log("[v0] Node.js environment detected")

        const fs = require("fs").promises
        const path = require("path")

        let actualPath: string
        if (requestedPath === "/") {
          actualPath = path.join(process.cwd(), "public")
        } else {
          actualPath = path.join(process.cwd(), "public", requestedPath.substring(1))
        }

        console.log("[v0] Reading directory:", actualPath)

        const entries = await fs.readdir(actualPath, { withFileTypes: true })
        console.log("[v0] Found", entries.length, "entries")

        items = await Promise.all(
          entries.map(async (entry) => {
            const webPath = requestedPath === "/" ? `/${entry.name}` : `${requestedPath}/${entry.name}`

            let size = 0
            let modified = new Date().toISOString()

            if (entry.isFile()) {
              try {
                const entryPath = path.join(actualPath, entry.name)
                const entryStats = await fs.stat(entryPath)
                size = entryStats.size
                modified = entryStats.mtime.toISOString()
              } catch (error) {
                console.log("[v0] Could not get stats for", entry.name)
              }
            }

            return {
              name: entry.name,
              path: webPath,
              isDirectory: entry.isDirectory(),
              isFile: entry.isFile(),
              size,
              modified,
              isImage: entry.isFile() && isImageFile(entry.name),
            }
          }),
        )

        if (requestedPath === "/") {
          parentPath = null
        } else {
          const pathParts = requestedPath.split("/").filter((p) => p)
          pathParts.pop()
          parentPath = pathParts.length === 0 ? "/" : "/" + pathParts.join("/")
        }

        console.log("[v0] Successfully read filesystem, found", items.length, "items")
      } else {
        throw new Error("Not in Node.js environment")
      }
    } catch (fsError) {
      console.log("[v0] Filesystem reading failed, using fallback")

      const mockData = {
        "/": [
          { name: "images", isDir: true },
          { name: "placeholder.svg", isDir: false },
          { name: "malibu_sunrise.jpg", isDir: false },
          { name: "solero.jpg", isDir: false },
          { name: "big_john.jpg", isDir: false },
        ],
        "/images": [{ name: "cocktails", isDir: true }],
        "/images/cocktails": [
          { name: "mojito.jpg", isDir: false },
          { name: "malibu_sunrise.jpg", isDir: false },
          { name: "malibu_ananas.jpg", isDir: false },
          { name: "long_island_iced_tea.jpg", isDir: false },
        ],
      }

      const mockItems = mockData[requestedPath as keyof typeof mockData] || []

      items = mockItems.map((item) => ({
        name: item.name,
        path: requestedPath === "/" ? `/${item.name}` : `${requestedPath}/${item.name}`,
        isDirectory: item.isDir,
        isFile: !item.isDir,
        size: item.isDir ? 0 : 50000,
        modified: new Date().toISOString(),
        isImage: !item.isDir && isImageFile(item.name),
      }))

      if (requestedPath === "/") {
        parentPath = null
      } else {
        const pathParts = requestedPath.split("/").filter((p) => p)
        pathParts.pop()
        parentPath = pathParts.length === 0 ? "/" : "/" + pathParts.join("/")
      }
    }

    const response: FileBrowserData = {
      currentPath: requestedPath,
      parentPath,
      items,
    }

    console.log("[v0] Returning", items.length, "items for path:", requestedPath)
    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] Filesystem API Error:", error)
    return NextResponse.json({ error: "Fehler beim Lesen des Verzeichnisses" }, { status: 500 })
  }
}
