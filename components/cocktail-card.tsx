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
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  useEffect(() => {
    const testImagePaths = async () => {
      setImageStatus("loading")
      const logs: string[] = []

      logs.push(`Original path: ${cocktail.image || "none"}`)

      if (!cocktail.image) {
        const placeholder = `/placeholder.svg?height=300&width=300&query=${encodeURIComponent(cocktail.name)}`
        setImageSrc(placeholder)
        setImageStatus("success")
        logs.push(`Using placeholder: ${placeholder}`)
        setDebugInfo(logs)
        return
      }

      // Extrahiere den Dateinamen aus dem Pfad
      const filename = cocktail.image.split("/").pop() || cocktail.image
      logs.push(`Extracted filename: ${filename}`)

      // Verschiedene Pfadstrategien zum Testen
      const strategies = [
        // 1. Standardpfad mit /images/cocktails/
        `/images/cocktails/${filename}`,

        // 2. Originaler Pfad
        cocktail.image,

        // 3. Ohne führenden Slash
        cocktail.image.startsWith("/") ? cocktail.image.substring(1) : cocktail.image,

        // 4. Mit führendem Slash
        cocktail.image.startsWith("/") ? cocktail.image : `/${cocktail.image}`,

        // 5. Direkter Pfad zu public
        `/public/images/cocktails/${filename}`,

        // 6. API-Pfad als Fallback
        `/api/image?path=${encodeURIComponent(`/home/pi/cocktailbot/cocktailbot-main/public/images/cocktails/${filename}`)}`,
      ]

      logs.push(`Testing ${strategies.length} strategies...`)

      for (let i = 0; i < strategies.length; i++) {
        const testPath = strategies[i]
        logs.push(`Strategy ${i + 1}: ${testPath}`)

        try {
          const img = new Image()

          const loadPromise = new Promise<boolean>((resolve) => {
            img.onload = () => {
              logs.push(`✅ Strategy ${i + 1} SUCCESS: ${testPath}`)
              resolve(true)
            }
            img.onerror = () => {
              logs.push(`❌ Strategy ${i + 1} FAILED: ${testPath}`)
              resolve(false)
            }
          })

          // Setze den Pfad und starte den Test
          img.src = testPath

          const success = await loadPromise

          if (success) {
            setImageSrc(testPath)
            setImageStatus("success")
            logs.push(`Using: ${testPath}`)
            setDebugInfo(logs)
            return
          }
        } catch (error) {
          logs.push(`❌ Strategy ${i + 1} ERROR: ${testPath}`)
        }
      }

      // Fallback auf Platzhalter
      const placeholder = `/placeholder.svg?height=300&width=300&query=${encodeURIComponent(cocktail.name)}`
      setImageSrc(placeholder)
      setImageStatus("error")
      logs.push(`All strategies failed, using placeholder: ${placeholder}`)
      setDebugInfo(logs)
    }

    testImagePaths()
  }, [cocktail.image, cocktail.name])

  return (
    <Card
      className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer bg-black border-[hsl(var(--cocktail-card-border))] hover:border-[hsl(var(--cocktail-primary))]/50"
      onClick={onClick}
    >
      <div className="relative aspect-square overflow-hidden">
        {/* Bild */}
        <img
          src={imageSrc || "/placeholder.svg"}
          alt={cocktail.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />

        {/* Debug-Info */}
        <div className="absolute top-0 left-0 bg-black/90 text-white text-xs p-2 z-10 max-w-full overflow-auto max-h-full">
          <div className="font-mono">
            <div>Status: {imageStatus}</div>
            <div className="truncate">Name: {cocktail.name}</div>
            <div className="truncate">Using: {imageSrc}</div>
            <div className="text-xs text-gray-400 mt-1">Debug:</div>
            {debugInfo.map((log, i) => (
              <div key={i} className="text-[8px] text-gray-400">
                {log}
              </div>
            ))}
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
