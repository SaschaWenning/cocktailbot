"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { pumpConfig as initialPumpConfig } from "@/data/pump-config"
import CocktailCard from "@/components/cocktail-card"
import PumpCalibration from "@/components/pump-calibration"
import PumpCleaning from "@/components/pump-cleaning"
import IngredientLevels from "@/components/ingredient-levels"
import ShotSelector from "@/components/shot-selector"
import { makeCocktail, getPumpConfig, saveRecipe, deleteRecipe, getAllCocktails } from "@/lib/cocktail-machine"
import {
  AlertCircle,
  Check,
  Edit,
  Plus,
  AlertTriangle,
  GlassWater,
  Wine,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Lock,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import PasswordModal from "@/components/password-modal"
import RecipeEditor from "@/components/recipe-editor"
import RecipeCreator from "@/components/recipe-creator"
import DeleteConfirmation from "@/components/delete-confirmation"
import type { Cocktail } from "@/types/cocktail"
import { cocktails as defaultCocktails } from "@/data/cocktails"
import { getIngredientLevels } from "@/lib/ingredient-level-service"
import type { IngredientLevel } from "@/types/ingredient-level"
import { ingredients } from "@/data/ingredients"
import type { PumpConfig } from "@/types/pump"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"

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
  const [cocktailsData, setCocktailsData] = useState<Cocktail[]>(defaultCocktails)
  const [ingredientLevels, setIngredientLevels] = useState<IngredientLevel[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [lowIngredients, setLowIngredients] = useState<string[]>([])
  const [pumpConfig, setPumpConfig] = useState<PumpConfig[]>(initialPumpConfig)
  const [loading, setLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [isCalibrationLocked, setIsCalibrationLocked] = useState(true)
  const [passwordAction, setPasswordAction] = useState<"edit" | "calibration">("edit")

  // Paginierung
  const [currentPage, setCurrentPage] = useState(1)
  const [virginCurrentPage, setVirginCurrentPage] = useState(1)

  // Filtere Cocktails nach alkoholisch und nicht-alkoholisch
  const alcoholicCocktails = cocktailsData.filter((cocktail) => cocktail.alcoholic)
  const virginCocktails = cocktailsData.filter((cocktail) => !cocktail.alcoholic)

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
        await Promise.all([loadIngredientLevels(), loadPumpConfig(), loadCocktails()])
      } catch (error) {
        console.error("Fehler beim Laden der Daten:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const loadCocktails = async () => {
    try {
      const cocktails = await getAllCocktails()

      // Protokolliere die geladenen Cocktails für Debugging-Zwecke
      console.log(
        "Geladene Cocktails:",
        cocktails.map((c) => ({ id: c.id, name: c.name, image: c.image })),
      )

      setCocktailsData(cocktails)
    } catch (error) {
      console.error("Fehler beim Laden der Cocktails:", error)
    }
  }

  const loadPumpConfig = async () => {
    try {
      const config = await getPumpConfig()
      setPumpConfig(config)
    } catch (error) {
      console.error("Fehler beim Laden der Pumpenkonfiguration:", error)
    }
  }

  const loadIngredientLevels = async () => {
    try {
      const levels = await getIngredientLevels()
      setIngredientLevels(levels)

      // Prüfe auf niedrige Füllstände
      const lowLevels = levels.filter((level) => level.currentAmount < 100)
      setLowIngredients(lowLevels.map((level) => level.ingredientId))
    } catch (error) {
      console.error("Fehler beim Laden der Füllstände:", error)
    }
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
      setIsCalibrationLocked(false)
      setActiveTab("calibration")
    }
  }

  const handleRecipeSave = async (updatedCocktail: Cocktail) => {
    try {
      await saveRecipe(updatedCocktail)

      // Aktualisiere die lokale Liste
      setCocktailsData((prev) => prev.map((c) => (c.id === updatedCocktail.id ? updatedCocktail : c)))
    } catch (error) {
      console.error("Fehler beim Speichern des Rezepts:", error)
    }
  }

  const handleNewRecipeSave = async (newCocktail: Cocktail) => {
    try {
      await saveRecipe(newCocktail)

      // Füge den neuen Cocktail zur lokalen Liste hinzu
      setCocktailsData((prev) => [...prev, newCocktail])
    } catch (error) {
      console.error("Fehler beim Speichern des neuen Rezepts:", error)
    }
  }

  const handleRequestDelete = (cocktailId: string) => {
    const cocktail = cocktailsData.find((c) => c.id === cocktailId)
    if (cocktail) {
      setCocktailToDelete(cocktail)
      setShowRecipeEditor(false)
      setShowDeleteConfirmation(true)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!cocktailToDelete) return

    try {
      await deleteRecipe(cocktailToDelete.id)

      // Aktualisiere die lokale Liste
      setCocktailsData((prev) => prev.filter((c) => c.id !== cocktailToDelete.id))

      // Wenn der gelöschte Cocktail ausgewählt war, setze die Auswahl zurück
      if (selectedCocktail === cocktailToDelete.id) {
        setSelectedCocktail(null)
      }

      setCocktailToDelete(null)
    } catch (error) {
      console.error("Fehler beim Löschen des Cocktails:", error)
      throw error
    }
  }

  const handleMakeCocktail = async () => {
    if (!selectedCocktail) return

    const cocktail = cocktailsData.find((c) => c.id === selectedCocktail)
    if (!cocktail) return

    setIsMaking(true)
    setProgress(0)
    setStatusMessage("Bereite Cocktail vor...")
    setErrorMessage(null)

    try {
      // Simuliere den Fortschritt
      let intervalId: NodeJS.Timeout
      intervalId = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(intervalId)
            return 100
          }
          return prev + 5
        })
      }, 300)

      // Starte den Cocktail-Herstellungsprozess mit der gewählten Größe
      await makeCocktail(cocktail, pumpConfig, selectedSize)

      clearInterval(intervalId)
      setProgress(100)
      setStatusMessage(`${cocktail.name} (${selectedSize}ml) fertig!`)
      setShowSuccess(true)

      // Aktualisiere die Füllstände nach erfolgreicher Zubereitung
      await loadIngredientLevels()

      setTimeout(() => {
        setIsMaking(false)
        setShowSuccess(false)
        setSelectedCocktail(null)
      }, 3000)
    } catch (error) {
      let intervalId: NodeJS.Timeout
      clearInterval(intervalId)
      setProgress(0)
      setStatusMessage("Fehler bei der Zubereitung!")
      setErrorMessage(error instanceof Error ? error.message : "Unbekannter Fehler")
      setTimeout(() => setIsMaking(false), 3000)
    }
  }

  // Berechne das aktuelle Gesamtvolumen des ausgewählten Cocktails
  const getCurrentVolume = () => {
    const cocktail = cocktailsData.find((c) => c.id === selectedCocktail)
    if (!cocktail) return 0
    return cocktail.recipe.reduce((total, item) => total + item.amount, 0)
  }

  // Prüfe, ob für den ausgewählten Cocktail genügend Zutaten vorhanden sind
  const checkIngredientsAvailable = () => {
    if (!selectedCocktail) return true

    const cocktail = cocktailsData.find((c) => c.id === selectedCocktail)
    if (!cocktail) return true

    // Skaliere das Rezept auf die gewünschte Größe
    const currentTotal = cocktail.recipe.reduce((total, item) => total + item.amount, 0)
    const scaleFactor = selectedSize / currentTotal

    const scaledRecipe = cocktail.recipe.map((item) => ({
      ...item,
      amount: Math.round(item.amount * scaleFactor),
    }))

    // Prüfe, ob genügend von allen Zutaten vorhanden ist
    for (const item of scaledRecipe) {
      const level = ingredientLevels.find((level) => level.ingredientId === item.ingredientId)
      if (!level) continue

      if (level.currentAmount < item.amount) {
        return false
      }
    }

    return true
  }

  const getIngredientName = (id: string) => {
    const ingredient = ingredients.find((i) => i.id === id)
    return ingredient ? ingredient.name : id
  }

  // Neue Komponente für die Cocktail-Detailansicht
  const CocktailDetail = ({ cocktail }: { cocktail: Cocktail }) => {
    // Generiere ein Platzhalterbild mit dem Namen des Cocktails
    const placeholderImage = `/placeholder.svg?height=400&width=400&query=${encodeURIComponent(cocktail.name)}`

    // Bildpfad-Logik
    let imageSrc = cocktail.image || ""
    if (cocktail.alcoholic) {
      const fileName = imageSrc.split("/").pop() || ""
      imageSrc = `/images/cocktails/${fileName}`
    } else if (imageSrc && !imageSrc.startsWith("/")) {
      imageSrc = `/${imageSrc}`
    }
    imageSrc = imageSrc.split("?")[0]

    const handleImageError = () => {
      setImageError(true)
    }

    const finalImageSrc = imageError ? placeholderImage : imageSrc

    // Verfügbare Größen
    const availableSizes = [200, 300, 400]

    // Prüfe, ob es sich um ein benutzerdefiniertes Rezept handelt
    const isCustomRecipe = cocktail.id.startsWith("custom-")

    return (
      <Card className="overflow-hidden transition-all bg-black border-[hsl(var(--cocktail-card-border))] ring-2 ring-[hsl(var(--cocktail-primary))]">
        <div className="flex flex-col md:flex-row">
          {/* Bild-Container (links) */}
          <div className="relative w-full md:w-1/3 aspect-square md:aspect-auto">
            <Image
              src={finalImageSrc || "/placeholder.svg"}
              alt={cocktail.name}
              fill
              className="object-cover"
              onError={handleImageError}
              sizes="(max-width: 768px) 100vw, 33vw"
              priority
            />
          </div>

          {/* Inhalt-Container (rechts) */}
          <div className="flex-1 p-4 flex flex-col">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-xl text-[hsl(var(--cocktail-text))]">{cocktail.name}</h3>
              <Badge variant={cocktail.alcoholic ? "default" : "outline"} className="text-xs">
                {cocktail.alcoholic ? "Alk" : "Alkoholfrei"}
              </Badge>
            </div>

            <div className="flex flex-col md:flex-row gap-4 flex-1">
              {/* Linke Spalte: Beschreibung und Zutaten */}
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

              {/* Rechte Spalte: Größenauswahl und Buttons */}
              <div className="md:w-1/2 flex flex-col">
                <div className="space-y-2 mb-4">
                  <h4 className="text-base mb-2 text-[hsl(var(--cocktail-text))]">Cocktailgröße wählen:</h4>

                  {/* Neue Größenauswahl ohne Punkte */}
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

                {/* Warnung bei nicht ausreichenden Zutaten */}
                {!checkIngredientsAvailable() && (
                  <Alert className="bg-[hsl(var(--cocktail-error))]/10 border-[hsl(var(--cocktail-error))]/30 mb-4">
                    <AlertCircle className="h-4 w-4 text-[hsl(var(--cocktail-error))]" />
                    <AlertDescription className="text-[hsl(var(--cocktail-error))] text-xs">
                      Nicht genügend Zutaten vorhanden! Bitte fülle die Zutaten nach.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Aktionsbuttons */}
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

                {/* Bearbeitungs- und Löschbuttons */}
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

                  {/* Löschbutton - nur für benutzerdefinierte Rezepte */}
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

  // Paginierungskomponente
  const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
  }: {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
  }) => {
    return (
      <div className="flex justify-center items-center gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-10 w-10 p-0 bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))]"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="text-sm font-medium">
          Seite {currentPage} von {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-10 w-10 p-0 bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))]"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    )
  }

  // Gemeinsame Komponente für die Cocktail-Anzeige
  const CocktailDisplay = ({
    cocktails,
    currentPage,
    totalPages,
    onPageChange,
  }: {
    cocktails: Cocktail[]
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
  }) => (
    <>
      {isMaking ? (
        <Card className="border-[hsl(var(--cocktail-card-border))] bg-black text-[hsl(var(--cocktail-text))]">
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-xl font-semibold text-center">{statusMessage}</h2>
            <Progress value={progress} className="h-2" />

            {errorMessage && (
              <Alert className="bg-[hsl(var(--cocktail-error))]/10 border-[hsl(var(--cocktail-error))]/30">
                <AlertCircle className="h-4 w-4 text-[hsl(var(--cocktail-error))]" />
                <AlertDescription className="text-[hsl(var(--cocktail-error))]">{errorMessage}</AlertDescription>
              </Alert>
            )}

            {showSuccess && (
              <div className="flex justify-center">
                <div className="rounded-full bg-[hsl(var(--cocktail-success))]/20 p-3">
                  <Check className="h-8 w-8 text-[hsl(var(--cocktail-success))]" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {selectedCocktail ? (
            // Verwende die neue Detailansicht-Komponente
            <CocktailDetail cocktail={cocktailsData.find((c) => c.id === selectedCocktail)!} />
          ) : (
            <>
              {/* Überschrift und Button für neues Rezept */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Verfügbare Cocktails</h2>
                <Button
                  onClick={() => setShowRecipeCreator(true)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))] hover:text-[hsl(var(--cocktail-primary))]"
                >
                  <Plus className="h-4 w-4" />
                  Neues Rezept
                </Button>
              </div>

              {/* Warnung bei niedrigen Füllständen */}
              {lowIngredients.length > 0 && (
                <Alert className="mb-4 bg-[hsl(var(--cocktail-warning))]/10 border-[hsl(var(--cocktail-warning))]/30">
                  <AlertTriangle className="h-4 w-4 text-[hsl(var(--cocktail-warning))]" />
                  <AlertDescription className="text-[hsl(var(--cocktail-text))]">
                    <p className="font-medium">Niedrige Füllstände bei folgenden Zutaten:</p>
                    <ul className="list-disc pl-5 mt-1 text-sm">
                      {lowIngredients.map((id) => (
                        <li key={id}>{getIngredientName(id)}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Cocktail-Grid */}
              <div className="grid grid-cols-3 gap-3">
                {/* Zeige nur die Cocktails der aktuellen Seite an */}
                {cocktails.map((cocktail) => (
                  <CocktailCard
                    key={cocktail.id}
                    cocktail={cocktail}
                    onClick={() => setSelectedCocktail(cocktail.id)}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </div>

              {/* Paginierung */}
              {totalPages > 1 && (
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
              )}
            </>
          )}
        </>
      )}
    </>
  )

  return (
    <div className="h-screen flex flex-col bg-[hsl(var(--cocktail-bg))] text-[hsl(var(--cocktail-text))]">
      <header className="p-4 border-b border-[hsl(var(--cocktail-card-border))] flex justify-center items-center bg-black shadow-sm">
        <h1 className="text-2xl font-bold text-[hsl(var(--cocktail-primary))]">CocktailBot</h1>
      </header>

      <main className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="mx-4 mt-2 flex justify-start bg-black border border-[hsl(var(--cocktail-card-border))] rounded-md tabs-list">
            <button
              className={`flex items-center gap-1 px-4 py-2 text-sm font-medium transition-all ${activeTab === "cocktails" ? "bg-[hsl(var(--cocktail-primary))] text-black" : "hover:bg-gray-900 text-white"}`}
              onClick={() => {
                if (activeTab === "cocktails" && selectedCocktail) {
                  setSelectedCocktail(null)
                } else {
                  setActiveTab("cocktails")
                  if (selectedCocktail) setSelectedCocktail(null)
                }
              }}
            >
              <Wine className="h-4 w-4" />
              Cocktails
            </button>
            <button
              className={`flex items-center gap-1 px-4 py-2 text-sm font-medium transition-all ${activeTab === "virgin-cocktails" ? "bg-[hsl(var(--cocktail-primary))] text-black" : "hover:bg-gray-900 text-white"}`}
              onClick={() => {
                if (activeTab === "virgin-cocktails" && selectedCocktail) {
                  setSelectedCocktail(null)
                } else {
                  setActiveTab("virgin-cocktails")
                  if (selectedCocktail) setSelectedCocktail(null)
                }
              }}
            >
              <GlassWater className="h-4 w-4" />
              Virgin Cocktails
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium transition-all ${activeTab === "shots" ? "bg-[hsl(var(--cocktail-primary))] text-black" : "hover:bg-gray-900 text-white"}`}
              onClick={() => setActiveTab("shots")}
            >
              Shots
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium transition-all ${activeTab === "levels" ? "bg-[hsl(var(--cocktail-primary))] text-black" : "hover:bg-gray-900 text-white"}`}
              onClick={() => setActiveTab("levels")}
            >
              Füllstände
            </button>
            <button
              className={`flex items-center gap-1 px-4 py-2 text-sm font-medium transition-all ${activeTab === "calibration" ? "bg-[hsl(var(--cocktail-primary))] text-black" : "hover:bg-gray-900 text-white"}`}
              onClick={() => {
                if (isCalibrationLocked) {
                  handleCalibrationClick()
                } else {
                  setActiveTab("calibration")
                }
              }}
            >
              {isCalibrationLocked && <Lock className="h-4 w-4 mr-1" />}
              Pumpenkalibrierung
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium transition-all ${activeTab === "cleaning" ? "bg-[hsl(var(--cocktail-primary))] text-black" : "hover:bg-gray-900 text-white"}`}
              onClick={() => setActiveTab("cleaning")}
            >
              Reinigung
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {activeTab === "cocktails" && (
              <div className="h-full overflow-auto p-4 space-y-4 touch-pan-y">
                <CocktailDisplay
                  cocktails={currentPageCocktails}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}

            {activeTab === "virgin-cocktails" && (
              <div className="h-full overflow-auto p-4 space-y-4 touch-pan-y">
                <CocktailDisplay
                  cocktails={currentPageVirginCocktails}
                  currentPage={virginCurrentPage}
                  totalPages={virginTotalPages}
                  onPageChange={setVirginCurrentPage}
                />
              </div>
            )}

            {activeTab === "shots" && (
              <div className="h-full overflow-auto p-4 space-y-4 touch-pan-y">
                <ShotSelector
                  pumpConfig={pumpConfig}
                  ingredientLevels={ingredientLevels}
                  onShotComplete={loadIngredientLevels}
                />
              </div>
            )}

            {activeTab === "levels" && (
              <div className="h-full overflow-auto p-4 touch-pan-y">
                <IngredientLevels pumpConfig={pumpConfig} />
              </div>
            )}

            {activeTab === "calibration" && !isCalibrationLocked && (
              <div className="h-full overflow-auto p-4 touch-pan-y">
                <PumpCalibration pumpConfig={pumpConfig} />
              </div>
            )}

            {activeTab === "cleaning" && (
              <div className="h-full overflow-auto p-4 touch-pan-y">
                <PumpCleaning pumpConfig={pumpConfig} />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Passwort-Modal */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordSuccess}
      />

      {/* Rezept-Editor */}
      <RecipeEditor
        isOpen={showRecipeEditor}
        onClose={() => setShowRecipeEditor(false)}
        cocktail={cocktailToEdit ? cocktailsData.find((c) => c.id === cocktailToEdit) || null : null}
        onSave={handleRecipeSave}
        onRequestDelete={handleRequestDelete}
      />

      {/* Rezept-Creator */}
      <RecipeCreator
        isOpen={showRecipeCreator}
        onClose={() => setShowRecipeCreator(false)}
        onSave={handleNewRecipeSave}
      />

      {/* Löschen-Bestätigung */}
      <DeleteConfirmation
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={handleDeleteConfirm}
        cocktailName={cocktailToDelete?.name || ""}
      />
    </div>
  )
}
