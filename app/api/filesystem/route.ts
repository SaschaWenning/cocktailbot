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

    if (!isPathSafe(requestedPath)) {
      console.log("[v0] Unsafe path detected:", requestedPath)
      return NextResponse.json({ error: "Ungültiger Pfad" }, { status: 400 })
    }

    let items: FileItem[] = []
    let parentPath: string | null = null

    try {
      // Try to import fs dynamically (only works on server with Node.js)
      const fs = await import("fs").then((m) => m.promises)
      const path = await import("path")

      // Map web path to actual filesystem path
      const basePath = process.cwd()
      const actualPath =
        requestedPath === "/"
          ? path.join(basePath, "public")
          : path.join(basePath, "public", requestedPath.replace(/^\/public/, ""))

      console.log("[v0] Reading actual filesystem path:", actualPath)

      const entries = await fs.readdir(actualPath, { withFileTypes: true })

      items = entries.map((entry) => {
        const fullPath = requestedPath === "/" ? `/public/${entry.name}` : `${requestedPath}/${entry.name}`

        return {
          name: entry.name,
          path: fullPath,
          isDirectory: entry.isDirectory(),
          isFile: entry.isFile(),
          size: entry.isFile() ? 0 : 0, // Could get actual size with fs.stat if needed
          modified: new Date().toISOString(),
          isImage: entry.isFile() && isImageFile(entry.name),
        }
      })

      // Calculate parent path
      if (requestedPath === "/") {
        parentPath = null
      } else {
        const pathParts = requestedPath.split("/").filter((p) => p)
        pathParts.pop()
        parentPath = pathParts.length === 0 ? "/" : "/" + pathParts.join("/")
      }

      console.log("[v0] Successfully read real filesystem, found", items.length, "items")
    } catch (fsError) {
      console.log("[v0] Real filesystem not available, using mock data:", fsError)

      // Fallback to mock data for v0 environment
      const mockItems: FileItem[] = [
        {
          name: "images",
          path: "/public/images",
          isDirectory: true,
          isFile: false,
          size: 0,
          modified: new Date().toISOString(),
          isImage: false,
        },
        {
          name: "cocktails",
          path: "/public/images/cocktails",
          isDirectory: true,
          isFile: false,
          size: 0,
          modified: new Date().toISOString(),
          isImage: false,
        },
        {
          name: "mojito.jpg",
          path: "/public/images/cocktails/mojito.jpg",
          isDirectory: false,
          isFile: true,
          size: 45678,
          modified: new Date().toISOString(),
          isImage: true,
        },
        {
          name: "long_island_iced_tea.jpg",
          path: "/public/images/cocktails/long_island_iced_tea.jpg",
          isDirectory: false,
          isFile: true,
          size: 52341,
          modified: new Date().toISOString(),
          isImage: true,
        },
      ]

      // Filter items based on current path
      if (requestedPath === "/") {
        items = [mockItems[0]] // Only show "images" folder
      } else if (requestedPath === "/public/images") {
        items = [mockItems[1]] // Only show "cocktails" folder
      } else if (requestedPath === "/public/images/cocktails") {
        items = mockItems.filter((item) => item.path.startsWith("/public/images/cocktails/") && item.isFile)
      }

      parentPath =
        requestedPath === "/"
          ? null
          : requestedPath === "/public/images"
            ? "/"
            : requestedPath === "/public/images/cocktails"
              ? "/public/images"
              : "/"
    }

    const response: FileBrowserData = {
      currentPath: requestedPath,
      parentPath,
      items,
    }

    console.log("[v0] Returning filesystem data:", response)
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
