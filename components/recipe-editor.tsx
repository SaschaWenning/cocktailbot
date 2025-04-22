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

  useEffect(() => {
    if (cocktail) {
      console.log("Cocktail im Editor geladen:", cocktail.name, "Bild:", cocktail.image)
      setRecipe([...cocktail.recipe])

      // Verbesserte Bildpfad-Logik
      let imagePath = cocktail.image || ""

      // Wenn es ein Platzhalterbild ist, setze leeren String
      if (imagePath.includes("placeholder")) {
        setImageUrl("")
      }
      // Wenn es ein lokaler Pfad ist, zeige ihn an
      else if (!imagePath.startsWith("http")) {
        // Entferne eventuelle URL-Parameter
        imagePath = imagePath.split("?")[0]
        setImageUrl(imagePath)
      }
      // Wenn es eine URL ist, zeige sie an
      else {
        setImageUrl(imagePath)
      }

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

    // Wenn es ein lokaler Pfad ist, ist es gültig
    if (url.startsWith("/")) return true

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

      // Bestimme den Bildpfad
      let finalImagePath = imageUrl

      // Wenn keine URL angegeben ist, verwende ein Platzhalterbild
      if (!finalImagePath) {
        finalImagePath = `/placeholder.svg?height=200&width=400&query=${encodeURIComponent(cocktail.name)}`
      }
      // Stelle sicher, dass lokale Pfade mit / beginnen
      else if (!finalImagePath.startsWith("http") && !finalImagePath.startsWith("/")) {
        finalImagePath = `/${finalImagePath}`
      }

      const updatedCocktail = {
        ...cocktail,
        description: description,
        image: finalImagePath,
        recipe: recipe,
        // Aktualisiere auch die Zutaten-Textliste
        ingredients: recipe.map((item) => {
          const ingredient = ingredients.find((i) => i.id === item.ingredientId)
          return `${item.amount}ml ${ingredient?.name || item.ingredientId}`
        }),
      }

      console.log("Speichere Cocktail mit Bild:", updatedCocktail.image)
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black border-[hsl(var(--cocktail-card-border))] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rezept bearbeiten: {cocktail.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 my-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-[hsl(var(--cocktail-bg))] border-[hsl(var(--cocktail-card-border))] text-white"
              placeholder="Beschreibe deinen Cocktail..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Bild-URL oder Pfad (optional)
            </Label>
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className={`bg-[hsl(var(--cocktail-bg))] border-[hsl(var(--cocktail-card-border))] text-white ${errors.imageUrl ? "border-[hsl(var(--cocktail-error))]" : ""}`}
              placeholder="/images/cocktails/mein_cocktail.jpg"
            />
            {errors.imageUrl && <p className="text-[hsl(var(--cocktail-error))] text-xs">{errors.imageUrl}</p>}
            <p className="text-xs text-white">
              Gib den Pfad oder die URL zu einem Bild deines Cocktails ein. Leer lassen für ein Platzhalterbild.
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
