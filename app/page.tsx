"use client"

import { useState } from "react"

import { Wine, Zap, Gauge, BookOpen, Settings, Droplets, BarChart3 } from "lucide-react"
import { CocktailStats } from "@/components/cocktail-stats"
import { toast } from "sonner"
import { makeCocktailAction } from "@/app/actions/cocktail" // Import the new server action

const Page = () => {
  const [activeTab, setActiveTab] = useState("cocktails")
  const [isLoading, setIsLoading] = useState(false)

  const handlePasswordRequired = (callback: () => void) => {
    // Password handling logic here
    // For now, just execute the callback directly
    callback()
  }

  // This function now calls the server action
  const makeCocktail = async (cocktailId: string, cocktailName: string) => {
    setIsLoading(true)
    try {
      const result = await makeCocktailAction(cocktailId, cocktailName)

      if (result.success) {
        toast({
          title: "Cocktail zubereitet!",
          description: result.message,
        })
      } else {
        toast({
          title: "Fehler",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error in makeCocktail:", error)
      toast({
        title: "Fehler",
        description: "Unbekannter Fehler beim Zubereiten",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: "cocktails", label: "Cocktails", icon: Wine },
    { id: "shots", label: "Shots", icon: Zap },
    { id: "levels", label: "Füllstände", icon: Gauge },
    { id: "stats", label: "Statistiken", icon: BarChart3 },
    { id: "recipes", label: "Rezepte", icon: BookOpen },
    { id: "calibration", label: "Kalibrierung", icon: Settings },
    { id: "cleaning", label: "Reinigung", icon: Droplets },
  ]

  return (
    <div>
      {/* Tab navigation here */}
      <div className="flex justify-around p-4 bg-gray-100 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center p-2 rounded-md transition-colors ${
              activeTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-gray-200"
            }`}
          >
            <tab.icon className="w-6 h-6" />
            <span className="text-xs mt-1">{tab.label}</span>
          </button>
        ))}
      </div>
      {/* Main content area here */}
      <div className="p-4">
        {activeTab === "cocktails" && <div>{/* Cocktail list here */}</div>}
        {activeTab === "shots" && <div>{/* Shot list here */}</div>}
        {activeTab === "levels" && <div>{/* Level display here */}</div>}
        {activeTab === "stats" && <CocktailStats onPasswordRequired={handlePasswordRequired} />}
        {activeTab === "recipes" && <div>{/* Recipe list here */}</div>}
        {activeTab === "calibration" && <div>{/* Calibration settings here */}</div>}
        {activeTab === "cleaning" && <div>{/* Cleaning instructions here */}</div>}
      </div>
    </div>
  )
}

export default Page
