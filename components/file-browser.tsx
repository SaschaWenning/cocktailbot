"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check, ImageIcon, Folder, ArrowLeft } from "lucide-react"

interface FileBrowserProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (path: string) => void
  fileTypes?: string[]
}

// Erweiterte Dateisystemstruktur
const fileSystem = {
  "/": {
    type: "folder",
    children: ["images", "public"],
  },
  "/images": {
    type: "folder",
    children: ["cocktails"],
  },
  "/images/cocktails": {
    type: "folder",
    children: [
      "bahama_mama.jpg",
      "big_john.jpg",
      "long_island_iced_tea.jpg",
      "mai_tai.jpg",
      "malibu_ananas.jpg",
      "malibu_colada.jpg",
      "malibu_sunrise.jpg",
      "malibu_sunset.jpg",
      "mojito.jpg",
      "passion_colada.jpg",
      "peaches_cream.jpg",
      "planters_punch.jpg",
      "sex_on_the_beach.jpg",
      "solero.jpg",
      "swimming_pool.jpg",
      "swimmingpool.jpg",
      "tequila_sunrise.jpg",
      "touch_down.jpg",
      "touchdown.jpg",
      "zombie.jpg",
    ],
  },
  "/public": {
    type: "folder",
    children: [
      "bursting-berries.png",
      "citrus-swirl-sunset.png",
      "palm-glow.png",
      "refreshing-citrus-cooler.png",
      "tropical-blend.png",
      "vibrant-passion-fizz.png",
    ],
  },
}

export default function FileBrowser({
  isOpen,
  onClose,
  onSelect,
  fileTypes = ["jpg", "jpeg", "png", "gif"],
}: FileBrowserProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [currentPath, setCurrentPath] = useState("/images/cocktails")

  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null)
      setCurrentPath("/images/cocktails") // Starte immer im cocktails Ordner
    }
  }, [isOpen])

  const getFileExtension = (filename: string) => {
    return filename.split(".").pop()?.toLowerCase() || ""
  }

  const isValidFileType = (filename: string) => {
    const ext = getFileExtension(filename)
    return fileTypes.includes(ext)
  }

  const getCurrentFolder = () => {
    return fileSystem[currentPath as keyof typeof fileSystem] || { type: "folder", children: [] }
  }

  const navigateToFolder = (folderName: string) => {
    if (folderName === "..") {
      // Gehe zum übergeordneten Ordner
      const pathParts = currentPath.split("/").filter((p) => p)
      pathParts.pop()
      setCurrentPath(pathParts.length > 0 ? "/" + pathParts.join("/") : "/")
    } else {
      // Gehe in den Unterordner
      const newPath = currentPath === "/" ? `/${folderName}` : `${currentPath}/${folderName}`
      setCurrentPath(newPath)
    }
    setSelectedFile(null)
  }

  const selectFile = (file: string) => {
    let filePath: string
    if (currentPath === "/public") {
      filePath = `/${file}`
    } else if (currentPath === "/images/cocktails") {
      filePath = `/images/cocktails/${file}`
    } else {
      filePath = `${currentPath}/${file}`
    }
    setSelectedFile(filePath)
  }

  const handleConfirm = () => {
    if (selectedFile) {
      onSelect(selectedFile)
      onClose()
    }
  }

  const currentFolder = getCurrentFolder()
  const items = currentFolder.children || []

  // Trenne Ordner und Dateien
  const folders = items.filter((item) => {
    const itemPath = currentPath === "/" ? `/${item}` : `${currentPath}/${item}`
    return fileSystem[itemPath as keyof typeof fileSystem]?.type === "folder"
  })

  const files = items.filter((item) => {
    const itemPath = currentPath === "/" ? `/${item}` : `${currentPath}/${item}`
    return !fileSystem[itemPath as keyof typeof fileSystem] && isValidFileType(item)
  })

  const canGoUp = currentPath !== "/"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black border-[hsl(var(--cocktail-card-border))] text-white max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Bild auswählen</DialogTitle>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Aktueller Pfad:</span>
            <code className="bg-gray-800 px-2 py-1 rounded text-xs">{currentPath}</code>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 py-4">
          {/* Navigation */}
          <div className="mb-4">
            {canGoUp && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateToFolder("..")}
                className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-gray-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zurück
              </Button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Ordner anzeigen */}
            {folders.map((folder) => (
              <div
                key={folder}
                className="border-2 border-[hsl(var(--cocktail-card-border))] rounded-lg overflow-hidden cursor-pointer hover:border-[hsl(var(--cocktail-primary))]/50 transition-all"
                onClick={() => navigateToFolder(folder)}
              >
                <div className="aspect-square bg-gray-800 flex items-center justify-center">
                  <Folder className="w-12 h-12 text-gray-400" />
                </div>
                <div className="p-2 bg-black/80">
                  <p className="text-xs text-center truncate">{folder}</p>
                </div>
              </div>
            ))}

            {/* Dateien anzeigen */}
            {files.map((file) => {
              const filePath =
                currentPath === "/public"
                  ? `/${file}`
                  : currentPath === "/images/cocktails"
                    ? `/images/cocktails/${file}`
                    : `${currentPath}/${file}`
              const isSelected = selectedFile === filePath
              const displayName = file.replace(/\.(jpg|jpeg|png|gif)$/i, "").replace(/[-_]/g, " ")

              return (
                <div
                  key={file}
                  className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                    isSelected
                      ? "border-[hsl(var(--cocktail-primary))] bg-[hsl(var(--cocktail-primary))]/10"
                      : "border-[hsl(var(--cocktail-card-border))] hover:border-[hsl(var(--cocktail-primary))]/50"
                  }`}
                  onClick={() => selectFile(file)}
                >
                  <div className="aspect-square bg-gray-800 flex items-center justify-center">
                    <img
                      src={filePath || "/placeholder.svg"}
                      alt={displayName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = "none"
                        const parent = target.parentElement
                        if (parent && !parent.querySelector(".fallback-icon")) {
                          const icon = document.createElement("div")
                          icon.className = "fallback-icon flex items-center justify-center w-full h-full text-gray-400"
                          icon.innerHTML =
                            '<svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"></path></svg>'
                          parent.appendChild(icon)
                        }
                      }}
                    />
                  </div>
                  <div className="p-2 bg-black/80">
                    <p className="text-xs text-center truncate capitalize">{displayName}</p>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-[hsl(var(--cocktail-primary))] text-black rounded-full p-1">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {items.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Keine Dateien in diesem Ordner</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 border-t border-[hsl(var(--cocktail-card-border))] pt-4">
          <div className="flex justify-between w-full">
            <div className="text-sm text-gray-400">
              {selectedFile && <span>Ausgewählt: {selectedFile.split("/").pop()}</span>}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))]"
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!selectedFile}
                className="bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
              >
                <Check className="h-4 w-4 mr-1" />
                Auswählen
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
