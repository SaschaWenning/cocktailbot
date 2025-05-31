"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { saveCustomIngredient } from "@/lib/ingredient-manager"
import type { Ingredient } from "@/types/pump"
import AlphaKeyboard from "./alpha-keyboard"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AddIngredientDialogProps {
  isOpen: boolean
  onClose: () => void
  onIngredientAdded: (newIngredient: Ingredient) => void
}

export default function AddIngredientDialog({ isOpen, onClose, onIngredientAdded }: AddIngredientDialogProps) {
  const [name, setName] = useState("")
  const [alcoholic, setAlcoholic] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Keyboard state - ähnlich wie in RecipeCreator
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [activeInput, setActiveInput] = useState<HTMLInputElement | null>(null)
  const [inputValue, setInputValue] = useState("")

  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setName("")
      setAlcoholic(false)
      setError(null)
      setIsLoading(false)
      setShowKeyboard(false)
      setActiveInput(null)
      setInputValue("")
    }
  }, [isOpen])

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Der Name der Zutat darf nicht leer sein.")
      return
    }
    setError(null)
    setIsLoading(true)
    try {
      const newIngredient = await saveCustomIngredient({ name: name.trim(), alcoholic })
      onIngredientAdded(newIngredient)
      onClose()
    } catch (err) {
      console.error("Failed to save ingredient:", err)
      setError(err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten.")
    } finally {
      setIsLoading(false)
    }
  }

  // Input focus handler - ähnlich wie in RecipeCreator
  const handleInputFocus = (input: HTMLInputElement) => {
    setActiveInput(input)
    setInputValue(input.value)
    setShowKeyboard(true)
  }

  const handleKeyboardClose = () => {
    setShowKeyboard(false)
    setActiveInput(null)
  }

  const handleKeyboardConfirm = (currentValue: string) => {
    if (activeInput) {
      setName(currentValue)
      activeInput.value = currentValue
    }
    setShowKeyboard(false)
    setActiveInput(null)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (showKeyboard) {
        setShowKeyboard(false)
        setActiveInput(null)
      }
      onClose()
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent
          className="bg-black border-[hsl(var(--cocktail-card-border))] text-white sm:max-w-md"
          onInteractOutside={(e) => {
            if (showKeyboard) {
              e.preventDefault()
            }
          }}
          onEscapeKeyDown={(e) => {
            if (showKeyboard) {
              e.preventDefault()
              setShowKeyboard(false)
              setActiveInput(null)
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Neue Zutat hinzufügen</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {error && (
              <Alert variant="destructive" className="bg-red-900/30 border-red-700 text-red-200">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="ingredient-name" className="text-[hsl(var(--cocktail-text))]">
                Name der Zutat
              </Label>
              <Input
                id="ingredient-name"
                ref={nameInputRef}
                value={name}
                onFocus={() => nameInputRef.current && handleInputFocus(nameInputRef.current)}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Cola Zero"
                className="bg-[hsl(var(--cocktail-input-bg))] border-[hsl(var(--cocktail-input-border))] text-white"
              />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="alcoholic-switch"
                checked={alcoholic}
                onCheckedChange={setAlcoholic}
                className="data-[state=checked]:bg-[hsl(var(--cocktail-primary))] data-[state=unchecked]:bg-gray-700"
              />
              <Label htmlFor="alcoholic-switch" className="text-[hsl(var(--cocktail-text))]">
                Alkoholisch
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (showKeyboard) {
                  setShowKeyboard(false)
                  setActiveInput(null)
                }
                onClose()
              }}
              className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading || !name.trim()}
              className="bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {showKeyboard && activeInput && (
        <AlphaKeyboard
          targetInput={activeInput}
          initialValue={inputValue}
          onClose={handleKeyboardClose}
          onConfirm={handleKeyboardConfirm}
          maxLength={50}
        />
      )}
    </>
  )
}
