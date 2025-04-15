"use client"

import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Cocktail } from "@/types/cocktail"
import { useState } from "react"

interface CocktailCardProps {
  cocktail: Cocktail
  selected?: boolean
  onClick: () => void
}

export default function CocktailCard({ cocktail, selected = false, onClick }: CocktailCardProps) {
  const [imageError, setImageError] = useState(false)

  // Generiere ein Platzhalterbild mit dem Namen des Cocktails
  const placeholderImage = `/placeholder.svg?height=400&width=400&query=${encodeURIComponent(cocktail.name)}`

  // Versuche, den Bildpfad zu korrigieren, falls er nicht mit / beginnt
  let imageSrc = cocktail.image
  if (imageSrc && !imageSrc.startsWith("/") && !imageSrc.startsWith("http")) {
    imageSrc = `/${imageSrc}`
  }

  // Verwende Platzhalterbild wenn ein Fehler auftritt oder kein Bild vorhanden ist
  const finalImageSrc = imageError || !imageSrc ? placeholderImage : imageSrc

  return (
    <Card
      className={`overflow-hidden transition-all cursor-pointer ${
        selected ? "ring-2 ring-[hsl(var(--cocktail-primary))]" : "hover:shadow-md"
      } bg-white border-[hsl(var(--cocktail-card-border))]`}
      onClick={onClick}
    >
      <div className={`relative aspect-square w-full ${selected ? "max-w-[30%] mx-auto" : ""}`}>
        <Image
          src={finalImageSrc || "/placeholder.svg"}
          alt={cocktail.name}
          fill
          className="object-cover"
          onError={() => setImageError(true)}
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={selected}
        />
      </div>
      <CardContent className="p-3">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-base text-[hsl(var(--cocktail-text))]">{cocktail.name}</h3>
          <Badge variant={cocktail.alcoholic ? "default" : "outline"} className="text-xs">
            {cocktail.alcoholic ? "Alk" : "Alkoholfrei"}
          </Badge>
        </div>

        {selected && (
          <>
            <p className="text-xs text-[hsl(var(--cocktail-text-muted))] mt-2">{cocktail.description}</p>

            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-1">Zutaten:</h4>
              <ul className="text-xs space-y-1 text-[hsl(var(--cocktail-text))]">
                {cocktail.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-1">•</span>
                    <span>{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
