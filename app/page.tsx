"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { pumpConfig as initialPumpConfig } from "@/data/pump-config"
import { makeCocktail, getPumpConfig, saveRecipe, deleteRecipe, getAllCocktails } from "@/lib/cocktail-machine"
import { AlertCircle, Edit, ChevronLeft, ChevronRight, Trash2, Check, Plus, Lock } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Cocktail } from "@/types/cocktail"
// cocktails as defaultCocktails wurde entfernt, da getAllCocktails jetzt die Quelle ist
import { getIngredientLevels, initializeNewIngredientLevel } from "@/lib/ingredient-level-service"
import type { IngredientLevel } from "@/types/ingredient-level"
import type { PumpConfig } from "@/types/pump"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import CocktailCard from "@/components/cocktail-card"
import PumpCleaning from "@/components/pump-cleaning"
import PumpCalibration from "@/components/pump-calibration"
import IngredientLevels from "@/components/ingredient-levels"
import ShotSelector from "@/components/shot-selector"
import PasswordModal from "@/components/password-modal"
import RecipeEditor from "@/components/recipe-editor"
import RecipeCreator from "@/components/recipe-creator"
import DeleteConfirmation from "@/components/delete-confirmation"
import { Progress } from "@/components/ui/progress"
import PumpPriming from "@/components/pump-priming"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

// Anzahl der Cocktails pro Seite
const COCKTAILS_PER_PAGE = 9

export default function Home() {
  const [selectedCocktail, setSelectedCocktail] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<number>(300)
  const [isMaking, setIsMaking] = useState(false)
  const [progress, setProgress] = useState<number>(0)
  const [statusMessage, setStatusMessage] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState("cocktails")
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showRecipeEditor, setShowRecipeEditor] = useState(false)
  const [showRecipeCreator, setShowRecipeCreator] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [cocktailToEdit, setCocktailToEdit] = useState<string | null>(null)
  const [cocktailToDelete, setCocktailToDelete] = useState<Cocktail | null>(null)
  const [cocktailsData, setCocktailsData] = useState<Cocktail[]>([]) // Initial leer
  const [ingredientLevels, setIngredientLevels] = useState<IngredientLevel[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [lowIngredients, setLowIngredients] = useState<string[]>([])
  const [pumpConfig, setPumpConfig] = useState<PumpConfig[]>(initialPumpConfig)
  const [loading, setLoading] = useState(true)
  const [isCancelling, setIsCancelling] = useState(false)
  const [passwordAction, setPasswordAction] = useState<"edit" | "calibration">("edit")
  const [calibrationUnlocked, setCalibrationUnlocked] = useState(false)
  const [showInactiveCocktails, setShowInactiveCocktails] = useState(false) // Neuer State

  // Paginierung
  const [currentPage, setCurrentPage] = useState(1)
  const [virginCurrentPage, setVirginCurrentPage] = useState(1)

  // Filtere Cocktails nach alkoholisch und nicht-alkoholisch
  // Berücksichtige showInactiveCocktails
  const displayedCocktails = cocktailsData.filter((c) => c.isActive || showInactiveCocktails)
  const alcoholicCocktails = displayedCocktails.filter((cocktail) => cocktail.alcoholic)
  const virginCocktails = displayedCocktails.filter((cocktail) => !cocktail.alcoholic)

  // Berechne die Gesamtanzahl der Seiten
  const totalPages = Math.ceil(alcoholicCocktails.length / COCKTAILS_PER_PAGE)
  const virginTotalPages = Math.ceil(virginCocktails.length / COCKTAILS_PER_PAGE)

  // Hole die Cocktails für die aktuelle Seite
  const getCurrentPageCocktails = (cocktails: Cocktail[], page: number) => {
    const startIndex = (page - 1) * COCKTAILS_PER_PAGE
    const endIndex = startIndex + COCKTAILS_PER_PAGE
    return cocktails.slice(startIndex, endIndex)
  }

  // Aktuelle Seite von Cocktails
  const currentPageCocktails = getCurrentPageCocktails(alcoholicCocktails, currentPage)
  const currentPageVirginCocktails = getCurrentPageCocktails(virginCocktails, virginCurrentPage)

  // Lade Füllstände, Pumpenkonfiguration und Cocktails beim ersten Rendern
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Lade Cocktails zuerst, damit die Pumpenkonfigurations-Initialisierung
        // auf die korrekten isActive-Status zugreifen kann, falls relevant.
        await loadCocktails()
        await Promise.all([loadIngredientLevels(), loadPumpConfig()])
      } catch (error) {
        console.error("Fehler beim Laden der Daten:", error)
        setErrorMessage("Fehler beim Laden initialer Daten.")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const loadCocktails = async () => {
    try {
      const cocktails = await getAllCocktails()
      setCocktailsData(cocktails)
    } catch (error) {
      console.error("Fehler beim Laden der Cocktails:", error)
      setErrorMessage("Fehler beim Laden der Cocktail-Rezepte.")
    }
  }

  const loadPumpConfig = async () => {
    try {
      const config = await getPumpConfig()
      setPumpConfig(config)

      if (config && config.length > 0) {
        for (const pump of config) {
          await initializeNewIngredientLevel(pump.ingredient)
        }
        await loadIngredientLevels()
      }
    } catch (error) {
      console.error("Fehler beim Laden der Pumpenkonfiguration:", error)
      setErrorMessage("Fehler beim Laden der Pumpenkonfiguration.")
    }
  }

  const loadIngredientLevels = async () => {
    try {
      const levels = await getIngredientLevels()
      setIngredientLevels(levels)
      const lowLevels = levels.filter((level) => level.currentAmount < 100)
      setLowIngredients(lowLevels.map((level) => level.ingredientId))
    } catch (error) {
      console.error("Fehler beim Laden der Füllstände:", error)
      setErrorMessage("Fehler beim Laden der Füllstände.")
    }
  }

  const handleSelectCocktail = (cocktailId: string) => {
    const cocktail = cocktailsData.find((c) => c.id === cocktailId)
    // Nur aktive Cocktails können ausgewählt werden für die Detailansicht/Zubereitung
    if (cocktail && !cocktail.isActive) {
      // Optional: Toast-Nachricht
      console.warn(`Cocktail "${cocktail.name}" ist deaktiviert und kann nicht ausgewählt werden.`)
      return
    }
    setSelectedCocktail(cocktailId)
  }

  const handleEditClick = (cocktailId: string) => {
    setCocktailToEdit(cocktailId)
    setPasswordAction("edit")
    setShowPasswordModal(true)
  }

  const handleDeleteClick = (cocktailId: string) => {
    const cocktail = cocktailsData.find((c) => c.id === cocktailId)
    if (cocktail) {
      setCocktailToDelete(cocktail)
      setShowDeleteConfirmation(true)
    }
  }

  const handleCalibrationClick = () => {
    setPasswordAction("calibration")
    setShowPasswordModal(true)
  }

  const handlePasswordSuccess = () => {
    setShowPasswordModal(false)
    if (passwordAction === "edit") {
      setShowRecipeEditor(true)
    } else if (passwordAction === "calibration") {
      setCalibrationUnlocked(true)
    }
  }

  const handleRecipeSave = async (updatedCocktail: Cocktail) => {
    try {
      await saveRecipe(updatedCocktail)
      // Lade alle Cocktails neu, um die Änderungen (inkl. isActive) zu reflektieren
      await loadCocktails()
    } catch (error) {
      console.error("Fehler beim Speichern des Rezepts:", error)
      setErrorMessage("Fehler beim Speichern des Rezepts.")
    }
  }

  const handleNewRecipeSave = async (newCocktail: Cocktail) => {
    try {
      // Stelle sicher, dass neue Cocktails standardmäßig aktiv sind
      const cocktailToSave = {
        ...newCocktail,
        isActive: newCocktail.isActive === undefined ? true : newCocktail.isActive,
      }
      await saveRecipe(cocktailToSave)
      // Lade alle Cocktails neu
      await loadCocktails()
    } catch (error) {
      console.error("Fehler beim Speichern des neuen Rezepts:", error)
      setErrorMessage("Fehler beim Speichern des neuen Rezepts.")
    }
  }

  const handleRequestDelete = (cocktailId: string) => {
    const cocktail = cocktailsData.find((c) => c.id === cocktailId)
    if (cocktail) {
      setCocktailToDelete(cocktail)
      setShowRecipeEditor(false) // Editor schließen, bevor Bestätigungsdialog kommt
      setShowDeleteConfirmation(true)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!cocktailToDelete) return

    try {
      await deleteRecipe(cocktailToDelete.id)
      setCocktailToDelete(null)
      // Lade alle Cocktails neu
      await loadCocktails()
      // Wenn der gelöschte Cocktail ausgewählt war, setze die Auswahl zurück
      if (selectedCocktail === cocktailToDelete.id) {
        setSelectedCocktail(null)
      }
    } catch (error) {
      console.error("Fehler beim Löschen des Cocktails:", error)
      setErrorMessage("Fehler beim Löschen des Cocktails.")
      throw error // Damit der Dialog das mitbekommt
    }
  }

  const handleMakeCocktail = async () => {
    if (!selectedCocktail) return

    const cocktail = cocktailsData.find((c) => c.id === selectedCocktail)
    if (!cocktail) return

    if (!cocktail.isActive) {
      setErrorMessage(`Cocktail "${cocktail.name}" ist deaktiviert.`)
      setTimeout(() => setErrorMessage(null), 3000)
      return
    }

    setIsMaking(true)
    setProgress(0)
    setStatusMessage("Bereite Cocktail vor...")
    setErrorMessage(null)

    try {
      const currentPumpConfig = await getPumpConfig()
      let intervalId: NodeJS.Timeout | undefined
      intervalId = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            if (intervalId) clearInterval(intervalId)
            return 100
          }
          return prev + 5
        })
      }, 300)

      await makeCocktail(cocktail, currentPumpConfig, selectedSize)

      if (intervalId) clearInterval(intervalId)
      setProgress(100)
      setStatusMessage(`${cocktail.name} (${selectedSize}ml) fertig!`)
      setShowSuccess(true)
      await loadIngredientLevels()

      setTimeout(() => {
        setIsMaking(false)
        setShowSuccess(false)
        setSelectedCocktail(null)
      }, 3000)
    } catch (error) {
      let intervalId: NodeJS.Timeout | undefined
      if (intervalId) clearInterval(intervalId)
      setProgress(0)
      setStatusMessage("Fehler bei der Zubereitung!")
      setErrorMessage(error instanceof Error ? error.message : "Unbekannter Fehler")
      setTimeout(() => {
        setIsMaking(false)
        setErrorMessage(null) // Fehlermeldung nach einiger Zeit ausblenden
      }, 5000)
    }
  }

  const handleCancelCocktail = () => {
    setIsCancelling(true)
    setIsMaking(false)
    setProgress(0)
    setStatusMessage("")
    setErrorMessage(null)
    setSelectedCocktail(null)
    setIsCancelling(false)
  }

  const getCurrentVolume = () => {
    const cocktail = cocktailsData.find((c) => c.id === selectedCocktail)
    if (!cocktail) return 0
    return cocktail.recipe.reduce((total, item) => total + item.amount, 0)
  }

  const checkIngredientsAvailable = () => {
    if (!selectedCocktail) return true
    const cocktail = cocktailsData.find((c) => c.id === selectedCocktail)
    if (!cocktail) return true

    const currentTotal = cocktail.recipe.reduce((total, item) => total + item.amount, 0)
    if (currentTotal === 0) return true // Verhindert Division durch Null, wenn Rezept leer ist
    const scaleFactor = selectedSize / currentTotal

    const scaledRecipe = cocktail.recipe.map((item) => ({
      ...item,
      amount: Math.round(item.amount * scaleFactor),
    }))

    for (const item of scaledRecipe) {
      const level = ingredientLevels.find((level) => level.ingredientId === item.ingredientId)
      if (!level) continue
      if (level.currentAmount < item.amount) {
        return false
      }
    }
    return true
  }

  function CocktailDetail({ cocktail }: { cocktail: Cocktail }) {
    const [localImageError, setLocalImageError] = useState(false)

    useEffect(() => {
      setLocalImageError(false)
    }, [cocktail.id])

    const placeholderImage = `/placeholder.svg?height=400&width=400&query=${encodeURIComponent(cocktail.name)}`
    let imageSrc = cocktail.image || ""
    if (imageSrc && !imageSrc.startsWith("http")) {
      if (!imageSrc.startsWith("/")) {
        imageSrc = `/${imageSrc}`
      }
      imageSrc = imageSrc.split("?")[0]
    }
    const finalImageSrc = localImageError ? placeholderImage : imageSrc
    const availableSizes = [200, 300, 400]
    const isCustomRecipe = cocktail.id.startsWith("custom-")

    return (
      <Card className="overflow-hidden transition-all bg-black border-[hsl(var(--cocktail-card-border))] ring-2 ring-[hsl(var(--cocktail-primary))]">
        <div className="flex flex-col md:flex-row">
          <div className="relative w-full md:w-1/3 aspect-square md:aspect-auto">
            <Image
              src={finalImageSrc || "/placeholder.svg"}
              alt={cocktail.name}
              fill
              className="object-cover"
              onError={() => setLocalImageError(true)}
              sizes="(max-width: 768px) 100vw, 33vw"
              priority
            />
          </div>
          <div className="flex-1 p-4 flex flex-col">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-xl text-[hsl(var(--cocktail-text))]">{cocktail.name}</h3>
              <Badge
                variant={cocktail.alcoholic ? "default" : "default"}
                className="text-xs bg-[hsl(var(--cocktail-primary))] text-black"
              >
                {cocktail.alcoholic ? "Alk" : "Alkoholfrei"}
              </Badge>
            </div>
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="md:w-1/2">
                <p className="text-sm text-[hsl(var(--cocktail-text-muted))] mb-4">{cocktail.description}</p>
                <div>
                  <h4 className="text-base font-semibold mb-2">Zutaten:</h4>
                  <ul className="text-sm space-y-1 text-[hsl(var(--cocktail-text))]">
                    {cocktail.ingredients.map((ingredient, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-1">•</span>
                        <span>{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="md:w-1/2 flex flex-col">
                <div className="space-y-2 mb-4">
                  <h4 className="text-base mb-2 text-[hsl(var(--cocktail-text))]">Cocktailgröße wählen:</h4>
                  <div className="flex gap-4">
                    {availableSizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`text-sm py-1 px-2 rounded bg-[hsl(var(--cocktail-card-bg))] ${
                          selectedSize === size
                            ? "font-semibold border-b-2 border-[hsl(var(--cocktail-primary))] text-[hsl(var(--cocktail-primary))]"
                            : "text-[hsl(var(--cocktail-text))] hover:text-[hsl(var(--cocktail-primary))]"
                        }`}
                      >
                        {size}ml
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-[hsl(var(--cocktail-text-muted))]">
                    Originalrezept: ca. {getCurrentVolume()}ml
                  </div>
                </div>
                {!checkIngredientsAvailable() && (
                  <Alert className="bg-[hsl(var(--cocktail-error))]/10 border-[hsl(var(--cocktail-error))]/30 mb-4">
                    <AlertCircle className="h-4 w-4 text-[hsl(var(--cocktail-error))]" />
                    <AlertDescription className="text-[hsl(var(--cocktail-error))] text-xs">
                      Nicht genügend Zutaten vorhanden! Bitte fülle die Zutaten nach.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="flex flex-col gap-2 mt-auto">
                  <Button
                    onClick={handleMakeCocktail}
                    disabled={!checkIngredientsAvailable()}
                    className="w-full bg-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] text-black"
                  >
                    Cocktail zubereiten
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedCocktail(null)}
                    className="w-full bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))]"
                  >
                    Abbrechen
                  </Button>
                </div>
                <div className="flex justify-between mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))]"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditClick(cocktail.id)
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Bearbeiten
                  </Button>
                  {isCustomRecipe && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteClick(cocktail.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Löschen
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  function PaginationComponent({
    currentPage,
    totalPages,
    onPageChange,
  }: {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
  }) {
    if (totalPages <= 1) return null // Keine Paginierung bei einer Seite
    return (
      <div className="flex justify-center items-center gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-10 w-10 p-0 bg-[hsl(var(--cocktail-primary))] text-black border-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] disabled:opacity-50 disabled:bg-[hsl(var(--cocktail-card-bg))] disabled:text-[hsl(var(--cocktail-text))] disabled:border-[hsl(var(--cocktail-card-border))]"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="text-sm font-medium text-[hsl(var(--cocktail-text))]">
          Seite {currentPage} von {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-10 w-10 p-0 bg-[hsl(var(--cocktail-primary))] text-black border-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] disabled:opacity-50 disabled:bg-[hsl(var(--cocktail-card-bg))] disabled:text-[hsl(var(--cocktail-text))] disabled:border-[hsl(var(--cocktail-card-border))]"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    )
  }

  const renderContent = () => {
    if (loading) {
      return <div className="text-center py-10 text-[hsl(var(--cocktail-text))]">Lade Cocktails...</div>
    }
    if (selectedCocktail) {
      const cocktail = cocktailsData.find((c) => c.id === selectedCocktail)
      if (!cocktail) return null // Sollte nicht passieren, wenn selectedCocktail gesetzt ist

      if (isMaking) {
        return (
          <Card className="border-[hsl(var(--cocktail-card-border))] bg-black text-[hsl(var(--cocktail-text))]">
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-semibold text-center">{statusMessage}</h2>
              <Progress value={progress} className="h-2" />
              {errorMessage && (
                <Alert className="bg-[hsl(var(--cocktail-error))]/10 border-[hsl(var(--cocktail-error))]/30">
                  <AlertCircle className="h-4 w-4 text-[hsl(var(--cocktail-error))]" />
                  <AlertDescription className="text-[hsl(var(--cocktail-error))]">{errorMessage}</AlertDescription>
                </Alert>
              )}
              {showSuccess ? (
                <div className="flex justify-center">
                  <div className="rounded-full bg-[hsl(var(--cocktail-success))]/20 p-3">
                    <Check className="h-8 w-8 text-[hsl(var(--cocktail-success))]" />
                  </div>
                </div>
              ) : (
                !errorMessage && ( // Zeige Abbrechen-Button nur, wenn kein Fehler aufgetreten ist
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      onClick={handleCancelCocktail}
                      disabled={isCancelling}
                      className="bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
                    >
                      {isCancelling ? "Abbrechen..." : "Abbrechen"}
                    </Button>
                  </div>
                )
              )}
            </div>
          </Card>
        )
      }
      return <CocktailDetail cocktail={cocktail} />
    }

    switch (activeTab) {
      case "cocktails":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-[hsl(var(--cocktail-text))]">Cocktails mit Alkohol</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-inactive-alcoholic"
                    checked={showInactiveCocktails}
                    onCheckedChange={setShowInactiveCocktails}
                    className="data-[state=checked]:bg-sky-500 data-[state=unchecked]:bg-gray-700"
                  />
                  <Label htmlFor="show-inactive-alcoholic" className="text-sm text-[hsl(var(--cocktail-text-muted))]">
                    Deaktivierte anzeigen
                  </Label>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRecipeCreator(true)}
                  className="bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Neues Rezept
                </Button>
              </div>
            </div>
            {alcoholicCocktails.length === 0 && (
              <p className="text-center text-[hsl(var(--cocktail-text-muted))] py-4">
                {showInactiveCocktails
                  ? "Keine alkoholischen Cocktails vorhanden."
                  : "Keine aktiven alkoholischen Cocktails. Aktiviere den Schalter, um deaktivierte anzuzeigen."}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {currentPageCocktails.map((cocktail) => (
                <CocktailCard
                  key={cocktail.id}
                  cocktail={cocktail}
                  onClick={() => handleSelectCocktail(cocktail.id)}
                  onDelete={cocktail.id.startsWith("custom-") ? handleDeleteClick : undefined}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <PaginationComponent currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            )}
          </div>
        )
      case "virgin":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-[hsl(var(--cocktail-text))]">Alkoholfreie Cocktails</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-inactive-virgin"
                    checked={showInactiveCocktails}
                    onCheckedChange={setShowInactiveCocktails}
                    className="data-[state=checked]:bg-sky-500 data-[state=unchecked]:bg-gray-700"
                  />
                  <Label htmlFor="show-inactive-virgin" className="text-sm text-[hsl(var(--cocktail-text-muted))]">
                    Deaktivierte anzeigen
                  </Label>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRecipeCreator(true)}
                  className="bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Neues Rezept
                </Button>
              </div>
            </div>
            {virginCocktails.length === 0 && (
              <p className="text-center text-[hsl(var(--cocktail-text-muted))] py-4">
                {showInactiveCocktails
                  ? "Keine alkoholfreien Cocktails vorhanden."
                  : "Keine aktiven alkoholfreien Cocktails. Aktiviere den Schalter, um deaktivierte anzuzeigen."}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {currentPageVirginCocktails.map((cocktail) => (
                <CocktailCard
                  key={cocktail.id}
                  cocktail={cocktail}
                  onClick={() => handleSelectCocktail(cocktail.id)}
                  onDelete={cocktail.id.startsWith("custom-") ? handleDeleteClick : undefined}
                />
              ))}
            </div>
            {virginTotalPages > 1 && (
              <PaginationComponent
                currentPage={virginCurrentPage}
                totalPages={virginTotalPages}
                onPageChange={setVirginCurrentPage}
              />
            )}
          </div>
        )
      case "shots":
        return (
          <ShotSelector
            pumpConfig={pumpConfig}
            ingredientLevels={ingredientLevels}
            onShotComplete={loadIngredientLevels}
          />
        )
      case "levels":
        return <IngredientLevels pumpConfig={pumpConfig} onLevelsUpdated={loadIngredientLevels} />
      case "priming":
        return <PumpPriming pumpConfig={pumpConfig} />
      case "cleaning":
        return <PumpCleaning pumpConfig={pumpConfig} />
      case "calibration":
        if (calibrationUnlocked) {
          return <PumpCalibration pumpConfig={pumpConfig} onConfigUpdate={loadPumpConfig} />
        }
        return (
          <div className="text-center py-8">
            <Lock className="h-12 w-12 mx-auto mb-4 text-[hsl(var(--cocktail-warning))]" />
            <h2 className="text-xl font-semibold mb-2 text-[hsl(var(--cocktail-text))]">
              Kalibrierung ist passwortgeschützt
            </h2>
            <p className="text-[hsl(var(--cocktail-text-muted))] mb-4">
              Bitte gib das Passwort ein, um die Pumpenkalibrierung zu bearbeiten.
            </p>
            <Button
              onClick={handleCalibrationClick}
              className="bg-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] text-black"
            >
              Passwort eingeben
            </Button>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-center text-[hsl(var(--cocktail-text))]">CocktailBot</h1>
      </header>

      {errorMessage && (
        <Alert variant="destructive" className="mb-4 bg-red-900/30 border-red-700 text-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="mb-6">
        <nav className="tabs-list">
          <div className="flex overflow-x-auto space-x-2 pb-2">
            <Button
              onClick={() => {
                if (selectedCocktail) setSelectedCocktail(null)
                setActiveTab("cocktails")
              }}
              className={`flex-1 ${
                activeTab === "cocktails"
                  ? "bg-[hsl(var(--cocktail-primary))] text-black"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] hover:bg-[hsl(var(--cocktail-card-border))]"
              }`}
            >
              Cocktails
            </Button>
            <Button
              onClick={() => {
                if (selectedCocktail) setSelectedCocktail(null)
                setActiveTab("virgin")
              }}
              className={`flex-1 ${
                activeTab === "virgin"
                  ? "bg-[hsl(var(--cocktail-primary))] text-black"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] hover:bg-[hsl(var(--cocktail-card-border))]"
              }`}
            >
              Alkoholfrei
            </Button>
            <Button
              onClick={() => {
                if (selectedCocktail) setSelectedCocktail(null)
                setActiveTab("shots")
              }}
              className={`flex-1 ${
                activeTab === "shots"
                  ? "bg-[hsl(var(--cocktail-primary))] text-black"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] hover:bg-[hsl(var(--cocktail-card-border))]"
              }`}
            >
              Shots
            </Button>
            <Button
              onClick={() => {
                if (selectedCocktail) setSelectedCocktail(null)
                setActiveTab("levels")
              }}
              className={`flex-1 ${
                activeTab === "levels"
                  ? "bg-[hsl(var(--cocktail-primary))] text-black"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] hover:bg-[hsl(var(--cocktail-card-border))]"
              }`}
            >
              Füllstände
            </Button>
            <Button
              onClick={() => {
                if (selectedCocktail) setSelectedCocktail(null)
                setActiveTab("priming")
              }}
              className={`flex-1 ${
                activeTab === "priming"
                  ? "bg-[hsl(var(--cocktail-primary))] text-black"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] hover:bg-[hsl(var(--cocktail-card-border))]"
              }`}
            >
              Entlüften
            </Button>
            <Button
              onClick={() => {
                if (selectedCocktail) setSelectedCocktail(null)
                setActiveTab("cleaning")
              }}
              className={`flex-1 ${
                activeTab === "cleaning"
                  ? "bg-[hsl(var(--cocktail-primary))] text-black"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] hover:bg-[hsl(var(--cocktail-card-border))]"
              }`}
            >
              Reinigung
            </Button>
            <Button
              onClick={() => {
                if (selectedCocktail) setSelectedCocktail(null)
                if (activeTab !== "calibration") {
                  setCalibrationUnlocked(false)
                }
                setActiveTab("calibration")
              }}
              className={`flex-1 ${
                activeTab === "calibration"
                  ? "bg-[hsl(var(--cocktail-primary))] text-black"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] hover:bg-[hsl(var(--cocktail-card-border))]"
              }`}
            >
              Kalibrierung
            </Button>
          </div>
        </nav>
      </div>

      <main>{renderContent()}</main>

      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordSuccess}
      />

      <RecipeEditor
        isOpen={showRecipeEditor}
        onClose={() => setShowRecipeEditor(false)}
        cocktail={cocktailToEdit ? cocktailsData.find((c) => c.id === cocktailToEdit) || null : null}
        onSave={handleRecipeSave}
        onRequestDelete={handleRequestDelete}
      />

      <RecipeCreator
        isOpen={showRecipeCreator}
        onClose={() => setShowRecipeCreator(false)}
        onSave={handleNewRecipeSave}
      />

      <DeleteConfirmation
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={handleDeleteConfirm}
        cocktailName={cocktailToDelete?.name || ""}
      />
    </div>
  )
}
