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
import { Loader2, ImageIcon, Plus, Minus, FolderOpen, X } from "lucide-react"
import SimpleKeyboard from "./simple-keyboard"
import FileBrowser from "./file-browser"

interface RecipeCreatorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (newCocktail: Cocktail) => void
}

export default function RecipeCreator({ isOpen, onClose, onSave }: RecipeCreatorProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [recipe, setRecipe] = useState<{ ingredientId: string; amount: number }[]>([])
  const [imageUrl, setImageUrl] = useState("")
  const [alcoholic, setAlcoholic] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<{
    name?: string
    imageUrl?: string
  }>({})
  const [showFileBrowser, setShowFileBrowser] = useState(false)

  // Tastatur-States
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [keyboardTitle, setKeyboardTitle] = useState("")
  const [keyboardValue, setKeyboardValue] = useState("")
  const [keyboardLayout, setKeyboardLayout] = useState<"alphanumeric" | "numeric">("alphanumeric")
  const [keyboardPlaceholder, setKeyboardPlaceholder] = useState("")
  const [keyboardCallback, setKeyboardCallback] = useState<((value: string) => void) | null>(null)

  useEffect(() => {
    if (recipe.length === 0) {
      addIngredient()
    }
  }, [recipe])

  const openKeyboard = (
    title: string,
    currentValue: string,
    layout: "alphanumeric" | "numeric",
    placeholder: string,
    callback: (value: string) => void,
  ) => {
    setKeyboardTitle(title)
    setKeyboardValue(currentValue)
    setKeyboardLayout(layout)
    setKeyboardPlaceholder(placeholder)
    setKeyboardCallback(() => callback)
    setShowKeyboard(true)
  }

  const handleKeyboardConfirm = () => {
    if (keyboardCallback) {
      keyboardCallback(keyboardValue)
    }
    setShowKeyboard(false)
    setKeyboardCallback(null)
  }

  const handleKeyboardCancel = () => {
    setShowKeyboard(false)
    setKeyboardCallback(null)
  }

  const handleNameInput = () => {
    openKeyboard("Name eingeben", name, "alphanumeric", "Name des Cocktails", setName)
  }

  const handleDescriptionInput = () => {
    openKeyboard("Beschreibung eingeben", description, "alphanumeric", "Beschreibe deinen Cocktail...", setDescription)
  }

  const handleImageUrlInput = () => {
    openKeyboard("Bild-Pfad eingeben", imageUrl, "alphanumeric", "/pfad/zum/bild.jpg", setImageUrl)
  }

  const handleAmountInput = (index: number) => {
    const currentAmount = recipe[index]?.amount?.toString() || ""
    openKeyboard("Menge eingeben (ml)", currentAmount, "numeric", "Menge in ml", (value: string) => {
      const amount = Number.parseFloat(value)
      if (!isNaN(amount) && amount >= 0) {
        handleAmountChange(index, amount)
      }
    })
  }

  const handleAmountChange = (index: number, amount: number) => {
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
    } else {
      console.warn("Alle Zutaten sind bereits im Rezept enthalten.")
    }
  }

  const removeIngredient = (index: number) => {
    if (recipe.length > 1) {
      const updatedRecipe = recipe.filter((_, i) => i !== index)
      setRecipe(updatedRecipe)
    }
  }

  const isValidUrl = (url: string) => {
    if (!url) return true
    if (url.startsWith("/")) return true
    try {
      new URL(url)
      return true
    } catch (e) {
      return false
    }
  }

  const validateForm = () => {
    const newErrors: { name?: string; imageUrl?: string } = {}

    if (!name.trim()) {
      newErrors.name = "Name ist erforderlich"
    }

    if (imageUrl && !isValidUrl(imageUrl)) {
      newErrors.imageUrl = "Bitte gib eine gültige URL ein"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setSaving(true)
    try {
      const newCocktailId = `custom-${Date.now()}`

      const newCocktail: Cocktail = {
        id: newCocktailId,
        name: name.trim(),
        description: description.trim(),
        image: imageUrl || "/placeholder.svg?height=200&width=400",
        alcoholic: alcoholic,
        recipe: recipe,
        ingredients: recipe.map((item) => {
          const ingredient = ingredients.find((i) => i.id === item.ingredientId)
          return `${item.amount}ml ${ingredient?.name || item.ingredientId}`
        }),
      }

      await saveRecipe(newCocktail)
      onSave(newCocktail)
      onClose()
      // Formular zurücksetzen
      setName("")
      setDescription("")
      setRecipe([])
      setImageUrl("")
      setAlcoholic(true)
      setErrors({})
    } catch (error) {
      console.error("Fehler beim Speichern des neuen Rezepts:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleSelectImageFromBrowser = (imagePath: string) => {
    setImageUrl(imagePath)
    setShowFileBrowser(false)
  }

  const clearImage = () => {
    setImageUrl("")
  }

  // Verhindere das Schließen des Haupt-Dialogs, wenn die Tastatur oder der Dateibrowser geöffnet ist
  const handleMainDialogOpenChange = (open: boolean) => {
    if (!open && (showKeyboard || showFileBrowser)) {
      return
    }
    if (!open) {
      onClose()
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleMainDialogOpenChange}>
        <DialogContent className="bg-black border-[hsl(var(--cocktail-card-border))] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Neues Rezept erstellen</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 my-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onClick={handleNameInput}
                readOnly
                className={`bg-white border-[hsl(var(--cocktail-card-border))] text-black cursor-pointer ${errors.name ? "border-red-500" : ""}`}
                placeholder="Name des Cocktails"
              />
              {errors.name && <p className="text-red-400 text-xs">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-white">
                Beschreibung
              </Label>
              <Input
                id="description"
                value={description}
                onClick={handleDescriptionInput}
                readOnly
                className="bg-white border-[hsl(var(--cocktail-card-border))] text-black cursor-pointer"
                placeholder="Beschreibe deinen Cocktail..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl" className="flex items-center gap-2 text-white">
                <ImageIcon className="h-4 w-4" />
                Bild-Pfad (optional)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="imageUrl"
                  value={imageUrl}
                  onClick={handleImageUrlInput}
                  readOnly
                  className={`bg-white border-[hsl(var(--cocktail-card-border))] text-black cursor-pointer flex-1 ${errors.imageUrl ? "border-red-500" : ""}`}
                  placeholder="/pfad/zum/bild.jpg"
                />
                <Button
                  type="button"
                  onClick={() => setShowFileBrowser(true)}
                  className="bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
                {imageUrl && (
                  <Button type="button" variant="destructive" size="icon" onClick={clearImage} className="h-10 w-10">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {errors.imageUrl && <p className="text-red-400 text-xs">{errors.imageUrl}</p>}
              <p className="text-xs text-gray-300">
                Wähle ein Bild aus dem Dateisystem aus oder gib den Pfad manuell ein.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alcoholic" className="text-white">
                Alkoholisch
              </Label>
              <Select value={alcoholic ? "true" : "false"} onValueChange={(value) => setAlcoholic(value === "true")}>
                <SelectTrigger className="bg-white border-[hsl(var(--cocktail-card-border))] text-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-[hsl(var(--cocktail-card-border))]">
                  <SelectItem value="true" className="text-black hover:bg-gray-100 cursor-pointer">
                    Ja
                  </SelectItem>
                  <SelectItem value="false" className="text-black hover:bg-gray-100 cursor-pointer">
                    Nein
                  </SelectItem>
                </SelectContent>
              </Select>
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
                    onClick={() => handleAmountInput(index)}
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

          <DialogFooter className="flex justify-end gap-2">
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

      {/* Dateibrowser */}
      <FileBrowser
        isOpen={showFileBrowser}
        onClose={() => setShowFileBrowser(false)}
        onSelectImage={handleSelectImageFromBrowser}
      />

      {/* Einfache Tastatur */}
      <SimpleKeyboard
        isOpen={showKeyboard}
        title={keyboardTitle}
        value={keyboardValue}
        onValueChange={setKeyboardValue}
        onConfirm={handleKeyboardConfirm}
        onCancel={handleKeyboardCancel}
        layout={keyboardLayout}
        placeholder={keyboardPlaceholder}
      />
    </>
  )
}
