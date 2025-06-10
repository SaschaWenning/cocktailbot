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

      // Da wir wissen, dass /home/pi/cocktailbot/cocktailbot-main/public/images/cocktails/ funktioniert,
      // extrahieren wir nur den Dateinamen und verwenden den korrekten Web-Pfad
      const filename = cocktail.image.split("/").pop() || cocktail.image

      // Der korrekte Web-Pfad für Next.js
      const correctWebPath = `/images/cocktails/${filename}`

      console.log(`🔍 [${cocktail.name}] Original: ${cocktail.image} → Using: ${correctWebPath}`)

      // Teste den korrekten Pfad
      try {
        const img = new Image()

        const loadPromise = new Promise<boolean>((resolve) => {
          img.onload = () => {
            console.log(`✅ [${cocktail.name}] Image loaded successfully: ${correctWebPath}`)
            resolve(true)
          }
          img.onerror = () => {
            console.log(`❌ [${cocktail.name}] Image failed to load: ${correctWebPath}`)
            resolve(false)
          }
          img.src = correctWebPath
        })

        const success = await loadPromise

        if (success) {
          setImageSrc(correctWebPath)
          setImageStatus("success")
        } else {
          // Fallback auf Platzhalter
          const placeholder = `/placeholder.svg?height=300&width=300&query=${encodeURIComponent(cocktail.name)}`
          setImageSrc(placeholder)
          setImageStatus("error")
        }
      } catch (error) {
        console.log(`❌ [${cocktail.name}] Error testing image: ${correctWebPath}`, error)
        const placeholder = `/placeholder.svg?height=300&width=300&query=${encodeURIComponent(cocktail.name)}`
        setImageSrc(placeholder)
        setImageStatus("error")
      }
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

        {/* Debug-Info */}
        <div className="absolute bottom-0 left-0 bg-black/90 text-white text-xs p-1 z-10 max-w-full">
          <div className="font-mono text-xs">
            <div>Status: {imageStatus}</div>
            <div className="truncate">File: {cocktail.image?.split("/").pop()}</div>
            <div className="truncate">Web: {imageSrc}</div>
          </div>
        </div>

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
