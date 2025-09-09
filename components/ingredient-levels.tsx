"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, AlertTriangle, Droplet, Wine, Coffee } from "lucide-react"
import type { IngredientLevel } from "@/types/ingredient-level"
import { ingredients } from "@/data/ingredients"
import {
  getIngredientLevels,
  refillAllIngredients,
  updateIngredientLevel,
  updateIngredientCapacity,
} from "@/lib/ingredient-level-service"
import type { PumpConfig } from "@/types/pump-config"
import { getAllIngredients } from "@/lib/ingredients"
import { VirtualKeyboard } from "@/components/virtual-keyboard"

interface IngredientLevelsProps {
  pumpConfig: PumpConfig[]
  onLevelsUpdated?: () => void
}

export default function IngredientLevels({ pumpConfig, onLevelsUpdated }: IngredientLevelsProps) {
  const [levels, setLevels] = useState<IngredientLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [showSuccess, setShowSuccess] = useState(false)
  const [allIngredients, setAllIngredients] = useState<any[]>([])
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [keyboardValue, setKeyboardValue] = useState("")
  const [keyboardType, setKeyboardType] = useState<"capacity" | "fill">("capacity")
  const [editingIngredient, setEditingIngredient] = useState<string | null>(null)

  const commonSizes = [500, 700, 750, 1000, 1500, 1750, 2000]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      console.log("[v0] Loading ingredient levels...")
      const [levelsData, ingredientsData] = await Promise.all([getIngredientLevels(), getAllIngredients()])
      setLevels(levelsData)
      setAllIngredients(ingredientsData)
      console.log("[v0] Loaded levels:", levelsData.length, "ingredients:", ingredientsData.length)
    } catch (error) {
      console.error("[v0] Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateCapacity = async (ingredientId: string, newCapacity: number) => {
    if (newCapacity <= 0) {
      alert("Kapazität muss größer als 0ml sein!")
      return
    }

    setSaving(ingredientId)
    try {
      console.log("[v0] Updating capacity for", ingredientId, "to", newCapacity)

      const updatedLevel = await updateIngredientCapacity(ingredientId, newCapacity)

      setLevels((prev) => {
        const existingIndex = prev.findIndex((level) => level.ingredientId === ingredientId)
        if (existingIndex >= 0) {
          return prev.map((level) => (level.ingredientId === ingredientId ? updatedLevel : level))
        } else {
          return [...prev, updatedLevel]
        }
      })

      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)

      if (onLevelsUpdated) onLevelsUpdated()
    } catch (error) {
      console.error("[v0] Error updating capacity:", error)
      alert("Fehler beim Aktualisieren der Kapazität!")
    } finally {
      setSaving(null)
    }
  }

  const updateFillLevel = async (ingredientId: string, newAmount: number) => {
    if (newAmount < 0) {
      alert("Füllstand kann nicht negativ sein!")
      return
    }

    const currentLevel = levels.find((l) => l.ingredientId === ingredientId)
    const capacity = currentLevel?.capacity || 1000

    if (newAmount > capacity) {
      alert(`Füllstand (${newAmount}ml) kann nicht größer als die Kapazität (${capacity}ml) sein!`)
      return
    }

    setSaving(ingredientId)
    try {
      console.log("[v0] Updating fill level for", ingredientId, "to", newAmount)

      const updatedLevel = await updateIngredientLevel(ingredientId, newAmount)
      updatedLevel.capacity = capacity

      setLevels((prev) => {
        const existingIndex = prev.findIndex((level) => level.ingredientId === ingredientId)
        if (existingIndex >= 0) {
          return prev.map((level) => (level.ingredientId === ingredientId ? updatedLevel : level))
        } else {
          return [...prev, updatedLevel]
        }
      })

      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)

      if (onLevelsUpdated) onLevelsUpdated()
    } catch (error) {
      console.error("[v0] Error updating fill level:", error)
      alert("Fehler beim Aktualisieren des Füllstands!")
    } finally {
      setSaving(null)
    }
  }

  const handleQuickFill = (ingredientId: string, amount: number) => {
    updateFillLevel(ingredientId, amount)
  }

  const handleEmpty = (ingredientId: string) => {
    updateFillLevel(ingredientId, 0)
  }

  const handleRefillAll = async () => {
    setSaving("all")
    try {
      console.log("[v0] Refilling all ingredients...")
      const updatedLevels = await refillAllIngredients()
      setLevels(updatedLevels)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)

      if (onLevelsUpdated) onLevelsUpdated()
    } catch (error) {
      console.error("[v0] Error refilling all:", error)
      alert("Fehler beim Nachfüllen aller Zutaten!")
    } finally {
      setSaving(null)
    }
  }

  const getIngredientName = (id: string) => {
    if (id.startsWith("custom-")) {
      const cleanName = id.replace(/^custom-\d+-/, "").trim()
      try {
        return decodeURIComponent(cleanName)
      } catch {
        return cleanName
      }
    }

    const ingredient = allIngredients.find((i) => i.id === id) || ingredients.find((i) => i.id === id)
    return ingredient ? ingredient.name : id
  }

  const getIngredientIcon = (id: string) => {
    if (id.startsWith("custom-")) {
      return <Droplet className="h-4 w-4" />
    }

    const ingredient = allIngredients.find((i) => i.id === id) || ingredients.find((i) => i.id === id)
    if (!ingredient) return <Droplet className="h-4 w-4" />

    if (ingredient.alcoholic) {
      return <Wine className="h-4 w-4 text-[#ff9500]" />
    } else {
      return <Coffee className="h-4 w-4 text-[#00ff00]" />
    }
  }

  const connectedIngredientIds = pumpConfig.map((pump) => pump.ingredient)

  const pumpBasedLevels = pumpConfig.map((pump) => {
    const existingLevel = levels.find((level) => level.ingredientId === pump.ingredient)

    if (!existingLevel) {
      return {
        ingredientId: pump.ingredient,
        currentAmount: 0,
        capacity: 1000,
        lastRefill: new Date(),
        pumpId: pump.id,
        isNew: true,
      }
    }

    return {
      ...existingLevel,
      pumpId: pump.id,
      isNew: false,
    }
  })

  const sortedLevels = pumpBasedLevels.sort((a, b) => a.pumpId - b.pumpId)

  const filteredLevels = sortedLevels.filter((level) => {
    if (activeTab === "all") return true
    if (activeTab === "low" && level.currentAmount < 100) return true
    if (activeTab === "alcoholic") {
      const ingredient =
        allIngredients.find((i) => i.id === level.ingredientId) || ingredients.find((i) => i.id === level.ingredientId)
      return ingredient?.alcoholic
    }
    if (activeTab === "non-alcoholic") {
      const ingredient =
        allIngredients.find((i) => i.id === level.ingredientId) || ingredients.find((i) => i.id === level.ingredientId)
      return !ingredient?.alcoholic
    }
    return false
  })

  const lowLevelsCount = levels.filter(
    (level) => level.currentAmount < 100 && connectedIngredientIds.includes(level.ingredientId),
  ).length

  const openKeyboard = (ingredientId: string, type: "capacity" | "fill", currentValue: number) => {
    setEditingIngredient(ingredientId)
    setKeyboardType(type)
    setKeyboardValue(currentValue.toString())
    setShowKeyboard(true)
  }

  const handleKeyboardConfirm = () => {
    const value = Number.parseInt(keyboardValue) || 0
    if (editingIngredient && keyboardType === "capacity") {
      updateCapacity(editingIngredient, value)
    } else if (editingIngredient && keyboardType === "fill") {
      updateFillLevel(editingIngredient, value)
    }
    setShowKeyboard(false)
    setEditingIngredient(null)
    setKeyboardValue("")
  }

  const handleKeyboardCancel = () => {
    setShowKeyboard(false)
    setEditingIngredient(null)
    setKeyboardValue("")
  }

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
                    const isUpdating = saving === level.ingredientId

                    const ingredient =
                      allIngredients.find((i) => i.id === level.ingredientId) ||
                      ingredients.find((i) => i.id === level.ingredientId)
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

                          <div className="mb-4">
                            <Progress
                              value={percentage}
                              className="h-3 bg-gray-800"
                              indicatorClassName={`transition-all duration-500 ${progressColor}`}
                            />
                          </div>

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

                          <div className="space-y-3 mb-4">
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <label className="text-sm text-gray-400 mb-1 block">Behälterkapazität (ml)</label>
                                <div
                                  onClick={() => openKeyboard(level.ingredientId, "capacity", level.capacity)}
                                  className="bg-gray-900 border border-gray-700 text-white text-center text-lg p-2 rounded cursor-pointer hover:border-[#ff9500] transition-colors"
                                >
                                  {level.capacity}ml
                                </div>
                              </div>
                              <div className="flex-1">
                                <label className="text-sm text-gray-400 mb-1 block">Aktueller Füllstand (ml)</label>
                                <div
                                  onClick={() => openKeyboard(level.ingredientId, "fill", level.currentAmount)}
                                  className="bg-gray-900 border border-gray-700 text-white text-center text-lg p-2 rounded cursor-pointer hover:border-[#00ff00] transition-colors"
                                >
                                  {level.currentAmount}ml
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-2 mb-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEmpty(level.ingredientId)}
                              className="bg-gray-900 text-white border-gray-700 hover:bg-[#ff3b30] hover:text-white hover:border-[#ff3b30] transition-all duration-200"
                              disabled={isUpdating}
                            >
                              {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : "Leer"}
                            </Button>
                            {commonSizes.slice(0, 3).map((size) => (
                              <Button
                                key={size}
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuickFill(level.ingredientId, size)}
                                className="bg-gray-900 text-white border-gray-700 hover:bg-[#00ff00] hover:text-black hover:border-[#00ff00] transition-all duration-200"
                                disabled={isUpdating || size > level.capacity}
                              >
                                {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : `${size}ml`}
                              </Button>
                            ))}
                          </div>

                          <div className="grid grid-cols-4 gap-2">
                            {commonSizes.slice(3).map((size) => (
                              <Button
                                key={size}
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuickFill(level.ingredientId, size)}
                                className="bg-gray-900 text-white border-gray-700 hover:bg-[#00ff00] hover:text-black hover:border-[#00ff00] transition-all duration-200"
                                disabled={isUpdating || size > level.capacity}
                              >
                                {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : `${size}ml`}
                              </Button>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>

              <Card className="bg-black border border-[#00ff00]/30">
                <CardContent className="p-4">
                  <Button
                    onClick={handleRefillAll}
                    className="w-full bg-[#00ff00] hover:bg-[#00cc00] text-black font-semibold py-3 transition-all duration-200 shadow-lg"
                    disabled={saving === "all"}
                  >
                    {saving === "all" ? (
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

      {showKeyboard && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-black border border-gray-800 rounded-lg p-4 w-full max-w-md mx-4">
            <h3 className="text-white text-lg font-semibold mb-4">
              {keyboardType === "capacity" ? "Behälterkapazität eingeben" : "Füllstand eingeben"}
            </h3>
            <div className="mb-4">
              <Input
                value={keyboardValue}
                readOnly
                className="bg-gray-900 border-gray-700 text-white text-center text-xl"
                placeholder="0"
              />
            </div>
            <VirtualKeyboard
              layout="numeric"
              value={keyboardValue}
              onChange={setKeyboardValue}
              onConfirm={handleKeyboardConfirm}
              onCancel={handleKeyboardCancel}
            />
          </div>
        </div>
      )}
    </div>
  )
}
