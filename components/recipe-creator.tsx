"use client"

import type React from "react"

import { useState, useEffect, useRef, useId } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import type { Cocktail, RecipeItem } from "@/types/cocktail"
import type { Ingredient } from "@/types/pump"
import { getAllIngredients } from "@/lib/ingredient-manager" // Updated import
import FileBrowser from "./file-browser"
import AlphaKeyboard from "./alpha-keyboard"
import VirtualKeyboard from "./virtual-keyboard"
import { Trash2, PlusCircle, FolderOpen, Loader2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from "next/image"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface RecipeCreatorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (cocktail: Cocktail) => Promise<void>
}

const initialRecipeItem: RecipeItem = { ingredientId: "", amount: 0 }

export default function RecipeCreator({ isOpen, onClose, onSave }: RecipeCreatorProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [alcoholic, setAlcoholic] = useState(true)
  const [recipe, setRecipe] = useState<RecipeItem[]>([initialRecipeItem])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)

  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([])
  const [loadingIngredients, setLoadingIngredients] = useState(true)

  const [showFileBrowser, setShowFileBrowser] = useState(false)
  const [showAlphaKeyboard, setShowAlphaKeyboard] = useState(false)
  const [showNumericKeyboard, setShowNumericKeyboard] = useState(false)
  const [activeInput, setActiveInput] = useState<{
    type: "name" | "description" | "imageUrl" | `recipeAmount-${number}`
    ref: React.RefObject<HTMLInputElement | HTMLTextAreaElement>
    maxLength?: number
  } | null>(null)
  const [activeNumericInput, setActiveNumericInput] = useState<{
    index: number
    ref: React.RefObject<HTMLInputElement>
  } | null>(null)

  const uniqueId = useId()

  const nameInputRef = useRef<HTMLInputElement>(null)
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null)
  const imageUrlInputRef = useRef<HTMLInputElement>(null)
  const recipeAmountInputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (isOpen) {
      // Reset form when dialog opens
      setName("")
      setDescription("")
      setImageUrl("")
      setAlcoholic(true)
      setRecipe([{ ingredientId: "", amount: 0 }])
      setErrors({})
      setIsSaving(false)
      loadIngredientsData()
    }
  }, [isOpen])

  const loadIngredientsData = async () => {
    setLoadingIngredients(true)
    try {
      const ingredients = await getAllIngredients()
      setAvailableIngredients(ingredients)
    } catch (error) {
      console.error("Fehler beim Laden der Zutaten:", error)
      // Optionally set an error state to display to the user
    } finally {
      setLoadingIngredients(false)
    }
  }

  const handleAddRecipeItem = () => {
    setRecipe([...recipe, { ...initialRecipeItem }])
  }

  const handleRemoveRecipeItem = (index: number) => {
    const newRecipe = recipe.filter((_, i) => i !== index)
    if (newRecipe.length === 0) {
      setRecipe([initialRecipeItem]) // Ensure there's always one item if all are removed
    } else {
      setRecipe(newRecipe)
    }
  }

  const handleRecipeChange = (index: number, field: keyof RecipeItem, value: string | number) => {
    const newRecipe = [...recipe]
    if (field === "amount") {
      newRecipe[index][field] = Number(value) || 0
    } else {
      newRecipe[index][field] = value as string
    }
    setRecipe(newRecipe)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = "Name ist erforderlich."
    if (!imageUrl.trim()) newErrors.imageUrl = "Bild-URL ist erforderlich."
    if (recipe.length === 0 || recipe.some((item) => !item.ingredientId || item.amount <= 0)) {
      newErrors.recipe = "Mindestens eine gültige Zutat mit Menge > 0 ist erforderlich."
    }
    recipe.forEach((item, index) => {
      if (!item.ingredientId) newErrors[`recipeIngredient-${index}`] = "Zutat auswählen."
      if (item.amount <= 0) newErrors[`recipeAmount-${index}`] = "Menge > 0."
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    setIsSaving(true)

    const ingredientsList = recipe
      .map((item) => {
        const foundIngredient = availableIngredients.find((ing) => ing.id === item.ingredientId)
        return foundIngredient ? `${item.amount}ml ${foundIngredient.name}` : null
      })
      .filter(Boolean) as string[]

    const newCocktail: Cocktail = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // More unique ID
      name: name.trim(),
      description: description.trim(),
      image: imageUrl.trim(),
      alcoholic,
      ingredients: ingredientsList,
      recipe,
      isActive: true, // New cocktails are active by default
    }
    try {
      await onSave(newCocktail)
      // onClose will be called by parent on successful save if desired
    } catch (error) {
      console.error("Error saving cocktail from creator:", error)
      setErrors({ form: "Fehler beim Speichern des Cocktails." })
    } finally {
      setIsSaving(false)
    }
  }

  const openAlphaKeyboard = (
    type: "name" | "description" | "imageUrl",
    ref: React.RefObject<HTMLInputElement | HTMLTextAreaElement>,
    maxLength?: number,
  ) => {
    setActiveInput({ type, ref, maxLength })
    setShowAlphaKeyboard(true)
  }

  const openNumericKeyboard = (index: number, ref: React.RefObject<HTMLInputElement>) => {
    setActiveNumericInput({ index, ref })
    setShowNumericKeyboard(true)
  }

  const handleDialogInteraction = (callback: () => void) => {
    if (showAlphaKeyboard || showNumericKeyboard || showFileBrowser) {
      // If an inner dialog/keyboard is open, do nothing to prevent closing the main dialog
      return
    }
    callback()
  }

  const recipeAmountInputRefsArray = Array.from({ length: recipe.length }, (_, index) => useRef<HTMLInputElement>(null))

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleDialogInteraction(onClose)
      }}
    >
      <DialogContent
        className="bg-black border-[hsl(var(--cocktail-card-border))] text-white sm:max-w-2xl"
        onInteractOutside={(e) => handleDialogInteraction(() => e.preventDefault())} // Prevent close if inner dialogs are open
        onEscapeKeyDown={(e) => handleDialogInteraction(() => e.preventDefault())} // Prevent close if inner dialogs are open
      >
        <DialogHeader>
          <DialogTitle>Neuen Cocktail erstellen</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] p-1 pr-3">
          <div className="space-y-4 py-4 pr-2">
            {errors.form && (
              <Alert variant="destructive">
                <AlertDescription>{errors.form}</AlertDescription>
              </Alert>
            )}

            {/* Name */}
            <div className="space-y-1">
              <Label htmlFor={`${uniqueId}-name`} className="text-[hsl(var(--cocktail-text))]">
                Name
              </Label>
              <Input
                id={`${uniqueId}-name`}
                ref={nameInputRef}
                value={name}
                onFocus={() => openAlphaKeyboard("name", nameInputRef, 50)}
                readOnly
                className={`bg-[hsl(var(--cocktail-input-bg))] border-[hsl(var(--cocktail-input-border))] text-white ${errors.name ? "border-red-500" : ""}`}
              />
              {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label htmlFor={`${uniqueId}-description`} className="text-[hsl(var(--cocktail-text))]">
                Beschreibung
              </Label>
              <Textarea
                id={`${uniqueId}-description`}
                ref={descriptionTextareaRef}
                value={description}
                onFocus={() => openAlphaKeyboard("description", descriptionTextareaRef, 200)}
                readOnly
                className="bg-[hsl(var(--cocktail-input-bg))] border-[hsl(var(--cocktail-input-border))] text-white min-h-[80px]"
              />
            </div>

            {/* Image URL */}
            <div className="space-y-1">
              <Label htmlFor={`${uniqueId}-imageUrl`} className="text-[hsl(var(--cocktail-text))]">
                Bild-URL
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id={`${uniqueId}-imageUrl`}
                  ref={imageUrlInputRef}
                  value={imageUrl}
                  onFocus={() => openAlphaKeyboard("imageUrl", imageUrlInputRef, 200)}
                  readOnly
                  className={`flex-grow bg-[hsl(var(--cocktail-input-bg))] border-[hsl(var(--cocktail-input-border))] text-white ${errors.imageUrl ? "border-red-500" : ""}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowFileBrowser(true)}
                  className="border-[hsl(var(--cocktail-button-border))] hover:bg-[hsl(var(--cocktail-button-hover-bg))]"
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </div>
              {imageUrl && (
                <div className="mt-2 relative w-full h-32 rounded overflow-hidden border border-[hsl(var(--cocktail-card-border))]">
                  <Image
                    src={imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}
                    alt="Vorschau"
                    layout="fill"
                    objectFit="cover"
                    onError={(e) => (e.currentTarget.src = "/placeholder.svg?height=128&width=128")}
                  />
                </div>
              )}
              {errors.imageUrl && <p className="text-xs text-red-400">{errors.imageUrl}</p>}
            </div>

            {/* Alcoholic Switch */}
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id={`${uniqueId}-alcoholic`}
                checked={alcoholic}
                onCheckedChange={setAlcoholic}
                className="data-[state=checked]:bg-sky-500 data-[state=unchecked]:bg-gray-700"
              />
              <Label htmlFor={`${uniqueId}-alcoholic`} className="text-[hsl(var(--cocktail-text))]">
                Alkoholisch
              </Label>
            </div>

            {/* Recipe Items */}
            <div className="space-y-3 pt-2">
              <Label className="text-[hsl(var(--cocktail-text))]">Zutaten</Label>
              {errors.recipe && <p className="text-xs text-red-400">{errors.recipe}</p>}
              {recipe.map((item, index) => {
                const itemInputRef = recipeAmountInputRefsArray[index]
                return (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 border border-[hsl(var(--cocktail-card-border))] rounded"
                  >
                    <div className="flex-grow">
                      <Select
                        value={item.ingredientId}
                        onValueChange={(value) => handleRecipeChange(index, "ingredientId", value)}
                      >
                        <SelectTrigger
                          className={`bg-[hsl(var(--cocktail-input-bg))] border-[hsl(var(--cocktail-input-border))] text-white ${errors[`recipeIngredient-${index}`] ? "border-red-500" : ""}`}
                        >
                          <SelectValue placeholder="Zutat wählen" />
                        </SelectTrigger>
                        <SelectContent className="bg-black text-white border-[hsl(var(--cocktail-card-border))] max-h-48">
                          {loadingIngredients ? (
                            <div className="flex items-center justify-center p-2">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Zutaten laden...
                            </div>
                          ) : (
                            availableIngredients.map((ing) => (
                              <SelectItem key={ing.id} value={ing.id}>
                                {ing.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {errors[`recipeIngredient-${index}`] && (
                        <p className="text-xs text-red-400 mt-1">{errors[`recipeIngredient-${index}`]}</p>
                      )}
                    </div>
                    <div className="w-24">
                      <Input
                        type="number" // Fallback for non-touch devices
                        ref={itemInputRef}
                        value={item.amount === 0 ? "" : item.amount.toString()}
                        onFocus={() => itemInputRef.current && openNumericKeyboard(index, itemInputRef)}
                        readOnly
                        placeholder="ml"
                        className={`bg-[hsl(var(--cocktail-input-bg))] border-[hsl(var(--cocktail-input-border))] text-white text-center ${errors[`recipeAmount-${index}`] ? "border-red-500" : ""}`}
                      />
                      {errors[`recipeAmount-${index}`] && (
                        <p className="text-xs text-red-400 mt-1">{errors[`recipeAmount-${index}`]}</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveRecipeItem(index)}
                      className="text-red-500 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
              <Button
                type="button"
                variant="outline"
                onClick={handleAddRecipeItem}
                className="w-full border-[hsl(var(--cocktail-button-border))] hover:bg-[hsl(var(--cocktail-button-hover-bg))]"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Zutat hinzufügen
              </Button>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleDialogInteraction(onClose)}
            className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving || loadingIngredients}
            className="bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loadingIngredients ? "Zutaten laden..." : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>

      {showFileBrowser && (
        <FileBrowser
          isOpen={showFileBrowser}
          onClose={() => setShowFileBrowser(false)}
          onSelect={(filePath) => {
            setImageUrl(filePath)
            setShowFileBrowser(false)
          }}
          baseDirectory="public/images/cocktails"
        />
      )}
      {showAlphaKeyboard && activeInput && activeInput.ref.current && (
        <AlphaKeyboard
          targetInput={activeInput.ref.current}
          initialValue={
            activeInput.type === "name"
              ? name
              : activeInput.type === "description"
                ? description
                : activeInput.type === "imageUrl"
                  ? imageUrl
                  : ""
          }
          onClose={() => {
            setShowAlphaKeyboard(false)
            activeInput.ref.current?.focus()
          }}
          onConfirm={(value) => {
            if (activeInput.type === "name") setName(value)
            else if (activeInput.type === "description") setDescription(value)
            else if (activeInput.type === "imageUrl") setImageUrl(value)
            setShowAlphaKeyboard(false)
            activeInput.ref.current?.focus()
          }}
          maxLength={activeInput.maxLength}
        />
      )}
      {showNumericKeyboard && activeNumericInput && activeNumericInput.ref.current && (
        <VirtualKeyboard
          targetInput={activeNumericInput.ref.current}
          initialValue={recipe[activeNumericInput.index].amount.toString()}
          onClose={() => {
            setShowNumericKeyboard(false)
            activeNumericInput.ref.current?.focus()
          }}
          onConfirm={(value) => {
            handleRecipeChange(activeNumericInput.index, "amount", value)
            setShowNumericKeyboard(false)
            activeNumericInput.ref.current?.focus()
          }}
          allowDecimal={false} // Amounts are usually whole numbers for ml
          maxLength={4}
        />
      )}
    </Dialog>
  )
}
