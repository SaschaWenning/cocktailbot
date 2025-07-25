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
import { Loader2, ImageIcon, Plus, Minus, FolderOpen, X, ArrowLeft, Check, ArrowUp, Lock } from "lucide-react"
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

  // Tastatur-States - INNERHALB des Dialogs
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [keyboardMode, setKeyboardMode] = useState<"name" | "description" | "imageUrl" | string>("name")
  const [keyboardValue, setKeyboardValue] = useState("")
  const [isNumericKeyboard, setIsNumericKeyboard] = useState(false)
  const [isShiftActive, setIsShiftActive] = useState(false)
  const [isCapsLockActive, setIsCapsLockActive] = useState(false)

  useEffect(() => {
    if (recipe.length === 0) {
      addIngredient()
    }
  }, [recipe])

  // Tastatur öffnen
  const openKeyboard = (mode: "name" | "description" | "imageUrl" | string, currentValue: string, numeric = false) => {
    setKeyboardMode(mode)
    setKeyboardValue(currentValue)
    setIsNumericKeyboard(numeric)
    setShowKeyboard(true)
    // Reset keyboard states when opening
    setIsShiftActive(false)
    setIsCapsLockActive(false)
  }

  // Tastatur-Eingabe
  const handleKeyPress = (key: string) => {
    if (isNumericKeyboard) {
      if (key === "." && keyboardValue.includes(".")) return
      if (key === "00" && keyboardValue === "") {
        setKeyboardValue("0")
        return
      }
      setKeyboardValue((prev) => prev + key)
    } else {
      // Handle uppercase/lowercase for letters
      let finalKey = key
      if (key.match(/[a-zA-Z]/)) {
        if (isShiftActive || isCapsLockActive) {
          finalKey = key.toUpperCase()
        } else {
          finalKey = key.toLowerCase()
        }
      }

      setKeyboardValue((prev) => prev + finalKey)

      // Reset shift after typing (but not caps lock)
      if (isShiftActive) {
        setIsShiftActive(false)
      }
    }
  }

  const handleShift = () => {
    setIsShiftActive(!isShiftActive)
  }

  const handleCapsLock = () => {
    setIsCapsLockActive(!isCapsLockActive)
    // Turn off shift when caps lock is toggled
    setIsShiftActive(false)
  }

  const handleBackspace = () => {
    setKeyboardValue((prev) => prev.slice(0, -1))
  }

  const handleClear = () => {
    setKeyboardValue("")
  }

  // Tastatur bestätigen
  const handleKeyboardConfirm = () => {
    if (keyboardMode === "name") {
      setName(keyboardValue)
    } else if (keyboardMode === "description") {
      setDescription(keyboardValue)
    } else if (keyboardMode === "imageUrl") {
      setImageUrl(keyboardValue)
    } else if (keyboardMode.startsWith("amount-")) {
      const index = Number.parseInt(keyboardMode.replace("amount-", ""), 10)
      const amount = Number.parseFloat(keyboardValue)
      if (!isNaN(amount) && amount >= 0) {
        handleAmountChange(index, amount)
      }
    }
    setShowKeyboard(false)
  }

  // Tastatur abbrechen
  const handleKeyboardCancel = () => {
    setShowKeyboard(false)
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
    }
  }

  const removeIngredient = (index: number) => {
    if (recipe.length > 1) {
      const updatedRecipe = recipe.filter((_, i) => i !== index)
      setRecipe(updatedRecipe)
    }
  }

  const validateForm = () => {
    const newErrors: { name?: string; imageUrl?: string } = {}

    if (!name.trim()) {
      newErrors.name = "Name ist erforderlich"
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
      // Reset
      setName("")
      setDescription("")
      setRecipe([])
      setImageUrl("")
      setAlcoholic(true)
      setErrors({})
    } catch (error) {
      console.error("Fehler beim Speichern:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleSelectImageFromBrowser = (imagePath: string) => {
    setImageUrl(imagePath)
    setShowFileBrowser(false)
  }

  // Tastaturen definieren
  const alphaKeys = [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    ["Q", "W", "E", "R", "T", "Z", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Y", "X", "C", "V", "B", "N", "M"],
    [" ", "-", "_", ".", "/"],
  ]

  const numericKeys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["0", "00", "."],
  ]

  const keys = isNumericKeyboard ? numericKeys : alphaKeys

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && !showFileBrowser && onClose()}>
        <DialogContent className="bg-black border-[hsl(var(--cocktail-card-border))] text-white sm:max-w-4xl max-h-[95vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Neues Rezept erstellen</DialogTitle>
          </DialogHeader>

          {!showKeyboard ? (
            // FORMULAR-ANSICHT
            <div className="space-y-4 my-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label className="text-white">Name</Label>
                <Input
                  value={name}
                  onClick={() => openKeyboard("name", name)}
                  readOnly
                  className={`bg-white border-[hsl(var(--cocktail-card-border))] text-black cursor-pointer ${errors.name ? "border-red-500" : ""}`}
                  placeholder="Name des Cocktails"
                />
                {errors.name && <p className="text-red-400 text-xs">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-white">Beschreibung</Label>
                <Input
                  value={description}
                  onClick={() => openKeyboard("description", description)}
                  readOnly
                  className="bg-white border-[hsl(var(--cocktail-card-border))] text-black cursor-pointer"
                  placeholder="Beschreibe deinen Cocktail..."
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-white">
                  <ImageIcon className="h-4 w-4" />
                  Bild-Pfad (optional)
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={imageUrl}
                    onClick={() => openKeyboard("imageUrl", imageUrl)}
                    readOnly
                    className="bg-white border-[hsl(var(--cocktail-card-border))] text-black cursor-pointer flex-1"
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
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => setImageUrl("")}
                      className="h-10 w-10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Alkoholisch</Label>
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
                      value={item.amount}
                      onClick={() => openKeyboard(`amount-${index}`, item.amount.toString(), true)}
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
          ) : (
            // TASTATUR-ANSICHT - Tastatur links, Action-Buttons rechts
            <div className="flex gap-3 my-4 h-[70vh]">
              {/* Tastatur links */}
              <div className="flex-1 flex flex-col">
                <div className="text-center mb-3">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {keyboardMode === "name" && "Name eingeben"}
                    {keyboardMode === "description" && "Beschreibung eingeben"}
                    {keyboardMode === "imageUrl" && "Bild-Pfad eingeben"}
                    {keyboardMode.startsWith("amount-") && "Menge eingeben (ml)"}
                  </h3>
                  <div className="bg-white text-black text-lg p-3 rounded mb-4 min-h-[50px] break-all">
                    {keyboardValue || <span className="text-gray-400">Eingabe...</span>}
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-2">
                  {keys.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex gap-1 justify-center flex-1">
                      {row.map((key) => (
                        <Button
                          key={key}
                          type="button"
                          onClick={() => handleKeyPress(key)}
                          className="flex-1 text-lg bg-gray-700 hover:bg-gray-600 text-white min-h-0 h-full"
                        >
                          {key}
                        </Button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons rechts */}
              <div className="flex flex-col gap-2 w-24">
                {/* Shift und Caps nur für Alpha-Tastatur */}
                {!isNumericKeyboard && (
                  <>
                    <Button
                      type="button"
                      onClick={handleShift}
                      className={`h-16 text-white flex flex-col items-center justify-center ${
                        isShiftActive ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-700 hover:bg-gray-600"
                      }`}
                    >
                      <ArrowUp className="h-4 w-4" />
                      <span className="text-xs">Shift</span>
                    </Button>
                    <Button
                      type="button"
                      onClick={handleCapsLock}
                      className={`h-16 text-white flex flex-col items-center justify-center ${
                        isCapsLockActive ? "bg-orange-600 hover:bg-orange-700" : "bg-gray-700 hover:bg-gray-600"
                      }`}
                    >
                      <Lock className="h-4 w-4" />
                      <span className="text-xs">Caps</span>
                    </Button>
                  </>
                )}

                <Button
                  type="button"
                  onClick={handleBackspace}
                  className="h-16 bg-red-700 hover:bg-red-600 text-white flex flex-col items-center justify-center"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-xs">Back</span>
                </Button>
                <Button
                  type="button"
                  onClick={handleClear}
                  className="h-16 bg-yellow-700 hover:bg-yellow-600 text-white flex flex-col items-center justify-center"
                >
                  <X className="h-4 w-4" />
                  <span className="text-xs">Clear</span>
                </Button>
                <Button
                  type="button"
                  onClick={handleKeyboardCancel}
                  className="h-16 bg-gray-700 hover:bg-gray-600 text-white flex flex-col items-center justify-center"
                >
                  <span className="text-xs">Cancel</span>
                </Button>
                <Button
                  type="button"
                  onClick={handleKeyboardConfirm}
                  className="h-16 bg-green-700 hover:bg-green-600 text-white flex flex-col items-center justify-center"
                >
                  <Check className="h-4 w-4" />
                  <span className="text-xs">OK</span>
                </Button>
              </div>
            </div>
          )}

          {!showKeyboard && (
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
          )}
        </DialogContent>
      </Dialog>

      {/* Dateibrowser */}
      <FileBrowser
        isOpen={showFileBrowser}
        onClose={() => setShowFileBrowser(false)}
        onSelectImage={handleSelectImageFromBrowser}
      />
    </>
  )
}
