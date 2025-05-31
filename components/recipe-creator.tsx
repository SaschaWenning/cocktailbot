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
import { ingredients as allIngredients } from "@/data/ingredients"
import { saveRecipe as saveCocktailRecipe } from "@/lib/cocktail-machine"
import VirtualKeyboard from "@/components/virtual-keyboard"
import AlphaKeyboard from "@/components/alpha-keyboard"
import FileBrowser from "@/components/file-browser" // Import FileBrowser

interface RecipeCreatorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (newCocktail: Cocktail) => void
}

export default function RecipeCreator({ isOpen, onClose, onSave }: RecipeCreatorProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [alcoholic, setAlcoholic] = useState(true)
  const [recipe, setRecipe] = useState<{ ingredientId: string; amount: number }[]>([{ ingredientId: "", amount: 0 }])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; recipe?: string; imageUrl?: string }>({})

  const [showKeyboard, setShowKeyboard] = useState(false)
  const [activeInput, setActiveInput] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState("")
  const [showFileBrowser, setShowFileBrowser] = useState(false)

  const resetForm = useCallback(() => {
    setName("")
    setDescription("")
    setImageUrl("")
    setAlcoholic(true)
    setRecipe([{ ingredientId: "", amount: 0 }])
    setErrors({})
    setShowKeyboard(false)
    setActiveInput(null)
    setInputValue("")
    setShowFileBrowser(false)
  }, [])

  useEffect(() => {
    if (isOpen) {
      resetForm()
    }
  }, [isOpen, resetForm])

  const handleInputClick = (inputId: string, currentValue: string | number) => {
    setActiveInput(inputId)
    setInputValue(String(currentValue))
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

    if (activeInput === "name") {
      setName(inputValue)
    } else if (activeInput === "description") {
      setDescription(inputValue)
    } else if (activeInput === "imageUrl") {
      setImageUrl(inputValue)
    } else if (activeInput.startsWith("amount-")) {
      const index = Number.parseInt(activeInput.replace("amount-", ""))
      const amount = Number.parseFloat(inputValue)
      if (!isNaN(amount) && amount >= 0) {
        const updatedRecipe = [...recipe]
        updatedRecipe[index] = { ...updatedRecipe[index], amount }
        setRecipe(updatedRecipe)
      } else {
        // Optional: Fehlerbehandlung für ungültige Menge
        console.warn("Ungültige Mengeneingabe:", inputValue)
      }
    }
    setShowKeyboard(false)
    setActiveInput(null)
    // inputValue wird nicht zurückgesetzt, damit der Wert im Feld bleibt
  }

  const handleKeyboardCancel = () => {
    setShowKeyboard(false)
    setActiveInput(null)
    setInputValue("") // Wert verwerfen
  }

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

  // handleAmountChange wird jetzt durch handleInputClick und handleKeyboardConfirm abgedeckt

  const validateForm = () => {
    const newErrors: { name?: string; recipe?: string; imageUrl?: string } = {}
    if (!name.trim()) newErrors.name = "Name ist erforderlich"
    const hasValidIngredients = recipe.every((item) => item.ingredientId && item.amount > 0)
    if (!hasValidIngredients) newErrors.recipe = "Alle Zutaten müssen eine gültige Zutat und Menge haben"

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
        image: imageUrl || "/placeholder.svg?height=400&width=400", // Verwende die ausgewählte/eingegebene URL
        alcoholic,
        ingredients: recipe.map((item) => {
          const ingredient = allIngredients.find((i) => i.id === item.ingredientId)
          return `${item.amount}ml ${ingredient?.name || "Unbekannte Zutat"}`
        }),
        recipe: recipe.filter((item) => item.ingredientId && item.amount > 0),
      }
      await saveCocktailRecipe(newCocktail)
      onSave(newCocktail)
      onClose() // Schließt den Dialog nach dem Speichern
    } catch (error) {
      console.error("Fehler beim Speichern des Rezepts:", error)
      // Optional: Fehler dem Benutzer anzeigen
    } finally {
      setSaving(false)
    }
  }

  const handleFileSelect = (filePath: string) => {
    setImageUrl(filePath)
    setShowFileBrowser(false)
    setActiveInput(null) // Wichtig, um den Fokus zurückzusetzen
  }

  const isNumericInput = activeInput?.startsWith("amount-") ?? false
  const isAlphaNumericInput = activeInput === "name" || activeInput === "description" || activeInput === "imageUrl"

  const handleDialogCloseInteraction = () => {
    if (showKeyboard || showFileBrowser) {
      // Mache nichts, wenn Tastatur oder FileBrowser offen ist
      return
    }
    onClose()
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleDialogCloseInteraction()
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
            setActiveInput(null)
          }
          // Wenn nichts offen ist, schließt der Dialog normal via onOpenChange
        }}
      >
        <DialogHeader>
          <DialogTitle>Neues Cocktail-Rezept erstellen</DialogTitle>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 text-white hover:text-gray-400"
              onClick={handleDialogCloseInteraction}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>

        {!showKeyboard && !showFileBrowser && (
          <div className="space-y-4 my-4 max-h-[60vh] overflow-y-auto pr-2">
            {/* Name Input */}
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

            {/* Description Input */}
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

            {/* Image URL Input & File Browser */}
            <div className="space-y-2">
              <Label htmlFor="imageUrl-display">Bild-URL</Label>
              <div className="flex gap-2">
                <Input
                  id="imageUrl-display"
                  value={imageUrl}
                  onClick={() => handleInputClick("imageUrl", imageUrl)}
                  readOnly
                  className={`flex-1 bg-[hsl(var(--cocktail-bg))] border-[hsl(var(--cocktail-card-border))] text-white cursor-pointer`}
                  placeholder="/images/cocktails/mein_cocktail.jpg"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setActiveInput("imageUrl")
                    setShowFileBrowser(true)
                  }}
                  className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </div>
              <div className="bg-[hsl(var(--cocktail-card-bg))] border border-[hsl(var(--cocktail-card-border))] rounded-md p-3 text-white mt-2">
                <p className="text-xs text-[hsl(var(--cocktail-primary))]">
                  Klicke auf das Feld, um die URL manuell einzugeben, oder nutze den{" "}
                  <ImageIcon className="inline h-3 w-3" /> Button, um ein Bild auszuwählen. Ohne Bild wird ein
                  Platzhalter verwendet.
                </p>
              </div>
            </div>

            {/* Cocktail Type */}
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

            {/* Ingredients */}
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
                  <Plus className="h-4 w-4 mr-1" /> Zutat hinzufügen
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
                        {allIngredients.map((ingredient) => (
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
                      type="text" // Text, da readOnly und von Tastatur befüllt
                      value={item.amount || "0"}
                      onClick={() => handleInputClick(`amount-${index}`, item.amount)}
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
              {activeInput?.startsWith("amount-") && "Menge eingeben (ml)"}
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
                allowDecimal={true} // Mengen können Dezimalstellen haben
                numericOnly={true}
              /> // Für Name, Beschreibung, ImageUrl
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

        {showFileBrowser && activeInput === "imageUrl" && (
          <FileBrowser
            isOpen={showFileBrowser}
            onClose={() => {
              setShowFileBrowser(false)
              setActiveInput(null)
            }}
            onSelect={handleFileSelect}
            fileTypes={["jpg", "jpeg", "png", "gif"]}
          />
        )}

        {!showKeyboard && !showFileBrowser && (
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleDialogCloseInteraction}
              className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
            >
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#00ff00] text-black hover:bg-[#00cc00]">
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
  )
}
