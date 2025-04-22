"use client"

import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Cocktail } from "@/types/cocktail"
import { useState, useEffect } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CocktailCardProps {
  cocktail: Cocktail
  selected?: boolean
  onClick: () => void
  onDelete?: (id: string) => void
}

export default function CocktailCard({ cocktail, selected = false, onClick, onDelete }: CocktailCardProps) {
  const [imageError, setImageError] = useState(false)
  const [imageSrc, setImageSrc] = useState<string>("")

  // Generiere ein Platzhalterbild mit dem Namen des Cocktails
  const placeholderImage = `/placeholder.svg?height=400&width=400&query=${encodeURIComponent(cocktail.name)}`

  useEffect(() => {
    // Setze imageError zurück, wenn sich der Cocktail ändert
    setImageError(false)

    // Versuche, den Bildpfad zu korrigieren
    let src = cocktail.image || ""

    // Wenn das Bild ein Platzhalterbild ist, behalte es bei
    if (src.includes("placeholder")) {
      setImageSrc(src)
      return
    }

    // Für lokale Bilder, stelle sicher, dass der Pfad korrekt ist
    if (!src.startsWith("http")) {
      // Entferne eventuelle URL-Parameter
      src = src.split("?")[0]

      // Stelle sicher, dass der Pfad mit / beginnt
      if (!src.startsWith("/")) {
        src = `/${src}`
      }
    }

    console.log(`Bildpfad für ${cocktail.name}: ${src}`)
    setImageSrc(src)
  }, [cocktail])

  // Funktion zum Umschalten auf das Platzhalterbild bei Fehlern
  const handleImageError = () => {
    console.log(`Bild konnte nicht geladen werden: ${imageSrc}, verwende Platzhalter`)
    setImageError(true)
  }

  // Verwende Platzhalterbild wenn ein Fehler auftritt oder kein Bild vorhanden ist
  const finalImageSrc = imageError || !imageSrc ? placeholderImage : imageSrc

  if (selected) {
    return (
      <Card className="overflow-hidden transition-all bg-black border-[hsl(var(--cocktail-card-border))] ring-2 ring-[hsl(var(--cocktail-primary))]">
        <div className="flex flex-col md:flex-row">
          {/* Bild-Container (links auf größeren Bildschirmen) */}
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
          </div>

          {/* Inhalt-Container (rechts auf größeren Bildschirmen) */}
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

  // Standard-Ansicht für nicht ausgewählte Cocktails (unverändert)
  return (
    <Card
      className="overflow-hidden transition-all cursor-pointer hover:shadow-md bg-black border-[hsl(var(--cocktail-card-border))]"
      onClick={onClick}
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
      </div>
      <CardContent className="p-3">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-base text-[hsl(var(--cocktail-text))]">{cocktail.name}</h3>
          <div className="flex items-center gap-1">
            <Badge
              variant={cocktail.alcoholic ? "default" : "default"}
              className="text-xs bg-[hsl(var(--cocktail-primary))] text-black"
            >
              {cocktail.alcoholic ? "Alk" : "Alkoholfrei"}
            </Badge>
            {cocktail.id.startsWith("custom-") && onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-[hsl(var(--cocktail-error))]"
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
      </CardContent>
    </Card>
  )
}
