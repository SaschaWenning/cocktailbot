"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Cocktail } from "@/types/cocktail"

interface CocktailCardProps {
  cocktail: Cocktail
  onClick: () => void
}

export default function CocktailCard({ cocktail, onClick }: CocktailCardProps) {
  const [imageError, setImageError] = useState(false)
  const [imageSrc, setImageSrc] = useState<string>("")
  const [debugInfo, setDebugInfo] = useState<string>("")

  useEffect(() => {
    const determineImageSrc = async () => {
      setImageError(false)

      const originalPath = cocktail.image || ""
      let finalSrc = ""
      let debug = `Original: "${originalPath}"`

      // Wenn kein Bild angegeben, verwende Platzhalter
      if (!originalPath) {
        finalSrc = `/placeholder.svg?height=300&width=300&query=${encodeURIComponent(cocktail.name)}`
        debug += ` → Placeholder (no image)`
        setImageSrc(finalSrc)
        setDebugInfo(debug)
        return
      }

      // Verschiedene Pfadstrategien ausprobieren
      const strategies = [
        // 1. Direkter Pfad (falls schon korrekt)
        originalPath,

        // 2. Nur Dateiname mit /images/cocktails/
        `/images/cocktails/${originalPath.split("/").pop()}`,

        // 3. Relativer Pfad von public/
        originalPath.startsWith("/") ? originalPath : `/${originalPath}`,

        // 4. Image API für absolute Pfade
        originalPath.startsWith("/") && originalPath.includes("/", 1)
          ? `/api/image?path=${encodeURIComponent(originalPath)}`
          : null,
      ].filter(Boolean) as string[]

      // Teste jede Strategie
      for (let i = 0; i < strategies.length; i++) {
        const testSrc = strategies[i]
        debug += ` → Strategy ${i + 1}: "${testSrc}"`

        try {
          const response = await fetch(testSrc, { method: "HEAD" })
          if (response.ok) {
            finalSrc = testSrc
            debug += ` ✅`
            break
          } else {
            debug += ` ❌(${response.status})`
          }
        } catch (error) {
          debug += ` ❌(fetch error)`
        }
      }

      // Fallback auf Platzhalter
      if (!finalSrc) {
        finalSrc = `/placeholder.svg?height=300&width=300&query=${encodeURIComponent(cocktail.name)}`
        debug += ` → Final: Placeholder`
      } else {
        debug += ` → Final: "${finalSrc}"`
      }

      setImageSrc(finalSrc)
      setDebugInfo(debug)
      console.log(`[${cocktail.name}] ${debug}`)
    }

    determineImageSrc()
  }, [cocktail.image, cocktail.name])

  const handleImageError = () => {
    console.error(`[${cocktail.name}] Image load failed: ${imageSrc}`)
    setImageError(true)
  }

  const handleImageLoad = () => {
    console.log(`[${cocktail.name}] Image loaded successfully: ${imageSrc}`)
  }

  const finalImageSrc = imageError
    ? `/placeholder.svg?height=300&width=300&query=${encodeURIComponent(cocktail.name)}`
    : imageSrc

  return (
    <Card
      className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer bg-black border-[hsl(var(--cocktail-card-border))] hover:border-[hsl(var(--cocktail-primary))]/50"
      onClick={onClick}
    >
      <div className="relative aspect-square overflow-hidden">
        {/* Debug-Info */}
        <div className="absolute top-0 left-0 bg-black/90 text-white text-xs p-2 z-10 max-w-full">
          <div className="font-mono text-xs break-all">{debugInfo}</div>
        </div>

        <img
          src={finalImageSrc || "/placeholder.svg"}
          alt={cocktail.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badge */}
        <Badge className="absolute top-3 right-3 bg-[hsl(var(--cocktail-primary))] text-black font-medium shadow-lg">
          {cocktail.alcoholic ? "Alkoholisch" : "Alkoholfrei"}
        </Badge>
      </div>

      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="font-bold text-lg text-[hsl(var(--cocktail-text))] line-clamp-1 group-hover:text-[hsl(var(--cocktail-primary))] transition-colors duration-200">
            {cocktail.name}
          </h3>
          <p className="text-sm text-[hsl(var(--cocktail-text-muted))] line-clamp-2 leading-relaxed">
            {cocktail.description}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
