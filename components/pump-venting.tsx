"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Loader2, Wind, Play, Settings } from "lucide-react"
import type { PumpConfig } from "@/types/pump"
import { cleanPump } from "@/lib/cocktail-machine"
import { VirtualKeyboard } from "@/components/virtual-keyboard"

interface PumpVentingProps {
  pumpConfig: PumpConfig[]
}

export default function PumpVenting({ pumpConfig: initialPumpConfig }: PumpVentingProps) {
  const [pumpConfig, setPumpConfig] = useState<PumpConfig[]>(initialPumpConfig)
  const [autoVentingStatus, setAutoVentingStatus] = useState<"idle" | "venting">("idle")
  const [currentPump, setCurrentPump] = useState<number | null>(null)
  const [progress, setProgress] = useState(0)
  const [pumpsDone, setPumpsDone] = useState<number[]>([])
  const [manualVentingPumps, setManualVentingPumps] = useState<Set<number>>(new Set())
  const [settingsMode, setSettingsMode] = useState(false)
  const [editingPumpId, setEditingPumpId] = useState<number | null>(null)
  const [keyboardValue, setKeyboardValue] = useState("")

  useEffect(() => {
    setPumpConfig(initialPumpConfig)
  }, [initialPumpConfig])

  const enabledPumps = pumpConfig.filter((pump) => pump.enabled)

  const saveVentDurations = async () => {
    try {
      const response = await fetch("/api/pump-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pumpConfig }),
      })

      if (!response.ok) {
        throw new Error("Fehler beim Speichern der Entlüftungszeiten")
      }

      setSettingsMode(false)
    } catch (error) {
      console.error("Fehler beim Speichern:", error)
    }
  }

  const openKeyboardForPump = (pumpId: number) => {
    const pump = pumpConfig.find((p) => p.id === pumpId)
    if (pump) {
      setEditingPumpId(pumpId)
      setKeyboardValue(((pump.ventDuration || 2000) / 1000).toString())
    }
  }

  const handleKeyboardConfirm = () => {
    if (editingPumpId !== null) {
      const seconds = Number.parseFloat(keyboardValue)
      if (!isNaN(seconds) && seconds > 0 && seconds <= 30) {
        setPumpConfig((prev) =>
          prev.map((pump) => (pump.id === editingPumpId ? { ...pump, ventDuration: seconds * 1000 } : pump)),
        )
      }
    }
    setEditingPumpId(null)
    setKeyboardValue("")
  }

  // Automatische Entlüftung aller Pumpen
  const startAutoVenting = async () => {
    setAutoVentingStatus("venting")
    setProgress(0)
    setPumpsDone([])
    setCurrentPump(null)

    for (let i = 0; i < enabledPumps.length; i++) {
      const pump = enabledPumps[i]
      setCurrentPump(pump.id)

      try {
        const duration = pump.ventDuration || 2000
        await cleanPump(pump.id, duration)
        setPumpsDone((prev) => [...prev, pump.id])

        // Fortschritt aktualisieren
        setProgress(Math.round(((i + 1) / enabledPumps.length) * 100))
      } catch (error) {
        console.error(`Fehler beim Entlüften der Pumpe ${pump.id}:`, error)
      }
    }

    setCurrentPump(null)
    setAutoVentingStatus("idle")
  }

  // Einzelne Pumpe entlüften (1 Sekunde, ohne Ladebildschirm)
  const ventSinglePump = async (pumpId: number) => {
    setManualVentingPumps((prev) => new Set(prev).add(pumpId))

    try {
      await cleanPump(pumpId, 1000) // 1 Sekunde
    } catch (error) {
      console.error(`Fehler beim Entlüften der Pumpe ${pumpId}:`, error)
    } finally {
      // Kurze Verzögerung für visuelle Rückmeldung
      setTimeout(() => {
        setManualVentingPumps((prev) => {
          const newSet = new Set(prev)
          newSet.delete(pumpId)
          return newSet
        })
      }, 100)
    }
  }

  const resetAutoVenting = () => {
    setAutoVentingStatus("idle")
    setCurrentPump(null)
    setProgress(0)
    setPumpsDone([])
  }

  return (
    <div className="space-y-4">
      {/* Automatische Entlüftung */}
      <Card className="bg-black border-[hsl(var(--cocktail-card-border))]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wind className="h-5 w-5 text-[hsl(var(--cocktail-primary))]" />
              <CardTitle className="text-white">Automatische Entlüftung</CardTitle>
            </div>
            <Button
              onClick={() => {
                if (settingsMode) {
                  saveVentDurations()
                } else {
                  setSettingsMode(true)
                }
              }}
              disabled={autoVentingStatus === "venting"}
              variant="outline"
              size="sm"
              className="bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-primary))] hover:text-black"
            >
              {settingsMode ? (
                <>
                  <span className="mr-2">Speichern</span>
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4 mr-2" />
                  Zeiten einstellen
                </>
              )}
            </Button>
          </div>
          <CardDescription className="text-[hsl(var(--cocktail-text-muted))]">
            {settingsMode
              ? "Klicke auf eine Pumpe, um die Entlüftungszeit einzustellen"
              : "Entlüfte alle Pumpen nacheinander mit individuellen Zeiten"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {settingsMode ? (
            <div className="space-y-3">
              <Alert className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))]">
                <AlertDescription className="text-[hsl(var(--cocktail-text))] text-sm">
                  Klicke auf eine Pumpe, um die Entlüftungszeit in Sekunden einzustellen (0.1 - 30 Sekunden).
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-4 gap-3">
                {enabledPumps.map((pump) => (
                  <div key={pump.id} className="flex flex-col items-center space-y-2">
                    <Button
                      onClick={() => openKeyboardForPump(pump.id)}
                      className="w-full h-16 bg-[hsl(var(--cocktail-card-bg))] hover:bg-[hsl(var(--cocktail-primary))] hover:text-black text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] flex flex-col items-center justify-center"
                    >
                      <span className="text-lg font-bold">Pumpe {pump.id}</span>
                      <span className="text-xs opacity-70">{((pump.ventDuration || 2000) / 1000).toFixed(1)}s</span>
                    </Button>
                    {pump.ingredient && (
                      <span className="text-[10px] text-[hsl(var(--cocktail-text-muted))] text-center">
                        {pump.ingredient}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <Button
                onClick={() => setSettingsMode(false)}
                variant="outline"
                className="w-full bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))]"
              >
                Abbrechen
              </Button>
            </div>
          ) : (
            <>
              <Alert className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))]">
                <AlertDescription className="text-[hsl(var(--cocktail-text))] text-sm">
                  <p className="font-medium mb-1">Vorbereitung:</p>
                  <p>
                    Stelle einen Auffangbehälter unter die Ausgänge und sorge dafür, dass alle Ansaugschläuche in den
                    entsprechenden Flüssigkeiten liegen.
                  </p>
                </AlertDescription>
              </Alert>

              {autoVentingStatus === "idle" && (
                <Button
                  onClick={startAutoVenting}
                  className="w-full bg-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] text-black"
                  size="lg"
                >
                  <Wind className="mr-2 h-5 w-5" />
                  Automatische Entlüftung starten
                </Button>
              )}

              {autoVentingStatus === "venting" && (
                <div className="space-y-3">
                  <Progress value={progress} className="h-2" indicatorClassName="bg-[hsl(var(--cocktail-primary))]" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[hsl(var(--cocktail-text-muted))]">
                      {pumpsDone.length} von {enabledPumps.length} Pumpen entlüftet
                    </span>
                    <span className="text-sm font-medium">{progress}%</span>
                  </div>

                  {currentPump !== null && (
                    <Alert className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))]">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--cocktail-primary))]" />
                        <AlertDescription className="text-[hsl(var(--cocktail-text))]">
                          Entlüfte Pumpe {currentPump}...
                        </AlertDescription>
                      </div>
                    </Alert>
                  )}

                  <div className="grid grid-cols-5 gap-2">
                    {enabledPumps.map((pump) => (
                      <div
                        key={pump.id}
                        className={`p-2 rounded-md text-center ${
                          pumpsDone.includes(pump.id)
                            ? "bg-[hsl(var(--cocktail-success))]/10 border border-[hsl(var(--cocktail-success))]/30"
                            : currentPump === pump.id
                              ? "bg-[hsl(var(--cocktail-primary))]/20 border border-[hsl(var(--cocktail-primary))]/50 font-bold animate-pulse"
                              : "bg-[hsl(var(--cocktail-bg))] border border-[hsl(var(--cocktail-card-border)))"
                        }`}
                      >
                        <span className={`text-sm ${currentPump === pump.id ? "text-white font-bold" : ""}`}>
                          {pump.id}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={resetAutoVenting}
                    className="w-full bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border)))]"
                  >
                    Abbrechen
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Manuelle Einzelpumpen-Entlüftung */}
      {!settingsMode && (
        <Card className="bg-black border-[hsl(var(--cocktail-card-border))]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-white">
              <Play className="h-5 w-5 text-[hsl(var(--cocktail-primary))]" />
              Manuelle Entlüftung
            </CardTitle>
            <CardDescription className="text-[hsl(var(--cocktail-text-muted))]">
              Entlüfte einzelne Pumpen für 1 Sekunde
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))]">
              <AlertDescription className="text-[hsl(var(--cocktail-text))] text-sm">
                Klicke auf eine Pumpe um sie für 1 Sekunde zu entlüften. Die Pumpe startet sofort ohne Ladebildschirm.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-5 gap-3">
              {enabledPumps.map((pump) => (
                <div key={pump.id} className="flex flex-col items-center space-y-2">
                  <Button
                    onClick={() => ventSinglePump(pump.id)}
                    disabled={autoVentingStatus === "venting"}
                    className={`w-full h-12 ${
                      manualVentingPumps.has(pump.id)
                        ? "bg-[hsl(var(--cocktail-primary))]/30 border border-[hsl(var(--cocktail-primary))]/50"
                        : "bg-[hsl(var(--cocktail-card-bg))] hover:bg-[hsl(var(--cocktail-primary))] hover:text-black"
                    } text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))]`}
                  >
                    {manualVentingPumps.has(pump.id) ? (
                      <Wind className="h-4 w-4 animate-pulse" />
                    ) : (
                      <Wind className="h-4 w-4" />
                    )}
                  </Button>
                  <span className="text-xs text-[hsl(var(--cocktail-text-muted))] text-center">
                    Pumpe {pump.id}
                    {pump.ingredient && <div className="text-[10px] opacity-70">{pump.ingredient}</div>}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {editingPumpId !== null && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <VirtualKeyboard
            layout="numeric"
            value={keyboardValue}
            onChange={setKeyboardValue}
            onConfirm={handleKeyboardConfirm}
            onCancel={() => {
              setEditingPumpId(null)
              setKeyboardValue("")
            }}
            title={`Entlüftungszeit für Pumpe ${editingPumpId}`}
            unit="s"
          />
        </div>
      )}
    </div>
  )
}
