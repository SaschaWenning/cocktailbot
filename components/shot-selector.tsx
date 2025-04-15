"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Check, AlertCircle, GlassWater } from "lucide-react"
import type { PumpConfig } from "@/types/pump"
import { ingredients } from "@/data/ingredients"
import { makeSingleShot } from "@/lib/cocktail-machine"
import type { IngredientLevel } from "@/types/ingredient-level"

interface ShotSelectorProps {
  pumpConfig: PumpConfig[]
  ingredientLevels: IngredientLevel[]
  onShotComplete: () => Promise<void>
}

export default function ShotSelector({ pumpConfig, ingredientLevels, onShotComplete }: ShotSelectorProps) {
  const [selectedIngredient, setSelectedIngredient] = useState<string | null>(null)
  const [isMaking, setIsMaking] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Filtere nur die Zutaten, die an Pumpen angeschlossen sind
  const availableIngredients = pumpConfig.map((pump) => {
    const ingredient = ingredients.find((i) => i.id === pump.ingredient)
    return {
      id: pump.ingredient,
      name: ingredient?.name || pump.ingredient,
      alcoholic: ingredient?.alcoholic || false,
      pumpId: pump.id,
    }
  })

  // Gruppiere Zutaten nach alkoholisch und nicht-alkoholisch
  const alcoholicIngredients = availableIngredients.filter((i) => i.alcoholic)
  const nonAlcoholicIngredients = availableIngredients.filter((i) => !i.alcoholic)

  const handleSelectShot = (ingredientId: string) => {
    setSelectedIngredient(ingredientId)
  }

  const handleCancelSelection = () => {
    setSelectedIngredient(null)
  }

  const checkIngredientAvailable = (ingredientId: string) => {
    const level = ingredientLevels.find((level) => level.ingredientId === ingredientId)
    return level && level.currentAmount >= 40
  }

  const handleMakeShot = async () => {
    if (!selectedIngredient) return

    setIsMaking(true)
    setProgress(0)
    setStatusMessage("Bereite Shot vor...")
    setErrorMessage(null)

    let intervalId: NodeJS.Timeout // Declare intervalId here

    try {
      // Simuliere den Fortschritt
      intervalId = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(intervalId)
            return 100
          }
          return prev + 10
        })
      }, 200)

      // Finde die Pumpe für die ausgewählte Zutat
      const pump = pumpConfig.find((p) => p.ingredient === selectedIngredient)
      if (!pump) {
        throw new Error("Keine Pumpe für diese Zutat konfiguriert")
      }

      // Bereite den Shot zu
      await makeSingleShot(selectedIngredient, 40)

      clearInterval(intervalId)
      setProgress(100)

      const ingredientName = ingredients.find((i) => i.id === selectedIngredient)?.name || selectedIngredient
      setStatusMessage(`${ingredientName} Shot (40ml) fertig!`)
      setShowSuccess(true)

      // Aktualisiere die Füllstände nach erfolgreicher Zubereitung
      await onShotComplete()

      setTimeout(() => {
        setIsMaking(false)
        setShowSuccess(false)
        setSelectedIngredient(null)
      }, 3000)
    } catch (error) {
      clearInterval(intervalId)
      setProgress(0)
      setStatusMessage("Fehler bei der Zubereitung!")
      setErrorMessage(error instanceof Error ? error.message : "Unbekannter Fehler")
      setTimeout(() => setIsMaking(false), 3000)
    }
  }

  if (isMaking) {
    return (
      <Card className="border-[hsl(var(--cocktail-card-border))] bg-white">
        <CardContent className="pt-6 space-y-4">
          <h2 className="text-xl font-semibold text-center">{statusMessage}</h2>
          <Progress value={progress} className="h-2" />

          {errorMessage && (
            <Alert className="bg-[hsl(var(--cocktail-error))]/10 border-[hsl(var(--cocktail-error))]/30">
              <AlertCircle className="h-4 w-4 text-[hsl(var(--cocktail-error))]" />
              <AlertDescription className="text-[hsl(var(--cocktail-error))]">{errorMessage}</AlertDescription>
            </Alert>
          )}

          {showSuccess && (
            <div className="flex justify-center">
              <div className="rounded-full bg-[hsl(var(--cocktail-success))]/20 p-3">
                <Check className="h-8 w-8 text-[hsl(var(--cocktail-success))]" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (selectedIngredient) {
    const ingredient = ingredients.find((i) => i.id === selectedIngredient)
    const isAvailable = checkIngredientAvailable(selectedIngredient)

    return (
      <div className="space-y-4">
        <Card className="border-[hsl(var(--cocktail-card-border))] bg-white">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-[hsl(var(--cocktail-primary))]/10 flex items-center justify-center">
                <GlassWater className="h-10 w-10 text-[hsl(var(--cocktail-primary))]" />
              </div>
              <h2 className="text-xl font-semibold">{ingredient?.name || selectedIngredient} Shot</h2>
              <p className="text-[hsl(var(--cocktail-text-muted))]">40ml</p>

              {!isAvailable && (
                <Alert className="bg-[hsl(var(--cocktail-error))]/10 border-[hsl(var(--cocktail-error))]/30">
                  <AlertCircle className="h-4 w-4 text-[hsl(var(--cocktail-error))]" />
                  <AlertDescription className="text-[hsl(var(--cocktail-error))]">
                    Nicht genügend {ingredient?.name || selectedIngredient} vorhanden! Bitte nachfüllen.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2 w-full mt-4">
                <Button className="flex-1" variant="outline" onClick={handleCancelSelection}>
                  Abbrechen
                </Button>
                <Button className="flex-1" onClick={handleMakeShot} disabled={!isAvailable}>
                  Shot zubereiten
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Alkoholische Shots</h2>
        <div className="grid grid-cols-2 gap-3">
          {alcoholicIngredients.map((ingredient) => (
            <Button
              key={ingredient.id}
              variant="outline"
              className={`h-auto py-3 justify-start ${!checkIngredientAvailable(ingredient.id) ? "opacity-50" : ""}`}
              onClick={() => handleSelectShot(ingredient.id)}
              disabled={!checkIngredientAvailable(ingredient.id)}
            >
              <div className="flex flex-col items-start">
                <span className="font-medium">{ingredient.name}</span>
                <span className="text-xs text-[hsl(var(--cocktail-text-muted))]">40ml Shot</span>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {nonAlcoholicIngredients.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Alkoholfreie Shots</h2>
          <div className="grid grid-cols-2 gap-3">
            {nonAlcoholicIngredients.map((ingredient) => (
              <Button
                key={ingredient.id}
                variant="outline"
                className={`h-auto py-3 justify-start ${!checkIngredientAvailable(ingredient.id) ? "opacity-50" : ""}`}
                onClick={() => handleSelectShot(ingredient.id)}
                disabled={!checkIngredientAvailable(ingredient.id)}
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">{ingredient.name}</span>
                  <span className="text-xs text-[hsl(var(--cocktail-text-muted))]">40ml Shot</span>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
