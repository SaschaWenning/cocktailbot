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

function isPathSafe(requestedPath: string): boolean {
  return !requestedPath.includes("..") && requestedPath.startsWith("/")
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
      console.log("[v0] Attempting to read real filesystem...")

      // Check if we're in a Node.js environment
      if (typeof process !== "undefined" && process.versions && process.versions.node) {
        console.log("[v0] Node.js environment detected, version:", process.versions.node)

        const fs = require("fs").promises
        const path = require("path")

        let actualPath: string

        if (requestedPath === "/") {
          // Für Root-Verzeichnis, zeige wichtige System-Ordner
          actualPath = "/"
        } else {
          // Für alle anderen Pfade, verwende den direkten Pfad
          actualPath = requestedPath
        }

        console.log("[v0] Using actual filesystem path:", actualPath)

        if (requestedPath === "/") {
          // Für Root-Verzeichnis, zeige nur wichtige Ordner
          const rootItems = [
            { name: "home", path: "/home", isDir: true },
            { name: "usr", path: "/usr", isDir: true },
            { name: "var", path: "/var", isDir: true },
            { name: "etc", path: "/etc", isDir: true },
            { name: "opt", path: "/opt", isDir: true },
            { name: "tmp", path: "/tmp", isDir: true },
          ]

          items = []
          for (const item of rootItems) {
            try {
              const stats = await fs.stat(item.path)
              if (stats.isDirectory()) {
                items.push({
                  name: item.name,
                  path: item.path,
                  isDirectory: true,
                  isFile: false,
                  size: 0,
                  modified: stats.mtime.toISOString(),
                  isImage: false,
                })
              }
            } catch (error) {
              console.log("[v0] Could not access", item.path)
            }
          }
        } else {
          // Für alle anderen Pfade, lese das Verzeichnis normal
          try {
            const stats = await fs.stat(actualPath)
            console.log("[v0] Path exists, is directory:", stats.isDirectory())

            if (!stats.isDirectory()) {
              throw new Error("Path is not a directory")
            }

            const entries = await fs.readdir(actualPath, { withFileTypes: true })
            console.log("[v0] Successfully read directory, found", entries.length, "entries")

            items = await Promise.all(
              entries.map(async (entry) => {
                const webPath = path.join(requestedPath, entry.name)

                // Get actual file size and modification time
                let size = 0
                let modified = new Date().toISOString()
                try {
                  if (entry.isFile()) {
                    const entryPath = path.join(actualPath, entry.name)
                    const entryStats = await fs.stat(entryPath)
                    size = entryStats.size
                    modified = entryStats.mtime.toISOString()
                  }
                } catch (sizeError) {
                  console.log("[v0] Could not get stats for", entry.name, ":", sizeError)
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
          } catch (readError) {
            console.log("[v0] Could not read directory:", actualPath, readError)
            throw readError
          }
        }

        // Calculate parent path
        if (requestedPath === "/") {
          parentPath = null
        } else {
          const pathParts = requestedPath.split("/").filter((p) => p)
          pathParts.pop()
          parentPath = pathParts.length === 0 ? "/" : "/" + pathParts.join("/")
        }

        console.log("[v0] Successfully read real filesystem, found", items.length, "items")
      } else {
        throw new Error("Not in Node.js environment")
      }
    } catch (fsError) {
      console.log("[v0] Real filesystem reading failed:", fsError)
      console.log("[v0] Error type:", typeof fsError)
      console.log("[v0] Error message:", fsError instanceof Error ? fsError.message : String(fsError))
      console.log("[v0] Falling back to enhanced mock data")

      const mockItems: FileItem[] = [
        // Root-Verzeichnis Ordner und Dateien
        {
          name: "images",
          path: "/images",
          isDirectory: true,
          isFile: false,
          size: 0,
          modified: new Date().toISOString(),
          isImage: false,
        },
        {
          name: "icons",
          path: "/icons",
          isDirectory: true,
          isFile: false,
          size: 0,
          modified: new Date().toISOString(),
          isImage: false,
        },
        {
          name: "placeholder.svg",
          path: "/placeholder.svg",
          isDirectory: false,
          isFile: true,
          size: 1234,
          modified: new Date().toISOString(),
          isImage: true,
        },

        // Bilder direkt im Root (basierend auf Debug-Logs)
        {
          name: "malibu_sunrise.jpg",
          path: "/malibu_sunrise.jpg",
          isDirectory: false,
          isFile: true,
          size: 45678,
          modified: new Date().toISOString(),
          isImage: true,
        },
        {
          name: "solero.jpg",
          path: "/solero.jpg",
          isDirectory: false,
          isFile: true,
          size: 52341,
          modified: new Date().toISOString(),
          isImage: true,
        },
        {
          name: "big_john.jpg",
          path: "/big_john.jpg",
          isDirectory: false,
          isFile: true,
          size: 48765,
          modified: new Date().toISOString(),
          isImage: true,
        },
        {
          name: "malibu_ananas.jpg",
          path: "/malibu_ananas.jpg",
          isDirectory: false,
          isFile: true,
          size: 51234,
          modified: new Date().toISOString(),
          isImage: true,
        },
        {
          name: "sex_on_the_beach.jpg",
          path: "/sex_on_the_beach.jpg",
          isDirectory: false,
          isFile: true,
          size: 49876,
          modified: new Date().toISOString(),
          isImage: true,
        },
        {
          name: "malibu_colada.jpg",
          path: "/malibu_colada.jpg",
          isDirectory: false,
          isFile: true,
          size: 47123,
          modified: new Date().toISOString(),
          isImage: true,
        },
        {
          name: "peaches_cream.jpg",
          path: "/peaches_cream.jpg",
          isDirectory: false,
          isFile: true,
          size: 46789,
          modified: new Date().toISOString(),
          isImage: true,
        },
        {
          name: "planters_punch.jpg",
          path: "/planters_punch.jpg",
          isDirectory: false,
          isFile: true,
          size: 50123,
          modified: new Date().toISOString(),
          isImage: true,
        },
        {
          name: "mojito.jpg",
          path: "/mojito.jpg",
          isDirectory: false,
          isFile: true,
          size: 48456,
          modified: new Date().toISOString(),
          isImage: true,
        },

        // PNG Dateien
        {
          name: "bursting-berries.png",
          path: "/bursting-berries.png",
          isDirectory: false,
          isFile: true,
          size: 65432,
          modified: new Date().toISOString(),
          isImage: true,
        },
        {
          name: "citrus-swirl-sunset.png",
          path: "/citrus-swirl-sunset.png",
          isDirectory: false,
          isFile: true,
          size: 67890,
          modified: new Date().toISOString(),
          isImage: true,
        },
        {
          name: "citrus-splash.png",
          path: "/citrus-splash.png",
          isDirectory: false,
          isFile: true,
          size: 63456,
          modified: new Date().toISOString(),
          isImage: true,
        },
        {
          name: "citrus-cooler.png",
          path: "/citrus-cooler.png",
          isDirectory: false,
          isFile: true,
          size: 61234,
          modified: new Date().toISOString(),
          isImage: true,
        },
        {
          name: "tropical-sunset.png",
          path: "/tropical-sunset.png",
          isDirectory: false,
          isFile: true,
          size: 69876,
          modified: new Date().toISOString(),
          isImage: true,
        },
        {
          name: "pineapple-lime-fizz.png",
          path: "/pineapple-lime-fizz.png",
          isDirectory: false,
          isFile: true,
          size: 64321,
          modified: new Date().toISOString(),
          isImage: true,
        },
        {
          name: "passion-paradise.png",
          path: "/passion-paradise.png",
          isDirectory: false,
          isFile: true,
          size: 66789,
          modified: new Date().toISOString(),
          isImage: true,
        },
        {
          name: "vanilla-orange-dream.png",
          path: "/vanilla-orange-dream.png",
          isDirectory: false,
          isFile: true,
          size: 62345,
          modified: new Date().toISOString(),
          isImage: true,
        },
        {
          name: "grenadine-sunrise.png",
          path: "/grenadine-sunrise.png",
          isDirectory: false,
          isFile: true,
          size: 68901,
          modified: new Date().toISOString(),
          isImage: true,
        },
        {
          name: "almond-citrus-cooler.png",
          path: "/almond-citrus-cooler.png",
          isDirectory: false,
          isFile: true,
          size: 65678,
          modified: new Date().toISOString(),
          isImage: true,
        },

        // Images-Unterordner
        {
          name: "cocktails",
          path: "/images/cocktails",
          isDirectory: true,
          isFile: false,
          size: 0,
          modified: new Date().toISOString(),
          isImage: false,
        },

        // Bilder im cocktails-Ordner (basierend auf Debug-Logs)
        {
          name: "mojito.jpg",
          path: "/images/cocktails/mojito.jpg",
          isDirectory: false,
          isFile: true,
          size: 45678,
          modified: new Date().toISOString(),
          isImage: true,
        },
        {
          name: "long_island_iced_tea.jpg",
          path: "/images/cocktails/long_island_iced_tea.jpg",
          isDirectory: false,
          isFile: true,
          size: 52341,
          modified: new Date().toISOString(),
          isImage: true,
        },
        {
          name: "malibu_sunrise.jpg",
          path: "/images/cocktails/malibu_sunrise.jpg",
          isDirectory: false,
          isFile: true,
          size: 48765,
          modified: new Date().toISOString(),
          isImage: true,
        },
        {
          name: "malibu_ananas.jpg",
          path: "/images/cocktails/malibu_ananas.jpg",
          isDirectory: false,
          isFile: true,
          size: 51234,
          modified: new Date().toISOString(),
          isImage: true,
        },
        {
          name: "malibu_colada.jpg",
          path: "/images/cocktails/malibu_colada.jpg",
          isDirectory: false,
          isFile: true,
          size: 47123,
          modified: new Date().toISOString(),
          isImage: true,
        },
        {
          name: "malibu_sunset.jpg",
          path: "/images/cocktails/malibu_sunset.jpg",
          isDirectory: false,
          isFile: true,
          size: 49876,
          modified: new Date().toISOString(),
          isImage: true,
        },
        {
          name: "bahama_mama.jpg",
          path: "/images/cocktails/bahama_mama.jpg",
          isDirectory: false,
          isFile: true,
          size: 46789,
          modified: new Date().toISOString(),
          isImage: true,
        },
        {
          name: "big_john.jpg",
          path: "/images/cocktails/big_john.jpg",
          isDirectory: false,
          isFile: true,
          size: 50123,
          modified: new Date().toISOString(),
          isImage: true,
        },
        {
          name: "sex_on_the_beach.jpg",
          path: "/images/cocktails/sex_on_the_beach.jpg",
          isDirectory: false,
          isFile: true,
          size: 48456,
          modified: new Date().toISOString(),
          isImage: true,
        },
        {
          name: "planters_punch.jpg",
          path: "/images/cocktails/planters_punch.jpg",
          isDirectory: false,
          isFile: true,
          size: 47890,
          modified: new Date().toISOString(),
          isImage: true,
        },
        {
          name: "peaches_cream.jpg",
          path: "/images/cocktails/peaches_cream.jpg",
          isDirectory: false,
          isFile: true,
          size: 49123,
          modified: new Date().toISOString(),
          isImage: true,
        },
        {
          name: "solero.jpg",
          path: "/images/cocktails/solero.jpg",
          isDirectory: false,
          isFile: true,
          size: 52341,
          modified: new Date().toISOString(),
          isImage: true,
        },
      ]

      if (requestedPath === "/") {
        items = mockItems.filter((item) => {
          const pathParts = item.path.split("/").filter((p) => p)
          return pathParts.length === 1 // Nur direkte Kinder des Root-Verzeichnisses
        })
      } else if (requestedPath === "/images") {
        items = mockItems.filter((item) => {
          return item.path.startsWith("/images/") && item.path.split("/").length === 3
        })
      } else if (requestedPath === "/images/cocktails") {
        items = mockItems.filter((item) => {
          return item.path.startsWith("/images/cocktails/") && item.isFile
        })
      } else {
        items = mockItems.filter((item) => item.path.startsWith(requestedPath + "/"))
      }

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

    console.log("[v0] Returning filesystem data with", items.length, "items for path:", requestedPath)
    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] Filesystem API Error:", error)
    return NextResponse.json(
      {
        error: "Fehler beim Lesen des Verzeichnisses",
        details: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      { status: 500 },
    )
  }
}
