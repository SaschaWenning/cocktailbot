"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Cocktail } from "@/types/cocktail"
import { ingredients } from "@/data/ingredients"
import { saveRecipe } from "@/lib/cocktail-machine"
import { Loader2, ImageIcon, Trash2, Plus, Minus } from "lucide-react"
import VirtualKeyboard from "./virtual-keyboard"

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
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [activeInput, setActiveInput] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState("")
  const [errors, setErrors] = useState<{
    imageUrl?: string
  }>({})

  useEffect(() => {
    if (cocktail) {
      setRecipe([...cocktail.recipe])

      // Normalize image path
      let imagePath = cocktail.image || ""
      if (imagePath.startsWith("/placeholder")) {
        setImageUrl("")
      } else {
        // Remove any URL parameters and ensure proper formatting
        imagePath = imagePath.split("?")[0]
        if (imagePath && !imagePath.startsWith("http")) {
          if (!imagePath.startsWith("/")) {
            imagePath = `/${imagePath}`
          }
        }
        setImageUrl(imagePath)
      }

      setDescription(cocktail.description)

      // For debugging
      console.log(`Editor loaded for ${cocktail.name} with image path: ${imagePath}`)
    }
  }, [cocktail])

  if (!cocktail) return null

  const handleInputFocus = (inputType: string, currentValue = "") => {
    setActiveInput(inputType)
    setInputValue(currentValue)
    setShowKeyboard(true)
  }

  const handleKeyboardInput = (value: string) => {
    setInputValue(value)
  }

  const handleKeyboardConfirm = () => {
    if (!activeInput) return

    if (activeInput === "description") {
      setDescription(inputValue)
    } else if (activeInput === "imageUrl") {
      setImageUrl(inputValue)
    } else if (activeInput.startsWith("amount-")) {
      const index = Number.parseInt(activeInput.replace("amount-", ""))
      const amount = Number.parseFloat(inputValue)
      if (!isNaN(amount) && amount >= 0) {
        handleAmountChange(index, inputValue)
      }
    }

    setShowKeyboard(false)
    setActiveInput(null)
    setInputValue("")
  }

  const handleKeyboardCancel = () => {
    setShowKeyboard(false)
    setActiveInput(null)
    setInputValue("")
  }

  const handleAmountChange = (index: number, value: string) => {
    const amount = Number.parseFloat(value)

    if (isNaN(amount) || amount < 0) return

    const updatedRecipe = [...recipe]
    updatedRecipe[index] = { ...updatedRecipe[index], amount }
    setRecipe(updatedRecipe)
  }

  const handleIngredientChange = (index: number, ingredientId: string) => {
    const updatedRecipe = [...recipe]
    updatedRecipe[index] = { ...updatedRecipe[index], ingredientId }
    setRecipe(updatedRecipe)
  }

  const addIngredient = () => {
    const availableIngredients = ingredients.filter(
      (ingredient) => !recipe.some((item) => item.ingredientId === ingredient.id),
    )

    if (availableIngredients.length > 0) {
      setRecipe([...recipe, { ingredientId: availableIngredients[0].id, amount: 30 }])
    }
  }

  const removeIngredient = (index: number) => {
    if (recipe.length > 1) {
      const updatedRecipe = recipe.filter((_, i) => i !== index)
      setRecipe(updatedRecipe)
    }
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-black border-[hsl(var(--cocktail-card-border))] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rezept bearbeiten: {cocktail.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 my-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label htmlFor="description" className="text-white">
                Beschreibung
              </Label>
              <Input
                id="description"
                value={description}
                onClick={() => handleInputFocus("description", description)}
                readOnly
                className="bg-white border-[hsl(var(--cocktail-card-border))] text-black cursor-pointer"
                placeholder="Beschreibe deinen Cocktail..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl" className="flex items-center gap-2 text-white">
                <ImageIcon className="h-4 w-4" />
                Bild-URL (optional)
              </Label>
              <Input
                id="imageUrl"
                value={imageUrl}
                onClick={() => handleInputFocus("imageUrl", imageUrl)}
                readOnly
                className={`bg-white border-[hsl(var(--cocktail-card-border))] text-black cursor-pointer ${errors.imageUrl ? "border-red-500" : ""}`}
                placeholder="https://beispiel.com/mein-cocktail.jpg"
              />
              {errors.imageUrl && <p className="text-red-400 text-xs">{errors.imageUrl}</p>}
              <p className="text-xs text-gray-300">
                Gib die URL zu einem Bild deines Cocktails ein. Leer lassen für ein Platzhalterbild.
              </p>
            </div>

            <div className="pt-2">
              <div className="flex justify-between items-center mb-2">
                <Label className="text-white">Zutaten</Label>
                <Button
                  type="button"
                  size="sm"
                  onClick={addIngredient}
                  className="bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
                  disabled={recipe.length >= ingredients.length}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Zutat hinzufügen
                </Button>
              </div>
            </div>

            {recipe.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-2 items-center p-2 bg-[hsl(var(--cocktail-card-bg))] rounded border border-[hsl(var(--cocktail-card-border))]"
              >
                <div className="col-span-6">
                  <Select value={item.ingredientId} onValueChange={(value) => handleIngredientChange(index, value)}>
                    <SelectTrigger className="bg-white border-[hsl(var(--cocktail-card-border))] text-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-[hsl(var(--cocktail-card-border))] max-h-48 overflow-y-auto">
                      {ingredients.map((ingredient) => (
                        <SelectItem
                          key={ingredient.id}
                          value={ingredient.id}
                          className="text-black hover:bg-gray-100 cursor-pointer"
                        >
                          {ingredient.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Input
                    type="text"
                    value={item.amount}
                    onClick={() => handleInputFocus(`amount-${index}`, item.amount.toString())}
                    readOnly
                    className="bg-white border-[hsl(var(--cocktail-card-border))] text-black cursor-pointer text-center"
                  />
                </div>
                <div className="col-span-2 text-sm text-white">ml</div>
                <div className="col-span-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => removeIngredient(index)}
                    disabled={recipe.length <= 1}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
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

      {showKeyboard && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="w-full max-w-2xl p-4">
            <div className="bg-black border border-[hsl(var(--cocktail-card-border))] rounded-lg p-4 mb-4">
              <Label className="text-white mb-2 block">
                {activeInput === "description" && "Beschreibung eingeben"}
                {activeInput === "imageUrl" && "Bild-URL eingeben"}
                {activeInput?.startsWith("amount-") && "Menge eingeben (ml)"}
              </Label>
              <Input
                value={inputValue}
                readOnly
                className="bg-white border-[hsl(var(--cocktail-card-border))] text-black text-center text-lg"
                placeholder={
                  activeInput === "description"
                    ? "Beschreibung..."
                    : activeInput === "imageUrl"
                      ? "https://..."
                      : "Menge in ml"
                }
              />
            </div>
            <VirtualKeyboard
              onInput={handleKeyboardInput}
              onConfirm={handleKeyboardConfirm}
              onCancel={handleKeyboardCancel}
              currentValue={inputValue}
              inputType={activeInput?.startsWith("amount-") ? "numeric" : "text"}
            />
          </div>
        </div>
      )}
    </>
  )
}
