"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Droplets, AlertTriangle } from "lucide-react"
import type { PumpConfig } from "@/types/pump"
import { ingredients } from "@/data/ingredients"
import { activatePumpForPriming } from "@/lib/cocktail-machine" // Sicherstellen, dass dies korrekt importiert wird

interface PumpPrimingProps {
  pumpConfig: PumpConfig[]
}

export default function PumpPriming({ pumpConfig }: PumpPrimingProps) {
  const [activePump, setActivePump] = useState<number | null>(null)
  const [isActivating, setIsActivating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getIngredientName = (ingredientId: string) => {
    const ingredient = ingredients.find((i) => i.id === ingredientId)
    return ingredient ? ingredient.name : ingredientId
  }

  const handlePriming = async (pumpId: number) => {
    if (isActivating) return

    setActivePump(pumpId)
    setIsActivating(true)
    setError(null)

    try {
      // Aktiviere die Pumpe für 1 Sekunde
      await activatePumpForPriming(pumpId, 1000)
    } catch (error) {
      console.error(`Fehler beim Entlüften der Pumpe ${pumpId}:`, error)
      setError(error instanceof Error ? error.message : "Unbekannter Fehler")
    } finally {
      setIsActivating(false)
      setActivePump(null)
    }
  }

  return (
    <Card className="bg-black border-[hsl(var(--cocktail-card-border))]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-white">
          <Droplets className="h-5 w-5 text-[hsl(var(--cocktail-primary))]" />
          Pumpen Entlüften
        </CardTitle>
        <CardDescription className="text-[hsl(var(--cocktail-text-muted))]">
          Aktiviere jede Pumpe für 1 Sekunde, um die Schläuche zu befüllen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Alert className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))]">
          <AlertTriangle className="h-4 w-4 text-[hsl(var(--cocktail-warning))]" />
          <AlertDescription className="text-[hsl(var(--cocktail-text))] text-sm">
            Stelle sicher, dass alle Schläuche korrekt angeschlossen sind und die Flaschen gefüllt sind.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-3 gap-2">
          {pumpConfig.map((pump) => (
            <Button
              key={pump.id}
              onClick={() => handlePriming(pump.id)}
              disabled={isActivating}
              className={`h-auto py-2 px-2 text-center ${
                activePump === pump.id
                  ? "bg-[hsl(var(--cocktail-primary))] text-black animate-pulse"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))] hover:text-[hsl(var(--cocktail-primary))]"
              }`}
            >
              <div className="flex flex-col items-center">
                {activePump === pump.id && isActivating ? (
                  <Loader2 className="h-4 w-4 animate-spin mb-1" />
                ) : (
                  <span className="text-xs mb-1">Pumpe {pump.id}</span>
                )}
                <span className="font-medium text-sm line-clamp-2 text-center">
                  {getIngredientName(pump.ingredient)}
                </span>
              </div>
            </Button>
          ))}
        </div>

        {error && (
          <Alert className="mt-2 bg-[hsl(var(--cocktail-error))]/10 border-[hsl(var(--cocktail-error))]/30">
            <AlertDescription className="text-[hsl(var(--cocktail-error))]">{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
