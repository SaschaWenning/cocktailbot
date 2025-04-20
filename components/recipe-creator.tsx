"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Trash2, ImageIcon } from "lucide-react"
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
  const [recipe, setRecipe] = useState<{ ingredientId: string; amount: number }[]>([{ ingredientId: "", amount: 0 }])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<{
    name?: string
    recipe?: string
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
    const newErrors: { name?: string; recipe?: string } = {}

    if (!name.trim()) {
      newErrors.name = "Name ist erforderlich"
    }

    const hasValidIngredients = recipe.every((item) => item.ingredientId && item.amount > 0)

    if (!hasValidIngredients) {
      newErrors.recipe = "Alle Zutaten müssen eine gültige Zutat und Menge haben"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setSaving(true)
    try {
      const newCocktail: Cocktail = {
        id: `custom-${uuidv4().slice(0, 8)}`,
        name,
        description,
        image: `/images/cocktails/${name.toLowerCase().replace(/\s+/g, "_")}.jpg`,
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
      <DialogContent className="bg-black border-[hsl(var(--cocktail-card-border))] text-white sm:max-w-md">
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
              className={`bg-[hsl(var(--cocktail-bg))] border-[hsl(var(--cocktail-card-border))] text-white ${errors.name ? "border-[hsl(var(--cocktail-error))]" : ""}`}
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
              className="bg-[hsl(var(--cocktail-bg))] border-[hsl(var(--cocktail-card-border))] text-white"
              placeholder="Beschreibe deinen Cocktail..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Bild-Information
            </Label>
            <div className="bg-[hsl(var(--cocktail-card-bg))] border border-[hsl(var(--cocktail-card-border))] rounded-md p-3 text-white">
              <p className="text-sm mb-2">Um ein Bild für deinen Cocktail hinzuzufügen:</p>
              <ol className="text-xs space-y-1 list-decimal pl-4">
                <li>Speichere dein Bild im Format JPG oder PNG</li>
                <li>
                  Benenne die Datei nach dem Cocktail-Namen (z.B. <span className="font-mono">mein_cocktail.jpg</span>)
                </li>
                <li>
                  Kopiere die Datei in den Ordner: <span className="font-mono">/images/cocktails/</span>
                </li>
              </ol>
              <p className="text-xs mt-2 text-[hsl(var(--cocktail-primary))]">
                Das Bild wird automatisch geladen, wenn der Dateiname dem Cocktail-Namen entspricht.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="alcoholic" checked={alcoholic} onCheckedChange={setAlcoholic} />
            <Label htmlFor="alcoholic">Enthält Alkohol</Label>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Zutaten</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddIngredient}
                className="h-8 px-2 bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[#00ff00] hover:text-black"
              >
                <Plus className="h-4 w-4 mr-1" />
                Zutat hinzufügen
              </Button>
            </div>

            {errors.recipe && <p className="text-[hsl(var(--cocktail-error))] text-xs">{errors.recipe}</p>}

            {recipe.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-7">
                  <Select value={item.ingredientId} onValueChange={(value) => handleIngredientChange(index, value)}>
                    <SelectTrigger className="bg-[hsl(var(--cocktail-bg))] border-[hsl(var(--cocktail-card-border))] text-white">
                      <SelectValue placeholder="Zutat wählen" />
                    </SelectTrigger>
                    <SelectContent className="bg-black text-white border-[hsl(var(--cocktail-card-border))]">
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
                    className="bg-[hsl(var(--cocktail-bg))] border-[hsl(var(--cocktail-card-border))] text-white"
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
                    className="h-8 w-8 text-white hover:text-[hsl(var(--cocktail-error))]"
                  >
                    <Trash2 className="h-4 w-4 text-[hsl(var(--cocktail-error))]" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
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
  )
}
