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
  const [imageSrc, setImageSrc] = useState<string>("")
  const [imageStatus, setImageStatus] = useState<"loading" | "success" | "error">("loading")

  useEffect(() => {
    const findWorkingImagePath = async () => {
      setImageStatus("loading")

      if (!cocktail.image) {
        const placeholder = `/placeholder.svg?height=300&width=300&query=${encodeURIComponent(cocktail.name)}`
        setImageSrc(placeholder)
        setImageStatus("success")
        return
      }

      // Extrahiere den Dateinamen aus dem Pfad
      const filename = cocktail.image.split("/").pop() || cocktail.image

      // Verschiedene Pfadstrategien zum Testen
      const strategies = [
        // 1. Originaler Pfad (funktioniert für beide Ordner)
        cocktail.image,
        // 2. Standardpfad mit /images/cocktails/ (für alkoholische)
        `/images/cocktails/${filename}`,
        // 3. Pfad für alkoholfreie Cocktails
        `/images/cocktails/alkoholfrei/${filename}`,
        // 4. Ohne führenden Slash
        cocktail.image.startsWith("/") ? cocktail.image.substring(1) : cocktail.image,
        // 5. Mit führendem Slash
        cocktail.image.startsWith("/") ? cocktail.image : `/${cocktail.image}`,
        // 6. Direkter Pfad zu public
        `/public/images/cocktails/${filename}`,
        // 7. Direkter Pfad zu public alkoholfrei
        `/public/images/cocktails/alkoholfrei/${filename}`,
        // 8. API-Pfad als Fallback für alkoholische
        `/api/image?path=${encodeURIComponent(`/home/pi/cocktailbot/cocktailbot-main/public/images/cocktails/${filename}`)}`,
        // 9. API-Pfad als Fallback für alkoholfreie
        `/api/image?path=${encodeURIComponent(`/home/pi/cocktailbot/cocktailbot-main/public/images/cocktails/alkoholfrei/${filename}`)}`,
      ]

      for (let i = 0; i < strategies.length; i++) {
        const testPath = strategies[i]

        try {
          const img = new Image()

          const loadPromise = new Promise<boolean>((resolve) => {
            img.onload = () => resolve(true)
            img.onerror = () => resolve(false)
          })

          img.src = testPath
          const success = await loadPromise

          if (success) {
            setImageSrc(testPath)
            setImageStatus("success")
            return
          }
        } catch (error) {
          // Fehler ignorieren und nächste Strategie versuchen
        }
      }

      // Fallback auf Platzhalter
      const placeholder = `/placeholder.svg?height=300&width=300&query=${encodeURIComponent(cocktail.name)}`
      setImageSrc(placeholder)
      setImageStatus("error")
    }

    findWorkingImagePath()
  }, [cocktail.image, cocktail.name])

  return (
    <Card
      className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer bg-black border-[hsl(var(--cocktail-card-border))] hover:border-[hsl(var(--cocktail-primary))]/50"
      onClick={onClick}
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={imageSrc || "/placeholder.svg"}
          alt={cocktail.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
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
