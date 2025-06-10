"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Cocktail } from "@/types/cocktail"

interface CocktailCardProps {
  cocktail: Cocktail
  onClick: () => void
}

export default function CocktailCard({ cocktail, onClick }: CocktailCardProps) {
  const [imageError, setImageError] = useState(false)

  // Einfache Bildpfad-Verarbeitung
  let imagePath = cocktail.image || ""

  // Wenn es ein Platzhalter ist oder kein Bild, verwende Platzhalter
  if (!imagePath || imagePath.startsWith("/placeholder")) {
    imagePath = `/placeholder.svg?height=300&width=300&query=${encodeURIComponent(cocktail.name)}`
  }

  // Stelle sicher, dass der Pfad mit / beginnt
  if (imagePath && !imagePath.startsWith("/") && !imagePath.startsWith("http")) {
    imagePath = `/${imagePath}`
  }

  const handleImageError = () => {
    console.error(`Bild konnte nicht geladen werden: ${imagePath}`)
    setImageError(true)
  }

  const finalImageSrc = imageError
    ? `/placeholder.svg?height=300&width=300&query=${encodeURIComponent(cocktail.name)}`
    : imagePath

  return (
    <Card
      className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer bg-black border-[hsl(var(--cocktail-card-border))] hover:border-[hsl(var(--cocktail-primary))]/50"
      onClick={onClick}
    >
      <div className="relative aspect-square overflow-hidden">
        {/* Debug-Info (nur in Development) */}
        {process.env.NODE_ENV === "development" && (
          <div className="absolute top-0 left-0 bg-black/80 text-white text-xs p-1 z-10 max-w-full">
            <div className="truncate">Src: {finalImageSrc}</div>
          </div>
        )}

        <img
          src={finalImageSrc || "/placeholder.svg"}
          alt={cocktail.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
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
