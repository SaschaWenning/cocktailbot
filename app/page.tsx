"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { pumpConfig as initialPumpConfig } from "@/data/pump-config"
import { makeCocktail, getPumpConfig, saveRecipe, deleteRecipe, getAllCocktails } from "@/lib/cocktail-machine"
import { AlertCircle, Edit, ChevronLeft, ChevronRight, Check, Plus, Lock } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Cocktail } from "@/types/cocktail"
import { cocktails as defaultCocktails } from "@/data/cocktails"
import { getIngredientLevels } from "@/lib/ingredient-level-service"
import type { IngredientLevel } from "@/types/ingredient-level"
import { ingredients } from "@/data/ingredients"
import type { PumpConfig } from "@/types/pump"
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
import ImageEditor from "@/components/image-editor"
import QuickShotSelector from "@/components/quick-shot-selector"
import { toast } from "@/components/ui/use-toast"

// Anzahl Cocktails pro Seite
const COCKTAILS_PER_PAGE = 9

export default function CocktailMachine() {
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
  const [isCalibrationLocked, setIsCalibrationLocked] = useState(true)
  const [passwordAction, setPasswordAction] = useState<"edit" | "calibration">("edit")
  const [showImageEditor, setShowImageEditor] = useState(false)

  // Kiosk-Modus Exit-Zähler
  const [kioskExitClicks, setKioskExitClicks] = useState(0)
  const [lastClickTime, setLastClickTime] = useState(0)

  // Paginierung
  const [currentPage, setCurrentPage] = useState(1)
  const [virginCurrentPage, setVirginCurrentPage] = useState(1)

  // Cocktails nach alkoholisch und alkoholfrei filtern
  const alcoholicCocktails = cocktailsData.filter((cocktail) => cocktail.alcoholic)
  const virginCocktails = cocktailsData.filter((cocktail) => !cocktail.alcoholic)

  // Gesamtanzahl der Seiten berechnen
  const totalPages = Math.ceil(alcoholicCocktails.length / COCKTAILS_PER_PAGE)
  const virginTotalPages = Math.ceil(virginCocktails.length / COCKTAILS_PER_PAGE)

  // Cocktails für aktuelle Seite holen
  const getCurrentPageCocktails = (cocktails: Cocktail[], page: number) => {
    const startIndex = (page - 1) * COCKTAILS_PER_PAGE
    const endIndex = startIndex + COCKTAILS_PER_PAGE
    return cocktails.slice(startIndex, endIndex)
  }

  // Aktuelle Seiten-Cocktails
  const currentPageCocktails = getCurrentPageCocktails(alcoholicCocktails, currentPage)
  const currentPageVirginCocktails = getCurrentPageCocktails(virginCocktails, virginCurrentPage)

  // Alle verfügbaren Zutaten aus Cocktail-Rezepten berechnen
  const getAvailableIngredientsFromCocktails = () => {
    const allIngredients = new Set<string>()
    cocktailsData.forEach((cocktail) => {
      cocktail.recipe.forEach((item) => {
        allIngredients.add(item.ingredientId)
      })
    })
    return Array.from(allIngredients)
  }

  // Füllstände, Pumpenkonfiguration und Cocktails beim ersten Rendern laden
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

      // Nach niedrigen Füllständen suchen
      const lowLevels = levels.filter((level) => level.currentAmount < 100)
      setLowIngredients(lowLevels.map((level) => level.ingredientId))
    } catch (error) {
      console.error("Fehler beim Laden der Füllstände:", error)
    }
  }

  const handleImageEditClick = (cocktailId: string) => {
    setCocktailToEdit(cocktailId)
    setShowImageEditor(true)
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

  const handleImageSave = async (updatedCocktail: Cocktail) => {
    try {
      await saveRecipe(updatedCocktail)

      // Lokale Liste aktualisieren
      setCocktailsData((prev) => prev.map((c) => (c.id === updatedCocktail.id ? updatedCocktail : c)))

      // Auch Füllstände für neue Zutaten aktualisieren
      await loadIngredientLevels()
    } catch (error) {
      console.error("Fehler beim Speichern des Bildes:", error)
    }
  }

  const handleRecipeSave = async (updatedCocktail: Cocktail) => {
    try {
      await saveRecipe(updatedCocktail)

      // Lokale Liste aktualisieren
      setCocktailsData((prev) => prev.map((c) => (c.id === updatedCocktail.id ? updatedCocktail : c)))

      // Auch Füllstände für neue Zutaten aktualisieren
      await loadIngredientLevels()
    } catch (error) {
      console.error("Fehler beim Speichern des Rezepts:", error)
    }
  }

  const handleNewRecipeSave = async (newCocktail: Cocktail) => {
    try {
      await saveRecipe(newCocktail)

      // Neuen Cocktail zur lokalen Liste hinzufügen
      setCocktailsData((prev) => [...prev, newCocktail])

      // Auch Füllstände für neue Zutaten aktualisieren
      await loadIngredientLevels()
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

      // Lokale Liste aktualisieren
      setCocktailsData((prev) => prev.filter((c) => c.id !== cocktailToDelete.id))

      // Wenn gelöschter Cocktail ausgewählt war, Auswahl zurücksetzen
      if (selectedCocktail === cocktailToDelete.id) {
        setSelectedCocktail(null)
      }

      setCocktailToDelete(null)
    } catch (error) {
      console.error("Fehler beim Löschen des Rezepts:", error)
    }
  }

  const handleMakeCocktail = async () => {
    if (!selectedCocktail) return

    const cocktail = cocktailsData.find((c) => c.id === selectedCocktail)
    if (!cocktail) return

    setIsMaking(true)
    setProgress(0)
    setStatusMessage("Cocktail wird zubereitet...")
    setErrorMessage(null)

    try {
      await makeCocktail(cocktail, selectedSize, (progress, message) => {
        setProgress(progress)
        setStatusMessage(message)
      })

      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        setSelectedCocktail(null)
      }, 3000)

      // Füllstände nach dem Zubereiten aktualisieren
      await loadIngredientLevels()
    } catch (error) {
      console.error("Fehler beim Zubereiten:", error)
      setErrorMessage(error instanceof Error ? error.message : "Unbekannter Fehler")
    } finally {
      setIsMaking(false)
      setProgress(0)
      setStatusMessage("")
    }
  }

  const handleKioskExit = () => {
    const now = Date.now()
    if (now - lastClickTime > 2000) {
      // Reset wenn mehr als 2 Sekunden vergangen sind
      setKioskExitClicks(1)
    } else {
      setKioskExitClicks((prev) => prev + 1)
    }
    setLastClickTime(now)

    if (kioskExitClicks >= 4) {
      // 5 Klicks erreicht
      fetch("/api/exit-kiosk", { method: "POST" })
        .then(() => {
          toast({
            title: "Kiosk-Modus beendet",
            description: "Die Anwendung wird beendet...",
          })
        })
        .catch((error) => {
          console.error("Fehler beim Beenden des Kiosk-Modus:", error)
        })
      setKioskExitClicks(0)
    }
  }

  const getIngredientName = (ingredientId: string) => {
    const ingredient = ingredients.find((i) => i.id === ingredientId)
    return ingredient?.name || ingredientId
  }

  const canMakeCocktail = (cocktail: Cocktail) => {
    return cocktail.recipe.every((item) => {
      const level = ingredientLevels.find((l) => l.ingredientId === item.ingredientId)
      return level && level.currentAmount >= item.amount
    })
  }

  const selectedCocktailData = selectedCocktail ? cocktailsData.find((c) => c.id === selectedCocktail) : null

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Lade Cocktail-Maschine...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-[hsl(var(--cocktail-card-bg))] border-b border-[hsl(var(--cocktail-card-border))] p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[hsl(var(--cocktail-primary))]" onClick={handleKioskExit}>
            Cocktail-Maschine
          </h1>
          <div className="flex gap-2">
            <Button
              variant={activeTab === "cocktails" ? "default" : "outline"}
              onClick={() => setActiveTab("cocktails")}
              className={
                activeTab === "cocktails"
                  ? "bg-[hsl(var(--cocktail-primary))] text-black"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))]"
              }
            >
              Cocktails
            </Button>
            <Button
              variant={activeTab === "virgin" ? "default" : "outline"}
              onClick={() => setActiveTab("virgin")}
              className={
                activeTab === "virgin"
                  ? "bg-[hsl(var(--cocktail-primary))] text-black"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))]"
              }
            >
              Alkoholfrei
            </Button>
            <Button
              variant={activeTab === "quick-shot" ? "default" : "outline"}
              onClick={() => setActiveTab("quick-shot")}
              className={
                activeTab === "quick-shot"
                  ? "bg-[hsl(var(--cocktail-primary))] text-black"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))]"
              }
            >
              Schnell-Shots
            </Button>
            <Button
              variant={activeTab === "levels" ? "default" : "outline"}
              onClick={() => setActiveTab("levels")}
              className={
                activeTab === "levels"
                  ? "bg-[hsl(var(--cocktail-primary))] text-black"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))]"
              }
            >
              Füllstände
            </Button>
            <Button
              variant={activeTab === "cleaning" ? "default" : "outline"}
              onClick={() => setActiveTab("cleaning")}
              className={
                activeTab === "cleaning"
                  ? "bg-[hsl(var(--cocktail-primary))] text-black"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))]"
              }
            >
              Reinigung
            </Button>
            <Button
              variant={activeTab === "calibration" ? "default" : "outline"}
              onClick={() => (isCalibrationLocked ? handleCalibrationClick() : setActiveTab("calibration"))}
              className={
                activeTab === "calibration"
                  ? "bg-[hsl(var(--cocktail-primary))] text-black"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))]"
              }
            >
              {isCalibrationLocked && <Lock className="h-4 w-4 mr-1" />}
              Kalibrierung
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setPasswordAction("edit")
                setShowPasswordModal(true)
              }}
              className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))]"
            >
              <Edit className="h-4 w-4 mr-1" />
              Bearbeiten
            </Button>
            <Button
              onClick={() => setShowRecipeCreator(true)}
              className="bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
            >
              <Plus className="h-4 w-4 mr-1" />
              Neues Rezept
            </Button>
          </div>
        </div>
      </div>

      {/* Warnung für niedrige Füllstände */}
      {lowIngredients.length > 0 && (
        <Alert className="m-4 border-yellow-500 bg-yellow-500/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Niedrige Füllstände: {lowIngredients.map((id) => getIngredientName(id)).join(", ")}
          </AlertDescription>
        </Alert>
      )}

      {/* Hauptinhalt */}
      <div className="p-4">
        {activeTab === "cocktails" && (
          <div>
            {/* Paginierung oben */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mb-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-white">
                  Seite {currentPage} von {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))]"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Cocktail-Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {currentPageCocktails.map((cocktail) => (
                <CocktailCard
                  key={cocktail.id}
                  cocktail={cocktail}
                  isSelected={selectedCocktail === cocktail.id}
                  canMake={canMakeCocktail(cocktail)}
                  onSelect={() => setSelectedCocktail(cocktail.id)}
                  onImageEdit={() => handleImageEditClick(cocktail.id)}
                  onDelete={() => handleDeleteClick(cocktail.id)}
                  showEditButtons={false}
                />
              ))}
            </div>

            {/* Paginierung unten */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-white">
                  Seite {currentPage} von {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))]"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === "virgin" && (
          <div>
            {/* Paginierung oben */}
            {virginTotalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mb-6">
                <Button
                  variant="outline"
                  onClick={() => setVirginCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={virginCurrentPage === 1}
                  className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-white">
                  Seite {virginCurrentPage} von {virginTotalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setVirginCurrentPage((prev) => Math.min(virginTotalPages, prev + 1))}
                  disabled={virginCurrentPage === virginTotalPages}
                  className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))]"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Alkoholfreie Cocktail-Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {currentPageVirginCocktails.map((cocktail) => (
                <CocktailCard
                  key={cocktail.id}
                  cocktail={cocktail}
                  isSelected={selectedCocktail === cocktail.id}
                  canMake={canMakeCocktail(cocktail)}
                  onSelect={() => setSelectedCocktail(cocktail.id)}
                  onImageEdit={() => handleImageEditClick(cocktail.id)}
                  onDelete={() => handleDeleteClick(cocktail.id)}
                  showEditButtons={false}
                />
              ))}
            </div>

            {/* Paginierung unten */}
            {virginTotalPages > 1 && (
              <div className="flex justify-center items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setVirginCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={virginCurrentPage === 1}
                  className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-white">
                  Seite {virginCurrentPage} von {virginTotalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setVirginCurrentPage((prev) => Math.min(virginTotalPages, prev + 1))}
                  disabled={virginCurrentPage === virginTotalPages}
                  className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))]"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === "quick-shot" && <QuickShotSelector pumpConfig={pumpConfig} />}

        {activeTab === "levels" && (
          <IngredientLevels
            ingredientLevels={ingredientLevels}
            onUpdate={loadIngredientLevels}
            availableIngredients={getAvailableIngredientsFromCocktails()}
          />
        )}

        {activeTab === "cleaning" && <PumpCleaning pumpConfig={pumpConfig} />}

        {activeTab === "calibration" && !isCalibrationLocked && (
          <PumpCalibration pumpConfig={pumpConfig} onConfigUpdate={loadPumpConfig} />
        )}
      </div>

      {/* Cocktail-Auswahl und Zubereitung */}
      {selectedCocktailData && (
        <div className="fixed bottom-0 left-0 right-0 bg-[hsl(var(--cocktail-card-bg))] border-t border-[hsl(var(--cocktail-card-border))] p-4">
          <div className="max-w-4xl mx-auto">
            {!isMaking && !showSuccess && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{selectedCocktailData.name}</h3>
                    <p className="text-sm text-gray-300">{selectedCocktailData.description}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedCocktailData.recipe.map((item) => {
                        const level = ingredientLevels.find((l) => l.ingredientId === item.ingredientId)
                        const hasEnough = level && level.currentAmount >= item.amount
                        return (
                          <Badge
                            key={item.ingredientId}
                            variant={hasEnough ? "default" : "destructive"}
                            className={hasEnough ? "bg-green-600" : "bg-red-600"}
                          >
                            {getIngredientName(item.ingredientId)}: {item.amount}ml
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <ShotSelector selectedSize={selectedSize} onSizeChange={setSelectedSize} />
                  <Button
                    onClick={handleMakeCocktail}
                    disabled={!canMakeCocktail(selectedCocktailData)}
                    className="bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))] disabled:opacity-50"
                  >
                    Zubereiten
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedCocktail(null)}
                    className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))]"
                  >
                    Abbrechen
                  </Button>
                </div>
              </div>
            )}

            {isMaking && (
              <div className="text-center">
                <div className="mb-2">
                  <h3 className="text-lg font-semibold text-white">{statusMessage}</h3>
                </div>
                <Progress value={progress} className="w-full mb-2" />
                <p className="text-sm text-gray-300">{progress}% abgeschlossen</p>
              </div>
            )}

            {showSuccess && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Check className="h-6 w-6 text-green-500" />
                  <h3 className="text-lg font-semibold text-green-500">Cocktail fertig!</h3>
                </div>
                <p className="text-sm text-gray-300">Ihr {selectedCocktailData.name} ist bereit zum Genießen!</p>
              </div>
            )}

            {errorMessage && (
              <Alert className="mt-4 border-red-500 bg-red-500/10">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-400">{errorMessage}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordSuccess}
      />

      <RecipeEditor
        isOpen={showRecipeEditor}
        onClose={() => setShowRecipeEditor(false)}
        cocktails={cocktailsData}
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
        onClose={() => {
          setShowDeleteConfirmation(false)
          setCocktailToDelete(null)
        }}
        onConfirm={handleDeleteConfirm}
        cocktailName={cocktailToDelete?.name || ""}
      />

      <ImageEditor
        isOpen={showImageEditor}
        onClose={() => {
          setShowImageEditor(false)
          setCocktailToEdit(null)
        }}
        cocktailId={cocktailToEdit}
        cocktails={cocktailsData}
        onSave={handleImageSave}
      />
    </div>
  )
}
