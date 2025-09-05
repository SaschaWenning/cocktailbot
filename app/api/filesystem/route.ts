import { type NextRequest, NextResponse } from "next/server"

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

    const mockItems: FileItem[] = [
      {
        name: "public",
        path: "/public",
        isDirectory: true,
        isFile: false,
        size: 0,
        modified: new Date().toISOString(),
        isImage: false,
      },
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
    let filteredItems = mockItems
    if (requestedPath === "/") {
      filteredItems = mockItems.filter((item) => item.path === "/public")
    } else if (requestedPath === "/public") {
      filteredItems = mockItems.filter((item) => item.path === "/public/images")
    } else if (requestedPath === "/public/images") {
      filteredItems = mockItems.filter((item) => item.path === "/public/images/cocktails")
    } else if (requestedPath === "/public/images/cocktails") {
      filteredItems = mockItems.filter((item) => item.path.startsWith("/public/images/cocktails/") && item.isFile)
    }

    const parentPath =
      requestedPath === "/"
        ? null
        : requestedPath === "/public"
          ? "/"
          : requestedPath === "/public/images"
            ? "/public"
            : requestedPath === "/public/images/cocktails"
              ? "/public/images"
              : "/"

    const response: FileBrowserData = {
      currentPath: requestedPath,
      parentPath,
      items: filteredItems,
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
