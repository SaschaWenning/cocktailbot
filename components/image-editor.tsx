"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { Cocktail } from "@/types/cocktail"
import { saveRecipe } from "@/lib/cocktail-machine"
import { Loader2, ImageIcon, FolderOpen, X } from "lucide-react"
import FileBrowser from "./file-browser"

interface ImageEditorProps {
  isOpen: boolean
  onClose: () => void
  cocktail: Cocktail | null
  onSave: (updatedCocktail: Cocktail) => void
}

export default function ImageEditor({ isOpen, onClose, cocktail, onSave }: ImageEditorProps) {
  const [imageUrl, setImageUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [showFileBrowser, setShowFileBrowser] = useState(false)

  // Lade die Cocktail-Daten beim Öffnen
  useEffect(() => {
    if (cocktail && isOpen) {
      // EINFACH: Verwende den Pfad wie er ist
      setImageUrl(cocktail.image || "")
    }
  }, [cocktail, isOpen])

  if (!cocktail) return null

  const handleSelectImageFromBrowser = (imagePath: string) => {
    setImageUrl(imagePath)
    setShowFileBrowser(false)
  }

  const handleSave = async () => {
    if (!cocktail) return

    setSaving(true)
    try {
      const updatedCocktail: Cocktail = {
        ...cocktail,
        image: imageUrl || "", // Speichere genau was eingegeben wurde
      }

      await saveRecipe(updatedCocktail)
      onSave(updatedCocktail)
      onClose()
    } catch (error) {
      console.error("Fehler beim Speichern des Bildes:", error)
    } finally {
      setSaving(false)
    }
  }

  // Vorschau-Bild
  const getPreviewSrc = () => {
    if (!imageUrl || imageUrl.includes("placeholder")) {
      return `/placeholder.svg?height=128&width=128&query=${encodeURIComponent(cocktail.name)}`
    }

    if (imageUrl.startsWith("/images/")) {
      return imageUrl
    }

    if (imageUrl.startsWith("/")) {
      return imageUrl
    }

    return `/${imageUrl}`
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-black border-[hsl(var(--cocktail-card-border))] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bild ändern - {cocktail.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 my-4">
            {/* Aktuelles Bild anzeigen */}
            <div className="flex justify-center">
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-[hsl(var(--cocktail-card-border))]">
                <img
                  src={getPreviewSrc() || "/placeholder.svg"}
                  alt="Vorschau"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `/placeholder.svg?height=128&width=128&query=${encodeURIComponent(cocktail.name)}`
                  }}
                />
              </div>
            </div>

            {/* Debug Info */}
            <div className="text-xs text-gray-400 bg-gray-800 p-2 rounded">
              <div>Original: {cocktail.image}</div>
              <div>Eingabe: {imageUrl}</div>
              <div>Vorschau: {getPreviewSrc()}</div>
            </div>

            {/* Bild-Pfad */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-white">
                <ImageIcon className="h-4 w-4" />
                Bild-Pfad
              </Label>
              <div className="flex gap-2">
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="bg-white border-[hsl(var(--cocktail-card-border))] text-black flex-1"
                  placeholder="/images/cocktails/mein-bild.jpg"
                />
                <Button
                  type="button"
                  onClick={() => setShowFileBrowser(true)}
                  className="bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
                {imageUrl && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => setImageUrl("")}
                    className="h-10 w-10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
            >
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#00ff00] text-black hover:bg-[#00cc00]">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Speichern...
                </>
              ) : (
                "Speichern"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FileBrowser
        isOpen={showFileBrowser}
        onClose={() => setShowFileBrowser(false)}
        onSelectImage={handleSelectImageFromBrowser}
      />
    </>
  )
}
