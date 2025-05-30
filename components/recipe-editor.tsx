"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { Cocktail } from "@/types/cocktail" // Assuming RecipeItem is part of Cocktail or defined elsewhere
import type { RecipeItem } from "@/types/cocktail" // Explicit import if separate
import { ingredients as allIngredientsData } from "@/data/ingredients"
import { Loader2, ImageIcon, Plus, Minus, FolderOpen, XIcon, EyeOff, Eye } from "lucide-react"
import VirtualKeyboard from "./virtual-keyboard"
import FileBrowser from "./file-browser"

const deepClone = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj))

interface RecipeEditorProps {
  isOpen: boolean
  onClose: () => void
  cocktail: Cocktail | null
  onSave: (updatedCocktail: Cocktail) => Promise<void> // Make onSave async
  // onRequestDelete: (cocktailId: string) => void; // Removed for now, delete is on card
}

export default function RecipeEditor({ isOpen, onClose, cocktail: initialCocktail, onSave }: RecipeEditorProps) {
  const [editableCocktail, setEditableCocktail] = useState<Cocktail | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [keyboardTarget, setKeyboardTarget] = useState<{
    field: string
    index?: number
    type: "text" | "numeric"
  } | null>(null)
  const [keyboardValue, setKeyboardValue] = useState("")
  const [showFileBrowser, setShowFileBrowser] = useState(false)
  const nameId = "nameId"
  const descriptionId = "descriptionId"
  const imageUrlId = "imageUrlId"
  const isActiveId = "isActiveId"
  const [ingredientIds, setIngredientIds] = useState<string[]>([])
  const [amountIds, setAmountIds] = useState<string[]>([])

  useEffect(() => {
    if (isOpen && initialCocktail) {
      const clonedCocktail = deepClone(initialCocktail)
      let imagePath = clonedCocktail.image || ""
      if (imagePath.startsWith("/placeholder")) imagePath = ""
      else {
        imagePath = imagePath.split("?")[0] // Remove query params for editing
        if (imagePath && !imagePath.startsWith("http") && !imagePath.startsWith("/")) {
          imagePath = `/${imagePath}` // Ensure leading slash for local images
        }
      }
      clonedCocktail.image = imagePath
      setEditableCocktail(clonedCocktail)
      // Ensure recipe is an array
      clonedCocktail.recipe = Array.isArray(clonedCocktail.recipe) ? clonedCocktail.recipe : []

      setIngredientIds(
        Array.from({ length: clonedCocktail.recipe.length || 1 }, () => Math.random().toString(36).substr(2, 9)),
      )
      setAmountIds(
        Array.from({ length: clonedCocktail.recipe.length || 1 }, () => Math.random().toString(36).substr(2, 9)),
      )
    } else if (!isOpen) {
      setEditableCocktail(null)
      setIsSaving(false)
      setFormError(null)
      setShowKeyboard(false)
      setKeyboardTarget(null)
      setKeyboardValue("")
      setShowFileBrowser(false)
      setIngredientIds([])
      setAmountIds([])
    }
  }, [isOpen, initialCocktail])

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

  const openKeyboard = (field: string, currentValue: string | number, type: "text" | "numeric", index?: number) => {
    setKeyboardTarget({ field, index, type })
    setKeyboardValue(String(currentValue))
    setShowKeyboard(true)
  }

  const handleKeyboardInput = (key: string) => {
    if (keyboardTarget?.type === "numeric" && key === "." && keyboardValue.includes(".")) return
    setKeyboardValue((prev) => prev + key)
  }

  const handleKeyboardConfirm = () => {
    if (!keyboardTarget || !editableCocktail) return

    const { field, index } = keyboardTarget
    let valueToSet: string | number = keyboardValue

    if (keyboardTarget.type === "numeric") {
      valueToSet = Number.parseFloat(keyboardValue)
      if (isNaN(valueToSet) || valueToSet < 0) {
        // Handle invalid number input if necessary, e.g., show an error or revert
        setShowKeyboard(false)
        return
      }
    }

    if (field === "name") handleChange("name", valueToSet)
    else if (field === "description") handleChange("description", valueToSet)
    else if (field === "image") handleChange("image", valueToSet)
    else if (field === "amount" && typeof index === "number") {
      handleRecipeChange(index, "amount", valueToSet as number)
    }
    setShowKeyboard(false)
  }

  const addRecipeIngredient = () => {
    setEditableCocktail((prev) => {
      if (!prev) return null
      const currentRecipe = prev.recipe || []
      const available = allIngredientsData.filter((ing) => !currentRecipe.some((item) => item.ingredientId === ing.id))
      if (available.length > 0) {
        const newRecipe = [...currentRecipe, { ingredientId: available[0].id, amount: 30 }]
        setIngredientIds((ids) => [...ids, Math.random().toString(36).substr(2, 9)])
        setAmountIds((ids) => [...ids, Math.random().toString(36).substr(2, 9)])
        return { ...prev, recipe: newRecipe }
      }
      return prev
    })
  }

  const removeRecipeIngredient = (index: number) => {
    setEditableCocktail((prev) => {
      if (!prev || !prev.recipe || prev.recipe.length <= 1) return prev
      const newRecipe = prev.recipe.filter((_, i) => i !== index)
      setIngredientIds((ids) => ids.filter((_, i) => i !== index))
      setAmountIds((ids) => ids.filter((_, i) => i !== index))
      return { ...prev, recipe: newRecipe }
    })
  }

  const handleSubmit = async () => {
    if (!editableCocktail) return
    setFormError(null)

    if (!editableCocktail.name.trim()) {
      setFormError("Der Cocktailname darf nicht leer sein.")
      return
    }
    if ((editableCocktail.recipe || []).length === 0) {
      setFormError("Ein Cocktail muss mindestens eine Zutat haben.")
      return
    }
    if (
      editableCocktail.image &&
      !editableCocktail.image.startsWith("/") &&
      !editableCocktail.image.startsWith("http")
    ) {
      try {
        new URL(editableCocktail.image) // Check if it's a valid absolute URL
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

      const finalCocktail: Cocktail = {
        ...editableCocktail,
        ingredients: ingredientsTextList,
        image:
          editableCocktail.image ||
          `/placeholder.svg?height=400&width=400&query=${encodeURIComponent(editableCocktail.name)}`,
      }
      await onSave(finalCocktail)
      onClose()
    } catch (error) {
      console.error("Fehler beim Speichern:", error)
      setFormError(error instanceof Error ? error.message : "Fehler beim Speichern des Rezepts.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleFileSelected = (path: string) => {
    handleChange("image", path)
    setShowFileBrowser(false)
  }

  if (!isOpen || !editableCocktail) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="bg-black border-[hsl(var(--cocktail-card-border))] text-white sm:max-w-lg w-[95vw] max-h-[90vh] flex flex-col"
          onPointerDownOutside={(e) => {
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
          <DialogHeader className="flex-shrink-0 flex flex-row justify-between items-center border-b border-[hsl(var(--cocktail-card-border))] pb-3">
            <DialogTitle>Rezept bearbeiten</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
                <XIcon className="h-5 w-5" />
              </Button>
            </DialogClose>
          </DialogHeader>

          <div className="flex-1 space-y-4 py-4 overflow-y-auto px-1 pr-3">
            {formError && <p className="text-sm text-red-400 bg-red-900/30 p-2 rounded">{formError}</p>}

            <div>
              <Label htmlFor={nameId} className="text-sm font-medium text-white">
                Name
              </Label>
              <Input
                id={nameId}
                value={editableCocktail.name}
                readOnly
                onClick={() => openKeyboard("name", editableCocktail.name, "text")}
                className="mt-1 bg-white text-black cursor-pointer border-[hsl(var(--cocktail-card-border))]"
                placeholder="Cocktail Name"
              />
            </div>

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
                checked={!!editableCocktail.isActive}
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
                onClick={() => openKeyboard("description", editableCocktail.description, "text")}
                className="mt-1 bg-white text-black cursor-pointer border-[hsl(var(--cocktail-card-border))]"
                placeholder="Cocktail Beschreibung"
              />
            </div>

            <div>
              <Label htmlFor={imageUrlId} className="text-sm font-medium text-white flex items-center gap-1">
                <ImageIcon size={16} /> Bild-URL oder Pfad
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id={imageUrlId}
                  value={editableCocktail.image || ""}
                  readOnly
                  onClick={() => openKeyboard("image", editableCocktail.image || "", "text")}
                  className="flex-grow bg-white text-black cursor-pointer border-[hsl(var(--cocktail-card-border))]"
                  placeholder="/images/cocktails/bild.jpg oder URL"
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={() => setShowFileBrowser(true)}
                  className="bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
                  aria-label="Datei auswählen"
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
                {(editableCocktail.recipe || []).map((item, index) => (
                  <div
                    key={ingredientIds[index] || `recipe-item-${index}`}
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
                      type="text" // Keep as text for readOnly and click interaction
                      value={item.amount}
                      readOnly
                      onClick={() => openKeyboard("amount", item.amount, "numeric", index)}
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
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 flex flex-col sm:flex-row sm:justify-end items-center gap-2 pt-4 border-t border-[hsl(var(--cocktail-card-border))]">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
                onClick={onClose}
              >
                Abbrechen
              </Button>
            </DialogClose>
            <Button
              onClick={handleSubmit}
              disabled={isSaving}
              className="w-full sm:w-auto bg-green-500 text-black hover:bg-green-600"
            >
              {isSaving ? (
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

      {showKeyboard && keyboardTarget && (
        <div
          className="fixed inset-0 bg-black/80 flex items-end justify-center z-[60]" // Higher z-index than DialogContent (default 50)
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowKeyboard(false)
          }}
        >
          <div className="w-full max-w-2xl p-2 sm:p-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-black border border-[hsl(var(--cocktail-card-border))] rounded-lg p-3 sm:p-4 mb-2 sm:mb-4">
              <Label className="text-white mb-2 block text-center text-sm sm:text-base">
                {keyboardTarget.field === "name" && "Name"}
                {keyboardTarget.field === "description" && "Beschreibung"}
                {keyboardTarget.field === "image" && "Bild-URL / Pfad"}
                {keyboardTarget.field === "amount" && `Menge (ml)`}
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
              allowDecimal={keyboardTarget.type === "numeric"}
              numericOnly={keyboardTarget.type === "numeric"}
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
