"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cleanPump, cleanAllPumps } from "@/lib/cocktail-machine"
import { ingredients } from "@/data/ingredients"
import type { PumpConfig } from "@/types/pump"
import { Droplets, RefreshCw, AlertCircle, Check } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PumpCleaningProps {
  pumpConfig: PumpConfig[]
}

export default function PumpCleaning({ pumpConfig }: PumpCleaningProps) {
  const [cleaningPump, setCleaningPump] = useState<number | null>(null)
  const [cleaningAll, setCleaningAll] = useState(false)
  const [progress, setProgress] = useState<number>(0)
  const [statusMessage, setStatusMessage] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const getIngredientName = (ingredientId: string) => {
    const ingredient = ingredients.find((i) => i.id === ingredientId)
    return ingredient?.name || ingredientId
  }

  const handleCleanPump = async (pumpNumber: number) => {
    setCleaningPump(pumpNumber)
    setProgress(0)
    setStatusMessage(`Pumpe ${pumpNumber} wird gereinigt...`)
    setErrorMessage(null)

    try {
      await cleanPump(pumpNumber, (progress, message) => {
        setProgress(progress)
        setStatusMessage(message)
      })

      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
      }, 3000)
    } catch (error) {
      console.error("Fehler beim Reinigen der Pumpe:", error)
      setErrorMessage(error instanceof Error ? error.message : "Unbekannter Fehler")
    } finally {
      setCleaningPump(null)
      setProgress(0)
      setStatusMessage("")
    }
  }

  const handleCleanAllPumps = async () => {
    setCleaningAll(true)
    setProgress(0)
    setStatusMessage("Alle Pumpen werden gereinigt...")
    setErrorMessage(null)

    try {
      await cleanAllPumps((progress, message) => {
        setProgress(progress)
        setStatusMessage(message)
      })

      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
      }, 3000)
    } catch (error) {
      console.error("Fehler beim Reinigen aller Pumpen:", error)
      setErrorMessage(error instanceof Error ? error.message : "Unbekannter Fehler")
    } finally {
      setCleaningAll(false)
      setProgress(0)
      setStatusMessage("")
    }
  }

  const isAnyPumpCleaning = cleaningPump !== null || cleaningAll

  return (
    <div className="space-y-6">
      <Card className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Droplets className="h-5 w-5" />
            Pumpen-Reinigung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-blue-500 bg-blue-500/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-blue-400">
              Stellen Sie sicher, dass alle Schläuche in Reinigungsflüssigkeit eingetaucht sind, bevor Sie die Reinigung
              starten.
            </AlertDescription>
          </Alert>

          {/* Einzelne Pumpen */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">Einzelne Pumpen</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {pumpConfig.map((pump) => (
                <Button
                  key={pump.pumpNumber}
                  onClick={() => handleCleanPump(pump.pumpNumber)}
                  disabled={isAnyPumpCleaning}
                  className="bg-[hsl(var(--cocktail-card-bg))] text-white border border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))] disabled:opacity-50 h-auto p-3"
                >
                  <div className="text-center">
                    <div className="font-semibold">Pumpe {pump.pumpNumber}</div>
                    <div className="text-xs">{getIngredientName(pump.ingredientId)}</div>
                    {cleaningPump === pump.pumpNumber && <RefreshCw className="h-4 w-4 animate-spin mx-auto mt-1" />}
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Alle Pumpen */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">Alle Pumpen</h3>
            <Button
              onClick={handleCleanAllPumps}
              disabled={isAnyPumpCleaning}
              className="w-full bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))] disabled:opacity-50"
            >
              {cleaningAll ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Alle Pumpen reinigen...
                </>
              ) : (
                "Alle Pumpen reinigen"
              )}
            </Button>
          </div>

          {/* Status */}
          {isAnyPumpCleaning && (
            <div className="space-y-2">
              <div className="text-white text-center">{statusMessage}</div>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-gray-300 text-center">{progress}% abgeschlossen</p>
            </div>
          )}

          {showSuccess && (
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Check className="h-6 w-6 text-green-500" />
                <span className="text-lg font-semibold text-green-500">Reinigung abgeschlossen!</span>
              </div>
              <p className="text-sm text-gray-300">Die Pumpen sind jetzt sauber.</p>
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
