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
import { Loader2, ImageIcon, Plus, Minus, FolderOpen, X } from "lucide-react"
import VirtualKeyboard from "./virtual-keyboard"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from "next/image"

interface RecipeCreatorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (newCocktail: Cocktail) => void
}

// Alle verfügbaren Bilder im Projekt, gruppiert nach Kategorien
const ALL_AVAILABLE_IMAGES = [
  {
    id: "cocktails",
    name: "Cocktails",
    files: [
      { path: "/images/cocktails/bahama_mama.jpg", name: "bahama_mama.jpg" },
      { path: "/images/cocktails/big_john.jpg", name: "big_john.jpg" },
      { path: "/images/cocktails/long_island_iced_tea.jpg", name: "long_island_iced_tea.jpg" },
      { path: "/images/cocktails/mai_tai.jpg", name: "mai_tai.jpg" },
      { path: "/images/cocktails/malibu_ananas.jpg", name: "malibu_ananas.jpg" },
      { path: "/images/cocktails/malibu_colada.jpg", name: "malibu_colada.jpg" },
      { path: "/images/cocktails/malibu_sunrise.jpg", name: "malibu_sunrise.jpg" },
      { path: "/images/cocktails/malibu_sunset.jpg", name: "malibu_sunset.jpg" },
      { path: "/images/cocktails/mojito.jpg", name: "mojito.jpg" },
      { path: "/images/cocktails/passion_colada.jpg", name: "passion_colada.jpg" },
      { path: "/images/cocktails/peaches_cream.jpg", name: "peaches_cream.jpg" },
      { path: "/images/cocktails/planters_punch.jpg", name: "planters_punch.jpg" },
      { path: "/images/cocktails/sex_on_the_beach.jpg", name: "sex_on_the_beach.jpg" },
      { path: "/images/cocktails/solero.jpg", name: "solero.jpg" },
      { path: "/images/cocktails/swimming_pool.jpg", name: "swimming_pool.jpg" },
      { path: "/images/cocktails/swimmingpool.jpg", name: "swimmingpool.jpg" },
      { path: "/images/cocktails/tequila_sunrise.jpg", name: "tequila_sunrise.jpg" },
      { path: "/images/cocktails/touch_down.jpg", name: "touch_down.jpg" },
      { path: "/images/cocktails/touchdown.jpg", name: "touchdown.jpg" },
      { path: "/images/cocktails/zombie.jpg", name: "zombie.jpg" },
    ],
  },
  {
    id: "backgrounds",
    name: "Hintergründe",
    files: [
      { path: "/bursting-berries.png", name: "bursting-berries.png" },
      { path: "/citrus-swirl-sunset.png", name: "citrus-swirl-sunset.png" },
      { path: "/palm-glow.png", name: "palm-glow.png" },
      { path: "/refreshing-citrus-cooler.png", name: "refreshing-citrus-cooler.png" },
      { path: "/tropical-blend.png", name: "tropical-blend.png" },
      { path: "/vibrant-passion-fizz.png", name: "vibrant-passion-fizz.png" },
    ],
  },
]

export default function RecipeCreator({ isOpen, onClose, onSave }: RecipeCreatorProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [recipe, setRecipe] = useState<{ ingredientId: string; amount: number }[]>([])
  const [imageUrl, setImageUrl] = useState("")
  const [alcoholic, setAlcoholic] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [activeInput, setActiveInput] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState("")
  const [keyboardLayout, setKeyboardLayout] = useState<"alphanumeric" | "numeric">("alphanumeric")
  const [errors, setErrors] = useState<{
    name?: string
    imageUrl?: string
  }>({})
  const [showImageBrowser, setShowImageBrowser] = useState(false)
  const [currentImageCategory, setCurrentImageCategory] = useState(ALL_AVAILABLE_IMAGES[0].id) // Standardkategorie
  const [selectedImageForPreview, setSelectedImageForPreview] = useState<string | null>(null)

  useEffect(() => {
    if (recipe.length === 0) {
      addIngredient()
    }
  }, [recipe])

  useEffect(() => {
    if (showImageBrowser) {
      setSelectedImageForPreview(imageUrl || null)
    }
  }, [showImageBrowser, imageUrl])

  const handleInputFocus = (inputType: string, currentValue = "") => {
    setActiveInput(inputType)
    setInputValue(currentValue)
    if (inputType.startsWith("amount-")) {
      setKeyboardLayout("numeric")
    } else {
      setKeyboardLayout("alphanumeric")
    }
    setShowKeyboard(true)
  }

  const handleKeyboardInput = (key: string) => {
    setInputValue((prev) => {
      if (activeInput?.startsWith("amount-")) {
        if (key === "." && prev.includes(".")) return prev
        if (key === "00" && prev === "") return "0"
        if (isNaN(Number(key)) && key !== "." && key !== "00") return prev
      }
      return prev + key
    })
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
        handleAmountChange(index, amount)
      }
    }

    setShowKeyboard(false) // Nur die Tastatur schließen
    setActiveInput(null)
    setInputValue("")
  }

  const handleKeyboardCancel = () => {
    setShowKeyboard(false) // Nur die Tastatur schließen
    setActiveInput(null)
    setInputValue("")
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
    } else {
      console.warn("Alle Zutaten sind bereits im Rezept enthalten.")
    }
  }

  const removeIngredient = (index: number) => {
    if (recipe.length > 1) {
      const updatedRecipe = recipe.filter((_, i) => i !== index)
      setRecipe(updatedRecipe)
    }
  }

  const isValidUrl = (url: string) => {
    if (!url) return true

    if (url.startsWith("/")) return true

    try {
      new URL(url)
      return true
    } catch (e) {
      return false
    }
  }

  const validateForm = () => {
    const newErrors: { name?: string; imageUrl?: string } = {}

    if (!name.trim()) {
      newErrors.name = "Name ist erforderlich"
    }

    if (imageUrl && !isValidUrl(imageUrl)) {
      newErrors.imageUrl = "Bitte gib eine gültige URL ein"
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
      // Formular zurücksetzen
      setName("")
      setDescription("")
      setRecipe([])
      setImageUrl("")
      setAlcoholic(true)
      setErrors({})
    } catch (error) {
      console.error("Fehler beim Speichern des neuen Rezepts:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleSelectImage = (path: string) => {
    setSelectedImageForPreview(path)
  }

  const confirmImageSelection = () => {
    setImageUrl(selectedImageForPreview || "")
    setShowImageBrowser(false)
  }

  const clearImage = () => {
    setImageUrl("")
    setSelectedImageForPreview(null)
  }

  const currentCategoryFiles = ALL_AVAILABLE_IMAGES.find((cat) => cat.id === currentImageCategory)?.files || []

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-black border-[hsl(var(--cocktail-card-border))] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Neues Rezept erstellen</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 my-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onClick={() => handleInputFocus("name", name)}
                readOnly
                className={`bg-white border-[hsl(var(--cocktail-card-border))] text-black cursor-pointer ${errors.name ? "border-red-500" : ""}`}
                placeholder="Name des Cocktails"
              />
              {errors.name && <p className="text-red-400 text-xs">{errors.name}</p>}
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
                Bild-URL (optional)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="imageUrl"
                  value={imageUrl}
                  onClick={() => handleInputFocus("imageUrl", imageUrl)}
                  readOnly
                  className={`bg-white border-[hsl(var(--cocktail-card-border))] text-black cursor-pointer flex-1 ${errors.imageUrl ? "border-red-500" : ""}`}
                  placeholder="https://beispiel.com/mein-cocktail.jpg"
                />
                <Button
                  type="button"
                  onClick={() => setShowImageBrowser(true)}
                  className="bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
                {imageUrl && (
                  <Button type="button" variant="destructive" size="icon" onClick={clearImage} className="h-10 w-10">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {errors.imageUrl && <p className="text-red-400 text-xs">{errors.imageUrl}</p>}
              <p className="text-xs text-gray-300">
                Wähle ein Bild aus oder gib die URL zu einem Bild ein. Leer lassen für ein Platzhalterbild.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alcoholic" className="text-white">
                Alkoholisch
              </Label>
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
        </DialogContent>
      </Dialog>

      {/* Bild-Browser Dialog */}
      <Dialog open={showImageBrowser} onOpenChange={setShowImageBrowser}>
        <DialogContent className="bg-black border-[hsl(var(--cocktail-card-border))] text-white sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Bild auswählen</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-[1fr_2fr] gap-4 h-[60vh]">
            {/* Linke Spalte: Ordner/Kategorien und Bildliste */}
            <div className="flex flex-col border-r border-[hsl(var(--cocktail-card-border))] pr-4">
              <h3 className="text-lg font-semibold mb-2 text-white">Ordner</h3>
              <ScrollArea className="h-full">
                <div className="space-y-1">
                  {ALL_AVAILABLE_IMAGES.map((category) => (
                    <Button
                      key={category.id}
                      variant="ghost"
                      onClick={() => {
                        setCurrentImageCategory(category.id)
                        setSelectedImageForPreview(null) // Reset preview when changing folder
                      }}
                      className={`w-full justify-start text-left ${
                        currentImageCategory === category.id
                          ? "bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
                          : "text-white hover:bg-[hsl(var(--cocktail-card-border))]"
                      }`}
                    >
                      <FolderOpen className="h-4 w-4 mr-2" />
                      {category.name}
                    </Button>
                  ))}
                </div>
              </ScrollArea>

              <h3 className="text-lg font-semibold mt-4 mb-2 text-white">Dateien</h3>
              <ScrollArea className="h-full">
                <div className="space-y-1">
                  {currentCategoryFiles.map((image) => (
                    <Button
                      key={image.path}
                      variant="ghost"
                      onClick={() => handleSelectImage(image.path)}
                      className={`w-full justify-start text-left text-sm ${
                        selectedImageForPreview === image.path
                          ? "bg-[hsl(var(--cocktail-card-border))] text-[hsl(var(--cocktail-primary))]"
                          : "text-white hover:bg-[hsl(var(--cocktail-card-border))]"
                      }`}
                    >
                      {image.name}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Rechte Spalte: Vorschaubild */}
            <div className="flex flex-col items-center justify-center bg-[hsl(var(--cocktail-card-bg))] rounded-md p-4">
              <h3 className="text-lg font-semibold mb-4 text-white">Vorschau</h3>
              <div className="relative w-full aspect-video border border-[hsl(var(--cocktail-card-border))] rounded-md overflow-hidden">
                <Image
                  src={selectedImageForPreview || "/placeholder.svg?height=400&width=600&query=No image selected"}
                  alt="Vorschau"
                  fill
                  className="object-contain" // Use object-contain to fit image within bounds
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg?height=400&width=600"
                  }}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <p className="text-sm text-center mt-2 text-gray-300">
                {selectedImageForPreview ? selectedImageForPreview.split("/").pop() : "Kein Bild ausgewählt"}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowImageBrowser(false)}
              className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
            >
              Abbrechen
            </Button>
            <Button
              onClick={confirmImageSelection}
              disabled={!selectedImageForPreview} // Disable if no image is selected
              className="bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
            >
              Bild auswählen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showKeyboard && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999] pointer-events-auto">
          <div className="w-full max-w-lg p-4 flex flex-col">
            {" "}
            {/* Adjusted max-w for keyboard */}
            <div className="bg-black border border-[hsl(var(--cocktail-card-border))] rounded-lg p-4 mb-4">
              <Label className="text-white mb-2 block">
                {activeInput === "name" && "Name eingeben"}
                {activeInput === "description" && "Beschreibung eingeben"}
                {activeInput === "imageUrl" && "Bild-URL eingeben"}
                {activeInput?.startsWith("amount-") && "Menge eingeben (ml)"}
              </Label>
              <Input
                value={inputValue}
                readOnly
                className="bg-white border-[hsl(var(--cocktail-card-border))] text-black text-center text-lg"
                placeholder={
                  activeInput === "name"
                    ? "Name des Cocktails"
                    : activeInput === "description"
                      ? "Beschreibung..."
                      : activeInput === "imageUrl"
                        ? "https://..."
                        : "Menge in ml"
                }
              />
            </div>
            <VirtualKeyboard
              onKeyPress={handleKeyboardInput}
              onBackspace={handleKeyboardBackspace}
              onClear={handleKeyboardClear}
              onConfirm={handleKeyboardConfirm}
              onCancel={handleKeyboardCancel}
              layout={keyboardLayout}
            />
          </div>
        </div>
      )}
    </>
  )
}
