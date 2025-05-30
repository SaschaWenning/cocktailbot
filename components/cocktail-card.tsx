"use client"

import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Cocktail } from "@/types/cocktail"
import { useState, useEffect } from "react"
import { Trash2, EyeOff, Edit } from "lucide-react" // Edit importiert
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CocktailCardProps {
  cocktail: Cocktail
  selected?: boolean
  onClick: () => void
  onDelete?: (id: string) => void
  onEdit?: (id: string) => void // Neue Prop für Bearbeiten
}

export default function CocktailCard({ cocktail, selected = false, onClick, onDelete, onEdit }: CocktailCardProps) {
  const [imageError, setImageError] = useState(false)
  const [imageSrc, setImageSrc] = useState<string>("")

  const placeholderImage = `/placeholder.svg?height=400&width=400&query=${encodeURIComponent(cocktail.name)}`

  useEffect(() => {
    setImageError(false)
    let src = cocktail.image || ""
    if (src && !src.startsWith("http")) {
      if (!src.startsWith("/")) {
        src = `/${src}`
      }
      src = src.split("?")[0]
    }
    setImageSrc(src)
  }, [cocktail])

  const handleImageError = () => {
    console.log(`Bild konnte nicht geladen werden: ${imageSrc}`)
    setImageError(true)
  }

  const finalImageSrc = imageError || !imageSrc ? placeholderImage : imageSrc
  const isActive = cocktail.isActive === undefined ? true : cocktail.isActive

  if (selected) {
    // Detailansicht (ausgewählt) - Bearbeiten-Button wird in CocktailDetail in app/page.tsx gehandhabt
    return (
      <Card className="overflow-hidden transition-all bg-black border-[hsl(var(--cocktail-card-border))] ring-2 ring-[hsl(var(--cocktail-primary))]">
        <div className="flex flex-col md:flex-row">
          <div className="relative w-full md:w-1/3 aspect-square md:aspect-auto">
            <Image
              src={finalImageSrc || "/placeholder.svg"}
              alt={cocktail.name}
              fill
              className="object-cover"
              onError={handleImageError}
              sizes="(max-width: 768px) 100vw, 33vw"
              priority
            />
            {!isActive && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                <EyeOff className="h-12 w-12 text-gray-400 mb-2" />
                <Badge variant="outline" className="bg-gray-700 text-white border-gray-500">
                  Deaktiviert
                </Badge>
              </div>
            )}
          </div>

          <div className="flex-1 p-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-xl text-[hsl(var(--cocktail-text))]">{cocktail.name}</h3>
              <Badge
                variant={cocktail.alcoholic ? "default" : "default"}
                className="text-xs bg-[hsl(var(--cocktail-primary))] text-black"
              >
                {cocktail.alcoholic ? "Alk" : "Alkoholfrei"}
              </Badge>
            </div>

            <p className="text-sm text-[hsl(var(--cocktail-text-muted))] mb-4">{cocktail.description}</p>

            <div>
              <h4 className="text-base font-semibold mb-2">Zutaten:</h4>
              <ul className="text-sm space-y-1 text-[hsl(var(--cocktail-text))]">
                {cocktail.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-1">•</span>
                    <span>{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  // Standard-Ansicht für nicht ausgewählte Cocktails
  return (
    <Card
      className={cn(
        "overflow-hidden transition-all bg-black border-[hsl(var(--cocktail-card-border))]",
        isActive
          ? "cursor-pointer hover:shadow-lg hover:ring-1 hover:ring-[hsl(var(--cocktail-primary))]"
          : "opacity-60 cursor-not-allowed",
      )}
      onClick={() => {
        if (!isActive) return
        onClick()
      }}
    >
      <div className="relative aspect-square w-full">
        <Image
          src={finalImageSrc || "/placeholder.svg"}
          alt={cocktail.name}
          fill
          className="object-cover"
          onError={handleImageError}
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={false}
        />
        {!isActive && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-2">
            <EyeOff className="h-8 w-8 text-gray-400 mb-1" />
            <Badge variant="outline" size="sm" className="bg-gray-800 text-gray-300 border-gray-600 text-xs">
              Deaktiviert
            </Badge>
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <div className="flex justify-between items-start">
          <h3 className={cn("font-bold text-base text-[hsl(var(--cocktail-text))]", !isActive && "text-gray-500")}>
            {cocktail.name}
          </h3>
          <div className="flex items-center gap-1">
            {onEdit && ( // Bearbeiten-Button für alle Cocktails, wenn onEdit übergeben wird
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-blue-400 hover:text-blue-300" // Andere Farbe zur Unterscheidung
                onClick={(e) => {
                  e.stopPropagation() // Verhindert Klick auf Karte
                  onEdit(cocktail.id)
                }}
                aria-label="Bearbeiten"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {cocktail.id.startsWith("custom-") && onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-[hsl(var(--cocktail-error))]"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(cocktail.id)
                }}
                aria-label="Löschen"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Badge
              variant={cocktail.alcoholic ? "default" : "default"}
              className={cn("text-xs bg-[hsl(var(--cocktail-primary))] text-black", !isActive && "opacity-50")}
            >
              {cocktail.alcoholic ? "Alk" : "Alkoholfrei"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
