"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { makeSingleShot } from "@/lib/cocktail-machine"
import { ingredients } from "@/data/ingredients"
import type { PumpConfig } from "@/types/pump"
import { Progress } from "@/components/ui/progress"
import { Check, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface QuickShotSelectorProps {
  pumpConfig: PumpConfig[]
}

export default function QuickShotSelector({ pumpConfig }: QuickShotSelectorProps) {
  const [selectedPump, setSelectedPump] = useState<number | null>(null)
  const [selectedSize, setSelectedSize] = useState<number>(30)
  const [isMaking, setIsMaking] = useState(false)
  const [progress, setProgress] = useState<number>(0)
  const [statusMessage, setStatusMessage] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const sizes = [
    { value: 20, label: "Klein (20ml)" },
    { value: 30, label: "Normal (30ml)" },
    { value: 50, label: "Groß (50ml)" },
  ]

  const handleMakeShot = async () => {
    if (selectedPump === null) return

    setIsMaking(true)
    setProgress(0)
    setStatusMessage("Shot wird zubereitet...")
    setErrorMessage(null)

    try {
      await makeSingleShot(selectedPump, selectedSize, (progress, message) => {
        setProgress(progress)
        setStatusMessage(message)
      })

      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        setSelectedPump(null)
      }, 3000)
    } catch (error) {
      console.error("Fehler beim Zubereiten des Shots:", error)
      setErrorMessage(error instanceof Error ? error.message : "Unbekannter Fehler")
    } finally {
      setIsMaking(false)
      setProgress(0)
      setStatusMessage("")
    }
  }

  const getIngredientName = (ingredientId: string) => {
    const ingredient = ingredients.find((i) => i.id === ingredientId)
    return ingredient?.name || ingredientId
  }

  return (
    <div className="space-y-6">
      <Card className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))]">
        <CardHeader>
          <CardTitle className="text-white">Schnell-Shots</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white">Pumpe auswählen</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {pumpConfig.map((pump) => (
                <Button
                  key={pump.pumpNumber}
                  variant={selectedPump === pump.pumpNumber ? "default" : "outline"}
                  onClick={() => setSelectedPump(pump.pumpNumber)}
                  className={
                    selectedPump === pump.pumpNumber
                      ? "bg-[hsl(var(--cocktail-primary))] text-black"
                      : "bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))]"
                  }
                  disabled={isMaking}
                >
                  <div className="text-center">
                    <div className="font-semibold">Pumpe {pump.pumpNumber}</div>
                    <div className="text-xs">{getIngredientName(pump.ingredientId)}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Größe wählen</Label>
            <div className="flex gap-2">
              {sizes.map((size) => (
                <Button
                  key={size.value}
                  variant={selectedSize === size.value ? "default" : "outline"}
                  onClick={() => setSelectedSize(size.value)}
                  className={
                    selectedSize === size.value
                      ? "bg-[hsl(var(--cocktail-primary))] text-black"
                      : "bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))]"
                  }
                  disabled={isMaking}
                >
                  {size.label}
                </Button>
              ))}
            </div>
          </div>

          {!isMaking && !showSuccess && (
            <Button
              onClick={handleMakeShot}
              disabled={selectedPump === null}
              className="w-full bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))] disabled:opacity-50"
            >
              Shot zubereiten
            </Button>
          )}

          {isMaking && (
            <div className="text-center space-y-2">
              <div className="text-white">{statusMessage}</div>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-gray-300">{progress}% abgeschlossen</p>
            </div>
          )}

          {showSuccess && (
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Check className="h-6 w-6 text-green-500" />
                <span className="text-lg font-semibold text-green-500">Shot fertig!</span>
              </div>
              <p className="text-sm text-gray-300">Ihr Shot ist bereit!</p>
            </div>
          )}

          {errorMessage && (
            <Alert className="border-red-500 bg-red-500/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-400">{errorMessage}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
