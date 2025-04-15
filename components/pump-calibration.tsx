"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { PumpConfig } from "@/types/pump"
import { savePumpConfig, calibratePump, getPumpConfig } from "@/lib/cocktail-machine"
import { ingredients } from "@/data/ingredients"
import { Loader2, Beaker, Save, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import VirtualKeyboard from "./virtual-keyboard"

interface PumpCalibrationProps {
  pumpConfig: PumpConfig[]
}

export default function PumpCalibration({ pumpConfig: initialConfig }: PumpCalibrationProps) {
  const [pumpConfig, setPumpConfig] = useState<PumpConfig[]>(initialConfig)
  const [saving, setSaving] = useState(false)
  const [calibrating, setCalibrating] = useState<number | null>(null)
  const [measuredAmount, setMeasuredAmount] = useState<string>("")
  const [calibrationStep, setCalibrationStep] = useState<"idle" | "measuring" | "input">("idle")
  const [currentPumpId, setCurrentPumpId] = useState<number | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showKeyboard, setShowKeyboard] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Lade die gespeicherte Konfiguration beim ersten Rendern
  useEffect(() => {
    loadPumpConfig()
  }, [])

  const loadPumpConfig = async () => {
    try {
      setLoading(true)
      const config = await getPumpConfig()
      setPumpConfig(config)
    } catch (error) {
      console.error("Fehler beim Laden der Pumpenkonfiguration:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleIngredientChange = (pumpId: number, ingredient: string) => {
    setPumpConfig((prev) => prev.map((pump) => (pump.id === pumpId ? { ...pump, ingredient } : pump)))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await savePumpConfig(pumpConfig)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error("Fehler beim Speichern der Pumpenkonfiguration:", error)
    } finally {
      setSaving(false)
    }
  }

  const startCalibration = async (pumpId: number) => {
    setCurrentPumpId(pumpId)
    setCalibrationStep("measuring")
    setCalibrating(pumpId)

    try {
      // Pumpe für genau 2 Sekunden laufen lassen
      await calibratePump(pumpId, 2000)
      setCalibrationStep("input")
      setMeasuredAmount("")
      setShowKeyboard(true)
      if (inputRef.current) {
        inputRef.current.focus()
      }
    } catch (error) {
      console.error("Fehler bei der Kalibrierung:", error)
      setCalibrationStep("idle")
    } finally {
      setCalibrating(null)
    }
  }

  const handleMeasuredAmountChange = (value: string) => {
    // Nur Zahlen und einen Dezimalpunkt erlauben
    if (/^\d*\.?\d*$/.test(value) || value === "") {
      setMeasuredAmount(value)
    }
  }

  const handleKeyPress = (key: string) => {
    // Verhindere mehrere Dezimalpunkte
    if (key === "." && measuredAmount.includes(".")) {
      return
    }
    setMeasuredAmount((prev) => prev + key)
  }

  const handleBackspace = () => {
    setMeasuredAmount((prev) => prev.slice(0, -1))
  }

  const handleClear = () => {
    setMeasuredAmount("")
  }

  const saveCalibration = async () => {
    if (currentPumpId === null || measuredAmount === "") return

    const amount = Number.parseFloat(measuredAmount)
    if (isNaN(amount) || amount <= 0) return

    // Berechne die Durchflussrate (ml/s) basierend auf der gemessenen Menge und 2 Sekunden Laufzeit
    const flowRate = amount / 2

    // Aktualisiere die lokale Konfiguration
    const updatedConfig = pumpConfig.map((pump) => (pump.id === currentPumpId ? { ...pump, flowRate } : pump))

    setPumpConfig(updatedConfig)

    // Speichere die Konfiguration sofort
    setSaving(true)
    try {
      await savePumpConfig(updatedConfig)

      // Zeige Erfolgsmeldung
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error("Fehler beim Speichern der Kalibrierung:", error)
    } finally {
      setSaving(false)
    }

    // Zurücksetzen
    setMeasuredAmount("")
    setCalibrationStep("idle")
    setCurrentPumpId(null)
    setShowKeyboard(false)
  }

  const cancelCalibration = () => {
    setMeasuredAmount("")
    setCalibrationStep("idle")
    setCurrentPumpId(null)
    setShowKeyboard(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--cocktail-primary))]" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="bg-white border-[hsl(var(--cocktail-card-border))]">
        <CardHeader>
          <CardTitle>CocktailBot Pumpenkalibrierung</CardTitle>
          <CardDescription>
            Kalibriere jede Pumpe, indem du sie für 2 Sekunden laufen lässt, die geförderte Menge in ml misst und den
            Wert einträgst.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={loadPumpConfig}
              disabled={loading || saving}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Konfiguration neu laden
            </Button>
          </div>

          {calibrationStep === "measuring" && (
            <Alert className="mb-4 bg-[hsl(var(--cocktail-accent))]/10 border-[hsl(var(--cocktail-accent))]/30">
              <Beaker className="h-4 w-4 text-[hsl(var(--cocktail-accent))]" />
              <AlertDescription className="text-[hsl(var(--cocktail-text))]">
                Pumpe {currentPumpId} läuft für 2 Sekunden. Bitte stelle ein Messgefäß bereit und miss die geförderte
                Menge in ml.
              </AlertDescription>
            </Alert>
          )}

          {calibrationStep === "input" && (
            <div className="mb-4 p-4 border border-[hsl(var(--cocktail-accent))]/30 rounded-lg bg-[hsl(var(--cocktail-accent))]/10">
              <h3 className="text-sm font-medium mb-2 text-[hsl(var(--cocktail-text))]">
                Gemessene Menge für Pumpe {currentPumpId} eintragen:
              </h3>
              <div className="flex gap-2 mb-4">
                <div className="flex-1">
                  <Input
                    ref={inputRef}
                    type="text"
                    value={measuredAmount}
                    onChange={(e) => handleMeasuredAmountChange(e.target.value)}
                    placeholder="Menge in ml"
                    className="w-full text-xl h-12 text-center"
                    onFocus={() => setShowKeyboard(true)}
                    readOnly
                  />
                </div>
              </div>

              {showKeyboard && (
                <div className="mt-4">
                  <VirtualKeyboard
                    onKeyPress={handleKeyPress}
                    onBackspace={handleBackspace}
                    onClear={handleClear}
                    onConfirm={saveCalibration}
                    allowDecimal={true}
                  />

                  <div className="mt-4 flex justify-end">
                    <Button onClick={cancelCalibration} variant="ghost">
                      Abbrechen
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            {pumpConfig.map((pump) => (
              <div key={pump.id} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-1">
                  <span className="font-medium">{pump.id}</span>
                </div>

                <div className="col-span-5">
                  <Select
                    value={pump.ingredient}
                    onValueChange={(value) => handleIngredientChange(pump.id, value)}
                    disabled={calibrationStep !== "idle"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Zutat wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {ingredients.map((ingredient) => (
                        <SelectItem key={ingredient.id} value={ingredient.id}>
                          {ingredient.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-3">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="text"
                      value={pump.flowRate.toFixed(1)}
                      readOnly
                      className="w-full bg-[hsl(var(--cocktail-bg))]"
                    />
                    <span className="text-xs whitespace-nowrap">ml/s</span>
                  </div>
                </div>

                <div className="col-span-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => startCalibration(pump.id)}
                    disabled={calibrationStep !== "idle" || calibrating !== null}
                  >
                    {calibrating === pump.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kalibrieren"}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button className="w-full mt-6" onClick={handleSave} disabled={saving || calibrationStep !== "idle"}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Speichern...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Konfiguration speichern
              </>
            )}
          </Button>

          {showSuccess && (
            <Alert className="mt-4 bg-[hsl(var(--cocktail-success))]/10 border-[hsl(var(--cocktail-success))]/30">
              <AlertDescription className="text-[hsl(var(--cocktail-success))]">
                Pumpenkonfiguration erfolgreich gespeichert!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
