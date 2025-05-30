"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2, RefreshCw, AlertTriangle, Droplet } from "lucide-react"
import type { IngredientLevel } from "@/types/ingredient-level"
import { ingredients } from "@/data/ingredients"
import { getIngredientLevels, refillAllIngredients } from "@/lib/ingredient-level-service"
import type { PumpConfig } from "@/types/pump-config"
import VirtualKeyboard from "./virtual-keyboard"
import { updateIngredientLevel } from "@/lib/ingredient-level-service"

interface IngredientLevelsProps {
  pumpConfig: PumpConfig[]
  onLevelsUpdated?: () => void // Neuer Callback für Aktualisierungen
}

export default function IngredientLevels({ pumpConfig, onLevelsUpdated }: IngredientLevelsProps) {
  const [levels, setLevels] = useState<IngredientLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [refillAmounts, setRefillAmounts] = useState<Record<string, string>>({})
  const [showSuccess, setShowSuccess] = useState(false)
  const [activeInput, setActiveInput] = useState<string | null>(null)
  const [showInputDialog, setShowInputDialog] = useState(false)
  const [currentIngredientName, setCurrentIngredientName] = useState("")
  const [activeButton, setActiveButton] = useState<string | null>(null)

  // Lade Füllstände beim ersten Rendern
  useEffect(() => {
    loadLevels()
  }, [])

  const loadLevels = async () => {
    setLoading(true)
    try {
      const data = await getIngredientLevels()
      setLevels(data)
    } catch (error) {
      console.error("Fehler beim Laden der Füllstände:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefillAmountChange = (ingredientId: string, value: string) => {
    // Nur Zahlen erlauben
    if (/^\d*$/.test(value) || value === "") {
      setRefillAmounts((prev) => ({
        ...prev,
        [ingredientId]: value,
      }))
    }
  }

  const handleKeyPress = (key: string) => {
    if (!activeInput) return

    // Nur Zahlen erlauben für Füllstände
    if (/^\d$/.test(key)) {
      setRefillAmounts((prev) => ({
        ...prev,
        [activeInput]: (prev[activeInput] || "") + key,
      }))
    }
  }

  const handleBackspace = () => {
    if (!activeInput) return

    setRefillAmounts((prev) => ({
      ...prev,
      [activeInput]: (prev[activeInput] || "").slice(0, -1),
    }))
  }

  const handleClear = () => {
    if (!activeInput) return

    setRefillAmounts((prev) => ({
      ...prev,
      [activeInput]: "",
    }))
  }

  const handleInputFocus = (ingredientId: string) => {
    const ingredient = ingredients.find((i) => i.id === ingredientId)
    setCurrentIngredientName(ingredient ? ingredient.name : ingredientId)
    setActiveInput(ingredientId)
    setShowInputDialog(true)
  }

  // Ändere die handleRefill Funktion, um die Gesamtmenge statt der hinzugefügten Menge zu verwenden
  const handleRefill = async (ingredientId: string) => {
    const amountStr = refillAmounts[ingredientId]
    if (!amountStr) return

    const newTotalAmount = Number.parseInt(amountStr, 10)
    if (isNaN(newTotalAmount) || newTotalAmount <= 0) return

    setSaving(true)
    try {
      // Finde den aktuellen Füllstand
      const currentLevel = levels.find((level) => level.ingredientId === ingredientId)
      if (!currentLevel) return

      // Setze den neuen Gesamtfüllstand direkt
      const updatedLevel = await updateIngredientLevel(ingredientId, newTotalAmount)

      // Aktualisiere den Füllstand in der lokalen State-Variable
      setLevels((prev) => prev.map((level) => (level.ingredientId === ingredientId ? updatedLevel : level)))

      // Setze das Eingabefeld zurück
      setRefillAmounts((prev) => ({
        ...prev,
        [ingredientId]: "",
      }))

      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)

      // Benachrichtige die übergeordnete Komponente über die Aktualisierung
      if (onLevelsUpdated) {
        onLevelsUpdated()
      }
    } catch (error) {
      console.error("Fehler beim Nachfüllen:", error)
    } finally {
      setSaving(false)
      setShowInputDialog(false)
      setActiveInput(null)
    }
  }

  // Füge eine neue Funktion für die Schnellauswahl von Flaschengrößen hinzu
  const handleQuickFill = (ingredientId: string, amount: number) => {
    // Setze den aktiven Button für visuelles Feedback
    setActiveButton(`${ingredientId}-${amount}`)
    setTimeout(() => setActiveButton(null), 300)

    setRefillAmounts((prev) => ({
      ...prev,
      [ingredientId]: amount.toString(),
    }))

    // Direkt nachfüllen
    handleRefill(ingredientId)
  }

  const handleRefillAll = async () => {
    setSaving(true)
    try {
      const updatedLevels = await refillAllIngredients()
      setLevels(updatedLevels)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)

      // Benachrichtige die übergeordnete Komponente über die Aktualisierung
      if (onLevelsUpdated) {
        onLevelsUpdated()
      }
    } catch (error) {
      console.error("Fehler beim Nachfüllen aller Zutaten:", error)
    } finally {
      setSaving(false)
    }
  }

  const getIngredientName = (id: string) => {
    const ingredient = ingredients.find((i) => i.id === id)
    return ingredient ? ingredient.name : id
  }

  const cancelInput = () => {
    setShowInputDialog(false)
    setActiveInput(null)
  }

  const confirmInput = () => {
    if (activeInput) {
      handleRefill(activeInput)
    }
  }

  // Ändere die Filterlogik, um nur angeschlossene Zutaten anzuzeigen
  const connectedIngredientIds = pumpConfig.map((pump) => pump.ingredient)

  // Filtere Zutaten basierend auf dem aktiven Tab UND ob sie angeschlossen sind
  const filteredLevels = levels.filter((level) => {
    // Prüfe zuerst, ob die Zutat überhaupt angeschlossen ist
    if (!connectedIngredientIds.includes(level.ingredientId)) return false

    // Dann wende die Tab-Filter an
    if (activeTab === "all") return true
    if (activeTab === "low" && level.currentAmount < 100) return true
    if (activeTab === "alcoholic") {
      const ingredient = ingredients.find((i) => i.id === level.ingredientId)
      return ingredient?.alcoholic
    }
    if (activeTab === "non-alcoholic") {
      const ingredient = ingredients.find((i) => i.id === level.ingredientId)
      return !ingredient?.alcoholic
    }
    return false
  })

  // Zähle niedrige Füllstände nur für angeschlossene Zutaten
  const lowLevelsCount = levels.filter(
    (level) => level.currentAmount < 100 && connectedIngredientIds.includes(level.ingredientId),
  ).length

  return (
    <div className="space-y-4">
      <Card className="bg-black border-[hsl(var(--cocktail-card-border))]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Droplet className="h-5 w-5 text-[#00ff00]" />
            CocktailBot Füllstände
          </CardTitle>
          <CardDescription className="text-white">
            Verwalte die Füllstände deiner Zutaten und fülle sie bei Bedarf nach.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#00ff00]" />
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-4 mb-4 bg-[hsl(var(--cocktail-card-bg))] h-14">
                    <TabsTrigger
                      value="all"
                      className={
                        activeTab === "all"
                          ? "bg-[#00ff00] text-black"
                          : "text-white hover:bg-[hsl(var(--cocktail-card-border))]"
                      }
                    >
                      Alle
                    </TabsTrigger>
                    <TabsTrigger
                      value="low"
                      className={`relative ${activeTab === "low" ? "bg-[#00ff00] text-black" : "text-white hover:bg-[hsl(var(--cocktail-card-border))]"}`}
                    >
                      Niedrig
                      {lowLevelsCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-[hsl(var(--cocktail-error))] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {lowLevelsCount}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger
                      value="alcoholic"
                      className={
                        activeTab === "alcoholic"
                          ? "bg-[#00ff00] text-black"
                          : "text-white hover:bg-[hsl(var(--cocktail-card-border))]"
                      }
                    >
                      Alkoholisch
                    </TabsTrigger>
                    <TabsTrigger
                      value="non-alcoholic"
                      className={
                        activeTab === "non-alcoholic"
                          ? "bg-[#00ff00] text-black"
                          : "text-white hover:bg-[hsl(var(--cocktail-card-border))]"
                      }
                    >
                      Alkoholfrei
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="space-y-6">
                {filteredLevels.length === 0 ? (
                  <p className="text-center py-4 text-white">Keine Zutaten in dieser Kategorie gefunden.</p>
                ) : (
                  filteredLevels.map((level) => {
                    const percentage = Math.round((level.currentAmount / level.capacity) * 100)
                    const isLow = level.currentAmount < 100

                    return (
                      <div key={level.ingredientId} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="font-medium text-white">{getIngredientName(level.ingredientId)}</div>
                          <div className="text-sm text-white">
                            {level.currentAmount} / {level.capacity} ml
                          </div>
                        </div>

                        <Progress
                          value={percentage}
                          className={`h-2 ${isLow ? "bg-[hsl(var(--cocktail-error))]/20" : "bg-[hsl(var(--cocktail-card-bg))]"}`}
                          indicatorClassName={isLow ? "bg-[hsl(var(--cocktail-error))]" : "!bg-[#00ff00]"}
                        />

                        {isLow && (
                          <Alert className="mt-1 py-2 bg-[hsl(var(--cocktail-error))]/10 border-[hsl(var(--cocktail-error))]/30">
                            <AlertTriangle className="h-4 w-4 text-[hsl(var(--cocktail-error))]" />
                            <AlertDescription className="text-[hsl(var(--cocktail-error))] text-xs">
                              Füllstand niedrig! Bitte nachfüllen.
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              id={`input-${level.ingredientId}`}
                              type="text"
                              placeholder="Neue Gesamtmenge in ml"
                              value={refillAmounts[level.ingredientId] || ""}
                              className="bg-white border-[hsl(var(--cocktail-card-border))] text-center text-lg text-black"
                              readOnly
                              onClick={() => handleInputFocus(level.ingredientId)}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleInputFocus(level.ingredientId)}
                              className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[#00ff00] hover:text-black active:bg-[#00ff00] active:text-black"
                            >
                              Setzen
                            </Button>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuickFill(level.ingredientId, 700)}
                              className={`flex-1 bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[#00ff00] hover:text-black active:bg-[#00ff00] active:text-black ${activeButton === `${level.ingredientId}-700` ? "bg-[#00ff00] text-black" : ""}`}
                            >
                              700ml
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuickFill(level.ingredientId, 1000)}
                              className={`flex-1 bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[#00ff00] hover:text-black active:bg-[#00ff00] active:text-black ${activeButton === `${level.ingredientId}-1000` ? "bg-[#00ff00] text-black" : ""}`}
                            >
                              1000ml
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleInputFocus(level.ingredientId)}
                              className="flex-1 bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[#00ff00] hover:text-black active:bg-[#00ff00] active:text-black"
                            >
                              Manuell
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-[hsl(var(--cocktail-card-border))]">
                <Button
                  onClick={handleRefillAll}
                  className="w-full bg-[#00ff00] hover:bg-[#00cc00] text-black active:bg-[#00cc00]"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Wird nachgefüllt...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Alle Zutaten vollständig auffüllen
                    </>
                  )}
                </Button>
              </div>

              {showSuccess && (
                <Alert className="mt-4 bg-[hsl(var(--cocktail-success))]/10 border-[hsl(var(--cocktail-success))]/30">
                  <AlertDescription className="text-[hsl(var(--cocktail-success))]">
                    Füllstände erfolgreich aktualisiert!
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog für die manuelle Mengeneingabe */}
      <Dialog open={showInputDialog} onOpenChange={(open) => !open && cancelInput()}>
        <DialogContent className="bg-black border-[hsl(var(--cocktail-card-border))] sm:max-w-md text-white">
          <DialogHeader>
            <DialogTitle>Füllstand aktualisieren</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-white">
              Bitte gib die neue Gesamtmenge für <strong>{currentIngredientName}</strong> ein:
            </p>

            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={activeInput ? refillAmounts[activeInput] || "" : ""}
                onChange={(e) => activeInput && handleRefillAmountChange(activeInput, e.target.value)}
                placeholder="Menge in ml"
                className="text-xl h-12 text-center text-black bg-white"
                autoFocus
                readOnly
              />
              <span className="text-sm text-white">ml</span>
            </div>

            <VirtualKeyboard
              onKeyPress={handleKeyPress}
              onBackspace={handleBackspace}
              onClear={handleClear}
              onConfirm={confirmInput}
              allowDecimal={false}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={cancelInput}
              className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
            >
              Abbrechen
            </Button>
            <Button
              onClick={confirmInput}
              disabled={!activeInput || !refillAmounts[activeInput || ""]}
              className="bg-[#00ff00] text-black hover:bg-[#00cc00]"
            >
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
