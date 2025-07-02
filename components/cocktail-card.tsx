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

      // Extract filename from path
      const filename = cocktail.image.split("/").pop() || cocktail.image
      const filenameWithoutExt = filename.replace(/\.[^/.]+$/, "") // Remove file extension
      const originalExt = filename.split(".").pop()?.toLowerCase() || ""

      // All common image formats
      const imageExtensions = ["jpg", "jpeg", "png", "webp", "gif", "bmp", "svg"]

      // Use original extension first, then all others
      const extensionsToTry = originalExt
        ? [originalExt, ...imageExtensions.filter((ext) => ext !== originalExt)]
        : imageExtensions

      // Different base paths for alcoholic and non-alcoholic cocktails
      const basePaths = [
        "/images/cocktails/", // Alcoholic cocktails
        "/", // Non-alcoholic cocktails (directly in public/)
        "", // Without path
        "/public/images/cocktails/", // Full path
        "/public/", // Public directory
      ]

      const strategies: string[] = []

      // Generate all combinations of paths and file extensions
      for (const basePath of basePaths) {
        for (const ext of extensionsToTry) {
          strategies.push(`${basePath}${filenameWithoutExt}.${ext}`)
        }
        // Also try the original filename
        strategies.push(`${basePath}${filename}`)
      }

      // Additional special strategies
      strategies.push(
        // Original path
        cocktail.image,
        // Without leading slash
        cocktail.image.startsWith("/") ? cocktail.image.substring(1) : cocktail.image,
        // With leading slash
        cocktail.image.startsWith("/") ? cocktail.image : `/${cocktail.image}`,
        // API path as fallback
        `/api/image?path=${encodeURIComponent(`/home/pi/cocktailbot/cocktailbot-main/public/images/cocktails/${filename}`)}`,
        `/api/image?path=${encodeURIComponent(`/home/pi/cocktailbot/cocktailbot-main/public/${filename}`)}`,
      )

      // Remove duplicates
      const uniqueStrategies = [...new Set(strategies)]

      console.log(
        `Testing ${uniqueStrategies.length} image strategies for ${cocktail.name}:`,
        uniqueStrategies.slice(0, 10),
      )

      for (let i = 0; i < uniqueStrategies.length; i++) {
        const testPath = uniqueStrategies[i]

        try {
          const img = new Image()
          img.crossOrigin = "anonymous" // For CORS

          const loadPromise = new Promise<boolean>((resolve) => {
            img.onload = () => resolve(true)
            img.onerror = () => resolve(false)
          })

          img.src = testPath
          const success = await loadPromise

          if (success) {
            console.log(`✅ Found working image for ${cocktail.name}: ${testPath}`)
            setImageSrc(testPath)
            setImageStatus("success")
            return
          }
        } catch (error) {
          // Ignore errors and try next strategy
        }
      }

      // Fallback to placeholder
      console.log(`❌ No working image found for ${cocktail.name}, using placeholder`)
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
          crossOrigin="anonymous"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badge */}
        <Badge className="absolute top-3 right-3 bg-[hsl(var(--cocktail-primary))] text-black font-medium shadow-lg">
          {cocktail.alcoholic ? "Alcoholic" : "Non-Alcoholic"}
        </Badge>

        {/* Debug Info (only in Development) */}
        {process.env.NODE_ENV === "development" && (
          <div className="absolute bottom-2 left-2 text-xs bg-black/70 text-white p-1 rounded">
            {imageStatus === "loading" && "🔄"}
            {imageStatus === "success" && "✅"}
            {imageStatus === "error" && "❌"}
          </div>
        )}
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
