"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Cocktail } from "@/types/cocktail"
import { getAllIngredients } from "@/lib/ingredients"
import { saveRecipe } from "@/lib/cocktail-machine"
import { Loader2, ImageIcon, Trash2, Plus, Minus, FolderOpen, ArrowLeft } from "lucide-react"
import VirtualKeyboard from "./virtual-keyboard"
import { ScrollArea } from "@/components/ui/scroll-area"

interface RecipeEditorProps {
  isOpen: boolean
  onClose: () => void
  cocktail: Cocktail | null
  onSave: (updatedCocktail: Cocktail) => void
  onRequestDelete: (cocktailId: string) => void
}

// Verfügbare Bilder im Projekt
const AVAILABLE_IMAGES = [
  { path: "/images/cocktails/bahama_mama.jpg", name: "Bahama Mama" },
  { path: "/images/cocktails/big_john.jpg", name: "Big John" },
  { path: "/images/cocktails/long_island_iced_tea.jpg", name: "Long Island Iced Tea" },
  { path: "/images/cocktails/mai_tai.jpg", name: "Mai Tai" },
  { path: "/images/cocktails/malibu_ananas.jpg", name: "Malibu Ananas" },
  { path: "/images/cocktails/malibu_colada.jpg", name: "Malibu Colada" },
  { path: "/images/cocktails/malibu_sunrise.jpg", name: "Malibu Sunrise" },
  { path: "/images/cocktails/malibu_sunset.jpg", name: "Malibu Sunset" },
  { path: "/images/cocktails/mojito.jpg", name: "Mojito" },
  { path: "/images/cocktails/passion_colada.jpg", name: "Passion Colada" },
  { path: "/images/cocktails/peaches_cream.jpg", name: "Peaches & Cream" },
  { path: "/images/cocktails/planters_punch.jpg", name: "Planters Punch" },
  { path: "/images/cocktails/sex_on_the_beach.jpg", name: "Sex on the Beach" },
  { path: "/images/cocktails/solero.jpg", name: "Solero" },
  { path: "/images/cocktails/swimming_pool.jpg", name: "Swimming Pool" },
  { path: "/images/cocktails/tequila_sunrise.jpg", name: "Tequila Sunrise" },
  { path: "/images/cocktails/touch_down.jpg", name: "Touch Down" },
  { path: "/images/cocktails/zombie.jpg", name: "Zombie" },
]

export default function RecipeEditor({ isOpen, onClose, cocktail, onSave, onRequestDelete }: RecipeEditorProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [alcoholic, setAlcoholic] = useState(true)
  const [recipe, setRecipe] = useState<
    { ingredientId: string; amount: number; type: "automatic" | "manual"; instruction?: string }[]
  >([])
  const [saving, setSaving] = useState(false)
  const [ingredients, setIngredients] = useState(getAllIngredients())

  // View states - genau wie beim RecipeCreator
  const [currentView, setCurrentView] = useState<"form" | "keyboard" | "imageBrowser">("form")
  const [activeInput, setActiveInput] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState("")

  useEffect(() => {
    if (isOpen) {
      setIngredients(getAllIngredients())
    }
  }, [isOpen])

  // Lade die Cocktail-Daten beim Öffnen
  useEffect(() => {
    if (cocktail && isOpen) {
      setName(cocktail.name)
      setDescription(cocktail.description)
      setAlcoholic(cocktail.alcoholic)
      // Map existing recipe to include 'type' and 'instruction' for backward compatibility
      setRecipe(
        cocktail.recipe.map((item) => ({
          ...item,
          type: item.type || "automatic", // Default to 'automatic' if not present
          instruction: item.instruction || "", // Default to empty string
        })),
      )

      // Normalize image path
      let imagePath = cocktail.image || ""
      if (imagePath.startsWith("/placeholder")) {
        setImageUrl("")
      } else {
        // Stelle sicher, dass der Pfad mit / beginnt
        if (imagePath && !imagePath.startsWith("/") && !imagePath.startsWith("http")) {
          imagePath = `/${imagePath}`
        }
        // Entferne URL-Parameter
        imagePath = imagePath.split("?")[0]
        setImageUrl(imagePath)
      }

      // Reset view
      setCurrentView("form")
      setActiveInput(null)
      setInputValue("")

      console.log(`Editor loaded for ${cocktail.name}:`, {
        name: cocktail.name,
        description: cocktail.description,
        image: imagePath,
        alcoholic: cocktail.alcoholic,
        recipe: cocktail.recipe,
      })
    }
  }, [cocktail, isOpen])

  if (!cocktail) return null

  // Keyboard handlers - genau wie beim RecipeCreator
  const handleInputFocus = (inputType: string, currentValue = "") => {
    setActiveInput(inputType)
    setInputValue(currentValue)
    setCurrentView("keyboard")
  }

  const handleKeyboardInput = (value: string) => {
    setInputValue(value)
  }

  const handleKeyboardConfirm = () => {
    if (!activeInput) return

    switch (activeInput) {
      case "name":
        setName(inputValue)
        break
      case "description":
        setDescription(inputValue)
        break
      case "imageUrl":
        setImageUrl(inputValue)
        break
      default:
        if (activeInput.startsWith("amount-")) {
          const index = Number.parseInt(activeInput.replace("amount-", ""))
          const amount = Number.parseFloat(inputValue)
          if (!isNaN(amount) && amount >= 0) {
            handleAmountChange(index, amount)
          }
        } else if (activeInput.startsWith("instruction-")) {
          const index = Number.parseInt(activeInput.replace("instruction-", ""))
          handleInstructionChange(index, inputValue)
        }
        break
    }

    setCurrentView("form")
    setActiveInput(null)
    setInputValue("")
  }

  const handleKeyboardCancel = () => {
    setCurrentView("form")
    setActiveInput(null)
    setInputValue("")
  }

  // Recipe handlers
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

  const handleTypeChange = (index: number, type: "automatic" | "manual") => {
    const updatedRecipe = [...recipe]
    updatedRecipe[index] = { ...updatedRecipe[index], type }
    setRecipe(updatedRecipe)
  }

  const handleInstructionChange = (index: number, instruction: string) => {
    const updatedRecipe = [...recipe]
    updatedRecipe[index] = { ...updatedRecipe[index], instruction }
    setRecipe(updatedRecipe)
  }

  const addIngredient = () => {
    const availableIngredients = ingredients.filter(
      (ingredient) => !recipe.some((item) => item.ingredientId === ingredient.id),
    )

    if (availableIngredients.length > 0) {
      setRecipe([
        ...recipe,
        { ingredientId: availableIngredients[0].id, amount: 30, type: "automatic", instruction: "" },
      ])
    }
  }

  const removeIngredient = (index: number) => {
    if (recipe.length > 1) {
      const updatedRecipe = recipe.filter((_, i) => i !== index)
      setRecipe(updatedRecipe)
    }
  }

  // Image browser handlers
  const handleSelectImage = (path: string) => {
    setImageUrl(path)
    setCurrentView("form")
  }

  // Save handler
  const handleSave = async () => {
    if (!cocktail || !name.trim() || recipe.length === 0) return

    setSaving(true)
    try {
      const updatedCocktail: Cocktail = {
        ...cocktail,
        name: name.trim(),
        description: description.trim(),
        image: imageUrl || "/placeholder.svg?height=200&width=400",
        alcoholic,
        recipe: recipe,
        ingredients: recipe.map((item) => {
          const ingredient = ingredients.find((i) => i.id === item.ingredientId)
          const ingredientName = ingredient?.name || item.ingredientId.replace(/^custom-\d+-/, "")
          return `${item.amount}ml ${ingredientName} ${item.type === "manual" ? "(manuell)" : ""}`
        }),
      }

      await saveRecipe(updatedCocktail)
      onSave(updatedCocktail)
      onClose()
    } catch (error) {
      console.error("Fehler beim Speichern des Rezepts:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRequest = () => {
    if (!cocktail) return
    onRequestDelete(cocktail.id)
  }

  const getIngredientName = (id: string) => {
    const ingredient = ingredients.find((i) => i.id === id)
    return ingredient ? ingredient.name : id.replace(/^custom-\d+-/, "")
  }

  // Form View - genau wie beim RecipeCreator
  const renderFormView = () => (
    <div className="space-y-6 my-4 max-h-[70vh] overflow-y-auto pr-2">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-white">
          Name des Cocktails
        </Label>
        <Input
          id="name"
          value={name}
          onClick={() => handleInputFocus("name", name)}
          readOnly
          className="bg-white border-[hsl(var(--cocktail-card-border))] text-black cursor-pointer"
          placeholder="z.B. Mein Cocktail"
        />
      </div>

      {/* Beschreibung */}
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

      {/* Alkoholisch */}
      <div className="space-y-2">
        <Label className="text-white">Typ</Label>
        <Select
          value={alcoholic ? "alcoholic" : "virgin"}
          onValueChange={(value) => setAlcoholic(value === "alcoholic")}
        >
          <SelectTrigger className="bg-white border-[hsl(var(--cocktail-card-border))] text-black">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border border-[hsl(var(--cocktail-card-border))]">
            <SelectItem value="alcoholic" className="text-black hover:bg-gray-100 cursor-pointer">
              Mit Alkohol
            </SelectItem>
            <SelectItem value="virgin" className="text-black hover:bg-gray-100 cursor-pointer">
              Alkoholfrei
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bild */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-white">
          <ImageIcon className="h-4 w-4" />
          Bild (optional)
        </Label>
        <div className="flex gap-2">
          <Input
            value={imageUrl}
            onClick={() => handleInputFocus("imageUrl", imageUrl)}
            readOnly
            className="bg-white border-[hsl(var(--cocktail-card-border))] text-black cursor-pointer flex-1"
            placeholder="Bild-URL oder aus Galerie wählen"
          />
          <Button
            type="button"
            onClick={() => setCurrentView("imageBrowser")}
            className="bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
          >
            <FolderOpen className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Zutaten */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
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

        {recipe.map((item, index) => (
          <div
            key={index}
            className="grid grid-cols-12 gap-2 items-center p-3 bg-[hsl(var(--cocktail-card-bg))] rounded-lg border border-[hsl(var(--cocktail-card-border))]"
          >
            <div className="col-span-4">
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
            <div className="col-span-2">
              <Input
                type="text"
                value={item.amount}
                onClick={() => handleInputFocus(`amount-${index}`, item.amount.toString())}
                readOnly
                className="bg-white border-[hsl(var(--cocktail-card-border))] text-black cursor-pointer text-center"
              />
            </div>
            <div className="col-span-1 text-sm text-white">ml</div>
            <div className="col-span-3">
              <Select
                value={item.type}
                onValueChange={(value: "automatic" | "manual") => handleTypeChange(index, value)}
              >
                <SelectTrigger className="bg-white border-[hsl(var(--cocktail-card-border))] text-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-[hsl(var(--cocktail-card-border))]">
                  <SelectItem value="automatic" className="text-black hover:bg-gray-100 cursor-pointer">
                    Automatisch
                  </SelectItem>
                  <SelectItem value="manual" className="text-black hover:bg-gray-100 cursor-pointer">
                    Manuell
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
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
            {item.type === "manual" && (
              <div className="col-span-12 mt-2">
                <Input
                  value={item.instruction || ""}
                  onClick={() => handleInputFocus(`instruction-${index}`, item.instruction || "")}
                  readOnly
                  className="bg-white border-[hsl(var(--cocktail-card-border))] text-black cursor-pointer"
                  placeholder="Anleitung (z.B. 'mit Eiswürfeln auffüllen')"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  // Keyboard View - genau wie beim RecipeCreator
  const renderKeyboardView = () => (
    <div className="space-y-4 my-4">
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleKeyboardCancel}
          className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold text-white">
          {activeInput === "name" && "Name eingeben"}
          {activeInput === "description" && "Beschreibung eingeben"}
          {activeInput === "imageUrl" && "Bild-URL eingeben"}
          {activeInput?.startsWith("amount-") && "Menge eingeben (ml)"}
          {activeInput?.startsWith("instruction-") && "Anleitung eingeben"}
        </h3>
      </div>

      <div className="bg-[hsl(var(--cocktail-card-bg))] border border-[hsl(var(--cocktail-card-border))] rounded-lg p-4">
        <Input
          value={inputValue}
          readOnly
          className="bg-white border-[hsl(var(--cocktail-card-border))] text-black text-center text-lg"
          placeholder={
            activeInput === "name"
              ? "Cocktail-Name..."
              : activeInput === "description"
                ? "Beschreibung..."
                : activeInput === "imageUrl"
                  ? "https://..."
                  : activeInput?.startsWith("amount-")
                    ? "Menge in ml"
                    : "Anleitung..."
          }
        />
      </div>

      <VirtualKeyboard
        onInput={handleKeyboardInput}
        onConfirm={handleKeyboardConfirm}
        onCancel={handleKeyboardCancel}
        currentValue={inputValue}
        inputType={activeInput?.startsWith("amount-") ? "numeric" : "text"}
      />
    </div>
  )

  // Image Browser View - genau wie beim RecipeCreator
  const renderImageBrowserView = () => (
    <div className="space-y-4 my-4">
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentView("form")}
          className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold text-white">Bild auswählen</h3>
      </div>

      <ScrollArea className="h-[60vh] pr-4">
        <div className="grid grid-cols-2 gap-4">
          {AVAILABLE_IMAGES.map((image) => (
            <div
              key={image.path}
              className={`relative aspect-square cursor-pointer rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                imageUrl === image.path
                  ? "border-[hsl(var(--cocktail-primary))] ring-2 ring-[hsl(var(--cocktail-primary))]/50"
                  : "border-transparent hover:border-[hsl(var(--cocktail-card-border))]"
              }`}
              onClick={() => handleSelectImage(image.path)}
            >
              <img
                src={image.path || "/placeholder.svg"}
                alt={image.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg?height=200&width=200"
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 text-xs text-center text-white">
                {image.name}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black border-[hsl(var(--cocktail-card-border))] text-white sm:max-w-md max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Rezept bearbeiten: {cocktail.name}</DialogTitle>
        </DialogHeader>

        {currentView === "form" && renderFormView()}
        {currentView === "keyboard" && renderKeyboardView()}
        {currentView === "imageBrowser" && renderImageBrowserView()}

        {currentView === "form" && (
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
              <Button
                onClick={handleSave}
                disabled={saving || !name.trim() || recipe.length === 0}
                className="bg-[#00ff00] text-black hover:bg-[#00cc00]"
              >
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
        )}
      </DialogContent>
    </Dialog>
  )
}
