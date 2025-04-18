"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { pumpConfig as initialPumpConfig } from "@/data/pump-config"
import CocktailCard from "@/components/cocktail-card"
import PumpCalibration from "@/components/pump-calibration"
import PumpCleaning from "@/components/pump-cleaning"
import IngredientLevels from "@/components/ingredient-levels"
import ShotSelector from "@/components/shot-selector"
import { makeCocktail, getPumpConfig, saveRecipe, deleteRecipe, getAllCocktails } from "@/lib/cocktail-machine"
import { AlertCircle, Check, Edit, Plus, AlertTriangle, GlassWater, Wine } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
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

  // Filtere Cocktails nach alkoholisch und nicht-alkoholisch
  const alcoholicCocktails = cocktailsData.filter((cocktail) => cocktail.alcoholic)
  const virginCocktails = cocktailsData.filter((cocktail) => !cocktail.alcoholic)

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

  const handleEditClick = (cocktailId: string) => {
    setCocktailToEdit(cocktailId)
    setShowPasswordModal(true)
  }

  const handlePasswordSuccess = () => {
    setShowPasswordModal(false)
    setShowRecipeEditor(true)
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

  // Gemeinsame Komponente für die Cocktail-Anzeige
  const CocktailDisplay = ({ cocktails }: { cocktails: Cocktail[] }) => (
    <>
      {isMaking ? (
        <Card className="border-[hsl(var(--cocktail-card-border))] bg-white">
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
            <div className="space-y-4">
              <CocktailCard
                cocktail={cocktailsData.find((c) => c.id === selectedCocktail)!}
                selected={true}
                onClick={() => {}}
              />

              <div className="flex justify-end mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEditClick(selectedCocktail)
                  }}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Rezept bearbeiten
                </Button>
              </div>

              <Card className="border-[hsl(var(--cocktail-card-border))] bg-white">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Cocktailgröße wählen:</h3>
                    <RadioGroup
                      value={selectedSize.toString()}
                      onValueChange={(value) => setSelectedSize(Number.parseInt(value))}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="200" id="size-200" />
                        <Label htmlFor="size-200">200ml</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="300" id="size-300" />
                        <Label htmlFor="size-300">300ml</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="400" id="size-400" />
                        <Label htmlFor="size-400">400ml</Label>
                      </div>
                    </RadioGroup>

                    <div className="text-xs text-[hsl(var(--cocktail-text-muted))] mt-2">
                      Originalrezept: ca. {getCurrentVolume()}ml
                    </div>
                  </div>
                </CardContent>
              </Card>

              {!checkIngredientsAvailable() && (
                <Alert className="bg-[hsl(var(--cocktail-error))]/10 border-[hsl(var(--cocktail-error))]/30">
                  <AlertCircle className="h-4 w-4 text-[hsl(var(--cocktail-error))]" />
                  <AlertDescription className="text-[hsl(var(--cocktail-error))]">
                    Nicht genügend Zutaten vorhanden! Bitte fülle die Zutaten nach.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button className="flex-1" variant="outline" onClick={() => setSelectedCocktail(null)}>
                  Abbrechen
                </Button>
                <Button className="flex-1" onClick={handleMakeCocktail} disabled={!checkIngredientsAvailable()}>
                  Cocktail zubereiten
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Verfügbare Cocktails</h2>
                <Button
                  onClick={() => setShowRecipeCreator(true)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Neues Rezept
                </Button>
              </div>

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

              <div className="grid grid-cols-3 gap-3">
                {cocktails.map((cocktail) => (
                  <CocktailCard
                    key={cocktail.id}
                    cocktail={cocktail}
                    onClick={() => setSelectedCocktail(cocktail.id)}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </>
  )

  return (
    <div className="h-screen flex flex-col bg-[hsl(var(--cocktail-bg))] text-[hsl(var(--cocktail-text))]">
      <header className="p-4 border-b border-[hsl(var(--cocktail-card-border))] flex justify-center items-center bg-white shadow-sm">
        <h1 className="text-2xl font-bold text-[hsl(var(--cocktail-primary))]">CocktailBot</h1>
      </header>

      <main className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="mx-4 mt-2 justify-start bg-white border border-[hsl(var(--cocktail-card-border))] tabs-list">
            <TabsTrigger value="cocktails" className="flex items-center gap-1">
              <Wine className="h-4 w-4" />
              Cocktails
            </TabsTrigger>
            <TabsTrigger value="virgin-cocktails" className="flex items-center gap-1">
              <GlassWater className="h-4 w-4" />
              Virgin Cocktails
            </TabsTrigger>
            <TabsTrigger value="shots">Shots</TabsTrigger>
            <TabsTrigger value="levels">Füllstände</TabsTrigger>
            <TabsTrigger value="calibration">Pumpenkalibrierung</TabsTrigger>
            <TabsTrigger value="cleaning">Reinigung</TabsTrigger>
          </TabsList>

          <TabsContent value="cocktails" className="flex-1 overflow-auto p-4 space-y-4 touch-pan-y">
            <CocktailDisplay cocktails={alcoholicCocktails} />
          </TabsContent>

          <TabsContent value="virgin-cocktails" className="flex-1 overflow-auto p-4 space-y-4 touch-pan-y">
            <CocktailDisplay cocktails={virginCocktails} />
          </TabsContent>

          <TabsContent value="shots" className="flex-1 overflow-auto p-4 space-y-4 touch-pan-y">
            <Card className="border-[hsl(var(--cocktail-card-border))] bg-white mb-4">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <GlassWater className="h-6 w-6 text-[hsl(var(--cocktail-primary))]" />
                  <h2 className="text-xl font-semibold">Shots (40ml)</h2>
                </div>
                <p className="text-[hsl(var(--cocktail-text-muted))]">
                  Wähle eine Zutat aus, um einen 40ml Shot zuzubereiten.
                </p>
              </CardContent>
            </Card>

            <ShotSelector
              pumpConfig={pumpConfig}
              ingredientLevels={ingredientLevels}
              onShotComplete={loadIngredientLevels}
            />
          </TabsContent>

          <TabsContent value="levels" className="flex-1 overflow-auto p-4 touch-pan-y">
            <IngredientLevels pumpConfig={pumpConfig} />
          </TabsContent>

          <TabsContent value="calibration" className="flex-1 overflow-auto p-4 touch-pan-y">
            <PumpCalibration pumpConfig={pumpConfig} />
          </TabsContent>

          <TabsContent value="cleaning" className="flex-1 overflow-auto p-4 touch-pan-y">
            <PumpCleaning pumpConfig={pumpConfig} />
          </TabsContent>
        </Tabs>
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
