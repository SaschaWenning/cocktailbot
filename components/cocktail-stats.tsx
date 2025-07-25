"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BarChart3, Trophy, Calendar, RotateCcw, Trash2, AlertCircle } from "lucide-react"
import {
  getCocktailStats,
  resetSingleCocktailStat,
  getTotalCocktailCount,
  getTopCocktails,
} from "@/lib/cocktail-stats-service"
import type { CocktailStat } from "@/lib/cocktail-stats-service"

interface CocktailStatsProps {
  onResetRequest: () => void
}

export default function CocktailStats({ onResetRequest }: CocktailStatsProps) {
  const [stats, setStats] = useState<CocktailStat[]>([])
  const [topCocktails, setTopCocktails] = useState<CocktailStat[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  const loadStats = async () => {
    setLoading(true)
    try {
      const [allStats, topStats, total] = await Promise.all([
        getCocktailStats(),
        getTopCocktails(5),
        getTotalCocktailCount(),
      ])

      setStats(allStats)
      setTopCocktails(topStats)
      setTotalCount(total)
    } catch (error) {
      console.error("Fehler beim Laden der Statistiken:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  const handleResetSingle = async (cocktailId: string) => {
    try {
      await resetSingleCocktailStat(cocktailId)
      await loadStats()
    } catch (error) {
      console.error("Fehler beim Zurücksetzen der Statistik:", error)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("de-DE", {
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
      {/* Header mit Gesamtstatistiken */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-black border-[hsl(var(--cocktail-card-border))]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[hsl(var(--cocktail-text))]">Gesamt zubereitet</CardTitle>
            <BarChart3 className="h-4 w-4 text-[hsl(var(--cocktail-primary))]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[hsl(var(--cocktail-primary))]">{totalCount}</div>
            <p className="text-xs text-[hsl(var(--cocktail-text-muted))]">Cocktails insgesamt</p>
          </CardContent>
        </Card>

        <Card className="bg-black border-[hsl(var(--cocktail-card-border))]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[hsl(var(--cocktail-text))]">
              Verschiedene Cocktails
            </CardTitle>
            <Trophy className="h-4 w-4 text-[hsl(var(--cocktail-primary))]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[hsl(var(--cocktail-primary))]">{stats.length}</div>
            <p className="text-xs text-[hsl(var(--cocktail-text-muted))]">Verschiedene Rezepte</p>
          </CardContent>
        </Card>

        <Card className="bg-black border-[hsl(var(--cocktail-card-border))]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[hsl(var(--cocktail-text))]">
              Beliebtester Cocktail
            </CardTitle>
            <Trophy className="h-4 w-4 text-[hsl(var(--cocktail-primary))]" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-[hsl(var(--cocktail-primary))] truncate">
              {topCocktails[0]?.cocktailName || "Noch keine"}
            </div>
            <p className="text-xs text-[hsl(var(--cocktail-text-muted))]">{topCocktails[0]?.count || 0}x zubereitet</p>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 Cocktails */}
      {topCocktails.length > 0 && (
        <Card className="bg-black border-[hsl(var(--cocktail-card-border))]">
          <CardHeader>
            <CardTitle className="text-[hsl(var(--cocktail-text))] flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[hsl(var(--cocktail-primary))]" />
              Top 5 Beliebteste Cocktails
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCocktails.map((stat, index) => (
                <div
                  key={stat.cocktailId}
                  className="flex items-center justify-between p-3 bg-[hsl(var(--cocktail-card-bg))]/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[hsl(var(--cocktail-primary))] border-[hsl(var(--cocktail-primary))]"
                    >
                      {index + 1}
                    </Badge>
                    <div>
                      <div className="font-medium text-[hsl(var(--cocktail-text))]">{stat.cocktailName}</div>
                      <div className="text-sm text-[hsl(var(--cocktail-text-muted))]">
                        Zuletzt: {formatDate(stat.lastMade)}
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-[hsl(var(--cocktail-primary))] text-black">{stat.count}x</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alle Statistiken */}
      <Card className="bg-black border-[hsl(var(--cocktail-card-border))]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-[hsl(var(--cocktail-text))] flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[hsl(var(--cocktail-primary))]" />
            Alle Cocktail-Statistiken
          </CardTitle>
          <Button onClick={onResetRequest} variant="destructive" size="sm" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Alle zurücksetzen
          </Button>
        </CardHeader>
        <CardContent>
          {stats.length === 0 ? (
            <Alert className="bg-[hsl(var(--cocktail-card-bg))]/30 border-[hsl(var(--cocktail-card-border))]">
              <AlertCircle className="h-4 w-4 text-[hsl(var(--cocktail-text-muted))]" />
              <AlertDescription className="text-[hsl(var(--cocktail-text-muted))]">
                Noch keine Cocktails zubereitet. Die Statistiken werden angezeigt, sobald du deinen ersten Cocktail
                zubereitest.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {stats.map((stat) => (
                <div
                  key={stat.cocktailId}
                  className="flex items-center justify-between p-4 bg-[hsl(var(--cocktail-card-bg))]/30 rounded-lg hover:bg-[hsl(var(--cocktail-card-bg))]/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-[hsl(var(--cocktail-text))]">{stat.cocktailName}</h3>
                      <Badge className="bg-[hsl(var(--cocktail-primary))] text-black font-semibold">
                        {stat.count}x
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[hsl(var(--cocktail-text-muted))]">
                      <Calendar className="h-4 w-4" />
                      Zuletzt zubereitet: {formatDate(stat.lastMade)}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleResetSingle(stat.cocktailId)}
                    variant="outline"
                    size="sm"
                    className="ml-4 bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
                  >
                    <Trash2 className="h-4 w-4" />
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
