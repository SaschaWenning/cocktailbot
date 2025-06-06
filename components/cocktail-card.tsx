"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2, Edit } from "lucide-react"
import type { Cocktail } from "@/types/cocktail"

interface CocktailCardProps {
  cocktail: Cocktail
  onClick: () => void
  onDelete?: (id: string) => void
  onEdit?: (id: string) => void
}

export default function CocktailCard({ cocktail, onClick, onDelete, onEdit }: CocktailCardProps) {
  const [imageError, setImageError] = useState(false)
  const [imageSrc, setImageSrc] = useState<string>("")

  // Reset image error when cocktail changes
  useEffect(() => {
    setImageError(false)

    // Normalisiere den Bildpfad
    let normalizedPath = cocktail.image || ""

    // Wenn es ein Platzhalter ist, behalte ihn
    if (normalizedPath.startsWith("/placeholder")) {
      setImageSrc(normalizedPath)
      return
    }

    // Stelle sicher, dass der Pfad mit / beginnt
    if (normalizedPath && !normalizedPath.startsWith("/") && !normalizedPath.startsWith("http")) {
      normalizedPath = `/${normalizedPath}`
    }

    // Entferne URL-Parameter
    normalizedPath = normalizedPath.split("?")[0]

    // Wenn der Pfad mit /images beginnt, versuche ihn direkt zu verwenden
    if (normalizedPath.startsWith("/images")) {
      setImageSrc(normalizedPath)
    }
    // Wenn der Pfad mit einem absoluten Pfad beginnt (z.B. /home/pi/...)
    else if (normalizedPath.startsWith("/") && normalizedPath.includes("/", 1)) {
      // Verwende die Image-API
      setImageSrc(`/api/image?path=${encodeURIComponent(normalizedPath)}`)
    }
    // Sonst verwende den Pfad direkt
    else {
      setImageSrc(normalizedPath)
    }

    console.log(`CocktailCard: Normalisierter Bildpfad für ${cocktail.name}: ${normalizedPath} -> ${imageSrc}`)
  }, [cocktail])

  const handleImageError = () => {
    console.log(`CocktailCard: Bildfehler für ${cocktail.name}: ${imageSrc}`)
    setImageError(true)
  }

  const placeholderImage = `/placeholder.svg?height=300&width=300&query=${encodeURIComponent(cocktail.name)}`
  const finalImageSrc = imageError ? placeholderImage : imageSrc || placeholderImage

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer bg-black border-[hsl(var(--cocktail-card-border))] hover:border-[hsl(var(--cocktail-primary))]/50">
      <div className="relative aspect-square overflow-hidden" onClick={onClick}>
        <img
          src={finalImageSrc || "/placeholder.svg"}
          alt={cocktail.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badge */}
        <Badge className="absolute top-3 right-3 bg-[hsl(var(--cocktail-primary))] text-black font-medium shadow-lg">
          {cocktail.alcoholic ? "Alkoholisch" : "Alkoholfrei"}
        </Badge>

        {/* Action Buttons - erscheinen beim Hover */}
        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          {onEdit && (
            <Button
              variant="secondary"
              size="sm"
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-black shadow-lg"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(cocktail.id)
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              className="h-8 w-8 p-0 shadow-lg"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(cocktail.id)
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <CardContent className="p-4" onClick={onClick}>
        <div className="space-y-2">
          <h3 className="font-bold text-lg text-[hsl(var(--cocktail-text))] line-clamp-1 group-hover:text-[hsl(var(--cocktail-primary))] transition-colors duration-200">
            {cocktail.name}
          </h3>
          <p className="text-sm text-[hsl(var(--cocktail-text-muted))] line-clamp-2 leading-relaxed">
            {cocktail.description}
          </p>

          {/* Zutaten-Vorschau */}
          <div className="flex flex-wrap gap-1 mt-2">
            {cocktail.recipe.slice(0, 3).map((item, index) => (
              <span
                key={index}
                className="text-xs bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text-muted))] px-2 py-1 rounded-full border border-[hsl(var(--cocktail-card-border))]"
              >
                {item.amount}ml
              </span>
            ))}
            {cocktail.recipe.length > 3 && (
              <span className="text-xs text-[hsl(var(--cocktail-text-muted))] px-2 py-1">
                +{cocktail.recipe.length - 3} weitere
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
