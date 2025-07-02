"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import type { PumpConfig } from "@/types/pump"
import { savePumpConfig, calibratePump, getPumpConfig } from "@/lib/cocktail-machine"
import { ingredients } from "@/data/ingredients"
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
  const inputRef = useRef<HTMLInputElement>(null)

  // Load saved configuration on first render
  useEffect(() => {
    loadPumpConfig()
  }, [])

  const loadPumpConfig = async () => {
    try {
      setLoading(true)
      const config = await getPumpConfig()
      setPumpConfig(config)
    } catch (error) {
      console.error("Error loading pump configuration:", error)
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

      // Notify main component about update
      if (onConfigUpdate) {
        await onConfigUpdate()
      }
    } catch (error) {
      console.error("Error saving pump configuration:", error)
    } finally {
      setSaving(false)
    }
  }

  const startCalibration = async (pumpId: number) => {
    setCurrentPumpId(pumpId)
    setCalibrationStep("measuring")
    setCalibrating(pumpId)

    try {
      // Run pump for exactly 2 seconds
      await calibratePump(pumpId, 2000)
      setCalibrationStep("input")
      setMeasuredAmount("")
      // Open dialog for input
      setShowInputDialog(true)
    } catch (error) {
      console.error("Error during calibration:", error)
      setCalibrationStep("idle")
    } finally {
      setCalibrating(null)
    }
  }

  const handleMeasuredAmountChange = (value: string) => {
    // Only allow numbers and one decimal point
    if (/^\d*\.?\d*$/.test(value) || value === "") {
      setMeasuredAmount(value)
    }
  }

  const handleKeyPress = (key: string) => {
    // Prevent multiple decimal points
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

    // Calculate flow rate (ml/s) based on measured amount and 2 seconds runtime
    const flowRate = amount / 2

    // Update local configuration
    const updatedConfig = pumpConfig.map((pump) => (pump.id === currentPumpId ? { ...pump, flowRate } : pump))

    setPumpConfig(updatedConfig)

    // Save configuration immediately
    setSaving(true)
    try {
      await savePumpConfig(updatedConfig)

      // Log updated flow rate for debugging
      const pump = updatedConfig.find((p) => p.id === currentPumpId)
      if (pump) {
        console.log(`Calibration for pump ${pump.id} (${pump.ingredient}) updated: ${flowRate} ml/s`)
      }

      // Show success message
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)

      // Notify main component about update
      if (onConfigUpdate) {
        await onConfigUpdate()
      }
    } catch (error) {
      console.error("Error saving calibration:", error)
    } finally {
      setSaving(false)
    }

    // Reset
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
          <CardTitle className="text-white">CocktailBot Pump Calibration</CardTitle>
          <CardDescription className="text-white">
            Calibrate each pump by running it for 2 seconds, measuring the dispensed amount in ml and entering the
            value.
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
              Reload Configuration
            </Button>
          </div>

          {calibrationStep === "measuring" && (
            <Alert className="mb-4 bg-[hsl(var(--cocktail-accent))]/10 border-[hsl(var(--cocktail-accent))]/30">
              <Beaker className="h-4 w-4 text-[hsl(var(--cocktail-accent))]" />
              <AlertDescription className="text-[hsl(var(--cocktail-text))]">
                Pump {currentPumpId} is running for 2 seconds. Please place a measuring cup and measure the dispensed
                amount in ml.
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
                    disabled={calibrationStep !== "idle"}
                  >
                    <SelectTrigger className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))]">
                      <SelectValue placeholder="Select ingredient" />
                    </SelectTrigger>
                    <SelectContent className="bg-black text-white border-[hsl(var(--cocktail-card-border))]">
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
                    disabled={calibrationStep !== "idle" || calibrating !== null}
                  >
                    {calibrating === pump.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Calibrate"}
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
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Configuration
              </>
            )}
          </Button>

          {showSuccess && (
            <Alert className="mt-4 bg-[hsl(var(--cocktail-success))]/10 border-[hsl(var(--cocktail-success))]/30">
              <AlertDescription className="text-[hsl(var(--cocktail-success))]">
                Pump configuration saved successfully!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Dialog for entering measured amount */}
      <Dialog open={showInputDialog} onOpenChange={(open) => !open && cancelCalibration()}>
        <DialogContent className="bg-black border-[hsl(var(--cocktail-card-border))] sm:max-w-md text-white">
          <DialogHeader>
            <DialogTitle>Enter Measured Amount</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-[hsl(var(--cocktail-text))]">
              Please enter the measured amount for pump {currentPumpId}:
            </p>

            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                type="text"
                value={measuredAmount}
                onChange={(e) => handleMeasuredAmountChange(e.target.value)}
                placeholder="Amount in ml"
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
              Cancel
            </Button>
            <Button
              onClick={saveCalibration}
              disabled={!measuredAmount}
              className="bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
