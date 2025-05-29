"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Folder, File, ChevronLeft, ChevronRight } from "lucide-react"

interface FileBrowserProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (path: string) => void
  baseDir?: string
  fileTypes?: string[]
}

// Simulierte Ordnerstruktur für die Vorschau
const fileSystem = {
  public: {
    type: "directory",
    children: {
      images: {
        type: "directory",
        children: {
          cocktails: {
            type: "directory",
            children: {
              "bahama_mama.jpg": { type: "file", mimeType: "image/jpeg" },
              "big_john.jpg": { type: "file", mimeType: "image/jpeg" },
              "long_island_iced_tea.jpg": { type: "file", mimeType: "image/jpeg" },
              "mai_tai.jpg": { type: "file", mimeType: "image/jpeg" },
              "malibu_ananas.jpg": { type: "file", mimeType: "image/jpeg" },
              "malibu_colada.jpg": { type: "file", mimeType: "image/jpeg" },
              "malibu_sunrise.jpg": { type: "file", mimeType: "image/jpeg" },
              "malibu_sunset.jpg": { type: "file", mimeType: "image/jpeg" },
              "mojito.jpg": { type: "file", mimeType: "image/jpeg" },
              "passion_colada.jpg": { type: "file", mimeType: "image/jpeg" },
              "peaches_cream.jpg": { type: "file", mimeType: "image/jpeg" },
              "planters_punch.jpg": { type: "file", mimeType: "image/jpeg" },
              "sex_on_the_beach.jpg": { type: "file", mimeType: "image/jpeg" },
              "solero.jpg": { type: "file", mimeType: "image/jpeg" },
              "swimming_pool.jpg": { type: "file", mimeType: "image/jpeg" },
              "tequila_sunrise.jpg": { type: "file", mimeType: "image/jpeg" },
              "touch_down.jpg": { type: "file", mimeType: "image/jpeg" },
              "zombie.jpg": { type: "file", mimeType: "image/jpeg" },
            },
          },
        },
      },
      "bursting-berries.png": { type: "file", mimeType: "image/png" },
      "citrus-swirl-sunset.png": { type: "file", mimeType: "image/png" },
      "palm-glow.png": { type: "file", mimeType: "image/png" },
      "refreshing-citrus-cooler.png": { type: "file", mimeType: "image/png" },
      "tropical-blend.png": { type: "file", mimeType: "image/png" },
      "vibrant-passion-fizz.png": { type: "file", mimeType: "image/png" },
    },
  },
}

export default function FileBrowser({
  isOpen,
  onClose,
  onSelect,
  baseDir = "",
  fileTypes = ["jpg", "jpeg", "png", "gif"],
}: FileBrowserProps) {
  const [currentPath, setCurrentPath] = useState<string[]>(["public"])
  const [history, setHistory] = useState<string[][]>([["public"]])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Navigiere zu einem Unterordner
  const navigateTo = (folder: string) => {
    const newPath = [...currentPath, folder]
    setCurrentPath(newPath)

    // Aktualisiere den Verlauf
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newPath)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)

    // Zurücksetzen der Auswahl
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  // Navigiere zurück
  const goBack = () => {
    if (currentPath.length > 1) {
      const newPath = currentPath.slice(0, -1)
      setCurrentPath(newPath)
      setSelectedFile(null)
      setPreviewUrl(null)
    }
  }

  // Navigiere in der Historie
  const goBackInHistory = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setCurrentPath(history[historyIndex - 1])
      setSelectedFile(null)
      setPreviewUrl(null)
    }
  }

  const goForwardInHistory = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setCurrentPath(history[historyIndex + 1])
      setSelectedFile(null)
      setPreviewUrl(null)
    }
  }

  // Wähle eine Datei aus
  const selectFile = (file: string) => {
    const filePath = [...currentPath, file].join("/")
    setSelectedFile(filePath)

    // Erstelle eine Vorschau-URL
    setPreviewUrl(`/${filePath}`)
  }

  // Bestätige die Auswahl
  const confirmSelection = () => {
    if (selectedFile) {
      onSelect(`/${selectedFile}`)
      onClose()
    }
  }

  // Hole den aktuellen Ordnerinhalt basierend auf dem Pfad
  const getCurrentFolder = () => {
    let current: any = fileSystem

    for (const segment of currentPath) {
      if (current[segment] && current[segment].type === "directory") {
        current = current[segment].children
      } else {
        return {}
      }
    }

    return current
  }

  // Filtere nach Dateitypen
  const isValidFileType = (filename: string) => {
    const extension = filename.split(".").pop()?.toLowerCase() || ""
    return fileTypes.includes(extension)
  }

  const currentFolder = getCurrentFolder()
  const breadcrumb = currentPath.join(" / ")

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black border-[hsl(var(--cocktail-card-border))] text-white sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Datei auswählen</DialogTitle>
        </DialogHeader>

        <div className="flex items-center space-x-2 mb-4">
          <Button
            variant="outline"
            size="icon"
            onClick={goBackInHistory}
            disabled={historyIndex <= 0}
            className="bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))]"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={goForwardInHistory}
            disabled={historyIndex >= history.length - 1}
            className="bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))]"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={goBack}
            disabled={currentPath.length <= 1}
            className="bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))]"
          >
            Zurück
          </Button>
          <div className="flex-1 overflow-hidden">
            <div className="text-sm truncate bg-[hsl(var(--cocktail-card-bg))] p-2 rounded">{breadcrumb}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-[50vh] overflow-y-auto">
          {Object.entries(currentFolder).map(([name, item]: [string, any]) => {
            if (item.type === "directory") {
              return (
                <div
                  key={name}
                  onClick={() => navigateTo(name)}
                  className="flex flex-col items-center p-2 border border-[hsl(var(--cocktail-card-border))] rounded cursor-pointer hover:bg-[hsl(var(--cocktail-card-bg))]"
                >
                  <Folder className="h-12 w-12 text-[hsl(var(--cocktail-primary))]" />
                  <span className="text-xs mt-1 text-center truncate w-full">{name}</span>
                </div>
              )
            } else if (item.type === "file" && isValidFileType(name)) {
              const isImage = item.mimeType?.startsWith("image/")
              const filePath = [...currentPath, name].join("/")
              const isSelected = selectedFile === filePath

              return (
                <div
                  key={name}
                  onClick={() => selectFile(name)}
                  className={`flex flex-col items-center p-2 border rounded cursor-pointer ${
                    isSelected
                      ? "border-[hsl(var(--cocktail-primary))] bg-[hsl(var(--cocktail-primary))]/10"
                      : "border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-bg))]"
                  }`}
                >
                  {isImage ? (
                    <div className="relative h-12 w-12 bg-[hsl(var(--cocktail-card-bg))] flex items-center justify-center overflow-hidden">
                      <img
                        src={`/${filePath}`}
                        alt={name}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg?height=48&width=48"
                        }}
                      />
                    </div>
                  ) : (
                    <File className="h-12 w-12 text-[hsl(var(--cocktail-text-muted))]" />
                  )}
                  <span className="text-xs mt-1 text-center truncate w-full">{name}</span>
                </div>
              )
            }
            return null
          })}
        </div>

        {previewUrl && (
          <div className="mt-4 border border-[hsl(var(--cocktail-card-border))] rounded p-2">
            <div className="text-sm mb-2">Vorschau:</div>
            <div className="flex justify-center bg-[hsl(var(--cocktail-card-bg))] p-2 rounded">
              <img
                src={previewUrl || "/placeholder.svg"}
                alt="Vorschau"
                className="max-h-32 object-contain"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg?height=128&width=128"
                  console.error("Fehler beim Laden des Vorschaubilds:", previewUrl)
                }}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))]"
          >
            Abbrechen
          </Button>
          <Button
            onClick={confirmSelection}
            disabled={!selectedFile}
            className="bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
          >
            Auswählen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
