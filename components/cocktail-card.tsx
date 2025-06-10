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
  const [imageLoadStatus, setImageLoadStatus] = useState<"loading" | "success" | "error">("loading")

  // Reset image error when cocktail changes
  useEffect(() => {
    setImageError(false)
    setImageLoadStatus("loading")

    let imagePath = cocktail.image || ""

    // Wenn kein Bild oder Platzhalter, verwende Platzhalter
    if (!imagePath || imagePath.startsWith("/placeholder")) {
      const placeholder = `/placeholder.svg?height=300&width=300&query=${encodeURIComponent(cocktail.name)}`
      setImageSrc(placeholder)
      setImageLoadStatus("success")
      return
    }

    // Normalisiere den Pfad
    if (!imagePath.startsWith("/") && !imagePath.startsWith("http")) {
      imagePath = `/${imagePath}`
    }

    // Verwende den Pfad direkt
    setImageSrc(imagePath)
  }, [cocktail])

  const handleImageLoad = () => {
    console.log(`✅ [${cocktail.name}] Image loaded successfully:`, imageSrc)
    setImageLoadStatus("success")
  }

  const handleImageError = () => {
    console.log(`❌ [${cocktail.name}] Image failed to load:`, imageSrc)
    setImageError(true)
    setImageLoadStatus("error")
  }

  const placeholderImage = `/placeholder.svg?height=300&width=300&query=${encodeURIComponent(cocktail.name)}`
  const finalImageSrc = imageError ? placeholderImage : imageSrc || placeholderImage

  console.log(`🎯 [${cocktail.name}] Final display source:`, finalImageSrc)

  return (
    <Card
      className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer bg-black border-[hsl(var(--cocktail-card-border))] hover:border-[hsl(var(--cocktail-primary))]/50"
      onClick={onClick}
    >
      <div className="relative aspect-square overflow-hidden">
        {/* Debug-Info (nur in Development) */}
        {process.env.NODE_ENV === "development" && (
          <div className="absolute top-0 left-0 bg-black/80 text-white text-xs p-1 z-10 max-w-full">
            <div>Status: {imageLoadStatus}</div>
            <div className="truncate">Src: {finalImageSrc}</div>
          </div>
        )}

        <img
          src={finalImageSrc || "/placeholder.svg"}
          alt={cocktail.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />

        {/* Loading Indicator */}
        {imageLoadStatus === "loading" && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            <div className="text-white text-sm">Lädt...</div>
          </div>
        )}

        {/* Error Indicator */}
        {imageLoadStatus === "error" && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">Bild-Fehler</div>
        )}

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
