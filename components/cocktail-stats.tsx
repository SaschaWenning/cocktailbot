"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Trophy, Calendar, RotateCcw, Trash2 } from "lucide-react"
import { getCocktailStats, getTotalStats, resetCocktailCount } from "@/lib/cocktail-stats-service"

interface CocktailStat {
  cocktailId: string
  cocktailName: string
  count: number
  lastMade: string
}

interface CocktailStatsProps {
  onResetRequest: () => void
}

export default function CocktailStats({ onResetRequest }: CocktailStatsProps) {
  const [stats, setStats] = useState<CocktailStat[]>([])
  const [totalStats, setTotalStats] = useState({
    totalCocktails: 0,
    uniqueCocktails: 0,
    mostPopular: null as CocktailStat | null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      const [cocktailStats, totals] = await Promise.all([getCocktailStats(), getTotalStats()])
      setStats(cocktailStats)
      setTotalStats(totals)
    } catch (error) {
      console.error("Fehler beim Laden der Statistiken:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleResetSingle = async (cocktailId: string) => {
    try {
      await resetCocktailCount(cocktailId)
      await loadStats() // Lade Statistiken neu
    } catch (error) {
      console.error("Fehler beim Zurücksetzen der Statistik:", error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-[hsl(var(--cocktail-text))]">Lade Statistiken...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[hsl(var(--cocktail-text))] flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Cocktail-Statistiken
        </h2>
        <Button onClick={onResetRequest} variant="destructive" className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          Alle zurücksetzen
        </Button>
      </div>

      {/* Gesamtstatistiken */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[hsl(var(--cocktail-text-muted))]">
              Gesamt zubereitet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[hsl(var(--cocktail-primary))]">{totalStats.totalCocktails}</div>
          </CardContent>
        </Card>

        <Card className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[hsl(var(--cocktail-text-muted))]">
              Verschiedene Cocktails
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[hsl(var(--cocktail-primary))]">{totalStats.uniqueCocktails}</div>
          </CardContent>
        </Card>

        <Card className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[hsl(var(--cocktail-text-muted))] flex items-center gap-1">
              <Trophy className="h-4 w-4" />
              Beliebtester
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-[hsl(var(--cocktail-primary))]">
              {totalStats.mostPopular ? totalStats.mostPopular.cocktailName : "Noch keine"}
            </div>
            {totalStats.mostPopular && (
              <div className="text-sm text-[hsl(var(--cocktail-text-muted))]">
                {totalStats.mostPopular.count}x zubereitet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top 5 Cocktails */}
      {stats.length > 0 && (
        <Card className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))]">
          <CardHeader>
            <CardTitle className="text-[hsl(var(--cocktail-text))] flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[hsl(var(--cocktail-primary))]" />
              Top 5 Cocktails
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.slice(0, 5).map((stat, index) => (
                <div
                  key={stat.cocktailId}
                  className="flex items-center justify-between p-3 bg-[hsl(var(--cocktail-card-bg))]/50 rounded-lg border border-[hsl(var(--cocktail-card-border))]"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0
                          ? "bg-yellow-500 text-black border-yellow-500"
                          : index === 1
                            ? "bg-gray-400 text-black border-gray-400"
                            : index === 2
                              ? "bg-orange-600 text-white border-orange-600"
                              : "bg-[hsl(var(--cocktail-card-border))] text-[hsl(var(--cocktail-text))]"
                      }`}
                    >
                      {index + 1}
                    </Badge>
                    <div>
                      <div className="font-medium text-[hsl(var(--cocktail-text))]">{stat.cocktailName}</div>
                      <div className="text-sm text-[hsl(var(--cocktail-text-muted))] flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Zuletzt: {formatDate(stat.lastMade)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-[hsl(var(--cocktail-primary))] text-black">{stat.count}x</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResetSingle(stat.cocktailId)}
                      className="h-8 w-8 p-0 bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))] hover:bg-red-500 hover:border-red-500 hover:text-white"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alle Cocktails */}
      {stats.length > 5 && (
        <Card className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))]">
          <CardHeader>
            <CardTitle className="text-[hsl(var(--cocktail-text))]">Alle Cocktails ({stats.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {stats.slice(5).map((stat) => (
                <div
                  key={stat.cocktailId}
                  className="flex items-center justify-between p-2 bg-[hsl(var(--cocktail-card-bg))]/30 rounded border border-[hsl(var(--cocktail-card-border))]/50"
                >
                  <div>
                    <div className="font-medium text-[hsl(var(--cocktail-text))] text-sm">{stat.cocktailName}</div>
                    <div className="text-xs text-[hsl(var(--cocktail-text-muted))]">{formatDate(stat.lastMade)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {stat.count}x
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResetSingle(stat.cocktailId)}
                      className="h-6 w-6 p-0 bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))] hover:bg-red-500 hover:border-red-500 hover:text-white"
                    >
                      <Trash2 className="h-2 w-2" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Keine Statistiken */}
      {stats.length === 0 && (
        <Card className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))]">
          <CardContent className="text-center py-12">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-[hsl(var(--cocktail-text-muted))]" />
            <h3 className="text-lg font-medium text-[hsl(var(--cocktail-text))] mb-2">Noch keine Statistiken</h3>
            <p className="text-[hsl(var(--cocktail-text-muted))]">
              Bereite deinen ersten Cocktail zu, um Statistiken zu sehen!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
