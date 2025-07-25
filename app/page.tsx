"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { pumpConfig as initialPumpConfig } from "@/data/pump-config"
import { makeCocktail, getPumpConfig, saveRecipe, deleteRecipe, getAllCocktails } from "@/lib/cocktail-machine"
import { AlertCircle, Edit, ChevronLeft, ChevronRight, Trash2, Check, Plus, Lock } from "lucide-react"
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
import CocktailStats from "@/components/cocktail-stats"
import { incrementCocktailCount, resetCocktailStats } from "@/lib/cocktail-stats-service"

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
  const [isCalibrationLocked, setIsCalibrationLocked] = useState(true)
  const [passwordAction, setPasswordAction] = useState<"edit" | "calibration" | "stats">("edit")
  const [showImageEditor, setShowImageEditor] = useState(false)
  const [showStatsReset, setShowStatsReset] = useState(false)

  // Kiosk-Modus Exit Zähler
  const [kioskExitClicks, setKioskExitClicks] = useState(0)
  const [lastClickTime, setLastClickTime] = useState(0)

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

  // Berechne alle verfügbaren Zutaten aus den Cocktail-Rezepten
  const getAvailableIngredientsFromCocktails = () => {
    const allIngredients = new Set<string>()
    cocktailsData.forEach((cocktail) => {
      cocktail.recipe.forEach((item) => {
        allIngredients.add(item.ingredientId)
      })
    })
    return Array.from(allIngredients)
  }

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

  const handleStatsResetRequest = () => {
    setPasswordAction("stats")
    setShowPasswordModal(true)
  }

  const handleStatsReset = async () => {
    try {
      await resetCocktailStats()
      // Hier könntest du eine Toast-Nachricht anzeigen
    } catch (error) {
      console.error("Fehler beim Zurücksetzen der Statistiken:", error)
    }
  }

  const handlePasswordSuccess = () => {
    setShowPasswordModal(false)
    if (passwordAction === "edit") {
      setShowRecipeEditor(true)
    } else if (passwordAction === "calibration") {
      setIsCalibrationLocked(false)
      setActiveTab("calibration")
    } else if (passwordAction === "stats") {
      handleStatsReset()
    }
  }

  const handleImageSave = async (updatedCocktail: Cocktail) => {
    try {
      await saveRecipe(updatedCocktail)

      // Aktualisiere die lokale Liste
      setCocktailsData((prev) => prev.map((c) => (c.id === updatedCocktail.id ? updatedCocktail : c)))

      // Aktualisiere auch die Füllstände für neue Zutaten
      await loadIngredientLevels()
    } catch (error) {
      console.error("Fehler beim Speichern des Bildes:", error)
    }
  }

  const handleRecipeSave = async (updatedCocktail: Cocktail) => {
    try {
      await saveRecipe(updatedCocktail)

      // Aktualisiere die lokale Liste
      setCocktailsData((prev) => prev.map((c) => (c.id === updatedCocktail.id ? updatedCocktail : c)))

      // Aktualisiere auch die Füllstände für neue Zutaten
      await loadIngredientLevels()
    } catch (error) {
      console.error("Fehler beim Speichern des Rezepts:", error)
    }
  }

  const handleNewRecipeSave = async (newCocktail: Cocktail) => {
    try {
      await saveRecipe(newCocktail)

      // Füge den neuen Cocktail zur lokalen Liste hinzu
      setCocktailsData((prev) => [...prev, newCocktail])

      // Aktualisiere auch die Füllstände für neue Zutaten
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
      // Lade die aktuellste Pumpenkonfiguration
      const currentPumpConfig = await getPumpConfig()

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

      // Starte den Cocktail-Herstellungsprozess mit der gewählten Größe und der aktuellen Pumpenkonfiguration
      await makeCocktail(cocktail, currentPumpConfig, selectedSize)

      // Nach dem erfolgreichen makeCocktail Aufruf, vor setProgress(100):
      await incrementCocktailCount(cocktail.id, cocktail.name)

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

  // Tab-Wechsel Handler - schließt automatisch die Cocktail-Detailansicht
  const handleTabChange = (newTab: string) => {
    setSelectedCocktail(null) // Schließe die Cocktail-Detailansicht
    setActiveTab(newTab)
  }

  // Funktion zum Beenden des Kiosk-Modus
  const handleExitKiosk = async () => {
    try {
      const response = await fetch("/api/exit-kiosk", {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Kiosk-Modus wird beendet",
          description: "Die Anwendung wird in wenigen Sekunden geschlossen.",
        })
      } else {
        toast({
          title: "Fehler",
          description: "Kiosk-Modus konnte nicht beendet werden.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Fehler beim Beenden des Kiosk-Modus:", error)
      toast({
        title: "Fehler",
        description: "Verbindungsproblem beim Beenden des Kiosk-Modus.",
        variant: "destructive",
      })
    }
  }

  // Handler für Klicks auf den Titel
  const handleTitleClick = () => {
    const currentTime = Date.now()

    // Wenn mehr als 3 Sekunden seit dem letzten Klick vergangen sind, setze den Zähler zurück
    if (currentTime - lastClickTime > 3000 && kioskExitClicks > 0) {
      setKioskExitClicks(1)
    } else {
      setKioskExitClicks((prev) => prev + 1)
    }

    setLastClickTime(currentTime)

    // Nach 5 Klicks den Kiosk-Modus beenden
    if (kioskExitClicks + 1 >= 5) {
      handleExitKiosk()
      setKioskExitClicks(0)
    }
  }

  // Erweiterte Bildlogik für Cocktail-Detail
  const findDetailImagePath = async (cocktail: Cocktail): Promise<string> => {
    if (!cocktail.image) {
      return `/placeholder.svg?height=400&width=400&query=${encodeURIComponent(cocktail.name)}`
    }

    // Extrahiere den Dateinamen aus dem Pfad
    const filename = cocktail.image.split("/").pop() || cocktail.image
    const filenameWithoutExt = filename.replace(/\.[^/.]+$/, "") // Entferne Dateierweiterung
    const originalExt = filename.split(".").pop()?.toLowerCase() || ""

    // Alle gängigen Bildformate
    const imageExtensions = ["jpg", "jpeg", "png", "webp", "gif", "bmp", "svg"]

    // Verwende originale Erweiterung zuerst, dann alle anderen
    const extensionsToTry = originalExt
      ? [originalExt, ...imageExtensions.filter((ext) => ext !== originalExt)]
      : imageExtensions

    // Verschiedene Basispfade für alkoholische und alkoholfreie Cocktails
    const basePaths = [
      "/images/cocktails/", // Alkoholische Cocktails
      "/", // Alkoholfreie Cocktails (direkt im public/)
      "", // Ohne Pfad
      "/public/images/cocktails/", // Vollständiger Pfad
      "/public/", // Public Verzeichnis
    ]

    const strategies: string[] = []

    // Generiere alle Kombinationen von Pfaden und Dateierweiterungen
    for (const basePath of basePaths) {
      for (const ext of extensionsToTry) {
        strategies.push(`${basePath}${filenameWithoutExt}.${ext}`)
      }
      // Auch den originalen Dateinamen probieren
      strategies.push(`${basePath}${filename}`)
    }

    // Zusätzliche spezielle Strategien
    strategies.push(
      // Originaler Pfad
      cocktail.image,
      // Ohne führenden Slash
      cocktail.image.startsWith("/") ? cocktail.image.substring(1) : cocktail.image,
      // Mit führendem Slash
      cocktail.image.startsWith("/") ? cocktail.image : `/${cocktail.image}`,
      // API-Pfad als Fallback
      `/api/image?path=${encodeURIComponent(`/home/pi/cocktailbot/cocktailbot-main/public/images/cocktails/${filename}`)}`,
      `/api/image?path=${encodeURIComponent(`/home/pi/cocktailbot/cocktailbot-main/public/${filename}`)}`,
    )

    // Entferne Duplikate
    const uniqueStrategies = [...new Set(strategies)]

    console.log(
      `Testing ${uniqueStrategies.length} detail image strategies for ${cocktail.name}:`,
      uniqueStrategies.slice(0, 10),
    )

    for (let i = 0; i < uniqueStrategies.length; i++) {
      const testPath = uniqueStrategies[i]

      try {
        const img = new Image()
        img.crossOrigin = "anonymous" // Für CORS

        const loadPromise = new Promise<boolean>((resolve) => {
          img.onload = () => resolve(true)
          img.onerror = () => resolve(false)
        })

        img.src = testPath
        const success = await loadPromise

        if (success) {
          console.log(`✅ Found working detail image for ${cocktail.name}: ${testPath}`)
          return testPath
        }
      } catch (error) {
        // Fehler ignorieren und nächste Strategie versuchen
      }
    }

    // Fallback auf Platzhalter
    console.log(`❌ No working detail image found for ${cocktail.name}, using placeholder`)
    return `/placeholder.svg?height=400&width=400&query=${encodeURIComponent(cocktail.name)}`
  }

  // Neue Komponente für die Cocktail-Detailansicht
  function CocktailDetail({ cocktail }: { cocktail: Cocktail }) {
    const [detailImageSrc, setDetailImageSrc] = useState<string>("")

    useEffect(() => {
      const loadDetailImage = async () => {
        const imagePath = await findDetailImagePath(cocktail)
        setDetailImageSrc(imagePath)
      }

      loadDetailImage()
    }, [cocktail])

    const handleDetailImageError = () => {
      const placeholder = `/placeholder.svg?height=400&width=400&query=${encodeURIComponent(cocktail.name)}`
      setDetailImageSrc(placeholder)
    }

    const availableSizes = [200, 300, 400]

    return (
      <Card className="overflow-hidden transition-all bg-black border-[hsl(var(--cocktail-card-border))] ring-2 ring-[hsl(var(--cocktail-primary))] shadow-2xl">
        <div className="flex flex-col md:flex-row">
          <div className="relative w-full md:w-1/3 aspect-square md:aspect-auto">
            <img
              src={detailImageSrc || "/placeholder.svg"}
              alt={cocktail.name}
              className="w-full h-full object-cover"
              onError={handleDetailImageError}
              crossOrigin="anonymous"
              key={`${cocktail.image}-${detailImageSrc}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
          <div className="flex-1 p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-2xl text-[hsl(var(--cocktail-text))]">{cocktail.name}</h3>
              <Badge
                variant={cocktail.alcoholic ? "default" : "default"}
                className="text-sm bg-[hsl(var(--cocktail-primary))] text-black px-3 py-1"
              >
                {cocktail.alcoholic ? "Alkoholisch" : "Alkoholfrei"}
              </Badge>
            </div>
            <div className="flex flex-col md:flex-row gap-6 flex-1">
              <div className="md:w-1/2">
                <p className="text-base text-[hsl(var(--cocktail-text-muted))] mb-6 leading-relaxed">
                  {cocktail.description}
                </p>
                <div>
                  <h4 className="text-lg font-semibold mb-3 text-[hsl(var(--cocktail-text))]">Zutaten:</h4>
                  <ul className="space-y-2 text-[hsl(var(--cocktail-text))]">
                    {cocktail.ingredients.map((ingredient, index) => (
                      <li key={index} className="flex items-start bg-[hsl(var(--cocktail-card-bg))]/50 p-2 rounded-lg">
                        <span className="mr-2 text-[hsl(var(--cocktail-primary))]">•</span>
                        <span>{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="md:w-1/2 flex flex-col">
                <div className="space-y-4 mb-6">
                  <h4 className="text-lg mb-3 text-[hsl(var(--cocktail-text))]">Cocktailgröße wählen:</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {availableSizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`py-3 px-4 rounded-lg transition-all duration-200 font-medium ${
                          selectedSize === size
                            ? "bg-[hsl(var(--cocktail-primary))] text-black shadow-lg scale-105"
                            : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] hover:bg-[hsl(var(--cocktail-card-border))] hover:scale-102"
                        }`}
                      >
                        {size}ml
                      </button>
                    ))}
                  </div>
                  <div className="text-sm text-[hsl(var(--cocktail-text-muted))] bg-[hsl(var(--cocktail-card-bg))]/30 p-2 rounded">
                    Originalrezept: ca. {getCurrentVolume()}ml
                  </div>
                </div>
                {!checkIngredientsAvailable() && (
                  <Alert className="bg-[hsl(var(--cocktail-error))]/10 border-[hsl(var(--cocktail-error))]/30 mb-6">
                    <AlertCircle className="h-4 w-4 text-[hsl(var(--cocktail-error))]" />
                    <AlertDescription className="text-[hsl(var(--cocktail-error))] text-sm">
                      Nicht genügend Zutaten vorhanden! Bitte fülle die Zutaten nach.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="flex flex-col gap-3 mt-auto">
                  <Button
                    onClick={handleMakeCocktail}
                    disabled={!checkIngredientsAvailable()}
                    className="w-full py-3 text-lg bg-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] text-black font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Cocktail zubereiten ({selectedSize}ml)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedCocktail(null)}
                    className="w-full py-2 bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
                  >
                    Zurück zur Übersicht
                  </Button>
                </div>
                <div className="flex justify-between mt-4 gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleImageEditClick(cocktail.id)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                    Bild ändern
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex items-center gap-2 shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteClick(cocktail.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Löschen
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  // Paginierungskomponente
  function PaginationComponent({
    currentPage,
    totalPages,
    onPageChange,
  }: {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
  }) {
    return (
      <div className="flex justify-center items-center gap-3 mt-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-10 w-10 p-0 bg-[hsl(var(--cocktail-primary))] text-black border-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] disabled:opacity-50 disabled:bg-[hsl(var(--cocktail-card-bg))] disabled:text-[hsl(var(--cocktail-text))] disabled:border-[hsl(var(--cocktail-card-border))] shadow-lg"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="text-sm font-medium text-[hsl(var(--cocktail-text))] bg-[hsl(var(--cocktail-card-bg))] px-4 py-2 rounded-lg border border-[hsl(var(--cocktail-card-border))]">
          Seite {currentPage} von {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-10 w-10 p-0 bg-[hsl(var(--cocktail-primary))] text-black border-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] disabled:opacity-50 disabled:bg-[hsl(var(--cocktail-card-bg))] disabled:text-[hsl(var(--cocktail-text))] disabled:border-[hsl(var(--cocktail-card-border))] shadow-lg"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    )
  }

  // Hauptinhalt basierend auf dem ausgewählten Tab
  const renderContent = () => {
    // Wenn ein Cocktail ausgewählt ist, zeige die Detailansicht
    if (selectedCocktail) {
      const cocktail = cocktailsData.find((c) => c.id === selectedCocktail)
      if (!cocktail) return null

      if (isMaking) {
        return (
          <Card className="border-[hsl(var(--cocktail-card-border))] bg-black text-[hsl(var(--cocktail-text))] shadow-2xl">
            <div className="p-8 space-y-6">
              <h2 className="text-2xl font-semibold text-center">{statusMessage}</h2>
              <Progress value={progress} className="h-3 rounded-full" />

              {errorMessage && (
                <Alert className="bg-[hsl(var(--cocktail-error))]/10 border-[hsl(var(--cocktail-error))]/30">
                  <AlertCircle className="h-4 w-4 text-[hsl(var(--cocktail-error))]" />
                  <AlertDescription className="text-[hsl(var(--cocktail-error))]">{errorMessage}</AlertDescription>
                </Alert>
              )}

              {showSuccess && (
                <div className="flex justify-center">
                  <div className="rounded-full bg-[hsl(var(--cocktail-success))]/20 p-4 shadow-lg">
                    <Check className="h-12 w-12 text-[hsl(var(--cocktail-success))]" />
                  </div>
                </div>
              )}
            </div>
          </Card>
        )
      }

      return <CocktailDetail cocktail={cocktail} />
    }

    // Sonst zeige den Inhalt basierend auf dem aktiven Tab
    switch (activeTab) {
      case "cocktails":
        return (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-[hsl(var(--cocktail-text))]">Cocktails mit Alkohol</h2>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowRecipeCreator(true)}
                className="bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))] shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                Neues Rezept
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentPageCocktails.map((cocktail) => (
                <CocktailCard key={cocktail.id} cocktail={cocktail} onClick={() => setSelectedCocktail(cocktail.id)} />
              ))}
            </div>

            {totalPages > 1 && (
              <PaginationComponent currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            )}
          </div>
        )
      case "virgin":
        return (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-[hsl(var(--cocktail-text))]">Alkoholfreie Cocktails</h2>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowRecipeCreator(true)}
                className="bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))] shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                Neues Rezept
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentPageVirginCocktails.map((cocktail) => (
                <CocktailCard key={cocktail.id} cocktail={cocktail} onClick={() => setSelectedCocktail(cocktail.id)} />
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
            availableIngredients={getAvailableIngredientsFromCocktails()}
          />
        )
      case "quickshots":
        return (
          <QuickShotSelector
            pumpConfig={pumpConfig}
            ingredientLevels={ingredientLevels}
            onShotComplete={loadIngredientLevels}
          />
        )
      case "levels":
        return <IngredientLevels pumpConfig={pumpConfig} onLevelsUpdated={loadIngredientLevels} />
      case "cleaning":
        return <PumpCleaning pumpConfig={pumpConfig} />
      case "calibration":
        return isCalibrationLocked ? (
          <div className="text-center py-12">
            <div className="bg-[hsl(var(--cocktail-card-bg))] rounded-2xl p-8 max-w-md mx-auto shadow-2xl border border-[hsl(var(--cocktail-card-border))]">
              <Lock className="h-16 w-16 mx-auto mb-6 text-[hsl(var(--cocktail-warning))]" />
              <h2 className="text-2xl font-semibold mb-4 text-[hsl(var(--cocktail-text))]">
                Kalibrierung ist passwortgeschützt
              </h2>
              <p className="text-[hsl(var(--cocktail-text-muted))] mb-6 leading-relaxed">
                Bitte gib das Passwort ein, um die Pumpenkalibrierung zu bearbeiten.
              </p>
              <Button
                onClick={handleCalibrationClick}
                className="bg-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] text-black font-semibold py-3 px-6 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Passwort eingeben
              </Button>
            </div>
          </div>
        ) : (
          <PumpCalibration pumpConfig={pumpConfig} onConfigUpdate={loadPumpConfig} />
        )
      case "stats":
        return <CocktailStats onResetRequest={handleStatsResetRequest} />
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <header className="mb-8">
        <h1
          className="text-4xl font-bold text-center text-[hsl(var(--cocktail-text))] mb-2 cursor-pointer"
          onClick={handleTitleClick}
        >
          CocktailBot
        </h1>
        <p className="text-center text-[hsl(var(--cocktail-text-muted))]">Dein persönlicher Cocktail-Assistent</p>
      </header>

      <div className="mb-8">
        <nav className="tabs-list">
          <div className="flex overflow-x-auto space-x-3 pb-2">
            <Button
              onClick={() => handleTabChange("cocktails")}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
                activeTab === "cocktails"
                  ? "bg-[hsl(var(--cocktail-primary))] text-black scale-105"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] hover:bg-[hsl(var(--cocktail-card-border))] hover:scale-102"
              }`}
            >
              Cocktails
            </Button>
            <Button
              onClick={() => handleTabChange("virgin")}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
                activeTab === "virgin"
                  ? "bg-[hsl(var(--cocktail-primary))] text-black scale-105"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] hover:bg-[hsl(var(--cocktail-card-border))] hover:scale-102"
              }`}
            >
              Alkoholfrei
            </Button>
            <Button
              onClick={() => handleTabChange("shots")}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
                activeTab === "shots"
                  ? "bg-[hsl(var(--cocktail-primary))] text-black scale-105"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] hover:bg-[hsl(var(--cocktail-card-border))] hover:scale-102"
              }`}
            >
              Shots
            </Button>
            <Button
              onClick={() => handleTabChange("quickshots")}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
                activeTab === "quickshots"
                  ? "bg-[hsl(var(--cocktail-primary))] text-black scale-105"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] hover:bg-[hsl(var(--cocktail-card-border))] hover:scale-102"
              }`}
            >
              Entlüften
            </Button>
            <Button
              onClick={() => handleTabChange("levels")}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
                activeTab === "levels"
                  ? "bg-[hsl(var(--cocktail-primary))] text-black scale-105"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] hover:bg-[hsl(var(--cocktail-card-border))] hover:scale-102"
              }`}
            >
              Füllstände
            </Button>
            <Button
              onClick={() => handleTabChange("cleaning")}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
                activeTab === "cleaning"
                  ? "bg-[hsl(var(--cocktail-primary))] text-black scale-105"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] hover:bg-[hsl(var(--cocktail-card-border))] hover:scale-102"
              }`}
            >
              Reinigung
            </Button>
            <Button
              onClick={() => handleTabChange("calibration")}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
                activeTab === "calibration"
                  ? "bg-[hsl(var(--cocktail-primary))] text-black scale-105"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] hover:bg-[hsl(var(--cocktail-card-border))] hover:scale-102"
              }`}
            >
              Kalibrierung
            </Button>
            <Button
              onClick={() => handleTabChange("stats")}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
                activeTab === "stats"
                  ? "bg-[hsl(var(--cocktail-primary))] text-black scale-105"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] hover:bg-[hsl(var(--cocktail-card-border))] hover:scale-102"
              }`}
            >
              Statistiken
            </Button>
          </div>
        </nav>
      </div>

      <main className="min-h-[60vh]">{renderContent()}</main>

      {/* Modals */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordSuccess}
        title={passwordAction === "stats" ? "Statistiken zurücksetzen" : "Passwort erforderlich"}
        description={
          passwordAction === "stats"
            ? "Bitte gib das Passwort ein, um alle Statistiken zurückzusetzen:"
            : "Bitte gib das Passwort ein, um Rezepte zu bearbeiten:"
        }
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

      <ImageEditor
        isOpen={showImageEditor}
        onClose={() => setShowImageEditor(false)}
        cocktail={cocktailToEdit ? cocktailsData.find((c) => c.id === cocktailToEdit) || null : null}
        onSave={handleImageSave}
      />
    </div>
  )
}
