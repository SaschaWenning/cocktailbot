"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Wine, AlertCircle, CheckCircle } from "lucide-react"
import type { PumpConfig } from "@/types/pump"
import type { IngredientLevel } from "@/types/ingredient-level"
import { makeSingleShot } from "@/lib/cocktail-machine"
import { ingredients } from "@/data/ingredients"

interface ShotSelectorProps {
  pumpConfig: PumpConfig[]
  ingredientLevels: IngredientLevel[]
  onShotComplete?: () => Promise<void>
  availableIngredients: string[]
}

export default function ShotSelector({
  pumpConfig,
  ingredientLevels,
  onShotComplete,
  availableIngredients,
}: ShotSelectorProps) {
  const [selectedIngredient, setSelectedIngredient] = useState<string>("")
  const [shotAmount, setShotAmount] = useState<number>(30)
  const [isMaking, setIsMaking] = useState(false)
  const [progress, setProgress] = useState<number>(0)
  const [statusMessage, setStatusMessage] = useState<string>("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>("")

  const getIngredientName = (ingredientId: string) => {
    const ingredient = ingredients.find((i) => i.id === ingredientId)
    return ingredient?.name || ingredientId
  }

  const getIngredientLevel = (ingredientId: string) => {
    return ingredientLevels.find((level) => level.ingredientId === ingredientId)
  }

  const canMakeShot = (ingredientId: string, amount: number) => {
    const level = getIngredientLevel(ingredientId)
    const pump = pumpConfig.find((p) => p.ingredient === ingredientId)
    return level && pump && level.currentAmount >= amount
  }

  const handleMakeShot = async () => {
    if (!selectedIngredient || shotAmount <= 0) return

    setIsMaking(true)
    setProgress(0)
    setStatusMessage(`Bereite ${shotAmount}ml ${getIngredientName(selectedIngredient)} zu...`)
    setErrorMessage("")
    setShowSuccess(false)

    try {
      // Fortschritt simulieren
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      await makeSingleShot(selectedIngredient, shotAmount, pumpConfig)

      clearInterval(progressInterval)
      setProgress(100)
      setStatusMessage("Shot fertig!")
      setShowSuccess(true)

      // Füllstände aktualisieren
      if (onShotComplete) {
        await onShotComplete()
      }

      setTimeout(() => {
        setIsMaking(false)
        setShowSuccess(false)
        setProgress(0)
        setStatusMessage("")
        setSelectedIngredient("")
        setShotAmount(30)
      }, 3000)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unbekannter Fehler")
      setIsMaking(false)
      setProgress(0)
      setStatusMessage("")
    }
  }

  // Verfügbare Zutaten (nur die mit konfigurierten Pumpen)
  const availablePumpIngredients = pumpConfig
    .filter((pump) => availableIngredients.includes(pump.ingredient))
    .map((pump) => pump.ingredient)

  return (
    <div className="space-y-6">
      <Card className="bg-black border-[hsl(var(--cocktail-card-border))]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Wine className="h-5 w-5 text-[hsl(var(--cocktail-primary))]" />
            Einzelne Shots
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Zutatenauswahl */}
          <div className="space-y-2">
            <Label htmlFor="ingredient-select" className="text-white">
              Zutat auswählen
            </Label>
            <Select value={selectedIngredient} onValueChange={setSelectedIngredient} disabled={isMaking}>
              <SelectTrigger className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))]">
                <SelectValue placeholder="Zutat auswählen" />
              </SelectTrigger>
              <SelectContent className="bg-black text-white border-[hsl(var(--cocktail-card-border))]">
                {availablePumpIngredients.map((ingredientId) => {
                  const level = getIngredientLevel(ingredientId)
                  const pump = pumpConfig.find((p) => p.ingredient === ingredientId)
                  return (
                    <SelectItem key={ingredientId} value={ingredientId}>
                      <div className="flex justify-between items-center w-full">
                        <span>{getIngredientName(ingredientId)}</span>
                        <span className="text-sm text-gray-400 ml-2">
                          Pumpe {pump?.id} - {level?.currentAmount || 0}ml
                        </span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Mengenauswahl */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-white">
              Menge (ml)
            </Label>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                min="10"
                max="200"
                step="10"
                value={shotAmount}
                onChange={(e) => setShotAmount(Number.parseInt(e.target.value) || 30)}
                disabled={isMaking}
                className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))]"
              />
              <div className="flex gap-1">
                {[20, 30, 50].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setShotAmount(amount)}
                    disabled={isMaking}
                    className={`${
                      shotAmount === amount
                        ? "bg-[hsl(var(--cocktail-primary))] text-black"
                        : "bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))]"
                    }`}
                  >
                    {amount}ml
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Verfügbarkeitscheck */}
          {selectedIngredient && !canMakeShot(selectedIngredient, shotAmount) && (
            <Alert className="bg-red-600/10 border-red-600/30">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-400">
                Nicht genügend {getIngredientName(selectedIngredient)} verfügbar. Verfügbar:{" "}
                {getIngredientLevel(selectedIngredient)?.currentAmount || 0}ml
              </AlertDescription>
            </Alert>
          )}

          {/* Shot zubereiten Button */}
          <Button
            onClick={handleMakeShot}
            disabled={!selectedIngredient || !canMakeShot(selectedIngredient, shotAmount) || isMaking}
            className="w-full bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
          >
            {isMaking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Bereite zu...
              </>
            ) : (
              `${shotAmount}ml ${selectedIngredient ? getIngredientName(selectedIngredient) : "Shot"} zubereiten`
            )}
          </Button>

          {/* Fortschrittsanzeige */}
          {isMaking && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-white">{statusMessage}</span>
                <span className="text-white">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Erfolgsmeldung */}
          {showSuccess && (
            <Alert className="bg-green-600/10 border-green-600/30">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-400">{statusMessage}</AlertDescription>
            </Alert>
          )}

          {/* Fehlermeldung */}
          {errorMessage && (
            <Alert className="bg-red-600/10 border-red-600/30">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-400">{errorMessage}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
