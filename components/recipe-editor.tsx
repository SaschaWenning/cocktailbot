"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Cocktail } from "@/types/cocktail"
import { ingredients as allIngredientsData } from "@/data/ingredients" // Umbenannt, um Konflikt zu vermeiden
import { saveRecipe as saveCocktailServerAction } from "@/lib/cocktail-machine" // Umbenannt für Klarheit
import { Loader2, ImageIcon, Trash2, Plus, Minus, FolderOpen, XIcon, EyeOff, Eye } from "lucide-react"
import VirtualKeyboard from "./virtual-keyboard"
import FileBrowser from "./file-browser"
import { Switch } from "@/components/ui/switch"

interface RecipeEditorProps {
  isOpen: boolean
  onClose: () => void
  cocktail: Cocktail | null
  onSave: (updatedCocktail: Cocktail) => void // Wird aufgerufen, nachdem serverseitiges Speichern erfolgreich war
  onRequestDelete: (cocktailId: string) => void
}

const initialCocktailState = null

export default function RecipeEditor({
  isOpen,
  onClose,
  cocktail: initialCocktail, // Umbenannt für Klarheit im Hook
  onSave,
  onRequestDelete,
}: RecipeEditorProps) {
  const [editableCocktail, setEditableCocktail] = useState<Cocktail | null>(initialCocktailState)
  const [cocktailNameDisplay, setCocktailNameDisplay] = useState("") // Nur für den Titel, Name selbst ist in editableCocktail

  const [saving, setSaving] = useState(false)
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [activeInput, setActiveInput] = useState<string | null>(null) // z.B. "description", "imageUrl", "amount-0"
  const [keyboardInputValue, setKeyboardInputValue] = useState("")
  const [showFileBrowser, setShowFileBrowser] = useState(false)
  const [formErrors, setFormErrors] = useState<{ imageUrl?: string }>({})

  useEffect(() => {
    if (isOpen && initialCocktail) {
      // Tiefe Kopie erstellen, um Prop-Mutationen zu vermeiden
      setEditableCocktail(JSON.parse(JSON.stringify(initialCocktail)))
      setCocktailNameDisplay(initialCocktail.name || "Unbenannter Cocktail")

      // Normalisiere Bild-URL beim Laden
      let imagePath = initialCocktail.image || ""
      if (imagePath.startsWith("/placeholder")) {
        imagePath = "" // Leere URL für Platzhalter
      } else {
        imagePath = imagePath.split("?")[0] // Query-Parameter entfernen
        if (imagePath && !imagePath.startsWith("http") && !imagePath.startsWith("/")) {
          imagePath = `/${imagePath}` // Sicherstellen, dass es mit / beginnt, wenn es ein lokaler Pfad ist
        }
      }
      // Setze die normalisierte URL im State
      setEditableCocktail((prev) => (prev ? { ...prev, image: imagePath } : null))
    } else if (!isOpen) {
      // Reset state when dialog closes
      setEditableCocktail(initialCocktailState)
      setCocktailNameDisplay("")
      setSaving(false)
      setShowKeyboard(false)
      setActiveInput(null)
      setKeyboardInputValue("")
      setShowFileBrowser(false)
      setFormErrors({})
    }
  }, [isOpen, initialCocktail])

  const handleFieldUpdate = useCallback(<K extends keyof Cocktail>(field: K, value: Cocktail[K]) => {
    setEditableCocktail((prev) => (prev ? { ...prev, [field]: value } : null))
  }, [])

  const handleRecipeItemChange = useCallback(
    (index: number, field: "ingredientId" | "amount", value: string | number) => {
      setEditableCocktail((prev) => {
        if (!prev || !prev.recipe) return prev
        const updatedRecipe = [...prev.recipe]
        if (updatedRecipe[index]) {
          updatedRecipe[index] = { ...updatedRecipe[index], [field]: value }
        }
        return { ...prev, recipe: updatedRecipe }
      })
    },
    [],
  )

  const handleInputFocus = useCallback((inputType: string, currentValue: string | number = "") => {
    setActiveInput(inputType)
    setKeyboardInputValue(String(currentValue))
    setShowKeyboard(true)
  }, [])

  const handleKeyboardKeyPress = useCallback(
    (key: string) => {
      if (activeInput?.startsWith("amount-") && key === "." && keyboardInputValue.includes(".")) {
        return // Nur einen Dezimalpunkt erlauben
      }
      setKeyboardInputValue((prev) => prev + key)
    },
    [activeInput, keyboardInputValue],
  )

  const handleKeyboardBackspace = useCallback(() => setKeyboardInputValue((prev) => prev.slice(0, -1)), [])
  const handleKeyboardClear = useCallback(() => setKeyboardInputValue(""), [])

  const handleKeyboardConfirm = useCallback(() => {
    if (!activeInput || !editableCocktail) return

    if (activeInput === "description") {
      handleFieldUpdate("description", keyboardInputValue)
    } else if (activeInput === "imageUrl") {
      handleFieldUpdate("image", keyboardInputValue)
    } else if (activeInput.startsWith("amount-")) {
      const index = Number.parseInt(activeInput.split("-")[1], 10)
      const amount = Number.parseFloat(keyboardInputValue)
      if (!isNaN(amount) && amount >= 0 && editableCocktail.recipe && editableCocktail.recipe[index]) {
        handleRecipeItemChange(index, "amount", amount)
      }
    }
    setShowKeyboard(false)
    setActiveInput(null)
    // keyboardInputValue wird nicht zurückgesetzt, damit der Wert im Feld bleibt bis zum nächsten Fokus
  }, [activeInput, keyboardInputValue, editableCocktail, handleFieldUpdate, handleRecipeItemChange])

  const handleKeyboardCancel = useCallback(() => {
    setShowKeyboard(false)
    setActiveInput(null)
    setKeyboardInputValue("") // Verwirft die Eingabe
  }, [])

  const addIngredient = useCallback(() => {
    if (!editableCocktail) return
    const currentRecipeItems = editableCocktail.recipe || []
    const available = allIngredientsData.filter(
      (ing) => !currentRecipeItems.some((item) => item.ingredientId === ing.id),
    )
    if (available.length > 0) {
      const newRecipeItem = { ingredientId: available[0].id, amount: 30 }
      handleFieldUpdate("recipe", [...currentRecipeItems, newRecipeItem])
    }
  }, [editableCocktail, handleFieldUpdate])

  const removeIngredient = useCallback(
    (index: number) => {
      if (!editableCocktail || !editableCocktail.recipe || editableCocktail.recipe.length <= 1) return
      const updatedRecipe = editableCocktail.recipe.filter((_, i) => i !== index)
      handleFieldUpdate("recipe", updatedRecipe)
    },
    [editableCocktail, handleFieldUpdate],
  )

  const isValidUrl = (url: string) => {
    if (!url) return true // Leer ist ok für Platzhalter
    if (url.startsWith("/")) return true // Lokale Pfade sind ok
    try {
      new URL(url)
      return true
    } catch (_) {
      return false
    }
  }

  const validateForm = useCallback(() => {
    const newErrors: { imageUrl?: string } = {}
    if (editableCocktail?.image && !isValidUrl(editableCocktail.image)) {
      newErrors.imageUrl = "Ungültige URL oder Pfad."
    }
    // Weitere Validierungen (z.B. Name, Zutaten) könnten hier hinzugefügt werden
    setFormErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [editableCocktail?.image])

  const handleSave = useCallback(async () => {
    if (!editableCocktail || !validateForm()) return
    setSaving(true)
    try {
      // Erzeuge die 'ingredients' (Textliste) basierend auf dem 'recipe' Array
      const finalIngredientsList = (editableCocktail.recipe || []).map((item) => {
        const ingredientDetails = allIngredientsData.find((i) => i.id === item.ingredientId)
        return `${item.amount}ml ${ingredientDetails?.name || item.ingredientId}`
      })

      const cocktailToSave: Cocktail = {
        ...editableCocktail,
        ingredients: finalIngredientsList,
        image:
          editableCocktail.image ||
          `/placeholder.svg?height=200&width=400&query=${encodeURIComponent(editableCocktail.name)}`,
      }

      await saveCocktailServerAction(cocktailToSave)
      onSave(cocktailToSave) // Benachrichtige Parent über erfolgreiches Speichern
      onClose() // Schließe den Dialog
    } catch (error) {
      console.error("Fehler beim Speichern des Rezepts:", error)
      // Hier könnte eine Fehlermeldung für den Benutzer angezeigt werden (z.B. mit toast)
    } finally {
      setSaving(false)
    }
  }, [editableCocktail, validateForm, onSave, onClose])

  const handleDeleteRequest = useCallback(() => {
    if (!editableCocktail) return
    onRequestDelete(editableCocktail.id)
  }, [editableCocktail, onRequestDelete])

  const handleFileSelect = useCallback(
    (path: string) => {
      handleFieldUpdate("image", path)
      setShowFileBrowser(false)
    },
    [handleFieldUpdate],
  )

  const isNumericKeyboard = activeInput?.startsWith("amount-") ?? false

  if (!isOpen || !editableCocktail) return null // Dialog nicht rendern, wenn nicht offen oder kein Cocktail-Daten

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="bg-black border-[hsl(var(--cocktail-card-border))] text-white sm:max-w-md"
          onInteractOutside={(e) => {
            if (showKeyboard || showFileBrowser) e.preventDefault()
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
            <DialogTitle>Rezept bearbeiten: {cocktailNameDisplay}</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
                <XIcon className="h-5 w-5" />
              </Button>
            </DialogClose>
          </DialogHeader>

          <div className="space-y-4 my-4 max-h-[60vh] overflow-y-auto pr-2">
            {/* Aktiv / Deaktiviert Schalter */}
            <div className="flex items-center justify-between p-3 bg-[hsl(var(--cocktail-card-bg))] rounded border border-[hsl(var(--cocktail-card-border))]">
              <Label htmlFor="isActiveSwitch" className="text-white flex items-center">
                {editableCocktail.isActive ? (
                  <Eye className="h-5 w-5 mr-2 text-green-400" />
                ) : (
                  <EyeOff className="h-5 w-5 mr-2 text-red-400" />
                )}
                {editableCocktail.isActive ? "Cocktail ist Aktiv" : "Cocktail ist Deaktiviert"}
              </Label>
              <Switch
                id="isActiveSwitch"
                checked={editableCocktail.isActive}
                onCheckedChange={(checked) => handleFieldUpdate("isActive", checked)}
                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
              />
            </div>

            {/* Beschreibung */}
            <div className="space-y-1">
              <Label htmlFor="descriptionInput" className="text-white">
                Beschreibung
              </Label>
              <Input
                id="descriptionInput"
                value={editableCocktail.description}
                onClick={() => handleInputFocus("description", editableCocktail.description)}
                readOnly
                className="bg-white border-[hsl(var(--cocktail-card-border))] text-black cursor-pointer"
                placeholder="Beschreibe deinen Cocktail..."
              />
            </div>

            {/* Bild-URL */}
            <div className="space-y-1">
              <Label htmlFor="imageUrlInput" className="flex items-center gap-2 text-white">
                <ImageIcon className="h-4 w-4" /> Bild-URL oder Pfad
              </Label>
              <div className="flex gap-2">
                <Input
                  id="imageUrlInput"
                  value={editableCocktail.image || ""}
                  onClick={() => handleInputFocus("imageUrl", editableCocktail.image || "")}
                  readOnly
                  className={`flex-1 bg-white border-[hsl(var(--cocktail-card-border))] text-black cursor-pointer ${formErrors.imageUrl ? "border-red-500" : ""}`}
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
              {formErrors.imageUrl && <p className="text-red-400 text-xs">{formErrors.imageUrl}</p>}
              <p className="text-xs text-gray-300">Leer lassen für Platzhalterbild.</p>
            </div>

            {/* Zutaten */}
            <div className="pt-2 space-y-2">
              <div className="flex justify-between items-center mb-2">
                <Label className="text-white">Zutaten</Label>
                <Button
                  type="button"
                  size="sm"
                  onClick={addIngredient}
                  className="bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
                  disabled={(editableCocktail.recipe || []).length >= allIngredientsData.length}
                >
                  <Plus className="h-4 w-4 mr-1" /> Zutat
                </Button>
              </div>
              {(editableCocktail.recipe || []).map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 items-center p-2 bg-[hsl(var(--cocktail-card-bg))] rounded border border-[hsl(var(--cocktail-card-border))]"
                >
                  <div className="col-span-6">
                    <Select
                      value={item.ingredientId}
                      onValueChange={(value) => handleRecipeItemChange(index, "ingredientId", value)}
                    >
                      <SelectTrigger className="bg-white border-[hsl(var(--cocktail-card-border))] text-black">
                        <SelectValue placeholder="Zutat wählen" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-[hsl(var(--cocktail-card-border))] max-h-48 overflow-y-auto">
                        {allIngredientsData.map((ing) => (
                          <SelectItem
                            key={ing.id}
                            value={ing.id}
                            className="text-black hover:bg-gray-100 cursor-pointer"
                          >
                            {ing.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="text" // Bleibt text wegen virtueller Tastatur
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
                      size="icon"
                      variant="destructive"
                      onClick={() => removeIngredient(index)}
                      disabled={(editableCocktail.recipe || []).length <= 1}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="flex justify-between items-center">
            <Button variant="destructive" onClick={handleDeleteRequest} className="mr-auto" type="button">
              <Trash2 className="mr-2 h-4 w-4" /> Löschen
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Speichern...
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
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-[100]">
          {" "}
          {/* Erhöhter z-index */}
          <div className="w-full max-w-2xl p-4">
            <div className="bg-black border border-[hsl(var(--cocktail-card-border))] rounded-lg p-4 mb-4">
              <Label className="text-white mb-2 block text-center">
                {activeInput === "description" && "Beschreibung eingeben"}
                {activeInput === "imageUrl" && "Bild-URL oder Pfad eingeben"}
                {activeInput?.startsWith("amount-") &&
                  `Menge für Zutat ${Number.parseInt(activeInput.split("-")[1], 10) + 1} eingeben (ml)`}
              </Label>
              <Input
                value={keyboardInputValue}
                readOnly
                className="bg-white border-[hsl(var(--cocktail-card-border))] text-black text-center text-lg"
                placeholder={
                  activeInput === "description"
                    ? "Beschreibung..."
                    : activeInput === "imageUrl"
                      ? "/pfad/zum/bild.jpg"
                      : "Menge in ml"
                }
              />
            </div>
            <VirtualKeyboard
              onKeyPress={handleKeyboardKeyPress}
              onBackspace={handleKeyboardBackspace}
              onClear={handleKeyboardClear}
              onConfirm={handleKeyboardConfirm}
              onCancel={handleKeyboardCancel}
              allowDecimal={isNumericKeyboard}
              numericOnly={isNumericKeyboard}
            />
          </div>
        </div>
      )}

      {/* FileBrowser wird als separater Dialog gerendert, der über dem RecipeEditor liegen sollte */}
      <FileBrowser
        isOpen={showFileBrowser}
        onClose={() => setShowFileBrowser(false)}
        onSelect={handleFileSelect}
        fileTypes={["jpg", "jpeg", "png", "gif"]}
      />
    </>
  )
}
