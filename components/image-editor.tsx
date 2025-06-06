"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { Cocktail } from "@/types/cocktail"
import { saveRecipe } from "@/lib/cocktail-machine"
import { Loader2, ImageIcon, FolderOpen, ArrowLeft } from "lucide-react"
import VirtualKeyboard from "./virtual-keyboard"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ImageEditorProps {
  isOpen: boolean
  onClose: () => void
  cocktail: Cocktail | null
  onSave: (updatedCocktail: Cocktail) => void
}

// Verfügbare Bilder im Projekt
const AVAILABLE_IMAGES = [
  { path: "/images/cocktails/bahama_mama.jpg", name: "Bahama Mama" },
  { path: "/images/cocktails/big_john.jpg", name: "Big John" },
  { path: "/images/cocktails/long_island_iced_tea.jpg", name: "Long Island Iced Tea" },
  { path: "/images/cocktails/mai_tai.jpg", name: "Mai Tai" },
  { path: "/images/cocktails/malibu_ananas.jpg", name: "Malibu Ananas" },
  { path: "/images/cocktails/malibu_colada.jpg", name: "Malibu Colada" },
  { path: "/images/cocktails/malibu_sunrise.jpg", name: "Malibu Sunrise" },
  { path: "/images/cocktails/malibu_sunset.jpg", name: "Malibu Sunset" },
  { path: "/images/cocktails/mojito.jpg", name: "Mojito" },
  { path: "/images/cocktails/passion_colada.jpg", name: "Passion Colada" },
  { path: "/images/cocktails/peaches_cream.jpg", name: "Peaches & Cream" },
  { path: "/images/cocktails/planters_punch.jpg", name: "Planters Punch" },
  { path: "/images/cocktails/sex_on_the_beach.jpg", name: "Sex on the Beach" },
  { path: "/images/cocktails/solero.jpg", name: "Solero" },
  { path: "/images/cocktails/swimming_pool.jpg", name: "Swimming Pool" },
  { path: "/images/cocktails/tequila_sunrise.jpg", name: "Tequila Sunrise" },
  { path: "/images/cocktails/touch_down.jpg", name: "Touch Down" },
  { path: "/images/cocktails/zombie.jpg", name: "Zombie" },
]

export default function ImageEditor({ isOpen, onClose, cocktail, onSave }: ImageEditorProps) {
  const [imageUrl, setImageUrl] = useState("")
  const [saving, setSaving] = useState(false)

  // View states
  const [currentView, setCurrentView] = useState<"form" | "keyboard" | "imageBrowser">("form")
  const [inputValue, setInputValue] = useState("")

  // Lade die Cocktail-Daten beim Öffnen
  useEffect(() => {
    if (cocktail && isOpen) {
      // Normalize image path
      let imagePath = cocktail.image || ""
      if (imagePath.startsWith("/placeholder")) {
        setImageUrl("")
      } else {
        // Stelle sicher, dass der Pfad mit / beginnt
        if (imagePath && !imagePath.startsWith("/") && !imagePath.startsWith("http")) {
          imagePath = `/${imagePath}`
        }
        // Entferne URL-Parameter
        imagePath = imagePath.split("?")[0]
        setImageUrl(imagePath)
      }

      // Reset view
      setCurrentView("form")
      setInputValue("")

      console.log(`Image Editor loaded for ${cocktail.name}:`, {
        name: cocktail.name,
        image: imagePath,
      })
    }
  }, [cocktail, isOpen])

  if (!cocktail) return null

  // Keyboard handlers
  const handleInputFocus = (currentValue = "") => {
    setInputValue(currentValue)
    setCurrentView("keyboard")
  }

  const handleKeyboardInput = (value: string) => {
    setInputValue(value)
  }

  const handleKeyboardConfirm = () => {
    setImageUrl(inputValue)
    setCurrentView("form")
    setInputValue("")
  }

  const handleKeyboardCancel = () => {
    setCurrentView("form")
    setInputValue("")
  }

  // Image browser handlers
  const handleSelectImage = (path: string) => {
    setImageUrl(path)
    setCurrentView("form")
  }

  // Save handler
  const handleSave = async () => {
    if (!cocktail) return

    setSaving(true)
    try {
      const updatedCocktail: Cocktail = {
        ...cocktail,
        image: imageUrl || "/placeholder.svg?height=200&width=400",
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

  // Form View
  const renderFormView = () => (
    <div className="space-y-6 my-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-2">{cocktail.name}</h3>
        <p className="text-sm text-[hsl(var(--cocktail-text-muted))]">Wähle ein neues Bild für diesen Cocktail aus</p>
      </div>

      {/* Aktuelles Bild anzeigen */}
      {imageUrl && (
        <div className="flex justify-center">
          <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-[hsl(var(--cocktail-card-border))]">
            <img
              src={imageUrl || "/placeholder.svg"}
              alt="Aktuelles Bild"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg?height=128&width=128"
              }}
            />
          </div>
        </div>
      )}

      {/* Bild URL */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-white">
          <ImageIcon className="h-4 w-4" />
          Bild-URL
        </Label>
        <div className="flex gap-2">
          <Input
            value={imageUrl}
            onClick={() => handleInputFocus(imageUrl)}
            readOnly
            className="bg-white border-[hsl(var(--cocktail-card-border))] text-black cursor-pointer flex-1"
            placeholder="Bild-URL eingeben oder aus Galerie wählen"
          />
          <Button
            type="button"
            onClick={() => setCurrentView("imageBrowser")}
            className="bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
          >
            <FolderOpen className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )

  // Keyboard View
  const renderKeyboardView = () => (
    <div className="space-y-4 my-4">
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleKeyboardCancel}
          className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold text-white">Bild-URL eingeben</h3>
      </div>

      <div className="bg-[hsl(var(--cocktail-card-bg))] border border-[hsl(var(--cocktail-card-border))] rounded-lg p-4">
        <Input
          value={inputValue}
          readOnly
          className="bg-white border-[hsl(var(--cocktail-card-border))] text-black text-center text-lg"
          placeholder="https://..."
        />
      </div>

      <VirtualKeyboard
        onInput={handleKeyboardInput}
        onConfirm={handleKeyboardConfirm}
        onCancel={handleKeyboardCancel}
        currentValue={inputValue}
        inputType="text"
      />
    </div>
  )

  // Image Browser View
  const renderImageBrowserView = () => (
    <div className="space-y-4 my-4">
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentView("form")}
          className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold text-white">Bild auswählen</h3>
      </div>

      <ScrollArea className="h-[60vh] pr-4">
        <div className="grid grid-cols-2 gap-4">
          {AVAILABLE_IMAGES.map((image) => (
            <div
              key={image.path}
              className={`relative aspect-square cursor-pointer rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                imageUrl === image.path
                  ? "border-[hsl(var(--cocktail-primary))] ring-2 ring-[hsl(var(--cocktail-primary))]/50"
                  : "border-transparent hover:border-[hsl(var(--cocktail-card-border))]"
              }`}
              onClick={() => handleSelectImage(image.path)}
            >
              <img
                src={image.path || "/placeholder.svg"}
                alt={image.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg?height=200&width=200"
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 text-xs text-center text-white">
                {image.name}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black border-[hsl(var(--cocktail-card-border))] text-white sm:max-w-md max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Bild ändern</DialogTitle>
        </DialogHeader>

        {currentView === "form" && renderFormView()}
        {currentView === "keyboard" && renderKeyboardView()}
        {currentView === "imageBrowser" && renderImageBrowserView()}

        {currentView === "form" && (
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
        )}
      </DialogContent>
    </Dialog>
  )
}
