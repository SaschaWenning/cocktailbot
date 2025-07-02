"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Droplets, AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import type { IngredientLevel } from "@/types/ingredient-level"
import { getIngredientLevels, updateIngredientLevel } from "@/lib/ingredient-level-service"
import { ingredients } from "@/data/ingredients"
import VirtualKeyboard from "./virtual-keyboard"

interface IngredientLevelsProps {
  ingredientLevels: IngredientLevel[]
  onUpdate?: () => Promise<void>
  availableIngredients: string[]
}

export default function IngredientLevels({
  ingredientLevels: initialLevels,
  onUpdate,
  availableIngredients,
}: IngredientLevelsProps) {
  const [levels, setLevels] = useState<IngredientLevel[]>(initialLevels)
  const [editingLevel, setEditingLevel] = useState<string | null>(null)
  const [newAmount, setNewAmount] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [showKeyboard, setShowKeyboard] = useState(false)

  useEffect(() => {
    setLevels(initialLevels)
  }, [initialLevels])

  const getIngredientName = (ingredientId: string) => {
    const ingredient = ingredients.find((i) => i.id === ingredientId)
    return ingredient?.name || ingredientId
  }

  const getIngredientColor = (ingredientId: string) => {
    const ingredient = ingredients.find((i) => i.id === ingredientId)
    return ingredient?.color || "#ffffff"
  }

  const getLevelStatus = (level: IngredientLevel) => {
    const percentage = (level.currentAmount / level.maxAmount) * 100
    if (percentage <= 10) return { status: "kritisch", color: "bg-red-600" }
    if (percentage <= 25) return { status: "niedrig", color: "bg-yellow-600" }
    if (percentage <= 50) return { status: "mittel", color: "bg-blue-600" }
    return { status: "hoch", color: "bg-green-600" }
  }

  const handleEditStart = (ingredientId: string, currentAmount: number) => {
    setEditingLevel(ingredientId)
    setNewAmount(currentAmount.toString())
    setShowKeyboard(true)
  }

  const handleEditCancel = () => {
    setEditingLevel(null)
    setNewAmount("")
    setShowKeyboard(false)
  }

  const handleEditSave = async () => {
    if (!editingLevel || !newAmount) return

    const amount = Number.parseFloat(newAmount)
    if (isNaN(amount) || amount < 0) {
      setErrorMessage("Bitte geben Sie eine gültige Menge ein")
      return
    }

    setSaving(editingLevel)
    setErrorMessage("")

    try {
      await updateIngredientLevel(editingLevel, amount)

      // Lokale Liste aktualisieren
      setLevels((prev) =>
        prev.map((level) => (level.ingredientId === editingLevel ? { ...level, currentAmount: amount } : level)),
      )

      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)

      // Hauptkomponente benachrichtigen
      if (onUpdate) {
        await onUpdate()
      }

      handleEditCancel()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unbekannter Fehler")
    } finally {
      setSaving(null)
    }
  }

  const handleRefillComplete = async (ingredientId: string) => {
    const level = levels.find((l) => l.ingredientId === ingredientId)
    if (!level) return

    setSaving(ingredientId)
    setErrorMessage("")

    try {
      await updateIngredientLevel(ingredientId, level.maxAmount)

      // Lokale Liste aktualisieren
      setLevels((prev) => prev.map((l) => (l.ingredientId === ingredientId ? { ...l, currentAmount: l.maxAmount } : l)))

      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)

      // Hauptkomponente benachrichtigen
      if (onUpdate) {
        await onUpdate()
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unbekannter Fehler")
    } finally {
      setSaving(null)
    }
  }

  const handleReloadLevels = async () => {
    setLoading(true)
    setErrorMessage("")

    try {
      const updatedLevels = await getIngredientLevels()
      setLevels(updatedLevels)

      if (onUpdate) {
        await onUpdate()
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unbekannter Fehler")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (key: string) => {
    if (key === "." && newAmount.includes(".")) return
    setNewAmount((prev) => prev + key)
  }

  const handleBackspace = () => {
    setNewAmount((prev) => prev.slice(0, -1))
  }

  const handleClear = () => {
    setNewAmount("")
  }

  // Nur Zutaten anzeigen, die in Cocktails verwendet werden
  const relevantLevels = levels.filter((level) => availableIngredients.includes(level.ingredientId))

  return (
    <div className="space-y-6">
      <Card className="bg-black border-[hsl(var(--cocktail-card-border))]">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-white flex items-center gap-2">
              <Droplets className="h-5 w-5 text-[hsl(var(--cocktail-primary))]" />
              Füllstände der Zutaten
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReloadLevels}
              disabled={loading}
              className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Aktualisieren
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {relevantLevels.length === 0 ? (
            <div className="text-center py-8 text-gray-400">Keine Füllstände verfügbar</div>
          ) : (
            <div className="grid gap-4">
              {relevantLevels.map((level) => {
                const { status, color } = getLevelStatus(level)
                const percentage = (level.currentAmount / level.maxAmount) * 100
                const isEditing = editingLevel === level.ingredientId
                const isSaving = saving === level.ingredientId

                return (
                  <Card
                    key={level.ingredientId}
                    className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))]"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full border border-gray-600"
                            style={{ backgroundColor: getIngredientColor(level.ingredientId) }}
                          />
                          <h3 className="font-semibold text-white">{getIngredientName(level.ingredientId)}</h3>
                          <Badge variant="outline" className={`${color} text-white border-none`}>
                            {status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {!isEditing && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditStart(level.ingredientId, level.currentAmount)}
                                disabled={isSaving}
                                className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
                              >
                                Bearbeiten
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRefillComplete(level.ingredientId)}
                                disabled={isSaving}
                                className="bg-green-600 text-white border-green-600 hover:bg-green-700"
                              >
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aufgefüllt"}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-300">
                          <span>
                            {level.currentAmount}ml von {level.maxAmount}ml
                          </span>
                          <span>{Math.round(percentage)}%</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>

                      {isEditing && (
                        <div className="mt-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`amount-${level.ingredientId}`} className="text-white">
                              Neue Menge (ml):
                            </Label>
                            <Input
                              id={`amount-${level.ingredientId}`}
                              type="text"
                              value={newAmount}
                              readOnly
                              className="w-32 bg-[hsl(var(--cocktail-bg))] text-white border-[hsl(var(--cocktail-card-border))]"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={handleEditSave}
                              disabled={!newAmount || isSaving}
                              className="bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
                            >
                              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                              Speichern
                            </Button>
                            <Button
                              variant="outline"
                              onClick={handleEditCancel}
                              disabled={isSaving}
                              className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
                            >
                              Abbrechen
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Erfolgsmeldung */}
          {showSuccess && (
            <Alert className="bg-green-600/10 border-green-600/30">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-400">Füllstand erfolgreich aktualisiert!</AlertDescription>
            </Alert>
          )}

          {/* Fehlermeldung */}
          {errorMessage && (
            <Alert className="bg-red-600/10 border-red-600/30">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-400">{errorMessage}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Virtuelle Tastatur */}
      {showKeyboard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black border border-[hsl(var(--cocktail-card-border))] rounded-lg p-4">
            <VirtualKeyboard
              onKeyPress={handleKeyPress}
              onBackspace={handleBackspace}
              onClear={handleClear}
              onConfirm={handleEditSave}
              allowDecimal={true}
            />
          </div>
        </div>
      )}
    </div>
  )
}
