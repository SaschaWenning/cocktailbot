"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, Plus, Minus } from "lucide-react"
import { updateIngredientLevel } from "@/lib/ingredient-level-service"
import { ingredients } from "@/data/ingredients"
import type { IngredientLevel } from "@/types/ingredient-level"
import VirtualKeyboard from "./virtual-keyboard"

interface IngredientLevelsProps {
  pumpConfig: any[]
  onLevelsUpdated?: () => void
  ingredientLevels: IngredientLevel[]
  onUpdate: () => void
  availableIngredients: string[]
}

export default function IngredientLevels({
  pumpConfig,
  onLevelsUpdated,
  ingredientLevels,
  onUpdate,
  availableIngredients,
}: IngredientLevelsProps) {
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
  const [updating, setUpdating] = useState<string | null>(null)

  // Common container sizes
  const commonSizes = [50, 100, 150, 200, 250, 300, 350]

  useEffect(() => {
    loadLevels()
  }, [])

  const loadLevels = async () => {
    setLoading(true)
    try {
      const data = await ingredientLevels
      setLevels(data)
    } catch (error) {
      console.error("Error loading fill levels:", error)
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
    setUpdating(ingredientId)
    try {
      await updateIngredientLevel(ingredientId, 1000)
      onUpdate()
    } catch (error) {
      console.error("Fehler beim Auffüllen:", error)
    } finally {
      setUpdating(null)
    }
  }

  const handleLevelChange = async (ingredientId: string, change: number) => {
    setUpdating(ingredientId)
    try {
      const currentLevel = levels.find((l) => l.ingredientId === ingredientId)
      if (currentLevel) {
        const newAmount = Math.max(0, Math.min(1000, currentLevel.currentAmount + change))
        await updateIngredientLevel(ingredientId, newAmount)
        onUpdate()
      }
    } catch (error) {
      console.error("Fehler beim Aktualisieren des Füllstands:", error)
    } finally {
      setUpdating(null)
    }
  }

  const getIngredientName = (ingredientId: string) => {
    const ingredient = ingredients.find((i) => i.id === ingredientId)
    return ingredient?.name || ingredientId
  }

  const getProgressColor = (percentage: number) => {
    if (percentage > 50) return "bg-green-500"
    if (percentage > 20) return "bg-yellow-500"
    return "bg-red-500"
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

  // Nur Zutaten anzeigen, die in Cocktail-Rezepten verwendet werden
  const relevantLevels = levels.filter((level) => availableIngredients.includes(level.ingredientId))

  return (
    <div className="space-y-6">
      <Card className="bg-black border border-gray-800">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#00ff00]/20 rounded-lg">
                <Plus className="h-6 w-6 text-[#00ff00]" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-white">Fill Levels</CardTitle>
              </div>
            </div>
            <Badge variant="outline" className="bg-[#00ff00]/10 text-[#00ff00] border-[#00ff00]/30">
              {relevantLevels.length} Ingredients
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#00ff00] mx-auto" />
                <p className="text-gray-400">Loading fill levels...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Tab Navigation */}
              <div className="w-full">
                <div className="grid grid-cols-4 bg-black border border-gray-800 h-12 p-1">
                  <div
                    className="data-[state=active]:bg-[#00ff00] data-[state=active]:text-black text-white font-medium"
                    onClick={() => setActiveTab("all")}
                  >
                    All
                  </div>
                  <div
                    className="data-[state=active]:bg-[#ff3b30] data-[state=active]:text-white text-white font-medium relative"
                    onClick={() => setActiveTab("low")}
                  >
                    Low
                  </div>
                  <div
                    className="data-[state=active]:bg-[#ff9500] data-[state=active]:text-black text-white font-medium"
                    onClick={() => setActiveTab("alcoholic")}
                  >
                    Alcoholic
                  </div>
                  <div
                    className="data-[state=active]:bg-[#00ff00] data-[state=active]:text-black text-white font-medium"
                    onClick={() => setActiveTab("non-alcoholic")}
                  >
                    Non-Alcoholic
                  </div>
                </div>
              </div>

              {/* Ingredient Cards */}
              <div className="space-y-4">
                {relevantLevels.length === 0 ? (
                  <Card className="bg-black border border-gray-800">
                    <CardContent className="py-12 text-center">
                      <Plus className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">No ingredients in this category</p>
                    </CardContent>
                  </Card>
                ) : (
                  relevantLevels.map((level) => {
                    const percentage = Math.round((level.currentAmount / level.capacity) * 100)
                    const isLow = level.currentAmount < 100
                    const isCritical = level.currentAmount < 50
                    const isNew = level.isNew || false

                    // Determine color based on state
                    const ingredient = ingredients.find((i) => i.id === level.ingredientId)
                    const isAlcoholic = ingredient?.alcoholic

                    const cardBorderColor = isCritical
                      ? "border-[#ff3b30]"
                      : isLow
                        ? "border-[#ff9500]"
                        : "border-gray-800"

                    const progressColor = getProgressColor(percentage)

                    return (
                      <Card
                        key={level.ingredientId}
                        className={`bg-black ${cardBorderColor} transition-all duration-300 hover:shadow-lg`}
                      >
                        <CardContent className="p-6">
                          {/* Header with Icon and Name */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <Plus className="h-4 w-4 text-[#00ff00]" />
                              <div>
                                <h3 className="font-semibold text-white text-lg">
                                  {getIngredientName(level.ingredientId)}
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

                          {/* Warning for low fill level */}
                          {isLow && (
                            <div className="mb-4 flex items-center justify-between">
                              <Minus className="h-4 w-4 text-[#ff9500]" />
                              <p className="text-sm text-[#ff9500]">
                                {isCritical ? "Critically low!" : "Fill level low!"} Please refill.
                              </p>
                            </div>
                          )}

                          {/* Input Field */}
                          <div className="mb-4">
                            <Button
                              type="text"
                              placeholder="New total amount in ml"
                              value={refillAmounts[level.ingredientId] || ""}
                              className="bg-gray-900 border-gray-700 text-white text-center text-lg placeholder:text-gray-500 focus:border-[#00ff00] focus:ring-[#00ff00]/20"
                              readOnly
                              onClick={() => handleInputFocus(level.ingredientId)}
                            >
                              📝 Enter manually
                            </Button>
                          </div>

                          {/* Quick Selection Buttons */}
                          <div className="grid grid-cols-4 gap-2 mb-3">
                            {commonSizes.map((size) => (
                              <Button
                                key={size}
                                variant="outline"
                                size="sm"
                                onClick={() => handleLevelChange(level.ingredientId, size)}
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

                          {/* Manual Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleInputFocus(level.ingredientId)}
                            className="w-full bg-gray-900 text-white border-gray-700 hover:bg-[#00ff00] hover:text-black hover:border-[#00ff00] transition-all duration-200"
                          >
                            📝 Enter manually
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>

              {/* Refill All Button */}
              <Card className="bg-black border border-[#00ff00]/30">
                <CardContent className="p-4">
                  <Button
                    onClick={handleRefill}
                    className="w-full bg-[#00ff00] hover:bg-[#00cc00] text-black font-semibold py-3 transition-all duration-200 shadow-lg"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Refilling...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-5 w-5" />
                        Refill all ingredients completely
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Success Message */}
              {showSuccess && (
                <div className="bg-[#00ff00]/10 border-[#00ff00]/30 animate-in slide-in-from-top-2 duration-300">
                  <p className="text-[#00ff00] font-medium">✅ Fill levels successfully updated!</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog for manual input */}
      <div open={showInputDialog} onOpenChange={(open) => !open && cancelInput()}>
        <div className="bg-black border-gray-800 sm:max-w-md text-white">
          <div className="text-xl font-bold">Update Fill Level</div>

          <div className="space-y-6 py-4">
            <div className="text-center">
              <div className="p-3 bg-[#00ff00]/20 rounded-full w-fit mx-auto mb-3">
                <Plus className="h-8 w-8 text-[#00ff00]" />
              </div>
              <p className="text-gray-300">
                New total amount for <span className="font-semibold text-white">{currentIngredientName}</span>:
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="text"
                value={activeInput ? refillAmounts[activeInput] || "" : ""}
                onChange={(e) => activeInput && handleRefillAmountChange(activeInput, e.target.value)}
                placeholder="Enter amount"
                className="text-2xl h-14 text-center text-black bg-white font-bold"
                autoFocus
                readOnly
              >
                📝 Enter manually
              </Button>
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

          <div className="gap-2">
            <Button
              variant="outline"
              onClick={cancelInput}
              className="bg-gray-900 text-gray-300 border-gray-700 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmInput}
              disabled={!activeInput || !refillAmounts[activeInput || ""]}
              className="bg-[#00ff00] text-black font-semibold hover:bg-[#00cc00]"
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
