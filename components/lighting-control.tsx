"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, Zap, Palette, Save, RotateCcw } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface LightingConfig {
  cocktailPreparation: {
    color: string
    blinking: boolean
  }
  cocktailFinished: {
    color: string
    blinking: boolean
  }
  idleMode: {
    scheme: string
    colors: string[]
  }
}

const defaultConfig: LightingConfig = {
  cocktailPreparation: {
    color: "#00ff00",
    blinking: false,
  },
  cocktailFinished: {
    color: "#0000ff",
    blinking: true,
  },
  idleMode: {
    scheme: "rainbow",
    colors: ["#ff0000", "#00ff00", "#0000ff"],
  },
}

const colorPresets = [
  { name: "Rot", value: "#ff0000" },
  { name: "Grün", value: "#00ff00" },
  { name: "Blau", value: "#0000ff" },
  { name: "Gelb", value: "#ffff00" },
  { name: "Magenta", value: "#ff00ff" },
  { name: "Cyan", value: "#00ffff" },
  { name: "Weiß", value: "#ffffff" },
  { name: "Orange", value: "#ff8000" },
  { name: "Lila", value: "#8000ff" },
  { name: "Pink", value: "#ff0080" },
]

const idleSchemes = [
  { name: "Regenbogen", value: "rainbow" },
  { name: "Sanft", value: "soft" },
  { name: "Pulsieren", value: "pulse" },
  { name: "Statisch", value: "static" },
  { name: "Aus", value: "off" },
]

export default function LightingControl() {
  const [config, setConfig] = useState<LightingConfig>(defaultConfig)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalConfig, setOriginalConfig] = useState<LightingConfig>(defaultConfig)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/lighting-config")
      if (response.ok) {
        const loadedConfig = await response.json()
        setConfig(loadedConfig)
        setOriginalConfig(JSON.parse(JSON.stringify(loadedConfig)))
      } else {
        setConfig(defaultConfig)
        setOriginalConfig(JSON.parse(JSON.stringify(defaultConfig)))
      }
      setHasChanges(false)
    } catch (error) {
      console.error("[v0] Error loading lighting config:", error)
      setConfig(defaultConfig)
      setOriginalConfig(JSON.parse(JSON.stringify(defaultConfig)))
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    try {
      setSaving(true)
      const response = await fetch("/api/lighting-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      })

      if (response.ok) {
        setOriginalConfig(JSON.parse(JSON.stringify(config)))
        setHasChanges(false)
        toast({
          title: "Gespeichert",
          description: "Beleuchtungseinstellungen wurden erfolgreich gespeichert.",
        })
      } else {
        throw new Error("Failed to save config")
      }
    } catch (error) {
      console.error("[v0] Error saving lighting config:", error)
      toast({
        title: "Fehler",
        description: "Beleuchtungseinstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const resetToDefault = () => {
    setConfig(defaultConfig)
    setHasChanges(JSON.stringify(defaultConfig) !== JSON.stringify(originalConfig))
  }

  const updateConfig = (path: string, value: any) => {
    setConfig((prev) => {
      const newConfig = JSON.parse(JSON.stringify(prev))
      const keys = path.split(".")
      let current = newConfig

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }
      current[keys[keys.length - 1]] = value

      setHasChanges(JSON.stringify(newConfig) !== JSON.stringify(originalConfig))
      return newConfig
    })
  }

  const testLighting = async (mode: string) => {
    try {
      await fetch("/api/lighting-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode, config }),
      })
      toast({
        title: "Test gestartet",
        description: `${mode} Beleuchtung wird für 5 Sekunden getestet.`,
      })
    } catch (error) {
      console.error("[v0] Error testing lighting:", error)
      toast({
        title: "Fehler",
        description: "Beleuchtungstest konnte nicht gestartet werden.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 bg-[hsl(var(--cocktail-bg))] min-h-[400px]">
        <div className="text-center space-y-4">
          <Lightbulb className="h-16 w-16 mx-auto animate-pulse text-[hsl(var(--cocktail-primary))]" />
          <h3 className="text-xl font-semibold text-[hsl(var(--cocktail-text))]">
            Beleuchtungseinstellungen werden geladen
          </h3>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 bg-[hsl(var(--cocktail-bg))] min-h-screen p-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Lightbulb className="h-8 w-8 text-[hsl(var(--cocktail-primary))]" />
          <h2 className="text-2xl font-bold text-[hsl(var(--cocktail-text))]">LED-Beleuchtung</h2>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={saveConfig}
            disabled={saving || !hasChanges}
            className="bg-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] text-black font-semibold"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Speichert..." : "Speichern"}
          </Button>
          <Button
            variant="outline"
            onClick={resetToDefault}
            disabled={saving}
            className="bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))]"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Standard
          </Button>
        </div>
      </div>

      {hasChanges && (
        <div className="p-4 rounded-xl border border-[hsl(var(--cocktail-primary))] bg-[hsl(var(--cocktail-card-bg))]">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full animate-pulse bg-[hsl(var(--cocktail-primary))]" />
            <p className="font-medium text-[hsl(var(--cocktail-primary))]">
              Sie haben ungespeicherte Änderungen. Klicken Sie auf "Speichern", um die Änderungen zu übernehmen.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Cocktail-Zubereitung */}
        <Card className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[hsl(var(--cocktail-text))]">
              <Zap className="h-5 w-5 text-[hsl(var(--cocktail-primary))]" />
              Cocktail-Zubereitung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[hsl(var(--cocktail-text))] mb-2 block">Farbe</label>
              <div className="grid grid-cols-5 gap-2 mb-3">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => updateConfig("cocktailPreparation.color", preset.value)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      config.cocktailPreparation.color === preset.value
                        ? "border-[hsl(var(--cocktail-primary))] scale-110"
                        : "border-gray-300 hover:scale-105"
                    }`}
                    style={{ backgroundColor: preset.value }}
                    title={preset.name}
                  />
                ))}
              </div>
              <input
                type="color"
                value={config.cocktailPreparation.color}
                onChange={(e) => updateConfig("cocktailPreparation.color", e.target.value)}
                className="w-full h-10 rounded-lg border border-[hsl(var(--cocktail-card-border))]"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[hsl(var(--cocktail-text))]">Blinken</label>
              <Button
                variant={config.cocktailPreparation.blinking ? "default" : "outline"}
                size="sm"
                onClick={() => updateConfig("cocktailPreparation.blinking", !config.cocktailPreparation.blinking)}
                className={
                  config.cocktailPreparation.blinking
                    ? "bg-[hsl(var(--cocktail-primary))] text-black"
                    : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))]"
                }
              >
                {config.cocktailPreparation.blinking ? "Ein" : "Aus"}
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => testLighting("preparation")}
              className="w-full bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))]"
            >
              Test
            </Button>
          </CardContent>
        </Card>

        {/* Cocktail fertig */}
        <Card className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[hsl(var(--cocktail-text))]">
              <Badge className="bg-[hsl(var(--cocktail-primary))] text-black">✓</Badge>
              Cocktail fertig
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[hsl(var(--cocktail-text))] mb-2 block">Farbe</label>
              <div className="grid grid-cols-5 gap-2 mb-3">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => updateConfig("cocktailFinished.color", preset.value)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      config.cocktailFinished.color === preset.value
                        ? "border-[hsl(var(--cocktail-primary))] scale-110"
                        : "border-gray-300 hover:scale-105"
                    }`}
                    style={{ backgroundColor: preset.value }}
                    title={preset.name}
                  />
                ))}
              </div>
              <input
                type="color"
                value={config.cocktailFinished.color}
                onChange={(e) => updateConfig("cocktailFinished.color", e.target.value)}
                className="w-full h-10 rounded-lg border border-[hsl(var(--cocktail-card-border))]"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[hsl(var(--cocktail-text))]">Blinken</label>
              <Button
                variant={config.cocktailFinished.blinking ? "default" : "outline"}
                size="sm"
                onClick={() => updateConfig("cocktailFinished.blinking", !config.cocktailFinished.blinking)}
                className={
                  config.cocktailFinished.blinking
                    ? "bg-[hsl(var(--cocktail-primary))] text-black"
                    : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))]"
                }
              >
                {config.cocktailFinished.blinking ? "Ein" : "Aus"}
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => testLighting("finished")}
              className="w-full bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))]"
            >
              Test
            </Button>
          </CardContent>
        </Card>

        {/* Idle-Modus */}
        <Card className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[hsl(var(--cocktail-text))]">
              <Palette className="h-5 w-5 text-[hsl(var(--cocktail-primary))]" />
              Idle-Modus
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[hsl(var(--cocktail-text))] mb-2 block">Farbschema</label>
              <div className="grid grid-cols-1 gap-2">
                {idleSchemes.map((scheme) => (
                  <Button
                    key={scheme.value}
                    variant={config.idleMode.scheme === scheme.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateConfig("idleMode.scheme", scheme.value)}
                    className={
                      config.idleMode.scheme === scheme.value
                        ? "bg-[hsl(var(--cocktail-primary))] text-black"
                        : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))]"
                    }
                  >
                    {scheme.name}
                  </Button>
                ))}
              </div>
            </div>
            {config.idleMode.scheme === "static" && (
              <div>
                <label className="text-sm font-medium text-[hsl(var(--cocktail-text))] mb-2 block">
                  Statische Farbe
                </label>
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => updateConfig("idleMode.colors", [preset.value])}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        config.idleMode.colors[0] === preset.value
                          ? "border-[hsl(var(--cocktail-primary))] scale-110"
                          : "border-gray-300 hover:scale-105"
                      }`}
                      style={{ backgroundColor: preset.value }}
                      title={preset.name}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={config.idleMode.colors[0] || "#ffffff"}
                  onChange={(e) => updateConfig("idleMode.colors", [e.target.value])}
                  className="w-full h-10 rounded-lg border border-[hsl(var(--cocktail-card-border))]"
                />
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => testLighting("idle")}
              className="w-full bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))]"
            >
              Test
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))]">
        <CardHeader>
          <CardTitle className="text-[hsl(var(--cocktail-text))]">Hardware-Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-[hsl(var(--cocktail-text))]">Controller:</span>
              <span className="ml-2 text-[hsl(var(--cocktail-text-muted))]">Raspberry Pico 2</span>
            </div>
            <div>
              <span className="font-medium text-[hsl(var(--cocktail-text))]">Verbindung:</span>
              <span className="ml-2 text-[hsl(var(--cocktail-text-muted))]">Raspberry Pi 5</span>
            </div>
            <div>
              <span className="font-medium text-[hsl(var(--cocktail-text))]">Protokoll:</span>
              <span className="ml-2 text-[hsl(var(--cocktail-text-muted))]">Serial/USB</span>
            </div>
            <div>
              <span className="font-medium text-[hsl(var(--cocktail-text))]">LED-Typ:</span>
              <span className="ml-2 text-[hsl(var(--cocktail-text-muted))]">WS2812B/NeoPixel</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
