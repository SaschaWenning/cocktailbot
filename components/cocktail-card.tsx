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

  // Bildpfad-Logik von Version 56
  useEffect(() => {
    setImageError(false)

    let imagePath = cocktail.image || ""

    // Wenn kein Bild oder Platzhalter, verwende Platzhalter
    if (!imagePath || imagePath.startsWith("/placeholder")) {
      const placeholder = `/placeholder.svg?height=300&width=300&query=${encodeURIComponent(cocktail.name)}`
      setImageSrc(placeholder)
      return
    }

    // Normalisiere den Pfad
    if (!imagePath.startsWith("/") && !imagePath.startsWith("http")) {
      imagePath = `/${imagePath}`
    }

    // Entferne URL-Parameter
    imagePath = imagePath.split("?")[0]

    // Bestimme die finale URL
    let finalSrc = ""

    // Wenn der Pfad mit /images beginnt, versuche ihn direkt zu verwenden
    if (imagePath.startsWith("/images")) {
      finalSrc = imagePath
    }
    // Wenn der Pfad mit einem absoluten Pfad beginnt (z.B. /home/pi/...)
    else if (imagePath.startsWith("/") && imagePath.includes("/", 1)) {
      // Verwende die Image-API
      finalSrc = `/api/image?path=${encodeURIComponent(imagePath)}`
    }
    // HTTP/HTTPS URLs direkt verwenden
    else if (imagePath.startsWith("http")) {
      finalSrc = imagePath
    }
    // Sonst verwende den Pfad direkt
    else {
      finalSrc = imagePath
    }

    setImageSrc(finalSrc)
  }, [cocktail])

  const handleImageError = () => {
    console.log(`❌ [${cocktail.name}] Image failed to load:`, imageSrc)
    setImageError(true)
  }

  const handleImageLoad = () => {
    console.log(`✅ [${cocktail.name}] Image loaded successfully:`, imageSrc)
  }

  const placeholderImage = `/placeholder.svg?height=300&width=300&query=${encodeURIComponent(cocktail.name)}`
  const finalImageSrc = imageError ? placeholderImage : imageSrc || placeholderImage

  return (
    <Card
      className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer bg-black border-[hsl(var(--cocktail-card-border))] hover:border-[hsl(var(--cocktail-primary))]/50"
      onClick={onClick}
    >
      <div className="relative aspect-square overflow-hidden">
        {/* Debug-Info */}
        <div className="absolute top-0 left-0 bg-black/80 text-white text-xs p-1 z-10 max-w-full">
          <div>Original: {cocktail.image}</div>
          <div className="truncate">Final: {finalImageSrc}</div>
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
