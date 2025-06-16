"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Loader2, Droplets, Check, AlertTriangle } from "lucide-react"
import type { PumpConfig } from "@/types/pump"
import { activatePumpForDuration } from "@/lib/cocktail-machine"

interface PumpCleaningProps {
  pumpConfig: PumpConfig[]
}

export default function PumpCleaning({ pumpConfig }: PumpCleaningProps) {
  const [cleaningStatus, setCleaningStatus] = useState<"idle" | "preparing" | "cleaning" | "complete">("idle")
  const [currentPump, setCurrentPump] = useState<number | null>(null)
  const [progress, setProgress] = useState(0)
  const [pumpsDone, setPumpsDone] = useState<number[]>([])

  const startCleaning = async () => {
    setCleaningStatus("preparing")
    setProgress(0)
    setPumpsDone([])

    // Vorbereitung
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setCleaningStatus("cleaning")

    // Jede Pumpe nacheinander reinigen
    for (let i = 0; i < pumpConfig.length; i++) {
      const pump = pumpConfig[i]
      setCurrentPump(pump.id)

      try {
        // Pumpe für 10 Sekunden aktivieren
        await activatePumpForDuration(pump.id, 10000)

        setPumpsDone((prev) => [...prev, pump.id])
        setProgress(Math.round(((i + 1) / pumpConfig.length) * 100))

        // Kurze Pause zwischen Pumpen
        await new Promise((resolve) => setTimeout(resolve, 500))
      } catch (error) {
        console.error(`Fehler beim Reinigen der Pumpe ${pump.id}:`, error)
      }
    }

    setCurrentPump(null)
    setCleaningStatus("complete")
  }

  const resetCleaning = () => {
    setCleaningStatus("idle")
    setCurrentPump(null)
    setProgress(0)
    setPumpsDone([])
  }

  return (
    <div className="space-y-4">
      <Card className="bg-black border-[hsl(var(--cocktail-card-border))]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-white">
            <Droplets className="h-5 w-5 text-[hsl(var(--cocktail-primary))]" />
            CocktailBot Pumpenreinigung
          </CardTitle>
          <CardDescription className="text-[hsl(var(--cocktail-text-muted))]">
            Reinige alle Pumpen mit warmem Wasser und Spülmittel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Alert className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))]">
            <AlertDescription className="text-[hsl(var(--cocktail-text))] text-sm">
              <p className="font-medium mb-1">Vorbereitung:</p>
              <ol className="list-decimal pl-4 space-y-1 text-sm">
                <li>Stelle einen Behälter mit warmem Wasser und etwas Spülmittel bereit.</li>
                <li>Lege die Ansaugschläuche aller Pumpen in diesen Behälter.</li>
                <li>Stelle einen leeren Auffangbehälter unter die Ausgänge.</li>
              </ol>
            </AlertDescription>
          </Alert>

          {cleaningStatus === "idle" && (
            <Button
              onClick={startCleaning}
              className="w-full bg-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] text-black"
              size="lg"
            >
              <Droplets className="mr-2 h-5 w-5" />
              Reinigung starten
            </Button>
          )}

          {cleaningStatus === "preparing" && (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--cocktail-primary))]" />
              </div>
              <p className="text-center text-[hsl(var(--cocktail-text))]">Vorbereitung der Reinigung...</p>
            </div>
          )}

          {cleaningStatus === "cleaning" && (
            <div className="space-y-3">
              <Progress value={progress} className="h-2" indicatorClassName="bg-[hsl(var(--cocktail-primary))]" />

              <div className="flex justify-between items-center">
                <span className="text-sm text-[hsl(var(--cocktail-text-muted))]">
                  {pumpsDone.length} von {pumpConfig.length} Pumpen gereinigt
                </span>
                <span className="text-sm font-medium text-white">{progress}%</span>
              </div>

              {currentPump !== null && (
                <Alert className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))]">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--cocktail-primary))]" />
                    <AlertDescription className="text-[hsl(var(--cocktail-text))]">
                      Reinige Pumpe {currentPump}...
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              <div className="grid grid-cols-5 gap-2">
                {pumpConfig.map((pump) => (
                  <div
                    key={pump.id}
                    className={`p-2 rounded-md text-center ${
                      pumpsDone.includes(pump.id)
                        ? "bg-[hsl(var(--cocktail-success))]/10 border border-[hsl(var(--cocktail-success))]/30"
                        : currentPump === pump.id
                          ? "bg-[hsl(var(--cocktail-primary))]/20 border border-[hsl(var(--cocktail-primary))]/50 animate-pulse"
                          : "bg-[hsl(var(--cocktail-bg))] border border-[hsl(var(--cocktail-card-border))]"
                    }`}
                  >
                    <span
                      className={`text-sm ${currentPump === pump.id ? "text-white font-bold" : "text-[hsl(var(--cocktail-text))]"}`}
                    >
                      {pump.id}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {cleaningStatus === "complete" && (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-4">
                <div className="rounded-full bg-[hsl(var(--cocktail-success))]/20 p-3">
                  <Check className="h-8 w-8 text-[hsl(var(--cocktail-success))]" />
                </div>
              </div>

              <p className="text-center font-medium text-white">Reinigung abgeschlossen!</p>

              <Alert className="bg-[hsl(var(--cocktail-warning))]/10 border-[hsl(var(--cocktail-warning))]/30">
                <AlertTriangle className="h-4 w-4 text-[hsl(var(--cocktail-warning))]" />
                <AlertDescription className="text-[hsl(var(--cocktail-text))]">
                  <p className="font-medium mb-1">Wichtig:</p>
                  <p>Spüle die Pumpen nun mit klarem Wasser nach, um Spülmittelreste zu entfernen.</p>
                </AlertDescription>
              </Alert>

              <Button
                onClick={resetCleaning}
                className="w-full bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))]"
              >
                Neue Reinigung starten
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
