"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Droplets, AlertCircle, CheckCircle } from "lucide-react"
import type { PumpConfig } from "@/types/pump"
import { cleanPump, cleanAllPumps } from "@/lib/cocktail-machine"
import { ingredients } from "@/data/ingredients"

interface PumpCleaningProps {
  pumpConfig: PumpConfig[]
}

export default function PumpCleaning({ pumpConfig }: PumpCleaningProps) {
  const [selectedPump, setSelectedPump] = useState<string>("")
  const [cleaningDuration, setCleaningDuration] = useState<number>(10)
  const [isCleaningSingle, setIsCleaningSingle] = useState(false)
  const [isCleaningAll, setIsCleaningAll] = useState(false)
  const [progress, setProgress] = useState<number>(0)
  const [statusMessage, setStatusMessage] = useState<string>("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>("")

  const getIngredientName = (ingredientId: string) => {
    const ingredient = ingredients.find((i) => i.id === ingredientId)
    return ingredient?.name || ingredientId
  }

  const handleSinglePumpClean = async () => {
    if (!selectedPump) return

    const pumpId = Number.parseInt(selectedPump)
    const durationMs = cleaningDuration * 1000

    setIsCleaningSingle(true)
    setProgress(0)
    setStatusMessage(`Reinige Pumpe ${pumpId}...`)
    setErrorMessage("")
    setShowSuccess(false)

    try {
      // Fortschritt simulieren
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval)
            return 100
          }
          return prev + 100 / cleaningDuration
        })
      }, 1000)

      await cleanPump(pumpId, durationMs)

      clearInterval(progressInterval)
      setProgress(100)
      setStatusMessage("Reinigung abgeschlossen!")
      setShowSuccess(true)

      setTimeout(() => {
        setIsCleaningSingle(false)
        setShowSuccess(false)
        setProgress(0)
        setStatusMessage("")
      }, 3000)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unbekannter Fehler")
      setIsCleaningSingle(false)
      setProgress(0)
      setStatusMessage("")
    }
  }

  const handleAllPumpsClean = async () => {
    const durationMs = cleaningDuration * 1000

    setIsCleaningAll(true)
    setProgress(0)
    setStatusMessage("Reinige alle Pumpen...")
    setErrorMessage("")
    setShowSuccess(false)

    try {
      // Fortschritt simulieren
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval)
            return 100
          }
          return prev + 100 / cleaningDuration
        })
      }, 1000)

      await cleanAllPumps(durationMs)

      clearInterval(progressInterval)
      setProgress(100)
      setStatusMessage("Reinigung aller Pumpen abgeschlossen!")
      setShowSuccess(true)

      setTimeout(() => {
        setIsCleaningAll(false)
        setShowSuccess(false)
        setProgress(0)
        setStatusMessage("")
      }, 3000)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unbekannter Fehler")
      setIsCleaningAll(false)
      setProgress(0)
      setStatusMessage("")
    }
  }

  const isAnyCleaningActive = isCleaningSingle || isCleaningAll

  return (
    <div className="space-y-6">
      <Card className="bg-black border-[hsl(var(--cocktail-card-border))]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Droplets className="h-5 w-5 text-[hsl(var(--cocktail-primary))]" />
            Pumpenreinigung
          </CardTitle>
          <CardDescription className="text-gray-300">
            Reinigen Sie einzelne Pumpen oder alle Pumpen gleichzeitig. Verwenden Sie destilliertes Wasser oder
            Reinigungsflüssigkeit.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Reinigungsdauer */}
          <div className="space-y-2">
            <Label htmlFor="duration" className="text-white">
              Reinigungsdauer (Sekunden)
            </Label>
            <Input
              id="duration"
              type="number"
              min="5"
              max="60"
              value={cleaningDuration}
              onChange={(e) => setCleaningDuration(Number.parseInt(e.target.value) || 10)}
              disabled={isAnyCleaningActive}
              className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))]"
            />
          </div>

          {/* Einzelne Pumpe reinigen */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Einzelne Pumpe reinigen</h3>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="pump-select" className="text-white">
                  Pumpe auswählen
                </Label>
                <Select value={selectedPump} onValueChange={setSelectedPump} disabled={isAnyCleaningActive}>
                  <SelectTrigger className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))]">
                    <SelectValue placeholder="Pumpe auswählen" />
                  </SelectTrigger>
                  <SelectContent className="bg-black text-white border-[hsl(var(--cocktail-card-border))]">
                    {pumpConfig.map((pump) => (
                      <SelectItem key={pump.id} value={pump.id.toString()}>
                        Pumpe {pump.id} - {getIngredientName(pump.ingredient)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleSinglePumpClean}
                disabled={!selectedPump || isAnyCleaningActive}
                className="bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
              >
                {isCleaningSingle ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reinige...
                  </>
                ) : (
                  "Pumpe reinigen"
                )}
              </Button>
            </div>
          </div>

          {/* Alle Pumpen reinigen */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Alle Pumpen reinigen</h3>
            <Button
              onClick={handleAllPumpsClean}
              disabled={isAnyCleaningActive}
              className="w-full bg-[hsl(var(--cocktail-accent))] text-black hover:bg-[hsl(var(--cocktail-accent))]/80"
            >
              {isCleaningAll ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reinige alle Pumpen...
                </>
              ) : (
                "Alle Pumpen reinigen"
              )}
            </Button>
          </div>

          {/* Fortschrittsanzeige */}
          {isAnyCleaningActive && (
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

          {/* Hinweise */}
          <Alert className="bg-blue-600/10 border-blue-600/30">
            <AlertCircle className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-400">
              <strong>Reinigungshinweise:</strong>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>Verwenden Sie destilliertes Wasser oder spezielle Reinigungsflüssigkeit</li>
                <li>Stellen Sie sicher, dass die Reinigungsflüssigkeit in den entsprechenden Behältern ist</li>
                <li>Nach der Reinigung mit Wasser nachspülen</li>
                <li>Regelmäßige Reinigung verlängert die Lebensdauer der Pumpen</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
