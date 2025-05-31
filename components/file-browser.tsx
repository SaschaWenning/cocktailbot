"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check, ImageIcon } from "lucide-react"

interface FileBrowserProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (path: string) => void
  fileTypes?: string[]
}

// Vereinfachte Dateisystemstruktur - direkt zu den Cocktail-Bildern
const cocktailImages = [
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
]

export default function FileBrowser({
  isOpen,
  onClose,
  onSelect,
  fileTypes = ["jpg", "jpeg", "png", "gif"],
}: FileBrowserProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null)
    }
  }, [isOpen])

  const getFileExtension = (filename: string) => {
    return filename.split(".").pop()?.toLowerCase() || ""
  }

  const isValidFileType = (filename: string) => {
    const ext = getFileExtension(filename)
    return fileTypes.includes(ext)
  }

  const selectFile = (file: string) => {
    const filePath = `/images/cocktails/${file}`
    setSelectedFile(filePath)
  }

  const handleConfirm = () => {
    if (selectedFile) {
      onSelect(selectedFile)
      onClose()
    }
  }

  const validImages = cocktailImages.filter(isValidFileType)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black border-[hsl(var(--cocktail-card-border))] text-white max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Cocktail-Bild auswählen</DialogTitle>
          <p className="text-sm text-gray-400">Wähle ein Bild für deinen Cocktail aus</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 py-4">
          <div className="grid grid-cols-3 gap-3">
            {validImages.map((image) => {
              const imagePath = `/images/cocktails/${image}`
              const isSelected = selectedFile === imagePath
              const displayName = image.replace(/\.(jpg|jpeg|png|gif)$/i, "").replace(/_/g, " ")

              return (
                <div
                  key={image}
                  className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                    isSelected
                      ? "border-[hsl(var(--cocktail-primary))] bg-[hsl(var(--cocktail-primary))]/10"
                      : "border-[hsl(var(--cocktail-card-border))] hover:border-[hsl(var(--cocktail-primary))]/50"
                  }`}
                  onClick={() => selectFile(image)}
                >
                  <div className="aspect-square bg-gray-800 flex items-center justify-center">
                    <img
                      src={imagePath || "/placeholder.svg"}
                      alt={displayName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback: Zeige Icon statt Bild
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

          {validImages.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Keine Bilder gefunden</p>
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
