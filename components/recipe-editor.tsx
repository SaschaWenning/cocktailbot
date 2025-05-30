"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Cocktail } from "@/types/cocktail"
import { ingredients } from "@/data/ingredients"
import { saveRecipe } from "@/lib/cocktail-machine"
import { Loader2, ImageIcon, Trash2, Plus, Minus, FolderOpen, XIcon, EyeOff, Eye } from "lucide-react"
import VirtualKeyboard from "./virtual-keyboard"
import FileBrowser from "./file-browser"
import { Switch } from "@/components/ui/switch" // Import Switch

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
  const [isActive, setIsActive] = useState(true) // Neuer State für Aktiv/Deaktiviert
  const [saving, setSaving] = useState(false)
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [activeInput, setActiveInput] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState("")
  const [showFileBrowser, setShowFileBrowser] = useState(false)
  const [errors, setErrors] = useState<{
    imageUrl?: string
  }>({})

  useEffect(() => {
    if (cocktail) {
      setRecipe([...cocktail.recipe])

      let imagePath = cocktail.image || ""
      if (imagePath.startsWith("/placeholder")) {
        setImageUrl("")
      } else {
        imagePath = imagePath.split("?")[0]
        if (imagePath && !imagePath.startsWith("http")) {
          if (!imagePath.startsWith("/")) {
            imagePath = `/${imagePath}`
          }
        }
        setImageUrl(imagePath)
      }
      setDescription(cocktail.description)
      setIsActive(cocktail.isActive === undefined ? true : cocktail.isActive) // isActive initialisieren
      console.log(`Editor loaded for ${cocktail.name} with image path: ${imagePath}, isActive: ${cocktail.isActive}`)
    } else {
      // Reset state when no cocktail is provided (e.g. dialog closes)
      setRecipe([])
      setImageUrl("")
      setDescription("")
      setIsActive(true)
    }
  }, [cocktail])

  const handleInputFocus = useCallback((inputType: string, currentValue = "") => {
    setActiveInput(inputType)
    setInputValue(currentValue)
    setShowKeyboard(true)
  }, [])

  const handleKeyPress = useCallback(
    (key: string) => {
      if (activeInput?.startsWith("amount-") && key === "." && inputValue.includes(".")) {
        return
      }
      setInputValue((prev) => prev + key)
    },
    [activeInput, inputValue],
  )

  const handleBackspace = useCallback(() => {
    setInputValue((prev) => prev.slice(0, -1))
  }, [])

  const handleClear = useCallback(() => {
    setInputValue("")
  }, [])

  const updateIngredientsList = useCallback((newRecipe: { ingredientId: string; amount: number }[]) => {
    return newRecipe.map((item) => {
      const ingredient = ingredients.find((i) => i.id === item.ingredientId)
      const ingredientName = ingredient ? ingredient.name : item.ingredientId
      return `${item.amount}ml ${ingredientName}`
    })
  }, [])

  const handleKeyboardConfirm = useCallback(() => {
    if (!activeInput) return

    if (activeInput === "description") {
      setDescription(inputValue)
    } else if (activeInput === "imageUrl") {
      setImageUrl(inputValue)
    } else if (activeInput.startsWith("amount-")) {
      const index = Number.parseInt(activeInput.replace("amount-", ""))
      const amount = Number.parseFloat(inputValue)
      if (!isNaN(amount) && amount >= 0) {
        setRecipe((prevRecipe) => {
          const updatedRecipe = [...prevRecipe]
          updatedRecipe[index] = { ...updatedRecipe[index], amount }
          return updatedRecipe
        })
      }
    }

    setShowKeyboard(false)
    setActiveInput(null)
    setInputValue("")
  }, [activeInput, inputValue])

  const handleKeyboardCancel = useCallback(() => {
    setShowKeyboard(false)
    setActiveInput(null)
    setInputValue("")
  }, [])

  const handleIngredientChange = useCallback((index: number, ingredientId: string) => {
    setRecipe((prevRecipe) => {
      const updatedRecipe = [...prevRecipe]
      updatedRecipe[index] = { ...updatedRecipe[index], ingredientId }
      return updatedRecipe
    })
  }, [])

  const addIngredient = useCallback(() => {
    const availableIngredients = ingredients.filter(
      (ingredient) => !recipe.some((item) => item.ingredientId === ingredient.id),
    )

    if (availableIngredients.length > 0) {
      setRecipe((prevRecipe) => [...prevRecipe, { ingredientId: availableIngredients[0].id, amount: 30 }])
    }
  }, [recipe])

  const removeIngredient = useCallback(
    (index: number) => {
      if (recipe.length > 1) {
        setRecipe((prevRecipe) => prevRecipe.filter((_, i) => i !== index))
      }
    },
    [recipe.length],
  )

  const isValidUrl = useCallback((url: string) => {
    if (!url) return true
    if (url.startsWith("/")) return true
    try {
      new URL(url)
      return true
    } catch (e) {
      return false
    }
  }, [])

  const validateForm = useCallback(() => {
    const newErrors: { imageUrl?: string } = {}
    if (imageUrl && !isValidUrl(imageUrl)) {
      newErrors.imageUrl = "Bitte gib eine gültige URL ein"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [imageUrl, isValidUrl])

  const handleSave = useCallback(async () => {
    if (!cocktail || !validateForm()) return

    setSaving(true)
    try {
      const updatedIngredients = updateIngredientsList(recipe)
      const updatedCocktail: Cocktail = {
        ...cocktail,
        description: description,
        image: imageUrl || `/placeholder.svg?height=200&width=400&query=${encodeURIComponent(cocktail.name)}`,
        recipe: recipe,
        ingredients: updatedIngredients,
        isActive: isActive, // isActive Wert speichern
      }

      await saveRecipe(updatedCocktail)
      onSave(updatedCocktail)
      onClose()
    } catch (error) {
      console.error("Fehler beim Speichern des Rezepts:", error)
    } finally {
      setSaving(false)
    }
  }, [cocktail, validateForm, recipe, description, imageUrl, isActive, updateIngredientsList, onSave, onClose])

  const handleDeleteRequest = useCallback(() => {
    if (!cocktail) return
    onRequestDelete(cocktail.id)
  }, [cocktail, onRequestDelete])

  const handleFileSelect = useCallback((path: string) => {
    setImageUrl(path)
    setShowFileBrowser(false)
  }, [])

  const isNumericInput = activeInput?.startsWith("amount-") ?? false

  if (!cocktail) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogPortal>
          <DialogOverlay />
          <DialogContent
            className="bg-black border-[hsl(var(--cocktail-card-border))] text-white sm:max-w-md"
            onInteractOutside={(e) => {
              if (showKeyboard || showFileBrowser) {
                e.preventDefault()
              }
            }}
            onEscapeKeyDown={(e) => {
              if (showKeyboard) {
                e.preventDefault()
                handleKeyboardCancel()
              } else if (showFileBrowser) {
                e.preventDefault()
                setShowFileBrowser(false)
              }
            }}
          >
            <DialogHeader className="flex flex-row justify-between items-center">
              <DialogTitle>Rezept bearbeiten: {cocktail.name}</DialogTitle>
              <DialogClose asChild>
                <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
                  <XIcon className="h-5 w-5" />
                </Button>
              </DialogClose>
            </DialogHeader>

            <div className="space-y-4 my-4 max-h-[60vh] overflow-y-auto pr-2">
              {/* Aktiv/Deaktiviert Schalter */}
              <div className="flex items-center justify-between p-3 bg-[hsl(var(--cocktail-card-bg))] rounded border border-[hsl(var(--cocktail-card-border))]">
                <Label htmlFor="isActive" className="text-white flex items-center">
                  {isActive ? (
                    <Eye className="h-5 w-5 mr-2 text-green-400" />
                  ) : (
                    <EyeOff className="h-5 w-5 mr-2 text-red-400" />
                  )}
                  {isActive ? "Cocktail ist Aktiv" : "Cocktail ist Deaktiviert"}
                </Label>
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
                />
              </div>

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
                  Bild-URL oder Pfad
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="imageUrl"
                    value={imageUrl}
                    onClick={() => handleInputFocus("imageUrl", imageUrl)}
                    readOnly
                    className={`flex-1 bg-white border-[hsl(var(--cocktail-card-border))] text-black cursor-pointer ${errors.imageUrl ? "border-red-500" : ""}`}
                    placeholder="/images/cocktails/mein-cocktail.jpg"
                  />
                  <Button
                    type="button"
                    onClick={() => setShowFileBrowser(true)}
                    className="bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
                  >
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                </div>
                {errors.imageUrl && <p className="text-red-400 text-xs">{errors.imageUrl}</p>}
                <p className="text-xs text-gray-300">
                  Wähle ein Bild aus oder gib einen Pfad ein. Leer lassen für ein Platzhalterbild.
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
                  key={`${item.ingredientId}-${index}`}
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
        </DialogPortal>
      </Dialog>

      {showKeyboard && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-[9999]">
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
                      ? "https://... oder /pfad/zum/bild.jpg"
                      : "Menge in ml"
                }
              />
            </div>
            <VirtualKeyboard
              onKeyPress={handleKeyPress}
              onBackspace={handleBackspace}
              onClear={handleClear}
              onConfirm={handleKeyboardConfirm}
              onCancel={handleKeyboardCancel}
              allowDecimal={isNumericInput}
              numericOnly={isNumericInput}
            />
          </div>
        </div>
      )}

      <FileBrowser
        isOpen={showFileBrowser}
        onClose={() => setShowFileBrowser(false)}
        onSelect={handleFileSelect}
        fileTypes={["jpg", "jpeg", "png", "gif"]}
      />
    </>
  )
}
