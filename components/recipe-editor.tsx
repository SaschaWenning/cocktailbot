"use client"

import { useState, useEffect, useCallback, useId } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { Cocktail, RecipeItem } from "@/types/cocktail" // Angenommen RecipeItem ist in types.tsx definiert
import { ingredients as allIngredientsData } from "@/data/ingredients"
import { saveRecipe as saveCocktailServerAction } from "@/lib/cocktail-machine"
import { Loader2, ImageIcon, Trash2, Plus, Minus, FolderOpen, XIcon, EyeOff, Eye } from "lucide-react"
import VirtualKeyboard from "./virtual-keyboard"
import FileBrowser from "./file-browser"

// Hilfsfunktion für eine tiefe Kopie, um Prop-Mutationen zu vermeiden
const deepClone = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj))

interface RecipeEditorProps {
  isOpen: boolean
  onClose: () => void
  cocktail: Cocktail | null
  onSave: (updatedCocktail: Cocktail) => void
  onRequestDelete: (cocktailId: string) => void
}

export default function RecipeEditor({
  isOpen,
  onClose,
  cocktail: initialCocktail,
  onSave,
  onRequestDelete,
}: RecipeEditorProps) {
  const [editableCocktail, setEditableCocktail] = useState<Cocktail | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // States für Sub-Modals
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [keyboardTarget, setKeyboardTarget] = useState<{ field: string; index?: number } | null>(null)
  const [keyboardValue, setKeyboardValue] = useState("")
  const [showFileBrowser, setShowFileBrowser] = useState(false)

  // Eindeutige IDs für Formularfelder generieren
  const descriptionId = useId()
  const imageUrlId = useId()
  const isActiveId = useId()
  const ingredientIds = Array.from({ length: 10 }, () => useId()) // Generate unique IDs for ingredients
  const amountIds = Array.from({ length: 10 }, () => useId()) // Generate unique IDs for amounts

  // Initialisierung und Reset des Editor-States
  useEffect(() => {
    if (isOpen && initialCocktail) {
      setEditableCocktail(deepClone(initialCocktail))
      // Normalisiere Bild-URL beim Laden
      setEditableCocktail((prev) => {
        if (!prev) return null
        let imagePath = prev.image || ""
        if (imagePath.startsWith("/placeholder")) imagePath = ""
        else {
          imagePath = imagePath.split("?")[0]
          if (imagePath && !imagePath.startsWith("http") && !imagePath.startsWith("/")) {
            imagePath = `/${imagePath}`
          }
        }
        return { ...prev, image: imagePath }
      })
    } else if (!isOpen) {
      setEditableCocktail(null)
      setIsSaving(false)
      setFormError(null)
      setShowKeyboard(false)
      setKeyboardTarget(null)
      setKeyboardValue("")
      setShowFileBrowser(false)
    }
  }, [isOpen, initialCocktail])

  // Allgemeine Handler für Feldänderungen
  const handleChange = useCallback((field: keyof Cocktail, value: any) => {
    setEditableCocktail((prev) => (prev ? { ...prev, [field]: value } : null))
  }, [])

  const handleRecipeChange = useCallback((index: number, field: keyof RecipeItem, value: any) => {
    setEditableCocktail((prev) => {
      if (!prev || !prev.recipe) return prev
      const newRecipe = [...prev.recipe]
      newRecipe[index] = { ...newRecipe[index], [field]: value }
      return { ...prev, recipe: newRecipe }
    })
  }, [])

  // Handler für Tastatur
  const openKeyboard = (field: string, currentValue: string | number, index?: number) => {
    setKeyboardTarget({ field, index })
    setKeyboardValue(String(currentValue))
    setShowKeyboard(true)
  }

  const handleKeyboardInput = (key: string) => {
    if (keyboardTarget?.field.startsWith("amount") && key === "." && keyboardValue.includes(".")) return
    setKeyboardValue((prev) => prev + key)
  }

  const handleKeyboardConfirm = () => {
    if (!keyboardTarget || editableCocktail === null) return

    const { field, index } = keyboardTarget
    if (field === "description") handleChange("description", keyboardValue)
    else if (field === "image") handleChange("image", keyboardValue)
    else if (field.startsWith("amount") && typeof index === "number") {
      const amount = Number.parseFloat(keyboardValue)
      if (!isNaN(amount) && amount >= 0) handleRecipeChange(index, "amount", amount)
    }
    setShowKeyboard(false)
  }

  // Handler für Zutaten
  const addRecipeIngredient = () => {
    if (!editableCocktail) return
    const currentRecipe = editableCocktail.recipe || []
    const available = allIngredientsData.filter((ing) => !currentRecipe.some((item) => item.ingredientId === ing.id))
    if (available.length > 0) {
      handleChange("recipe", [...currentRecipe, { ingredientId: available[0].id, amount: 30 }])
    }
  }

  const removeRecipeIngredient = (index: number) => {
    if (!editableCocktail || !editableCocktail.recipe || editableCocktail.recipe.length <= 1) return
    const newRecipe = editableCocktail.recipe.filter((_, i) => i !== index)
    handleChange("recipe", newRecipe)
  }

  // Handler für Speichern und Löschen
  const handleSubmit = async () => {
    if (!editableCocktail) return
    setFormError(null)

    // Validierung (Beispiel: Bild-URL)
    if (
      editableCocktail.image &&
      !editableCocktail.image.startsWith("/") &&
      !editableCocktail.image.startsWith("http")
    ) {
      try {
        new URL(editableCocktail.image)
      } catch (_) {
        setFormError("Ungültige Bild-URL. Muss mit / beginnen oder eine vollständige URL sein.")
        return
      }
    }

    setIsSaving(true)
    try {
      const ingredientsTextList = (editableCocktail.recipe || []).map((item) => {
        const ing = allIngredientsData.find((i) => i.id === item.ingredientId)
        return `${item.amount}ml ${ing?.name || item.ingredientId}`
      })
      const finalCocktail = {
        ...editableCocktail,
        ingredients: ingredientsTextList,
        image:
          editableCocktail.image ||
          `/placeholder.svg?height=200&width=400&query=${encodeURIComponent(editableCocktail.name)}`,
      }
      await saveCocktailServerAction(finalCocktail)
      onSave(finalCocktail)
      onClose()
    } catch (error) {
      console.error("Fehler beim Speichern:", error)
      setFormError("Fehler beim Speichern des Rezepts.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = () => {
    if (editableCocktail) onRequestDelete(editableCocktail.id)
  }

  // Handler für FileBrowser
  const handleFileSelected = (path: string) => {
    handleChange("image", path)
    setShowFileBrowser(false)
  }

  if (!isOpen || !editableCocktail) return null

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
              setShowKeyboard(false)
            } else if (showFileBrowser) {
              e.preventDefault()
              setShowFileBrowser(false)
            }
          }}
        >
          <DialogHeader className="flex flex-row justify-between items-center">
            <DialogTitle>Rezept bearbeiten: {editableCocktail.name}</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
                <XIcon className="h-5 w-5" />
              </Button>
            </DialogClose>
          </DialogHeader>

          <div className="space-y-4 my-4 max-h-[60vh] overflow-y-auto p-1 pr-2">
            {formError && <p className="text-sm text-red-400 bg-red-900/30 p-2 rounded">{formError}</p>}

            <div className="flex items-center justify-between p-3 bg-[hsl(var(--cocktail-card-bg))] rounded border border-[hsl(var(--cocktail-card-border))]">
              <Label htmlFor={isActiveId} className="text-white flex items-center">
                {editableCocktail.isActive ? (
                  <Eye className="h-5 w-5 mr-2 text-green-400" />
                ) : (
                  <EyeOff className="h-5 w-5 mr-2 text-red-400" />
                )}
                {editableCocktail.isActive ? "Cocktail ist Aktiv" : "Cocktail ist Deaktiviert"}
              </Label>
              <Switch
                id={isActiveId}
                checked={editableCocktail.isActive}
                onCheckedChange={(checked) => handleChange("isActive", checked)}
                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
              />
            </div>

            <div>
              <Label htmlFor={descriptionId} className="text-sm font-medium text-white">
                Beschreibung
              </Label>
              <Input
                id={descriptionId}
                value={editableCocktail.description}
                readOnly
                onClick={() => openKeyboard("description", editableCocktail.description)}
                className="mt-1 bg-white text-black cursor-pointer border-[hsl(var(--cocktail-card-border))]"
                placeholder="Cocktail Beschreibung"
              />
            </div>

            <div>
              <Label htmlFor={imageUrlId} className="text-sm font-medium text-white flex items-center gap-1">
                <ImageIcon size={16} />
                Bild-URL oder Pfad
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id={imageUrlId}
                  value={editableCocktail.image || ""}
                  readOnly
                  onClick={() => openKeyboard("image", editableCocktail.image || "")}
                  className="flex-grow bg-white text-black cursor-pointer border-[hsl(var(--cocktail-card-border))]"
                  placeholder="/images/cocktails/bild.jpg"
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={() => setShowFileBrowser(true)}
                  className="bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
                  disabled={(editableCocktail.recipe || []).length >= allIngredientsData.length}
                >
                  <FolderOpen size={18} />
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Leer lassen für Platzhalterbild.</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-sm font-medium text-white">Zutaten</Label>
                <Button
                  type="button"
                  size="sm"
                  onClick={addRecipeIngredient}
                  className="bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
                  disabled={(editableCocktail.recipe || []).length >= allIngredientsData.length}
                >
                  <Plus size={16} className="mr-1" /> Zutat
                </Button>
              </div>
              <div className="space-y-2">
                {(editableCocktail.recipe || []).map((item, index) => {
                  return (
                    <div
                      key={`recipe-item-${index}`}
                      className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center p-2 bg-[hsl(var(--cocktail-card-bg))] rounded border border-[hsl(var(--cocktail-card-border))]"
                    >
                      <Select
                        value={item.ingredientId}
                        onValueChange={(value) => handleRecipeChange(index, "ingredientId", value)}
                      >
                        <SelectTrigger
                          id={ingredientIds[index]}
                          className="bg-white text-black border-[hsl(var(--cocktail-card-border))]"
                          aria-label={`Zutat ${index + 1}`}
                        >
                          <SelectValue placeholder="Zutat wählen" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-[hsl(var(--cocktail-card-border))]">
                          {allIngredientsData.map((ing) => (
                            <SelectItem key={ing.id} value={ing.id} className="text-black hover:bg-gray-100">
                              {ing.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        id={amountIds[index]}
                        type="text"
                        value={item.amount}
                        readOnly
                        onClick={() => openKeyboard("amount", item.amount, index)}
                        className="w-20 bg-white text-black text-center cursor-pointer border-[hsl(var(--cocktail-card-border))]"
                        aria-label={`Menge Zutat ${index + 1}`}
                      />
                      <span className="text-sm text-white">ml</span>
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        onClick={() => removeRecipeIngredient(index)}
                        disabled={(editableCocktail.recipe || []).length <= 1}
                        aria-label={`Zutat ${index + 1} entfernen`}
                      >
                        <Minus size={16} />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between items-center gap-2 pt-4 border-t border-[hsl(var(--cocktail-card-border))]">
            <Button variant="destructive" onClick={handleDelete} className="w-full sm:w-auto" type="button">
              <Trash2 className="mr-2 h-4 w-4" /> Löschen
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 sm:flex-initial bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
                  onClick={onClose}
                >
                  Abbrechen
                </Button>
              </DialogClose>
              <Button
                onClick={handleSubmit}
                disabled={isSaving}
                className="flex-1 sm:flex-initial bg-green-500 text-black hover:bg-green-600"
              >
                {isSaving ? (
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

      {showKeyboard && keyboardTarget && (
        <div
          className="fixed inset-0 bg-black/80 flex items-end justify-center z-[1000]"
          onClick={() => setShowKeyboard(false)}
        >
          {" "}
          {/* Overlay Klick schließt Tastatur */}
          <div className="w-full max-w-2xl p-2 sm:p-4" onClick={(e) => e.stopPropagation()}>
            {" "}
            {/* Verhindert Schließen bei Klick auf Tastatur selbst */}
            <div className="bg-black border border-[hsl(var(--cocktail-card-border))] rounded-lg p-3 sm:p-4 mb-2 sm:mb-4">
              <Label className="text-white mb-2 block text-center text-sm sm:text-base">
                {keyboardTarget.field === "description" && "Beschreibung"}
                {keyboardTarget.field === "image" && "Bild-URL / Pfad"}
                {keyboardTarget.field.startsWith("amount") && `Menge (ml)`}
              </Label>
              <Input
                value={keyboardValue}
                readOnly
                className="bg-white border-[hsl(var(--cocktail-card-border))] text-black text-center text-base sm:text-lg"
              />
            </div>
            <VirtualKeyboard
              onKeyPress={handleKeyboardInput}
              onBackspace={() => setKeyboardValue((prev) => prev.slice(0, -1))}
              onClear={() => setKeyboardValue("")}
              onConfirm={handleKeyboardConfirm}
              onCancel={() => setShowKeyboard(false)}
              allowDecimal={keyboardTarget.field.startsWith("amount")}
              numericOnly={keyboardTarget.field.startsWith("amount")}
            />
          </div>
        </div>
      )}

      <FileBrowser
        isOpen={showFileBrowser}
        onClose={() => setShowFileBrowser(false)}
        onSelect={handleFileSelected}
        fileTypes={["jpg", "jpeg", "png", "gif"]}
      />
    </>
  )
}
