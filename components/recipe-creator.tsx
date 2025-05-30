"use client"

import { useState, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Trash2, ImageIcon, Wine, GlassWater, X } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import type { Cocktail } from "@/types/cocktail"
import { ingredients as allIngredientsData } from "@/data/ingredients" // Renamed to avoid conflict
import VirtualKeyboard from "@/components/virtual-keyboard"
import AlphaKeyboard from "@/components/alpha-keyboard"
import FileBrowser from "@/components/file-browser"

interface RecipeCreatorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (newCocktail: Cocktail) => Promise<void> // onSave can be async
}

interface IngredientItem {
  id: string // For unique key in map
  ingredientId: string
  amount: number
}

export default function RecipeCreator({ isOpen, onClose, onSave }: RecipeCreatorProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [alcoholic, setAlcoholic] = useState(true)
  const [recipe, setRecipe] = useState<IngredientItem[]>([{ id: uuidv4(), ingredientId: "", amount: 0 }])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; recipe?: string; imageUrl?: string }>({})

  const [showKeyboard, setShowKeyboard] = useState(false)
  const [activeInput, setActiveInput] = useState<string | null>(null)
  const [keyboardTargetIndex, setKeyboardTargetIndex] = useState<number | null>(null)
  const [inputValue, setInputValue] = useState("")
  const [showFileBrowser, setShowFileBrowser] = useState(false)
  const [availableIngredients] = useState(allIngredientsData)

  const resetForm = useCallback(() => {
    setName("")
    setDescription("")
    setImageUrl("")
    setAlcoholic(true)
    setRecipe([{ id: uuidv4(), ingredientId: "", amount: 0 }])
    setErrors({})
    setShowKeyboard(false)
    setActiveInput(null)
    setKeyboardTargetIndex(null)
    setInputValue("")
    setShowFileBrowser(false)
  }, [])

  useEffect(() => {
    if (isOpen) {
      resetForm()
    }
  }, [isOpen, resetForm])

  const handleInputClick = (inputId: string, currentValue: string | number, index?: number) => {
    setActiveInput(inputId)
    setInputValue(String(currentValue))
    setKeyboardTargetIndex(index === undefined ? null : index)
    setShowKeyboard(true)
  }

  const handleKeyboardKeyPress = (key: string) => {
    setInputValue((prev) => prev + key)
  }

  const handleKeyboardBackspace = () => {
    setInputValue((prev) => prev.slice(0, -1))
  }

  const handleKeyboardClear = () => {
    setInputValue("")
  }

  const handleKeyboardConfirm = () => {
    if (!activeInput) return

    if (activeInput === "name") setName(inputValue)
    else if (activeInput === "description") setDescription(inputValue)
    else if (activeInput === "imageUrl") setImageUrl(inputValue)
    else if (activeInput === "amount" && keyboardTargetIndex !== null) {
      const amount = Number.parseFloat(inputValue)
      if (!isNaN(amount) && amount >= 0) {
        const updatedRecipe = [...recipe]
        updatedRecipe[keyboardTargetIndex] = { ...updatedRecipe[keyboardTargetIndex], amount }
        setRecipe(updatedRecipe)
      }
    }
    setShowKeyboard(false)
    setActiveInput(null)
    setKeyboardTargetIndex(null)
    // inputValue wird nicht zurückgesetzt, damit der Wert im Feld bleibt
  }

  const handleKeyboardCancel = () => {
    setShowKeyboard(false)
    setActiveInput(null)
    setKeyboardTargetIndex(null)
    setInputValue("") // Wert verwerfen
  }

  const handleAddIngredient = () => {
    setRecipe([...recipe, { id: uuidv4(), ingredientId: "", amount: 0 }])
  }

  const handleRemoveIngredient = (idToRemove: string) => {
    if (recipe.length <= 1) return
    setRecipe(recipe.filter((item) => item.id !== idToRemove))
  }

  const handleIngredientChange = (idToChange: string, newIngredientId: string) => {
    setRecipe(recipe.map((item) => (item.id === idToChange ? { ...item, ingredientId: newIngredientId } : item)))
  }

  const validateForm = () => {
    const newErrors: { name?: string; recipe?: string; imageUrl?: string } = {}
    if (!name.trim()) newErrors.name = "Name ist erforderlich"
    if (!imageUrl.trim()) newErrors.imageUrl = "Bild-URL oder Auswahl ist erforderlich"

    const hasValidIngredients = recipe.every((item) => item.ingredientId && item.amount > 0)
    if (!hasValidIngredients || recipe.length === 0) {
      newErrors.recipe = "Mindestens eine Zutat mit gültiger Auswahl und Menge > 0 ist erforderlich"
    }
    if (recipe.some((item) => !item.ingredientId || item.amount <= 0)) {
      newErrors.recipe = "Alle Zutaten müssen eine gültige Auswahl und eine Menge > 0 haben."
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
        image: imageUrl,
        alcoholic,
        ingredients: recipe
          .filter((item) => item.ingredientId && item.amount > 0)
          .map((item) => {
            const ingredient = availableIngredients.find((i) => i.id === item.ingredientId)
            return `${item.amount}ml ${ingredient?.name || "Unbekannte Zutat"}`
          }),
        recipe: recipe
          .filter((item) => item.ingredientId && item.amount > 0)
          .map(({ ingredientId, amount }) => ({ ingredientId, amount })),
        isActive: true, // New cocktails are active by default
      }
      await onSave(newCocktail)
      // onClose will be called by parent if save is successful
    } catch (error) {
      console.error("Fehler beim Speichern des Rezepts:", error)
      setErrors({ recipe: "Fehler beim Speichern des Rezepts. Bitte versuche es erneut." })
    } finally {
      setSaving(false)
    }
  }

  const handleOpenImageSelector = () => {
    // setActiveInput("imageUrl"); // No need to set activeInput if FileBrowser handles its own state
    setShowFileBrowser(true)
  }

  const handleFileSelect = (filePath: string) => {
    setImageUrl(filePath)
    setShowFileBrowser(false)
    // setActiveInput(null); // Reset active input if it was set
  }

  const isNumericInput = activeInput === "amount"
  const isAlphaNumericInput = ["name", "description", "imageUrl"].includes(activeInput || "")

  const handleDialogCloseInteraction = (open: boolean) => {
    if (!open) {
      if (showKeyboard || showFileBrowser) {
        // Prevent closing if keyboard or file browser is open
        // Instead, you might want to close the keyboard/filebrowser first
        if (showKeyboard) {
          setShowKeyboard(false)
          setActiveInput(null)
        }
        if (showFileBrowser) {
          setShowFileBrowser(false)
        }
        return // Keep the main dialog open
      }
      onClose() // Close main dialog
    }
  }

  return (
    <>
      <Dialog
        open={isOpen && !showFileBrowser}
        onOpenChange={(open) => {
          if (!open) {
            // If attempting to close
            if (showKeyboard) {
              setShowKeyboard(false)
              setActiveInput(null)
              // Do not call onClose() yet, keep dialog open
            } else if (showFileBrowser) {
              setShowFileBrowser(false)
              // Do not call onClose() yet, keep dialog open
            } else {
              onClose() // All sub-dialogs are closed, so close main dialog
            }
          }
        }}
      >
        <DialogContent
          className="bg-black border-[hsl(var(--cocktail-card-border))] text-white sm:max-w-lg"
          onInteractOutside={(e) => {
            if (showKeyboard || showFileBrowser) {
              e.preventDefault()
            }
          }}
          onEscapeKeyDown={(e) => {
            if (showKeyboard) {
              e.preventDefault()
              setShowKeyboard(false)
              setActiveInput(null)
            } else if (showFileBrowser) {
              e.preventDefault()
              setShowFileBrowser(false)
            } else {
              onClose() // Default behavior if no sub-dialog is open
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Neues Cocktail-Rezept erstellen</DialogTitle>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4 text-white hover:text-gray-400"
                onClick={() => handleDialogCloseInteraction(false)} // Explicitly call with false
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </DialogHeader>

          {!showKeyboard && (
            <div className="space-y-4 my-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label htmlFor="name-display">Name</Label>
                <Input
                  id="name-display"
                  value={name}
                  onClick={() => handleInputClick("name", name)}
                  readOnly
                  className={`bg-[hsl(var(--cocktail-bg))] border-[hsl(var(--cocktail-card-border))] text-white cursor-pointer ${errors.name ? "border-[hsl(var(--cocktail-error))]" : ""}`}
                  placeholder="z.B. Mein Super Cocktail"
                />
                {errors.name && <p className="text-[hsl(var(--cocktail-error))] text-xs">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description-display">Beschreibung</Label>
                <Textarea
                  id="description-display"
                  value={description}
                  onClick={() => handleInputClick("description", description)}
                  readOnly
                  className="bg-[hsl(var(--cocktail-bg))] border-[hsl(var(--cocktail-card-border))] text-white cursor-pointer"
                  placeholder="Beschreibe deinen Cocktail..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl-display">Bild</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="imageUrl-display"
                    value={imageUrl}
                    onClick={() => handleInputClick("imageUrl", imageUrl)}
                    readOnly
                    className={`flex-1 bg-[hsl(var(--cocktail-bg))] border-[hsl(var(--cocktail-card-border))] text-white cursor-pointer ${errors.imageUrl ? "border-[hsl(var(--cocktail-error))]" : ""}`}
                    placeholder="/images/cocktails/mein_cocktail.jpg"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleOpenImageSelector}
                    className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </div>
                {errors.imageUrl && <p className="text-[hsl(var(--cocktail-error))] text-xs">{errors.imageUrl}</p>}
                {imageUrl && (
                  <div className="mt-2">
                    <img
                      src={imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}
                      alt="Vorschau"
                      className="max-h-20 rounded-md border border-[hsl(var(--cocktail-card-border))]"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Cocktail-Typ</Label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setAlcoholic(true)}
                    className={`flex items-center gap-2 text-sm py-2 px-3 rounded bg-[hsl(var(--cocktail-card-bg))] ${alcoholic ? "font-semibold border-b-2 border-[hsl(var(--cocktail-primary))] text-[hsl(var(--cocktail-primary))]" : "text-[hsl(var(--cocktail-text))] hover:text-[hsl(var(--cocktail-primary))]"}`}
                  >
                    <Wine className="h-4 w-4" /> Mit Alkohol
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlcoholic(false)}
                    className={`flex items-center gap-2 text-sm py-2 px-3 rounded bg-[hsl(var(--cocktail-card-bg))] ${!alcoholic ? "font-semibold border-b-2 border-[hsl(var(--cocktail-primary))] text-[hsl(var(--cocktail-primary))]" : "text-[hsl(var(--cocktail-text))] hover:text-[hsl(var(--cocktail-primary))]"}`}
                  >
                    <GlassWater className="h-4 w-4" /> Ohne Alkohol
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Zutaten</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddIngredient}
                    className="h-8 px-2 bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-primary))] hover:text-black"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Zutat
                  </Button>
                </div>
                {errors.recipe && <p className="text-[hsl(var(--cocktail-error))] text-xs">{errors.recipe}</p>}
                {recipe.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-7">
                      <Select
                        value={item.ingredientId}
                        onValueChange={(value) => handleIngredientChange(item.id, value)}
                      >
                        <SelectTrigger className="bg-[hsl(var(--cocktail-bg))] border-[hsl(var(--cocktail-card-border))] text-white">
                          <SelectValue placeholder="Zutat wählen" />
                        </SelectTrigger>
                        <SelectContent className="bg-black text-white border-[hsl(var(--cocktail-card-border))]">
                          {availableIngredients.map((ingredient) => (
                            <SelectItem key={ingredient.id} value={ingredient.id}>
                              {ingredient.name} {ingredient.alcoholic ? "(Alk)" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Input
                        id={`amount-display-${index}`}
                        type="text"
                        value={item.amount || "0"}
                        onClick={() => handleInputClick("amount", item.amount, index)}
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
                        onClick={() => handleRemoveIngredient(item.id)}
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
          )}

          {showKeyboard && activeInput && (
            <div className="my-4">
              <div className="text-center mb-2 text-white">
                {activeInput === "name" && "Namen eingeben"}
                {activeInput === "description" && "Beschreibung eingeben"}
                {activeInput === "imageUrl" && "Bild-URL eingeben"}
                {activeInput === "amount" && "Menge eingeben (ml)"}
              </div>
              <Input
                value={inputValue}
                readOnly
                className="bg-gray-800 border-gray-700 text-white text-center text-lg mb-2"
                placeholder="Hier tippen..."
              />
              {isNumericInput ? (
                <VirtualKeyboard
                  onKeyPress={handleKeyboardKeyPress}
                  onBackspace={handleKeyboardBackspace}
                  onClear={handleKeyboardClear}
                  onConfirm={handleKeyboardConfirm}
                  onCancel={handleKeyboardCancel}
                  allowDecimal={true}
                  numericOnly={true}
                />
              ) : (
                <AlphaKeyboard
                  onKeyPress={handleKeyboardKeyPress}
                  onBackspace={handleKeyboardBackspace}
                  onClear={handleKeyboardClear}
                  onConfirm={handleKeyboardConfirm}
                  onCancel={handleKeyboardCancel}
                />
              )}
            </div>
          )}

          {!showKeyboard && (
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogCloseInteraction(false)} // Explicitly call with false
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
          )}
        </DialogContent>
      </Dialog>

      <FileBrowser
        isOpen={showFileBrowser}
        onClose={() => {
          setShowFileBrowser(false)
          // setActiveInput(null); // Reset active input if it was set
        }}
        onSelect={handleFileSelect}
      />
    </>
  )
}
