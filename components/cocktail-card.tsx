"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import type { Cocktail } from "@/types/cocktail"

interface CocktailCardProps {
  cocktail: Cocktail
  isSelected?: boolean
  canMake?: boolean
  onSelect?: () => void
  onImageEdit?: () => void
  onDelete?: () => void
  showEditButtons?: boolean
}

export default function CocktailCard({
  cocktail,
  isSelected = false,
  canMake = true,
  onSelect,
  onImageEdit,
  onDelete,
  showEditButtons = false,
}: CocktailCardProps) {
  const [imageSrc, setImageSrc] = useState<string>("")
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    const loadImage = async () => {
      if (!cocktail.image) {
        setImageSrc(`/placeholder.svg?height=200&width=300&text=${encodeURIComponent(cocktail.name)}`)
        return
      }

      // Verschiedene Bildpfade testen
      const imagePaths = [
        cocktail.image,
        `/images/cocktails/${cocktail.image.split("/").pop()}`,
        `/${cocktail.image.split("/").pop()}`,
        `/public${cocktail.image}`,
        `/api/image?path=${encodeURIComponent(cocktail.image)}`,
      ]

      for (const path of imagePaths) {
        try {
          const img = new Image()
          img.crossOrigin = "anonymous"

          const loadPromise = new Promise<boolean>((resolve) => {
            img.onload = () => resolve(true)
            img.onerror = () => resolve(false)
          })

          img.src = path
          const success = await loadPromise

          if (success) {
            setImageSrc(path)
            setImageError(false)
            return
          }
        } catch (error) {
          continue
        }
      }

      // Fallback zu Platzhalter
      setImageSrc(`/placeholder.svg?height=200&width=300&text=${encodeURIComponent(cocktail.name)}`)
      setImageError(true)
    }

    loadImage()
  }, [cocktail.image, cocktail.name])

  const handleImageError = () => {
    if (!imageError) {
      setImageError(true)
      setImageSrc(`/placeholder.svg?height=200&width=300&text=${encodeURIComponent(cocktail.name)}`)
    }
  }

  return (
    <Card
      className={`overflow-hidden transition-all cursor-pointer hover:shadow-lg ${
        isSelected
          ? "ring-2 ring-[hsl(var(--cocktail-primary))] bg-[hsl(var(--cocktail-card-bg))]/80"
          : "bg-[hsl(var(--cocktail-card-bg))] hover:bg-[hsl(var(--cocktail-card-bg))]/80"
      } border-[hsl(var(--cocktail-card-border))]`}
      onClick={onSelect}
    >
      <div className="relative">
        <img
          src={imageSrc || "/placeholder.svg"}
          alt={cocktail.name}
          className="w-full h-48 object-cover"
          onError={handleImageError}
          crossOrigin="anonymous"
        />
        <div className="absolute top-2 right-2">
          <Badge
            variant={cocktail.alcoholic ? "default" : "secondary"}
            className={cocktail.alcoholic ? "bg-[hsl(var(--cocktail-primary))] text-black" : "bg-green-600 text-white"}
          >
            {cocktail.alcoholic ? "Alkoholisch" : "Alkoholfrei"}
          </Badge>
        </div>
        {!canMake && (
          <div className="absolute top-2 left-2">
            <Badge variant="destructive" className="bg-red-600 text-white">
              Zutaten fehlen
            </Badge>
          </div>
        )}
        {showEditButtons && (
          <div className="absolute bottom-2 right-2 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="bg-white/90 text-black border-white/90 hover:bg-white"
              onClick={(e) => {
                e.stopPropagation()
                onImageEdit?.()
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="bg-red-600/90 text-white border-red-600/90 hover:bg-red-600"
              onClick={(e) => {
                e.stopPropagation()
                onDelete?.()
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2 text-[hsl(var(--cocktail-text))]">{cocktail.name}</h3>
        <p className="text-sm text-[hsl(var(--cocktail-text-muted))] mb-3 line-clamp-2">{cocktail.description}</p>
        <div className="flex flex-wrap gap-1">
          {cocktail.ingredients.slice(0, 3).map((ingredient, index) => (
            <Badge
              key={index}
              variant="outline"
              className="text-xs bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))]"
            >
              {ingredient}
            </Badge>
          ))}
          {cocktail.ingredients.length > 3 && (
            <Badge
              variant="outline"
              className="text-xs bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))]"
            >
              +{cocktail.ingredients.length - 3} weitere
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
