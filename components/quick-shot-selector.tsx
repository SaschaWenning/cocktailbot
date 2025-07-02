"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Zap, AlertCircle, CheckCircle } from "lucide-react"
import type { PumpConfig } from "@/types/pump"
import { activatePumpForDuration } from "@/lib/cocktail-machine"

interface QuickShotSelectorProps {
  pumpConfig: PumpConfig[]
}

export default function QuickShotSelector({ pumpConfig }: QuickShotSelectorProps) {
  const [purgeDuration, setPurgeDuration] = useState<number>(3)
  const [activePumps, setActivePumps] = useState<Set<number>>(new Set())
  const [progress, setProgress] = useState<number>(0)
  const [statusMessage, setStatusMessage] = useState<string>("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>("")

  const handlePumpActivation = async (pumpId: number) => {
    const durationMs = purgeDuration * 1000

    setActivePumps((prev) => new Set(prev).add(pumpId))
    setProgress(0)
    setStatusMessage(`Spüle Pumpe ${pumpId}...`)
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
          return prev + 100 / purgeDuration
        })
      }, 1000)

      await activatePumpForDuration(pumpId, durationMs)

      clearInterval(progressInterval)
      setProgress(100)
      setStatusMessage(`Pumpe ${pumpId} gespült!`)
      setShowSuccess(true)

      setTimeout(() => {
        setActivePumps((prev) => {
          const newSet = new Set(prev)
          newSet.delete(pumpId)
          return newSet
        })
        setShowSuccess(false)
        setProgress(0)
        setStatusMessage("")
      }, 2000)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unbekannter Fehler")
      setActivePumps((prev) => {
        const newSet = new Set(prev)
        newSet.delete(pumpId)
        return newSet
      })
      setProgress(0)
      setStatusMessage("")
    }
  }

  const handleAllPumpsActivation = async () => {
    const durationMs = purgeDuration * 1000
    const allPumpIds = pumpConfig.map((p) => p.id)

    setActivePumps(new Set(allPumpIds))
    setProgress(0)
    setStatusMessage("Spüle alle Pumpen...")
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
          return prev + 100 / purgeDuration
        })
      }, 1000)

      // Alle Pumpen gleichzeitig aktivieren
      await Promise.all(allPumpIds.map((pumpId) => activatePumpForDuration(pumpId, durationMs)))

      clearInterval(progressInterval)
      setProgress(100)
      setStatusMessage("Alle Pumpen gespült!")
      setShowSuccess(true)

      setTimeout(() => {
        setActivePumps(new Set())
        setShowSuccess(false)
        setProgress(0)
        setStatusMessage("")
      }, 2000)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unbekannter Fehler")
      setActivePumps(new Set())
      setProgress(0)
      setStatusMessage("")
    }
  }

  const isAnyPumpActive = activePumps.size > 0

  return (
    <div className="space-y-6">
      <Card className="bg-black border-[hsl(var(--cocktail-card-border))]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-[hsl(var(--cocktail-primary))]" />
            Schnell-Spülung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Spüldauer */}
          <div className="space-y-2">
            <Label htmlFor="purge-duration" className="text-white">
              Spüldauer (Sekunden)
            </Label>
            <Input
              id="purge-duration"
              type="number"
              min="1"
              max="10"
              value={purgeDuration}
              onChange={(e) => setPurgeDuration(Number.parseInt(e.target.value) || 3)}
              disabled={isAnyPumpActive}
              className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))]"
            />
          </div>

          {/* Einzelne Pumpen */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Einzelne Pumpen spülen</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {pumpConfig.map((pump) => (
                <Button
                  key={pump.id}
                  onClick={() => handlePumpActivation(pump.id)}
                  disabled={isAnyPumpActive}
                  className={`h-16 flex flex-col items-center justify-center ${
                    activePumps.has(pump.id)
                      ? "bg-[hsl(var(--cocktail-accent))] text-black"
                      : "bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
                  }`}
                  variant="outline"
                >
                  {activePumps.has(pump.id) ? (
                    <Loader2 className="h-4 w-4 animate-spin mb-1" />
                  ) : (
                    <Zap className="h-4 w-4 mb-1" />
                  )}
                  <span className="text-xs">Pumpe {pump.id}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Alle Pumpen */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Alle Pumpen spülen</h3>
            <Button
              onClick={handleAllPumpsActivation}
              disabled={isAnyPumpActive}
              className="w-full h-16 bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
            >
              {isAnyPumpActive ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Spüle alle Pumpen...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-5 w-5" />
                  Alle Pumpen spülen ({purgeDuration}s)
                </>
              )}
            </Button>
          </div>

          {/* Fortschrittsanzeige */}
          {isAnyPumpActive && (
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
              <strong>Spül-Hinweise:</strong>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>Verwenden Sie diese Funktion zum schnellen Entlüften der Leitungen</li>
                <li>Ideal vor der ersten Nutzung oder nach längerer Standzeit</li>
                <li>Kurze Spülzeiten (1-3 Sekunden) reichen meist aus</li>
                <li>Stellen Sie sicher, dass Flüssigkeit in den Behältern ist</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
