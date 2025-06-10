"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, AlertTriangle, Droplet, Wine, Coffee } from "lucide-react"
import type { IngredientLevel } from "@/types/ingredient-level"
import { ingredients } from "@/data/ingredients"
import { getIngredientLevels, refillAllIngredients } from "@/lib/ingredient-level-service"
import type { PumpConfig } from "@/types/pump-config"
import VirtualKeyboard from "./virtual-keyboard"
import { updateIngredientLevel } from "@/lib/ingredient-level-service"

interface IngredientLevelsProps {
  pumpConfig: PumpConfig[]
  onLevelsUpdated?: () => void
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

  // Häufige Gebindegrößen
  const commonSizes = [500, 700, 750, 1000, 1500, 1750, 2000]

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
    if (/^\d*$/.test(value) || value === "") {
      setRefillAmounts((prev) => ({
        ...prev,
        [ingredientId]: value,
      }))
    }
  }

  const handleKeyPress = (key: string) => {
    if (!activeInput) return

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

  const handleRefill = async (ingredientId: string) => {
    const amountStr = refillAmounts[ingredientId]
    if (!amountStr) return

    const newTotalAmount = Number.parseInt(amountStr, 10)
    if (isNaN(newTotalAmount) || newTotalAmount <= 0) return

    setSaving(true)
    try {
      const updatedLevel = await updateIngredientLevel(ingredientId, newTotalAmount)

      setLevels((prev) => {
        const existingIndex = prev.findIndex((level) => level.ingredientId === ingredientId)
        if (existingIndex >= 0) {
          // Update existing
          return prev.map((level) => (level.ingredientId === ingredientId ? updatedLevel : level))
        } else {
          // Add new
          return [...prev, updatedLevel]
        }
      })

      setRefillAmounts((prev) => ({
        ...prev,
        [ingredientId]: "",
      }))

      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)

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

  const handleQuickFill = (ingredientId: string, amount: number) => {
    setActiveButton(`${ingredientId}-${amount}`)
    setTimeout(() => setActiveButton(null), 300)

    setRefillAmounts((prev) => ({
      ...prev,
      [ingredientId]: amount.toString(),
    }))

    handleRefill(ingredientId)
  }

  const handleRefillAll = async () => {
    setSaving(true)
    try {
      const updatedLevels = await refillAllIngredients()
      setLevels(updatedLevels)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)

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

  const getIngredientIcon = (id: string) => {
    const ingredient = ingredients.find((i) => i.id === id)
    if (!ingredient) return <Droplet className="h-4 w-4" />

    if (ingredient.alcoholic) {
      return <Wine className="h-4 w-4 text-[#ff9500]" />
    } else {
      return <Coffee className="h-4 w-4 text-[#00ff00]" />
    }
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

  const connectedIngredientIds = pumpConfig.map((pump) => pump.ingredient)

  // Erstelle eine feste Liste basierend auf den Pumpen
  const pumpBasedLevels = pumpConfig.map((pump) => {
    // Suche den existierenden Füllstand für diese Zutat
    const existingLevel = levels.find((level) => level.ingredientId === pump.ingredient)

    // Falls kein Füllstand existiert, erstelle einen temporären
    if (!existingLevel) {
      return {
        ingredientId: pump.ingredient,
        currentAmount: 0,
        capacity: 1000,
        lastRefill: new Date(),
        pumpId: pump.id, // Füge Pumpen-ID hinzu für Sortierung
        isNew: true, // Markiere als neu
      }
    }

    return {
      ...existingLevel,
      pumpId: pump.id,
      isNew: false,
    }
  })

  // Sortiere nach Pumpen-ID
  const sortedLevels = pumpBasedLevels.sort((a, b) => a.pumpId - b.pumpId)

  // Filtere basierend auf dem aktiven Tab
  const filteredLevels = sortedLevels.filter((level) => {
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

  const lowLevelsCount = levels.filter(
    (level) => level.currentAmount < 100 && connectedIngredientIds.includes(level.ingredientId),
  ).length

  return (
    <div className="space-y-6">
      <Card className="bg-black border border-gray-800">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#00ff00]/20 rounded-lg">
                <Droplet className="h-6 w-6 text-[#00ff00]" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-white">Füllstände</CardTitle>
                <CardDescription className="text-gray-400">Verwalte deine Zutaten und Gebindegrößen</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="bg-[#00ff00]/10 text-[#00ff00] border-[#00ff00]/30">
              {filteredLevels.length} Zutaten
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#00ff00] mx-auto" />
                <p className="text-gray-400">Lade Füllstände...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Tab-Navigation */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-4 bg-black border border-gray-800 h-12 p-1">
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:bg-[#00ff00] data-[state=active]:text-black text-white font-medium"
                  >
                    Alle
                  </TabsTrigger>
                  <TabsTrigger
                    value="low"
                    className="data-[state=active]:bg-[#ff3b30] data-[state=active]:text-white text-white font-medium relative"
                  >
                    Niedrig
                    {lowLevelsCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 bg-[#ff3b30] text-white text-xs h-5 w-5 p-0 flex items-center justify-center">
                        {lowLevelsCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="alcoholic"
                    className="data-[state=active]:bg-[#ff9500] data-[state=active]:text-black text-white font-medium"
                  >
                    Alkoholisch
                  </TabsTrigger>
                  <TabsTrigger
                    value="non-alcoholic"
                    className="data-[state=active]:bg-[#00ff00] data-[state=active]:text-black text-white font-medium"
                  >
                    Alkoholfrei
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Zutaten-Cards */}
              <div className="space-y-4">
                {filteredLevels.length === 0 ? (
                  <Card className="bg-black border border-gray-800">
                    <CardContent className="py-12 text-center">
                      <Droplet className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">Keine Zutaten in dieser Kategorie</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredLevels.map((level) => {
                    const percentage = Math.round((level.currentAmount / level.capacity) * 100)
                    const isLow = level.currentAmount < 100
                    const isCritical = level.currentAmount < 50
                    const isNew = level.isNew || false

                    // Bestimme die Farbe basierend auf dem Zustand
                    const ingredient = ingredients.find((i) => i.id === level.ingredientId)
                    const isAlcoholic = ingredient?.alcoholic

                    const cardBorderColor = isCritical
                      ? "border-[#ff3b30]"
                      : isLow
                        ? "border-[#ff9500]"
                        : "border-gray-800"

                    const progressColor = isCritical
                      ? "bg-[#ff3b30]"
                      : isLow
                        ? "bg-[#ff9500]"
                        : isAlcoholic
                          ? "bg-[#ff9500]"
                          : "bg-[#00ff00]"

                    return (
                      <Card
                        key={level.ingredientId}
                        className={`bg-black ${cardBorderColor} transition-all duration-300 hover:shadow-lg`}
                      >
                        <CardContent className="p-6">
                          {/* Header mit Icon und Name */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              {getIngredientIcon(level.ingredientId)}
                              <div>
                                <h3 className="font-semibold text-white text-lg">
                                  Pumpe {level.pumpId}: {getIngredientName(level.ingredientId)}
                                </h3>
                                <p className="text-sm text-gray-400">
                                  {level.currentAmount} / {level.capacity} ml
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={`${
                                isCritical
                                  ? "bg-[#ff3b30]/20 text-[#ff3b30] border-[#ff3b30]/50"
                                  : isLow
                                    ? "bg-[#ff9500]/20 text-[#ff9500] border-[#ff9500]/50"
                                    : isAlcoholic
                                      ? "bg-[#ff9500]/20 text-[#ff9500] border-[#ff9500]/50"
                                      : "bg-[#00ff00]/20 text-[#00ff00] border-[#00ff00]/50"
                              }`}
                            >
                              {percentage}%
                            </Badge>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-4">
                            <Progress
                              value={percentage}
                              className="h-3 bg-gray-800"
                              indicatorClassName={`transition-all duration-500 ${progressColor}`}
                            />
                          </div>

                          {/* Warnung bei niedrigem Füllstand */}
                          {isLow && (
                            <Alert
                              className={`mb-4 ${
                                isCritical
                                  ? "bg-[#ff3b30]/10 border-[#ff3b30]/30"
                                  : "bg-[#ff9500]/10 border-[#ff9500]/30"
                              }`}
                            >
                              <AlertTriangle
                                className={`h-4 w-4 ${isCritical ? "text-[#ff3b30]" : "text-[#ff9500]"}`}
                              />
                              <AlertDescription
                                className={`${isCritical ? "text-[#ff3b30]" : "text-[#ff9500]"} text-sm`}
                              >
                                {isCritical ? "Kritisch niedrig!" : "Füllstand niedrig!"} Bitte nachfüllen.
                              </AlertDescription>
                            </Alert>
                          )}

                          {/* Eingabefeld */}
                          <div className="mb-4">
                            <Input
                              type="text"
                              placeholder="Neue Gesamtmenge in ml"
                              value={refillAmounts[level.ingredientId] || ""}
                              className="bg-gray-900 border-gray-700 text-white text-center text-lg placeholder:text-gray-500 focus:border-[#00ff00] focus:ring-[#00ff00]/20"
                              readOnly
                              onClick={() => handleInputFocus(level.ingredientId)}
                            />
                          </div>

                          {/* Schnellauswahl-Buttons */}
                          <div className="grid grid-cols-4 gap-2 mb-3">
                            {commonSizes.map((size) => (
                              <Button
                                key={size}
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuickFill(level.ingredientId, size)}
                                className={`bg-gray-900 text-white border-gray-700 hover:bg-[#00ff00] hover:text-black hover:border-[#00ff00] transition-all duration-200 ${
                                  activeButton === `${level.ingredientId}-${size}`
                                    ? "bg-[#00ff00] text-black border-[#00ff00]"
                                    : ""
                                }`}
                              >
                                {size}ml
                              </Button>
                            ))}
                          </div>

                          {/* Manuell-Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleInputFocus(level.ingredientId)}
                            className="w-full bg-gray-900 text-white border-gray-700 hover:bg-[#00ff00] hover:text-black hover:border-[#00ff00] transition-all duration-200"
                          >
                            📝 Manuell eingeben
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>

              {/* Alle auffüllen Button */}
              <Card className="bg-black border border-[#00ff00]/30">
                <CardContent className="p-4">
                  <Button
                    onClick={handleRefillAll}
                    className="w-full bg-[#00ff00] hover:bg-[#00cc00] text-black font-semibold py-3 transition-all duration-200 shadow-lg"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Wird nachgefüllt...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-5 w-5" />
                        Alle Zutaten vollständig auffüllen
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Erfolgs-Meldung */}
              {showSuccess && (
                <Alert className="bg-[#00ff00]/10 border-[#00ff00]/30 animate-in slide-in-from-top-2 duration-300">
                  <AlertDescription className="text-[#00ff00] font-medium">
                    ✅ Füllstände erfolgreich aktualisiert!
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog für manuelle Eingabe */}
      <Dialog open={showInputDialog} onOpenChange={(open) => !open && cancelInput()}>
        <DialogContent className="bg-black border-gray-800 sm:max-w-md text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Füllstand aktualisieren</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="text-center">
              <div className="p-3 bg-[#00ff00]/20 rounded-full w-fit mx-auto mb-3">
                <Droplet className="h-8 w-8 text-[#00ff00]" />
              </div>
              <p className="text-gray-300">
                Neue Gesamtmenge für <span className="font-semibold text-white">{currentIngredientName}</span>:
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Input
                type="text"
                value={activeInput ? refillAmounts[activeInput] || "" : ""}
                onChange={(e) => activeInput && handleRefillAmountChange(activeInput, e.target.value)}
                placeholder="Menge eingeben"
                className="text-2xl h-14 text-center text-black bg-white font-bold"
                autoFocus
                readOnly
              />
              <span className="text-lg text-gray-300 font-medium">ml</span>
            </div>

            <VirtualKeyboard
              onKeyPress={handleKeyPress}
              onBackspace={handleBackspace}
              onClear={handleClear}
              onConfirm={confirmInput}
              allowDecimal={false}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={cancelInput}
              className="bg-gray-900 text-gray-300 border-gray-700 hover:bg-gray-800"
            >
              Abbrechen
            </Button>
            <Button
              onClick={confirmInput}
              disabled={!activeInput || !refillAmounts[activeInput || ""]}
              className="bg-[#00ff00] text-black font-semibold hover:bg-[#00cc00]"
            >
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
