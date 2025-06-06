"use client"

import { useState, useEffect } from "react"
import { getAllCocktails } from "@/lib/cocktail-machine"
import type { Cocktail } from "@/types/cocktail"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugImagesPage() {
  const [cocktails, setCocktails] = useState<Cocktail[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCocktails = async () => {
      try {
        const data = await getAllCocktails()
        setCocktails(data)
        console.log("All cocktails loaded for debug:", data)
      } catch (error) {
        console.error("Error loading cocktails:", error)
      } finally {
        setLoading(false)
      }
    }

    loadCocktails()
  }, [])

  if (loading) {
    return <div className="p-8 text-white">Lade Cocktails...</div>
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <h1 className="text-3xl font-bold text-white mb-6">Debug: Cocktail-Bilder</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cocktails.map((cocktail) => (
          <Card key={cocktail.id} className="bg-black border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-lg">{cocktail.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Original Image Path */}
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-1">Original Path:</h4>
                <code className="text-xs bg-gray-800 text-green-400 p-2 rounded block break-all">
                  {cocktail.image || "KEIN PFAD"}
                </code>
              </div>

              {/* Test Image Display */}
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Bild-Test:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {/* Direct Path Test */}
                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-1">Direkt</p>
                    <img
                      src={cocktail.image || "/placeholder.svg"}
                      alt={`${cocktail.name} direct`}
                      className="w-full h-20 object-cover rounded border"
                      onError={(e) => {
                        e.currentTarget.style.border = "2px solid red"
                        e.currentTarget.title = "Fehler beim Laden"
                      }}
                      onLoad={(e) => {
                        e.currentTarget.style.border = "2px solid green"
                        e.currentTarget.title = "Erfolgreich geladen"
                      }}
                    />
                  </div>

                  {/* API Path Test */}
                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-1">API</p>
                    <img
                      src={
                        cocktail.image ? `/api/image?path=${encodeURIComponent(cocktail.image)}` : "/placeholder.svg"
                      }
                      alt={`${cocktail.name} api`}
                      className="w-full h-20 object-cover rounded border"
                      onError={(e) => {
                        e.currentTarget.style.border = "2px solid red"
                        e.currentTarget.title = "Fehler beim Laden"
                      }}
                      onLoad={(e) => {
                        e.currentTarget.style.border = "2px solid green"
                        e.currentTarget.title = "Erfolgreich geladen"
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* File System Check */}
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-1">Datei-Check:</h4>
                <FileExistsCheck filePath={cocktail.image} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function FileExistsCheck({ filePath }: { filePath: string }) {
  const [exists, setExists] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)

  const checkFile = async () => {
    if (!filePath) {
      setExists(false)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/image?path=${encodeURIComponent(filePath)}`)
      setExists(response.ok)
    } catch (error) {
      setExists(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkFile()
  }, [filePath])

  if (loading) {
    return <span className="text-xs text-yellow-400">Prüfe...</span>
  }

  if (exists === null) {
    return <span className="text-xs text-gray-400">Unbekannt</span>
  }

  return (
    <span className={`text-xs ${exists ? "text-green-400" : "text-red-400"}`}>
      {exists ? "✅ Datei existiert" : "❌ Datei nicht gefunden"}
    </span>
  )
}
