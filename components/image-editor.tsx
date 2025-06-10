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
  const [previewError, setPreviewError] = useState(false)

  // Lade die Cocktail-Daten beim Öffnen
  useEffect(() => {
    if (cocktail && isOpen) {
      setImageUrl(cocktail.image || "")
      setPreviewError(false)
    }
  }, [cocktail, isOpen])

  if (!cocktail) return null

  const handleSelectImageFromBrowser = (imagePath: string) => {
    // Extrahiere nur den Dateinamen
    const filename = imagePath.split("/").pop()
    // Setze den standardisierten Pfad
    setImageUrl(`/images/cocktails/${filename}`)
    setShowFileBrowser(false)
    setPreviewError(false)
  }

  const handleSave = async () => {
    if (!cocktail) return

    setSaving(true)
    try {
      const updatedCocktail: Cocktail = {
        ...cocktail,
        image: imageUrl || "",
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

  // Einfache Vorschau-Logik
  const getPreviewSrc = () => {
    if (previewError || !imageUrl) {
      return `/placeholder.svg?height=128&width=128&query=${encodeURIComponent(cocktail.name)}`
    }

    const filename = imageUrl.split("/").pop()
    const cacheBuster = Date.now()
    return `/images/cocktails/${filename}?v=${cacheBuster}`
  }

  const handlePreviewError = () => {
    console.error(`❌ Vorschau-Bild konnte nicht geladen werden: ${getPreviewSrc()}`)
    setPreviewError(true)
  }

  const handlePreviewLoad = () => {
    console.log(`✅ Vorschau-Bild erfolgreich geladen: ${getPreviewSrc()}`)
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
                  onError={handlePreviewError}
                  onLoad={handlePreviewLoad}
                  key={imageUrl} // Erzwinge Neurendering
                />
              </div>
            </div>

            {/* Debug-Info */}
            <div className="text-xs text-gray-400 bg-gray-800 p-2 rounded font-mono">
              <div>Original: {cocktail.image}</div>
              <div>Eingabe: {imageUrl}</div>
              <div>Vorschau: {getPreviewSrc()}</div>
              <div>Fehler: {previewError ? "Ja" : "Nein"}</div>
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
                  onChange={(e) => {
                    setImageUrl(e.target.value)
                    setPreviewError(false)
                  }}
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
                    onClick={() => {
                      setImageUrl("")
                      setPreviewError(false)
                    }}
                    className="h-10 w-10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Test-Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const testSrc = getPreviewSrc()
                window.open(testSrc, "_blank")
              }}
              className="w-full bg-blue-600 text-white border-blue-500 hover:bg-blue-500"
            >
              🔗 Bild in neuem Tab öffnen
            </Button>
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
