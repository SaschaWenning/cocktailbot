"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"
import PumpCleaning from "@/components/pump-cleaning"
import PumpCalibration from "@/components/pump-calibration"
import IngredientLevels from "@/components/ingredient-levels"
import QuickShotSelector from "@/components/quick-shot-selector"
import PasswordModal from "@/components/password-modal"
import { IngredientManager } from "@/components/ingredient-manager"
import type { PumpConfig } from "@/types/pump"
import type { IngredientLevel } from "@/types/ingredient-level"

interface ServiceMenuProps {
  pumpConfig: PumpConfig[]
  ingredientLevels: IngredientLevel[]
  onLevelsUpdated: () => void
  onConfigUpdate: () => void
  onShotComplete: () => void
  availableIngredients: string[]
}

export default function ServiceMenu({
  pumpConfig,
  ingredientLevels,
  onLevelsUpdated,
  onConfigUpdate,
  onShotComplete,
  availableIngredients,
}: ServiceMenuProps) {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [activeServiceTab, setActiveServiceTab] = useState("fuellstaende")

  const handlePasswordSuccess = () => {
    setShowPasswordModal(false)
    setIsUnlocked(true)
  }

  const handleUnlockClick = () => {
    setShowPasswordModal(true)
  }

  if (!isUnlocked) {
    return (
      <>
        <div className="text-center py-12">
          <div className="bg-[hsl(var(--cocktail-card-bg))] rounded-2xl p-8 max-w-md mx-auto shadow-2xl border border-[hsl(var(--cocktail-card-border))]">
            <Lock className="h-16 w-16 mx-auto mb-6 text-[hsl(var(--cocktail-warning))]" />
            <h2 className="text-2xl font-semibold mb-4 text-[hsl(var(--cocktail-text))]">
              Servicemenü ist passwortgeschützt
            </h2>
            <p className="text-[hsl(var(--cocktail-text-muted))] mb-6 leading-relaxed">
              Bitte gib das Passwort ein, um das Servicemenü zu öffnen.
            </p>
            <Button
              onClick={handleUnlockClick}
              className="bg-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] text-black font-semibold py-3 px-6 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Passwort eingeben
            </Button>
          </div>
        </div>

        <PasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          onSuccess={handlePasswordSuccess}
        />
      </>
    )
  }

  const renderServiceContent = () => {
    switch (activeServiceTab) {
      case "entlueften":
        return (
          <QuickShotSelector
            pumpConfig={pumpConfig}
            ingredientLevels={ingredientLevels}
            onShotComplete={onShotComplete}
          />
        )
      case "fuellstaende":
        return <IngredientLevels pumpConfig={pumpConfig} onLevelsUpdated={onLevelsUpdated} />
      case "reinigung":
        return <PumpCleaning pumpConfig={pumpConfig} />
      case "kalibrierung":
        return <PumpCalibration pumpConfig={pumpConfig} onConfigUpdate={onConfigUpdate} />
      case "zutaten":
        return <IngredientManager onClose={() => setActiveServiceTab("fuellstaende")} />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[hsl(var(--cocktail-text))]">Servicemenü</h2>
        <Button
          variant="outline"
          onClick={() => setIsUnlocked(false)}
          className="bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
        >
          <Lock className="h-4 w-4 mr-2" />
          Sperren
        </Button>
      </div>

      <div className="mb-6">
        <nav className="service-tabs-list">
          <div className="flex overflow-x-auto space-x-3 pb-2">
            <Button
              onClick={() => setActiveServiceTab("entlueften")}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
                activeServiceTab === "entlueften"
                  ? "bg-[#00ff00] text-black scale-105"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] hover:bg-[hsl(var(--cocktail-card-border))] hover:scale-102"
              }`}
            >
              Entlüften
            </Button>
            <Button
              onClick={() => setActiveServiceTab("fuellstaende")}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
                activeServiceTab === "fuellstaende"
                  ? "bg-[#00ff00] text-black scale-105"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] hover:bg-[hsl(var(--cocktail-card-border))] hover:scale-102"
              }`}
            >
              Füllstände
            </Button>
            <Button
              onClick={() => setActiveServiceTab("reinigung")}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
                activeServiceTab === "reinigung"
                  ? "bg-[#00ff00] text-black scale-105"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] hover:bg-[hsl(var(--cocktail-card-border))] hover:scale-102"
              }`}
            >
              Reinigung
            </Button>
            <Button
              onClick={() => setActiveServiceTab("kalibrierung")}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
                activeServiceTab === "kalibrierung"
                  ? "bg-[#00ff00] text-black scale-105"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] hover:bg-[hsl(var(--cocktail-card-border))] hover:scale-102"
              }`}
            >
              Kalibrierung
            </Button>
            <Button
              onClick={() => setActiveServiceTab("zutaten")}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
                activeServiceTab === "zutaten"
                  ? "bg-[#00ff00] text-black scale-105"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] hover:bg-[hsl(var(--cocktail-card-border))] hover:scale-102"
              }`}
            >
              Zutaten
            </Button>
          </div>
        </nav>
      </div>

      <div className="min-h-[60vh]">{renderServiceContent()}</div>
    </div>
  )
}
