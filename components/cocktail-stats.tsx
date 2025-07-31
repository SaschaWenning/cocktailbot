"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { BarChart3, Trophy, Calendar, RotateCcw, Trash2 } from "lucide-react"
import { type CocktailStat, CocktailStatsService } from "@/lib/cocktail-stats-service"

interface CocktailStatsProps {
  onPasswordRequired: (action: () => void) => void
}

export function CocktailStats({ onPasswordRequired }: CocktailStatsProps) {
  const [stats, setStats] = useState<CocktailStat[]>([])
  const [totalStats, setTotalStats] = useState({
    totalCocktails: 0,
    uniqueCocktails: 0,
    mostPopular: null as CocktailStat | null,
  })
  const [loading, setLoading] = useState(true)

  const loadStats = async () => {
    try {
      const statsService = CocktailStatsService.getInstance()
      const [cocktailStats, totals] = await Promise.all([statsService.getStats(), statsService.getTotalStats()])
      setStats(cocktailStats)
      setTotalStats(totals)
    } catch (error) {
      console.error("Error loading stats:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  const handleResetCocktail = async (cocktailId: string) => {
    try {
      const statsService = CocktailStatsService.getInstance()
      await statsService.resetCocktailStats(cocktailId)
      await loadStats()
    } catch (error) {
      console.error("Error resetting cocktail stats:", error)
    }
  }

  const handleResetAllStats = async () => {
    try {
      const statsService = CocktailStatsService.getInstance()
      await statsService.resetAllStats()
      await loadStats()
    } catch (error) {
      console.error("Error resetting all stats:", error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Lade Statistiken...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Gesamtstatistiken */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamt Cocktails</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalCocktails}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verschiedene Cocktails</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.uniqueCocktails}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Beliebtester</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">{totalStats.mostPopular?.name || "Keine Daten"}</div>
            {totalStats.mostPopular && (
              <div className="text-sm text-muted-foreground">{totalStats.mostPopular.count}x zubereitet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reset Button */}
      <div className="flex justify-end">
        <Button
          variant="destructive"
          onClick={() => onPasswordRequired(handleResetAllStats)}
          disabled={stats.length === 0}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Alle Statistiken zurücksetzen
        </Button>
      </div>

      <Separator />

      {/* Top 5 Cocktails */}
      {stats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Top 5 Cocktails
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.slice(0, 5).map((stat, index) => (
                <div key={stat.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Badge variant={index === 0 ? "default" : "secondary"}>#{index + 1}</Badge>
                    <span className="font-medium">{stat.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{stat.count}x</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detaillierte Statistiken */}
      <Card>
        <CardHeader>
          <CardTitle>Alle Cocktail-Statistiken</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Noch keine Cocktails zubereitet</div>
          ) : (
            <div className="space-y-3">
              {stats.map((stat) => (
                <div key={stat.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{stat.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <BarChart3 className="w-4 h-4" />
                        {stat.count}x zubereitet
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Zuletzt: {formatDate(stat.lastMade)}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleResetCocktail(stat.id)}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Reset
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
