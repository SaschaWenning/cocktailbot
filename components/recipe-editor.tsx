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

// Available images in the project
const AVAILABLE_IMAGES = [
  { path: "/images/cocktails/bahama_mama.jpg", name: "Bahama Mama" },
  { path: "/images/cocktails/big_john.jpg", name: "Big John" },
  { path: "/images/cocktails/long_island_iced_tea.jpg", name: "Long Island Iced Tea" },
  { path: "/images/cocktails/mai_tai.jpg", name: "Mai Tai" },
  { path: "/images/cocktails/malibu_ananas.jpg", name: "Malibu Pineapple" },
  { path: "/images/cocktails/malibu_colada.jpg", name: "Malibu Colada" },
  { path: "/images/cocktails/malibu_sunrise.jpg", name: "Malibu Sunrise" },
  { path: "/images/cocktails/malibu_sunset.jpg", name: "Malibu Sunset" },
  { path: "/images/cocktails/mojito.jpg", name: "Mojito" },
  { path: "/images/cocktails/passion_colada.jpg", name: "Passion Colada" },
  { path: "/images/cocktails/peaches_cream.jpg", name: "Peaches & Cream" },
  { path: "/images/cocktails/planters_punch.jpg", name: "Planter's Punch" },
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
  const [recipe, setRecipe] = useState<{ ingredientId: string; amount: number }[]>([])
  const [saving, setSaving] = useState(false)

  // View states - same as RecipeCreator
  const [currentView, setCurrentView] = useState<"form" | "keyboard" | "imageBrowser">("form")
  const [activeInput, setActiveInput] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState("")

  // Load cocktail data when opening
  useEffect(() => {
    if (cocktail && isOpen) {
      setName(cocktail.name)
      setDescription(cocktail.description)
      setAlcoholic(cocktail.alcoholic)
      setRecipe([...cocktail.recipe])

      // Normalize image path
      let imagePath = cocktail.image || ""
      if (imagePath.startsWith("/placeholder")) {
        setImageUrl("")
      } else {
        // Make sure path starts with /
        if (imagePath && !imagePath.startsWith("/") && !imagePath.startsWith("http")) {
          imagePath = `/${imagePath}`
        }
        // Remove URL parameters
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

  // Keyboard handlers - same as RecipeCreator
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
          return `${item.amount}ml ${ingredient?.name || item.ingredientId}`
        }),
      }

      await saveRecipe(updatedCocktail)
      onSave(updatedCocktail)
      onClose()
    } catch (error) {
      console.error("Error saving recipe:", error)
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
    return ingredient ? ingredient.name : id
  }

  // Form View - same as RecipeCreator
  const renderFormView = () => (
    <div className="space-y-6 my-4 max-h-[70vh] overflow-y-auto pr-2">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-white">
          Cocktail Name
        </Label>
        <Input
          id="name"
          value={name}
          onClick={() => handleInputFocus("name", name)}
          readOnly
          className="bg-white border-[hsl(var(--cocktail-card-border))] text-black cursor-pointer"
          placeholder="e.g. My Cocktail"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-white">
          Description
        </Label>
        <Input
          id="description"
          value={description}
          onClick={() => handleInputFocus("description", description)}
          readOnly
          className="bg-white border-[hsl(var(--cocktail-card-border))] text-black cursor-pointer"
          placeholder="Describe your cocktail..."
        />
      </div>

      {/* Alcoholic */}
      <div className="space-y-2">
        <Label className="text-white">Type</Label>
        <Select
          value={alcoholic ? "alcoholic" : "virgin"}
          onValueChange={(value) => setAlcoholic(value === "alcoholic")}
        >
          <SelectTrigger className="bg-white border-[hsl(var(--cocktail-card-border))] text-black">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border border-[hsl(var(--cocktail-card-border))]">
            <SelectItem value="alcoholic" className="text-black hover:bg-gray-100 cursor-pointer">
              With Alcohol
            </SelectItem>
            <SelectItem value="virgin" className="text-black hover:bg-gray-100 cursor-pointer">
              Non-Alcoholic
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Image */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-white">
          <ImageIcon className="h-4 w-4" />
          Image (optional)
        </Label>
        <div className="flex gap-2">
          <Input
            value={imageUrl}
            onClick={() => handleInputFocus("imageUrl", imageUrl)}
            readOnly
            className="bg-white border-[hsl(var(--cocktail-card-border))] text-black cursor-pointer flex-1"
            placeholder="Image URL or select from gallery"
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

      {/* Recipe */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label className="text-white">Recipe</Label>
          <Button
            type="button"
            size="sm"
            onClick={addIngredient}
            className="bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
            disabled={recipe.length >= ingredients.length}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Ingredient
          </Button>
        </div>

        <div className="space-y-2">
          {recipe.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-2 items-center p-3 bg-[hsl(var(--cocktail-card-bg))] rounded border border-[hsl(var(--cocktail-card-border))]"
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
      </div>
    </div>
  )

  // Keyboard View - same as RecipeCreator
  const renderKeyboardView = () => {
    const isNumeric = activeInput?.startsWith("amount-")

    return (
      <div className="space-y-4 my-4">
        <div className="flex items-center gap-2 mb-4">
          <Button type="button" onClick={handleKeyboardCancel} className="bg-gray-700 hover:bg-gray-600 text-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold text-white">
            {activeInput === "name" && "Edit Name"}
            {activeInput === "description" && "Edit Description"}
            {activeInput === "imageUrl" && "Edit Image URL"}
            {activeInput?.startsWith("amount-") && "Edit Amount (ml)"}
          </h3>
        </div>

        <VirtualKeyboard
          value={inputValue}
          onChange={handleKeyboardInput}
          onConfirm={handleKeyboardConfirm}
          onCancel={handleKeyboardCancel}
          allowDecimal={isNumeric}
          numericOnly={isNumeric}
        />
      </div>
    )
  }

  // Image Browser View
  const renderImageBrowserView = () => (
    <div className="space-y-4 my-4">
      <div className="flex items-center gap-2 mb-4">
        <Button
          type="button"
          onClick={() => setCurrentView("form")}
          className="bg-gray-700 hover:bg-gray-600 text-white"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold text-white">Select Image</h3>
      </div>

      <ScrollArea className="h-[50vh]">
        <div className="grid grid-cols-2 gap-3">
          {AVAILABLE_IMAGES.map((image) => (
            <div
              key={image.path}
              onClick={() => handleSelectImage(image.path)}
              className="cursor-pointer group border border-[hsl(var(--cocktail-card-border))] rounded-lg overflow-hidden hover:border-[hsl(var(--cocktail-primary))] transition-colors"
            >
              <div className="aspect-video bg-gray-800 flex items-center justify-center">
                <img
                  src={image.path || "/placeholder.svg"}
                  alt={image.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = "none"
                    target.nextElementSibling?.classList.remove("hidden")
                  }}
                />
                <div className="hidden text-white text-sm text-center p-2">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  {image.name}
                </div>
              </div>
              <div className="p-2 bg-[hsl(var(--cocktail-card-bg))]">
                <p className="text-white text-sm truncate">{image.name}</p>
                <p className="text-gray-400 text-xs truncate">{image.path}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-black border-[hsl(var(--cocktail-card-border))] text-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Recipe: {cocktail.name}</DialogTitle>
        </DialogHeader>

        {currentView === "form" && renderFormView()}
        {currentView === "keyboard" && renderKeyboardView()}
        {currentView === "imageBrowser" && renderImageBrowserView()}

        {currentView === "form" && (
          <DialogFooter className="flex justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteRequest}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Recipe
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-[#00ff00] text-black hover:bg-[#00cc00]">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
