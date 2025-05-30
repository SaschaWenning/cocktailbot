"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { saveCustomIngredient } from "@/lib/ingredient-manager"
import type { Ingredient } from "@/types/pump"
import AlphaKeyboard from "./alpha-keyboard" // Assuming AlphaKeyboard exists
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

  const [showKeyboard, setShowKeyboard] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setName("")
      setAlcoholic(false)
      setError(null)
      setIsLoading(false)
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
      onClose() // Close dialog on success
    } catch (err) {
      console.error("Failed to save ingredient:", err)
      setError(err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleNameFocus = () => {
    setShowKeyboard(true)
  }

  const handleKeyboardClose = () => {
    setShowKeyboard(false)
    nameInputRef.current?.focus()
  }

  const handleKeyboardConfirm = (currentValue: string) => {
    setName(currentValue)
    setShowKeyboard(false)
    nameInputRef.current?.focus()
  }

  const handleDialogClose = () => {
    if (showKeyboard) {
      setShowKeyboard(false) // Close keyboard first if open
    } else {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDialogClose()}>
      <DialogContent className="bg-black border-[hsl(var(--cocktail-card-border))] text-white sm:max-w-md">
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
              onFocus={handleNameFocus}
              onChange={(e) => setName(e.target.value)} // Allow direct typing as fallback
              readOnly={showKeyboard} // Prevent typing when keyboard is open for consistency
              placeholder="z.B. Cola Zero"
              className="bg-[hsl(var(--cocktail-input-bg))] border-[hsl(var(--cocktail-input-border))] text-white"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="alcoholic-switch"
              checked={alcoholic}
              onCheckedChange={setAlcoholic}
              className="data-[state=checked]:bg-sky-500 data-[state=unchecked]:bg-gray-700"
            />
            <Label htmlFor="alcoholic-switch" className="text-[hsl(var(--cocktail-text))]">
              Alkoholisch
            </Label>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant="outline"
              onClick={onClose}
              className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
            >
              Abbrechen
            </Button>
          </DialogClose>
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
      {showKeyboard && nameInputRef.current && (
        <AlphaKeyboard
          targetInput={nameInputRef.current}
          initialValue={name}
          onClose={handleKeyboardClose}
          onConfirm={handleKeyboardConfirm}
          maxLength={50}
        />
      )}
    </Dialog>
  )
}
