"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Trash2, ImageIcon } from "lucide-react"
import type { Cocktail } from "@/types/cocktail"
import type { Ingredient } from "@/types/pump"
import { getAllIngredients } from "@/lib/ingredient-manager"
import VirtualKeyboard from "@/components/virtual-keyboard"
import AlphaKeyboard from "@/components/alpha-keyboard"
import FileBrowser from "@/components/file-browser"
import { Switch } from "@/components/ui/switch"

interface RecipeCreatorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (newCocktail: Cocktail) => Promise<void>
}

export default function RecipeCreator({ isOpen, onClose, onSave }: RecipeCreatorProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [alcoholic, setAlcoholic] = useState(true)
  const [recipe, setRecipe] = useState<{ ingredientId: string; amount: number }[]>([{ ingredientId: "", amount: 0 }])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; recipe?: string }>({})

  const [showFileBrowser, setShowFileBrowser] = useState(false)
  const [showAlphaKeyboard, setShowAlphaKeyboard] = useState(false)
  const [showNumericKeyboard, setShowNumericKeyboard] = useState(false)
  const [activeField, setActiveField] = useState<"name" | "description" | "imageUrl" | null>(null)
  const [activeAmountIndex, setActiveAmountIndex] = useState<number | null>(null)
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([])
  const [loadingIngredients, setLoadingIngredients] = useState(false)

  useEffect(() => {
    if (isOpen) {
      resetForm()
      loadIngredients()
    }
  }, [isOpen])

  const resetForm = () => {
    setName("")
    setDescription("")
    setImageUrl("")
    setAlcoholic(true)
    setRecipe([{ ingredientId: "", amount: 0 }])
    setErrors({})
    setShowAlphaKeyboard(false)
    setShowNumericKeyboard(false)
    setShowFileBrowser(false)
    setActiveField(null)
    setActiveAmountIndex(null)
  }

  const loadIngredients = async () => {
    setLoadingIngredients(true)
    try {
      const ingredients = await getAllIngredients()
      setAvailableIngredients(ingredients)
    } catch (error) {
      console.error("Fehler beim Laden der Zutaten:", error)
    } finally {
      setLoadingIngredients(false)
    }
  }

  const handleAddIngredient = () => {
    setRecipe([...recipe, { ingredientId: "", amount: 0 }])
  }

  const handleRemoveIngredient = (index: number) => {
    if (recipe.length <= 1) return
    const newRecipe = [...recipe]
    newRecipe.splice(index, 1)
    setRecipe(newRecipe)
  }

  const handleIngredientChange = (index: number, ingredientId: string) => {
    const newRecipe = [...recipe]
    newRecipe[index].ingredientId = ingredientId
    setRecipe(newRecipe)
  }

  const handleAmountChange = (index: number, amount: number) => {
    const newRecipe = [...recipe]
    newRecipe[index].amount = amount
    setRecipe(newRecipe)
  }

  const validateForm = () => {
    const newErrors: { name?: string; recipe?: string } = {}
    if (!name.trim()) newErrors.name = "Name ist erforderlich"

    const hasValidIngredients = recipe.some((item) => item.ingredientId && item.amount > 0)
    if (!hasValidIngredients) {
      newErrors.recipe = "Mindestens eine Zutat mit gültiger Auswahl und Menge > 0 ist erforderlich"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return
    setSaving(true)
    try {
      const ingredientsList = recipe
        .filter((item) => item.ingredientId && item.amount > 0)
        .map((item) => {
          const ingredient = availableIngredients.find((i) => i.id === item.ingredientId)
          return `${item.amount}ml ${ingredient?.name || "Unbekannte Zutat"}`
        })

      const newCocktail: Cocktail = {
        id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name,
        description,
        image: imageUrl || `/placeholder.svg?height=400&width=400&query=${encodeURIComponent(name)}`,
        alcoholic,
        ingredients: ingredientsList,
        recipe: recipe.filter((item) => item.ingredientId && item.amount > 0),
        isActive: true,
      }
      await onSave(newCocktail)
      onClose()
    } catch (error) {
      console.error("Fehler beim Speichern des Rezepts:", error)
    } finally {
      setSaving(false)
    }
  }

  // Tastatur-Handler
  const handleOpenAlphaKeyboard = (field: "name" | "description" | "imageUrl") => {
    setActiveField(field)
    setShowAlphaKeyboard(true)
  }

  const handleOpenNumericKeyboard = (index: number) => {
    setActiveAmountIndex(index)
    setShowNumericKeyboard(true)
  }

  const handleAlphaKeyboardConfirm = (value: string) => {
    if (activeField === "name") setName(value)
    else if (activeField === "description") setDescription(value)
    else if (activeField === "imageUrl") setImageUrl(value)
    setShowAlphaKeyboard(false)
    setActiveField(null)
  }

  const handleNumericKeyboardConfirm = (value: string) => {
    if (activeAmountIndex !== null) {
      const amount = Number.parseInt(value) || 0
      handleAmountChange(activeAmountIndex, amount)
    }
    setShowNumericKeyboard(false)
    setActiveAmountIndex(null)
  }

  const handleKeyboardCancel = () => {
    setShowAlphaKeyboard(false)
    setShowNumericKeyboard(false)
    setActiveField(null)
    setActiveAmountIndex(null)
  }

  const getCurrentValue = () => {
    if (activeField === "name") return name
    if (activeField === "description") return description
    if (activeField === "imageUrl") return imageUrl
    if (activeAmountIndex !== null) return recipe[activeAmountIndex].amount.toString()
    return ""
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-black border-[hsl(var(--cocktail-card-border))] text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[hsl(var(--cocktail-text))]">Neues Cocktail-Rezept erstellen</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 my-4 max-h-[60vh] overflow-y-auto pr-2">
            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[hsl(var(--cocktail-text))]">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onClick={() => handleOpenAlphaKeyboard("name")}
                readOnly
                className={`bg-[hsl(var(--cocktail-bg))] border-[hsl(var(--cocktail-card-border))] text-white cursor-pointer ${errors.name ? "border-red-500" : ""}`}
                placeholder="z.B. Mein Super Cocktail"
              />
              {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
            </div>

            {/* Description Input */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-[hsl(var(--cocktail-text))]">
                Beschreibung
              </Label>
              <Textarea
                id="description"
                value={description}
                onClick={() => handleOpenAlphaKeyboard("description")}
                readOnly
                className="bg-[hsl(var(--cocktail-bg))] border-[hsl(var(--cocktail-card-border))] text-white cursor-pointer"
                placeholder="Beschreibe deinen Cocktail..."
                rows={2}
              />
            </div>

            {/* Image URL Input & File Browser */}
            <div className="space-y-2">
              <Label htmlFor="imageUrl" className="text-[hsl(var(--cocktail-text))]">
                Bild (optional)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="imageUrl"
                  value={imageUrl}
                  onClick={() => handleOpenAlphaKeyboard("imageUrl")}
                  readOnly
                  className="flex-1 bg-[hsl(var(--cocktail-bg))] border-[hsl(var(--cocktail-card-border))] text-white cursor-pointer"
                  placeholder="Bild auswählen oder URL eingeben"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFileBrowser(true)}
                  className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </div>
              {imageUrl && (
                <div className="mt-2 h-32 relative rounded overflow-hidden border border-[hsl(var(--cocktail-card-border))]">
                  <img
                    src={imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}
                    alt="Vorschau"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `/placeholder.svg?height=128&width=128&query=${encodeURIComponent(name || "Cocktail")}`
                    }}
                  />
                </div>
              )}
            </div>

            {/* Cocktail Type */}
            <div className="space-y-2">
              <Label className="text-[hsl(var(--cocktail-text))]">Cocktail-Typ</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="alcoholic"
                  checked={alcoholic}
                  onCheckedChange={setAlcoholic}
                  className="data-[state=checked]:bg-[hsl(var(--cocktail-primary))] data-[state=unchecked]:bg-gray-700"
                />
                <Label htmlFor="alcoholic" className="text-[hsl(var(--cocktail-text))]">
                  {alcoholic ? "Mit Alkohol" : "Ohne Alkohol"}
                </Label>
              </div>
            </div>

            {/* Ingredients */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-[hsl(var(--cocktail-text))]">Zutaten</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddIngredient}
                  className="h-8 px-2 bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-primary))] hover:text-black"
                >
                  <Plus className="h-4 w-4 mr-1" /> Zutat hinzufügen
                </Button>
              </div>
              {errors.recipe && <p className="text-red-500 text-xs">{errors.recipe}</p>}
              {recipe.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-7">
                    <Select value={item.ingredientId} onValueChange={(value) => handleIngredientChange(index, value)}>
                      <SelectTrigger className="bg-[hsl(var(--cocktail-bg))] border-[hsl(var(--cocktail-card-border))] text-white">
                        <SelectValue placeholder="Zutat wählen" />
                      </SelectTrigger>
                      <SelectContent className="bg-black text-white border-[hsl(var(--cocktail-card-border))]">
                        {loadingIngredients ? (
                          <div className="flex items-center justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span>Lade Zutaten...</span>
                          </div>
                        ) : (
                          availableIngredients.map((ingredient) => (
                            <SelectItem key={ingredient.id} value={ingredient.id}>
                              {ingredient.name} {ingredient.alcoholic ? "(Alk)" : ""}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="text"
                      value={item.amount || ""}
                      onClick={() => handleOpenNumericKeyboard(index)}
                      readOnly
                      className="bg-[hsl(var(--cocktail-bg))] border-[hsl(var(--cocktail-card-border))] text-white cursor-pointer text-right pr-2"
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
                      className="h-8 w-8 text-white hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
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
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Speichern...
                </>
              ) : (
                "Speichern"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlphaKeyboard für Text-Eingaben */}
      {showAlphaKeyboard && activeField && (
        <AlphaKeyboard
          targetInput={null}
          initialValue={getCurrentValue()}
          onClose={handleKeyboardCancel}
          onConfirm={handleAlphaKeyboardConfirm}
          maxLength={activeField === "name" ? 50 : activeField === "description" ? 200 : 100}
        />
      )}

      {/* VirtualKeyboard für numerische Eingaben */}
      {showNumericKeyboard && activeAmountIndex !== null && (
        <VirtualKeyboard
          targetInput={null}
          initialValue={getCurrentValue()}
          onClose={handleKeyboardCancel}
          onConfirm={handleNumericKeyboardConfirm}
          allowDecimal={false}
          maxLength={4}
        />
      )}

      {/* FileBrowser für Bildauswahl */}
      {showFileBrowser && (
        <FileBrowser
          isOpen={showFileBrowser}
          onClose={() => setShowFileBrowser(false)}
          onSelect={(filePath) => {
            setImageUrl(filePath)
            setShowFileBrowser(false)
          }}
        />
      )}
    </>
  )
}
