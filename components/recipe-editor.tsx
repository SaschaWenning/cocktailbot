"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Cocktail } from "@/types/cocktail"
import { ingredients } from "@/data/ingredients"
import { saveRecipe } from "@/lib/cocktail-machine"
import { Loader2, ImageIcon, Trash2 } from "lucide-react"
// Importieren Sie die VirtualKeyboard-Komponente am Anfang der Datei
import VirtualKeyboard from "./virtual-keyboard"
import AlphaKeyboard from "./alpha-keyboard"

interface RecipeEditorProps {
  isOpen: boolean
  onClose: () => void
  cocktail: Cocktail | null
  onSave: (updatedCocktail: Cocktail) => void
  onRequestDelete: (cocktailId: string) => void
}

export default function RecipeEditor({ isOpen, onClose, cocktail, onSave, onRequestDelete }: RecipeEditorProps) {
  const [recipe, setRecipe] = useState<{ ingredientId: string; amount: number }[]>([])
  const [imageUrl, setImageUrl] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<{
    imageUrl?: string
  }>({})
  // Fügen Sie die folgenden Zustände zur RecipeEditor-Komponente hinzu
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [activeInput, setActiveInput] = useState<"description" | "imageUrl" | null>(null)
  const [keyboardType, setKeyboardType] = useState<"numeric" | "alpha">("alpha")

  useEffect(() => {
    if (cocktail) {
      setRecipe([...cocktail.recipe])
      setImageUrl(cocktail.image.startsWith("/placeholder") ? "" : cocktail.image)
      setDescription(cocktail.description)
    }
  }, [cocktail])

  if (!cocktail) return null

  const handleAmountChange = (index: number, value: string) => {
    const amount = Number.parseFloat(value)

    if (isNaN(amount) || amount < 0) return

    const updatedRecipe = [...recipe]
    updatedRecipe[index] = { ...updatedRecipe[index], amount }
    setRecipe(updatedRecipe)
  }

  const isValidUrl = (url: string) => {
    if (!url) return true // Leere URL ist erlaubt
    try {
      new URL(url)
      return true
    } catch (e) {
      return false
    }
  }

  const validateForm = () => {
    const newErrors: { imageUrl?: string } = {}

    if (imageUrl && !isValidUrl(imageUrl)) {
      newErrors.imageUrl = "Bitte gib eine gültige URL ein"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!cocktail || !validateForm()) return

    setSaving(true)
    try {
      // Berechne das Gesamtvolumen des Rezepts
      const totalVolume = recipe.reduce((sum, item) => sum + item.amount, 0)

      const updatedCocktail = {
        ...cocktail,
        description: description,
        image: imageUrl || "/placeholder.svg?height=200&width=400",
        recipe: recipe,
        // Aktualisiere auch die Zutaten-Textliste
        ingredients: recipe.map((item) => {
          const ingredient = ingredients.find((i) => i.id === item.ingredientId)
          return `${item.amount}ml ${ingredient?.name || item.ingredientId}`
        }),
      }

      await saveRecipe(updatedCocktail)
      onSave(updatedCocktail)
      onClose()
    } catch (error) {
      console.error("Fehler beim Speichern des Rezepts:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRequest = () => {
    if (!cocktail) return
    onRequestDelete(cocktail.id)
  }

  const getIngredientName = (id: string) => {
    const ingredient = ingredients.find((i) => i.id === id)
    return ingredient ? ingredient.name : id
  }

  // Prüfe, ob es sich um ein benutzerdefiniertes Rezept handelt
  const isCustomRecipe = cocktail.id.startsWith("custom-")

  // Fügen Sie diese Funktionen zur RecipeEditor-Komponente hinzu
  const handleInputFocus = (inputType: "description" | "imageUrl") => {
    setActiveInput(inputType)
    setKeyboardType(inputType === "imageUrl" ? "alpha" : "alpha")
    setShowKeyboard(true)
  }

  const handleKeyPress = (key: string) => {
    if (!activeInput) return

    if (activeInput === "description") {
      setDescription((prev) => prev + key)
    } else if (activeInput === "imageUrl") {
      setImageUrl((prev) => prev + key)
    }
  }

  const handleBackspace = () => {
    if (!activeInput) return

    if (activeInput === "description") {
      setDescription((prev) => prev.slice(0, -1))
    } else if (activeInput === "imageUrl") {
      setImageUrl((prev) => prev.slice(0, -1))
    }
  }

  const handleClear = () => {
    if (!activeInput) return

    if (activeInput === "description") {
      setDescription("")
    } else if (activeInput === "imageUrl") {
      setImageUrl("")
    }
  }

  const handleConfirm = () => {
    setShowKeyboard(false)
    setActiveInput(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black border-[hsl(var(--cocktail-card-border))] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rezept bearbeiten: {cocktail.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 my-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            {/* Ändern Sie die Textarea für die Beschreibung, um die Tastatur zu aktivieren */}
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-[hsl(var(--cocktail-bg))] border-[hsl(var(--cocktail-card-border))] text-white"
              placeholder="Beschreibe deinen Cocktail..."
              rows={2}
              onFocus={() => handleInputFocus("description")}
              readOnly
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Bild-URL (optional)
            </Label>
            {/* Ändern Sie das Input-Feld für die Bild-URL, um die Tastatur zu aktivieren */}
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className={`bg-[hsl(var(--cocktail-bg))] border-[hsl(var(--cocktail-card-border))] text-white ${errors.imageUrl ? "border-[hsl(var(--cocktail-error))]" : ""}`}
              placeholder="https://beispiel.com/mein-cocktail.jpg"
              onFocus={() => handleInputFocus("imageUrl")}
              readOnly
            />
            {errors.imageUrl && <p className="text-[hsl(var(--cocktail-error))] text-xs">{errors.imageUrl}</p>}
            <p className="text-xs text-white">
              Gib die URL zu einem Bild deines Cocktails ein. Leer lassen für ein Platzhalterbild.
            </p>
          </div>

          <div className="pt-2">
            <Label>Zutaten</Label>
          </div>

          {recipe.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-7">
                <Label className="text-white">{getIngredientName(item.ingredientId)}</Label>
              </div>
              <div className="col-span-3">
                <Input
                  type="number"
                  value={item.amount}
                  onChange={(e) => handleAmountChange(index, e.target.value)}
                  min="0"
                  step="1"
                  className="bg-[hsl(var(--cocktail-bg))] border-[hsl(var(--cocktail-card-border))] text-white"
                />
              </div>
              <div className="col-span-2 text-sm text-white">ml</div>
            </div>
          ))}
        </div>
        {/* Fügen Sie die Tastatur am Ende des Formulars hinzu, vor dem DialogFooter */}
        {showKeyboard && (
          <div className="mt-4">
            {keyboardType === "numeric" ? (
              <VirtualKeyboard
                onKeyPress={handleKeyPress}
                onBackspace={handleBackspace}
                onClear={handleClear}
                onConfirm={handleConfirm}
              />
            ) : (
              <AlphaKeyboard
                onKeyPress={handleKeyPress}
                onBackspace={handleBackspace}
                onClear={handleClear}
                onConfirm={handleConfirm}
              />
            )}
          </div>
        )}

        <DialogFooter className="flex justify-between items-center">
          <Button variant="destructive" onClick={handleDeleteRequest} className="mr-auto" type="button">
            <Trash2 className="mr-2 h-4 w-4" />
            Löschen
          </Button>
          <div className="flex gap-2">
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
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
