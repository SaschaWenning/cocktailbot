"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import type { PumpConfig } from "@/types/pump"
import { savePumpConfig, calibratePump, getPumpConfig } from "@/lib/cocktail-machine"
import { getAllIngredients } from "@/lib/ingredients"
import { Loader2, Beaker, Save, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import VirtualKeyboard from "./virtual-keyboard"

interface PumpCalibrationProps {
  pumpConfig: PumpConfig[]
  onConfigUpdate?: () => Promise<void>
}

export default function PumpCalibration({ pumpConfig: initialConfig, onConfigUpdate }: PumpCalibrationProps) {
  const [pumpConfig, setPumpConfig] = useState<PumpConfig[]>(initialConfig)
  const [saving, setSaving] = useState(false)
  const [calibrating, setCalibrating] = useState<number | null>(null)
  const [measuredAmount, setMeasuredAmount] = useState<string>("")
  const [calibrationStep, setCalibrationStep] = useState<"idle" | "measuring" | "input">("idle")
  const [currentPumpId, setCurrentPumpId] = useState<number | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showInputDialog, setShowInputDialog] = useState(false)
  const [allIngredients, setAllIngredients] = useState(getAllIngredients())
  const inputRef = useRef<HTMLInputElement>(null)

  // Lade die gespeicherte Konfiguration beim ersten Rendern
  useEffect(() => {
    loadPumpConfig()
    setAllIngredients(getAllIngredients())
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

  const handleToggleEnabled = async (pumpId: number) => {
    const updatedConfig = pumpConfig.map((pump) => (pump.id === pumpId ? { ...pump, enabled: !pump.enabled } : pump))
    setPumpConfig(updatedConfig)

    setSaving(true)
    try {
      await savePumpConfig(updatedConfig)
      console.log(
        `Pumpe ${pumpId} ${updatedConfig.find((p) => p.id === pumpId)?.enabled ? "aktiviert" : "deaktiviert"}`,
      )

      // Benachrichtige die Hauptkomponente über die Aktualisierung
      if (onConfigUpdate) {
        await onConfigUpdate()
      }
    } catch (error) {
      console.error("Fehler beim Speichern der Pumpen-Aktivierung:", error)
      // Bei Fehler: State zurücksetzen
      setPumpConfig(pumpConfig)
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await savePumpConfig(pumpConfig)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)

      // Benachrichtige die Hauptkomponente über die Aktualisierung
      if (onConfigUpdate) {
        await onConfigUpdate()
      }
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
      // Öffne das Dialog-Fenster für die Eingabe
      setShowInputDialog(true)
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
    if (currentPumpId === null || measuredAmount === "") {
      setShowInputDialog(false)
      setCalibrationStep("idle")
      return
    }

    const amount = Number.parseFloat(measuredAmount)
    if (isNaN(amount) || amount <= 0) {
      setShowInputDialog(false)
      setCalibrationStep("idle")
      return
    }

    // Berechne die Durchflussrate (ml/s) basierend auf der gemessenen Menge und 2 Sekunden Laufzeit
    const flowRate = amount / 2

    // Aktualisiere die lokale Konfiguration
    const updatedConfig = pumpConfig.map((pump) => (pump.id === currentPumpId ? { ...pump, flowRate } : pump))

    setPumpConfig(updatedConfig)

    // Speichere die Konfiguration sofort
    setSaving(true)
    try {
      await savePumpConfig(updatedConfig)

      // Protokolliere die aktualisierte Durchflussrate für Debugging-Zwecke
      const pump = updatedConfig.find((p) => p.id === currentPumpId)
      if (pump) {
        console.log(`Kalibrierung für Pumpe ${pump.id} (${pump.ingredient}) aktualisiert: ${flowRate} ml/s`)
      }

      // Zeige Erfolgsmeldung
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)

      // Benachrichtige die Hauptkomponente über die Aktualisierung
      if (onConfigUpdate) {
        await onConfigUpdate()
      }
    } catch (error) {
      console.error("Fehler beim Speichern der Kalibrierung:", error)
    } finally {
      setSaving(false)
    }

    // Zurücksetzen
    setMeasuredAmount("")
    setCalibrationStep("idle")
    setCurrentPumpId(null)
    setShowInputDialog(false)
  }

  const cancelCalibration = () => {
    setMeasuredAmount("")
    setCalibrationStep("idle")
    setCurrentPumpId(null)
    setShowInputDialog(false)
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
      <Card className="bg-black border-[hsl(var(--cocktail-card-border))]">
        <CardHeader>
          <CardTitle className="text-white">CocktailBot Pumpenkalibrierung</CardTitle>
          <CardDescription className="text-white">
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
              className="flex items-center gap-1 bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
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

          <div className="space-y-4">
            {pumpConfig.map((pump) => (
              <div key={pump.id} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-1">
                  <span className="font-medium text-white">{pump.id}</span>
                </div>

                <div className="col-span-4">
                  <Select
                    value={pump.ingredient}
                    onValueChange={(value) => handleIngredientChange(pump.id, value)}
                    disabled={calibrationStep !== "idle" || !pump.enabled}
                  >
                    <SelectTrigger
                      className={`${pump.enabled ? "bg-[hsl(var(--cocktail-card-bg))]" : "bg-gray-800 opacity-50"} text-white border-[hsl(var(--cocktail-card-border))]`}
                    >
                      <SelectValue placeholder="Zutat wählen" />
                    </SelectTrigger>
                    <SelectContent className="bg-black text-white border-[hsl(var(--cocktail-card-border))]">
                      {allIngredients.map((ingredient) => (
                        <SelectItem key={ingredient.id} value={ingredient.id}>
                          {ingredient.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="text"
                      value={pump.flowRate.toFixed(1)}
                      readOnly
                      className={`w-full ${pump.enabled ? "bg-[hsl(var(--cocktail-bg))]" : "bg-gray-800 opacity-50"} text-white border-[hsl(var(--cocktail-card-border))]`}
                    />
                    <span className="text-xs whitespace-nowrap text-white">ml/s</span>
                  </div>
                </div>

                <div className="col-span-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))] hover:text-[hsl(var(--cocktail-primary))]"
                    onClick={() => startCalibration(pump.id)}
                    disabled={calibrationStep !== "idle" || calibrating !== null || !pump.enabled}
                  >
                    {calibrating === pump.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kalibrieren"}
                  </Button>
                </div>

                <div className="col-span-3">
                  <Button
                    variant={pump.enabled ? "destructive" : "default"}
                    size="sm"
                    className={`w-full ${
                      pump.enabled
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] text-black"
                    }`}
                    onClick={() => handleToggleEnabled(pump.id)}
                    disabled={calibrationStep !== "idle"}
                  >
                    {pump.enabled ? "Deaktivieren" : "Aktivieren"}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button
            className="w-full mt-6 bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
            onClick={handleSave}
            disabled={saving || calibrationStep !== "idle"}
          >
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

      {/* Dialog für die Eingabe der gemessenen Menge */}
      <Dialog open={showInputDialog} onOpenChange={(open) => !open && cancelCalibration()}>
        <DialogContent className="bg-black border-[hsl(var(--cocktail-card-border))] sm:max-w-md text-white">
          <DialogHeader>
            <DialogTitle>Gemessene Menge eingeben</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-[hsl(var(--cocktail-text))]">
              Bitte gib die gemessene Menge für Pumpe {currentPumpId} ein:
            </p>

            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                type="text"
                value={measuredAmount}
                onChange={(e) => handleMeasuredAmountChange(e.target.value)}
                placeholder="Menge in ml"
                className="text-xl h-12 text-center bg-[hsl(var(--cocktail-bg))] border-[hsl(var(--cocktail-card-border))]"
                autoFocus
                readOnly
              />
              <span className="text-sm">ml</span>
            </div>

            <VirtualKeyboard
              onKeyPress={handleKeyPress}
              onBackspace={handleBackspace}
              onClear={handleClear}
              onConfirm={saveCalibration}
              allowDecimal={true}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={cancelCalibration}
              className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
            >
              Abbrechen
            </Button>
            <Button
              onClick={saveCalibration}
              disabled={!measuredAmount}
              className="bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
            >
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
