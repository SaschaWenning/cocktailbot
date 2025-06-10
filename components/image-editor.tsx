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
  const [previewSrc, setPreviewSrc] = useState("")
  const [previewError, setPreviewError] = useState(false)

  // Lade die Cocktail-Daten beim Öffnen
  useEffect(() => {
    if (cocktail && isOpen) {
      setImageUrl(cocktail.image || "")
      setPreviewError(false)
      updatePreview(cocktail.image || "")
    }
  }, [cocktail, isOpen])

  const updatePreview = async (url: string) => {
    if (!url || !cocktail) {
      setPreviewSrc(`/placeholder.svg?height=128&width=128&query=${encodeURIComponent(cocktail?.name || "")}`)
      return
    }

    // Teste verschiedene Pfadstrategien für die Vorschau
    const strategies = [
      url,
      `/images/cocktails/${url.split("/").pop()}`,
      url.startsWith("/") ? url : `/${url}`,
      url.startsWith("/") && url.includes("/", 1) ? `/api/image?path=${encodeURIComponent(url)}` : null,
    ].filter(Boolean) as string[]

    let workingSrc = ""
    for (const testSrc of strategies) {
      try {
        const response = await fetch(testSrc, { method: "HEAD" })
        if (response.ok) {
          workingSrc = testSrc
          break
        }
      } catch (error) {
        // Ignoriere Fehler und versuche nächste Strategie
      }
    }

    setPreviewSrc(workingSrc || `/placeholder.svg?height=128&width=128&query=${encodeURIComponent(cocktail.name)}`)
  }

  const handleImageUrlChange = (newUrl: string) => {
    setImageUrl(newUrl)
    setPreviewError(false)
    updatePreview(newUrl)
  }

  if (!cocktail) return null

  const handleSelectImageFromBrowser = (imagePath: string) => {
    setImageUrl(imagePath)
    setShowFileBrowser(false)
    setPreviewError(false)
    updatePreview(imagePath)
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

  const handlePreviewError = () => {
    setPreviewError(true)
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
                  src={
                    previewError
                      ? `/placeholder.svg?height=128&width=128&query=${encodeURIComponent(cocktail.name)}`
                      : previewSrc
                  }
                  alt="Vorschau"
                  className="w-full h-full object-cover"
                  onError={handlePreviewError}
                />
              </div>
            </div>

            {/* Debug-Info */}
            <div className="text-xs text-gray-400 bg-gray-800 p-2 rounded font-mono">
              <div>Original: {cocktail.image}</div>
              <div>Eingabe: {imageUrl}</div>
              <div>Vorschau: {previewSrc}</div>
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
                  onChange={(e) => handleImageUrlChange(e.target.value)}
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
                    onClick={() => handleImageUrlChange("")}
                    className="h-10 w-10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Debug-Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => window.open("/debug-images", "_blank")}
              className="w-full bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
            >
              🔍 Debug-Seite öffnen
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
