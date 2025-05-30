"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import type { PumpConfig, Ingredient } from "@/types/pump" // Added Ingredient
import { savePumpConfig, calibratePump, getPumpConfig as fetchPumpConfig } from "@/lib/cocktail-machine" // Renamed getPumpConfig to fetchPumpConfig to avoid conflict
import { getAllIngredients } from "@/lib/ingredient-manager" // New import
import AddIngredientDialog from "./add-ingredient-dialog" // New import
import { Loader2, Beaker, Save, RefreshCw, PlusCircle } from "lucide-react"
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
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [showInputDialog, setShowInputDialog] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([])
  const [showAddIngredientDialog, setShowAddIngredientDialog] = useState(false)
  const [loadingIngredients, setLoadingIngredients] = useState(true)

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setLoadingConfig(true)
    setLoadingIngredients(true)
    try {
      await Promise.all([loadPumpConfigData(), loadAvailableIngredientsData()])
    } catch (error) {
      console.error("Fehler beim Laden der Initialdaten für Kalibrierung:", error)
    } finally {
      setLoadingConfig(false)
      setLoadingIngredients(false)
    }
  }

  const loadPumpConfigData = async () => {
    try {
      setLoadingConfig(true)
      const config = await fetchPumpConfig() // Use renamed import
      setPumpConfig(config)
    } catch (error) {
      console.error("Fehler beim Laden der Pumpenkonfiguration:", error)
    } finally {
      setLoadingConfig(false)
    }
  }

  const loadAvailableIngredientsData = async () => {
    try {
      setLoadingIngredients(true)
      const ingredients = await getAllIngredients()
      setAvailableIngredients(ingredients)
    } catch (error) {
      console.error("Fehler beim Laden der Zutaten:", error)
    } finally {
      setLoadingIngredients(false)
    }
  }

  const handleIngredientChange = (pumpId: number, ingredientId: string) => {
    setPumpConfig((prev) => prev.map((pump) => (pump.id === pumpId ? { ...pump, ingredient: ingredientId } : pump)))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await savePumpConfig(pumpConfig)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
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
      await calibratePump(pumpId, 2000)
      setCalibrationStep("input")
      setMeasuredAmount("")
      setShowInputDialog(true)
    } catch (error) {
      console.error("Fehler bei der Kalibrierung:", error)
      setCalibrationStep("idle")
    } finally {
      setCalibrating(null)
    }
  }

  const handleMeasuredAmountChange = (value: string) => {
    if (/^\d*\.?\d*$/.test(value) || value === "") {
      setMeasuredAmount(value)
    }
  }

  const handleKeyPress = (key: string) => {
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
    const flowRate = amount / 2
    const updatedConfig = pumpConfig.map((pump) => (pump.id === currentPumpId ? { ...pump, flowRate } : pump))
    setPumpConfig(updatedConfig)
    setSaving(true)
    try {
      await savePumpConfig(updatedConfig)
      const pump = updatedConfig.find((p) => p.id === currentPumpId)
      if (pump) {
        console.log(`Kalibrierung für Pumpe ${pump.id} (${pump.ingredient}) aktualisiert: ${flowRate} ml/s`)
      }
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
      if (onConfigUpdate) {
        await onConfigUpdate()
      }
    } catch (error) {
      console.error("Fehler beim Speichern der Kalibrierung:", error)
    } finally {
      setSaving(false)
    }
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

  if (loadingConfig || loadingIngredients) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--cocktail-primary))]" />
        <span className="ml-2 text-white">Lade Kalibrierungsdaten...</span>
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
            Wert einträgst. Wähle die Zutat für jede Pumpe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddIngredientDialog(true)}
              className="flex items-center gap-1 bg-[hsl(var(--cocktail-accent))] text-black border-[hsl(var(--cocktail-accent))] hover:bg-[hsl(var(--cocktail-accent))]/80"
            >
              <PlusCircle className="h-4 w-4" />
              Neue Zutat
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadPumpConfigData}
              disabled={loadingConfig || saving || calibrationStep !== "idle"}
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

                <div className="col-span-5">
                  <Select
                    value={pump.ingredient}
                    onValueChange={(value) => handleIngredientChange(pump.id, value)}
                    disabled={calibrationStep !== "idle" || loadingIngredients}
                  >
                    <SelectTrigger className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))]">
                      <SelectValue placeholder="Zutat wählen" />
                    </SelectTrigger>
                    <SelectContent className="bg-black text-white border-[hsl(var(--cocktail-card-border))] max-h-60">
                      {loadingIngredients ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Zutaten laden...
                        </div>
                      ) : (
                        availableIngredients.map((ingredient) => (
                          <SelectItem key={ingredient.id} value={ingredient.id}>
                            {ingredient.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-3">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="text"
                      value={pump.flowRate.toFixed(1)}
                      readOnly
                      className="w-full bg-[hsl(var(--cocktail-bg))] text-white border-[hsl(var(--cocktail-card-border))]"
                    />
                    <span className="text-xs whitespace-nowrap text-white">ml/s</span>
                  </div>
                </div>

                <div className="col-span-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))] hover:text-[hsl(var(--cocktail-primary))]"
                    onClick={() => startCalibration(pump.id)}
                    disabled={calibrationStep !== "idle" || calibrating !== null || !pump.ingredient}
                  >
                    {calibrating === pump.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kalibrieren"}
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

      <AddIngredientDialog
        isOpen={showAddIngredientDialog}
        onClose={() => setShowAddIngredientDialog(false)}
        onIngredientAdded={async (newIngredient) => {
          await loadAvailableIngredientsData() // Reload ingredients
          setShowAddIngredientDialog(false)
          // Optional: Select the new ingredient for the current pump if one is being configured?
          // Or notify user that ingredient is now available.
        }}
      />
    </div>
  )
}
