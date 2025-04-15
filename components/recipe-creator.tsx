"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Trash2, Image } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import type { Cocktail } from "@/types/cocktail"
import { ingredients } from "@/data/ingredients"
import { saveRecipe } from "@/lib/cocktail-machine"

interface RecipeCreatorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (newCocktail: Cocktail) => void
}

export default function RecipeCreator({ isOpen, onClose, onSave }: RecipeCreatorProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [alcoholic, setAlcoholic] = useState(true)
  const [imageUrl, setImageUrl] = useState("")
  const [recipe, setRecipe] = useState<{ ingredientId: string; amount: number }[]>([{ ingredientId: "", amount: 0 }])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<{
    name?: string
    recipe?: string
    imageUrl?: string
  }>({})

  const handleAddIngredient = () => {
    setRecipe([...recipe, { ingredientId: "", amount: 0 }])
  }

  const handleRemoveIngredient = (index: number) => {
    if (recipe.length <= 1) return
    setRecipe(recipe.filter((_, i) => i !== index))
  }

  const handleIngredientChange = (index: number, ingredientId: string) => {
    const updatedRecipe = [...recipe]
    updatedRecipe[index] = { ...updatedRecipe[index], ingredientId }
    setRecipe(updatedRecipe)
  }

  const handleAmountChange = (index: number, value: string) => {
    const amount = Number.parseInt(value)
    if (isNaN(amount) || amount < 0) return

    const updatedRecipe = [...recipe]
    updatedRecipe[index] = { ...updatedRecipe[index], amount }
    setRecipe(updatedRecipe)
  }

  const validateForm = () => {
    const newErrors: { name?: string; recipe?: string; imageUrl?: string } = {}

    if (!name.trim()) {
      newErrors.name = "Name ist erforderlich"
    }

    const hasValidIngredients = recipe.every((item) => item.ingredientId && item.amount > 0)

    if (!hasValidIngredients) {
      newErrors.recipe = "Alle Zutaten müssen eine gültige Zutat und Menge haben"
    }

    if (imageUrl && !isValidUrl(imageUrl)) {
      newErrors.imageUrl = "Bitte gib eine gültige URL ein"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch (e) {
      return false
    }
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setSaving(true)
    try {
      const newCocktail: Cocktail = {
        id: `custom-${uuidv4().slice(0, 8)}`,
        name,
        description,
        image: imageUrl || "/placeholder.svg?height=200&width=400",
        alcoholic,
        ingredients: recipe.map((item) => {
          const ingredient = ingredients.find((i) => i.id === item.ingredientId)
          return `${item.amount}ml ${ingredient?.name || item.ingredientId}`
        }),
        recipe: recipe.filter((item) => item.ingredientId && item.amount > 0),
      }

      await saveRecipe(newCocktail)
      onSave(newCocktail)

      // Formular zurücksetzen
      setName("")
      setDescription("")
      setAlcoholic(true)
      setImageUrl("")
      setRecipe([{ ingredientId: "", amount: 0 }])
      setErrors({})

      onClose()
    } catch (error) {
      console.error("Fehler beim Speichern des Rezepts:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border-[hsl(var(--cocktail-card-border))] text-[hsl(var(--cocktail-text))] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Neues Cocktail-Rezept erstellen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 my-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`bg-[hsl(var(--cocktail-bg))] border-[hsl(var(--cocktail-card-border))] ${errors.name ? "border-[hsl(var(--cocktail-error))]" : ""}`}
              placeholder="z.B. Mein Cocktail"
            />
            {errors.name && <p className="text-[hsl(var(--cocktail-error))] text-xs">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-[hsl(var(--cocktail-bg))] border-[hsl(var(--cocktail-card-border))]"
              placeholder="Beschreibe deinen Cocktail..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Bild-URL (optional)
            </Label>
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className={`bg-[hsl(var(--cocktail-bg))] border-[hsl(var(--cocktail-card-border))] ${errors.imageUrl ? "border-[hsl(var(--cocktail-error))]" : ""}`}
              placeholder="https://beispiel.com/mein-cocktail.jpg"
            />
            {errors.imageUrl && <p className="text-[hsl(var(--cocktail-error))] text-xs">{errors.imageUrl}</p>}
            <p className="text-xs text-[hsl(var(--cocktail-text-muted))]">
              Gib die URL zu einem Bild deines Cocktails ein. Leer lassen für ein Platzhalterbild.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="alcoholic" checked={alcoholic} onCheckedChange={setAlcoholic} />
            <Label htmlFor="alcoholic">Enthält Alkohol</Label>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Zutaten</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddIngredient} className="h-8 px-2">
                <Plus className="h-4 w-4 mr-1" />
                Zutat hinzufügen
              </Button>
            </div>

            {errors.recipe && <p className="text-[hsl(var(--cocktail-error))] text-xs">{errors.recipe}</p>}

            {recipe.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-7">
                  <Select value={item.ingredientId} onValueChange={(value) => handleIngredientChange(index, value)}>
                    <SelectTrigger className="bg-[hsl(var(--cocktail-bg))] border-[hsl(var(--cocktail-card-border))]">
                      <SelectValue placeholder="Zutat wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {ingredients.map((ingredient) => (
                        <SelectItem key={ingredient.id} value={ingredient.id}>
                          {ingredient.name} {ingredient.alcoholic ? "(Alk)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Input
                    type="number"
                    value={item.amount || ""}
                    onChange={(e) => handleAmountChange(index, e.target.value)}
                    min="0"
                    step="1"
                    className="bg-[hsl(var(--cocktail-bg))] border-[hsl(var(--cocktail-card-border))]"
                    placeholder="ml"
                  />
                </div>
                <div className="col-span-2 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveIngredient(index)}
                    disabled={recipe.length <= 1}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4 text-[hsl(var(--cocktail-error))]" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={saving}>
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
  )
}
