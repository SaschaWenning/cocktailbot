"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, Zap, Palette, Save, RotateCcw, Play } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { type LightingConfig, defaultConfig } from "@/lib/lighting-config-types"

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

  const applyLighting = async (mode: "preparation" | "finished" | "idle" | "off") => {
    try {
      let body: any = {}

      if (mode === "preparation") {
        body = {
          mode: "cocktailPreparation",
          blinking: config.cocktailPreparation.blinking,
          color: config.cocktailPreparation.color,
          brightness: config.brightness,
        }
      } else if (mode === "finished") {
        body = {
          mode: "cocktailFinished",
          blinking: config.cocktailFinished.blinking,
          color: config.cocktailFinished.color,
          brightness: config.brightness,
        }
      } else if (mode === "idle") {
        if (config.idleMode.scheme === "static" && config.idleMode.colors.length > 0) {
          body = { mode: "color", color: config.idleMode.colors[0], brightness: config.brightness }
        } else if (config.idleMode.scheme === "off") {
          body = { mode: "off" }
        } else {
          body = { mode: "idle", brightness: config.brightness }
        }
      } else if (mode === "off") {
        body = { mode: "off" }
      }

      const res = await fetch("/api/lighting-control", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        throw new Error(await res.text())
      }

      toast({
        title: "Angewendet",
        description: `${mode === "preparation" ? "Zubereitung" : mode === "finished" ? "Fertig" : mode === "idle" ? "Idle" : "Aus"} Beleuchtung wurde dauerhaft aktiviert.`,
      })
    } catch (error) {
      console.error("[v0] Error applying lighting:", error)
      toast({
        title: "Fehler",
        description: "Beleuchtung konnte nicht angewendet werden.",
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
    <div className="space-y-4 md:space-y-6 bg-[hsl(var(--cocktail-bg))] min-h-screen p-3 md:p-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="flex items-center gap-2 md:gap-3">
          <Lightbulb className="h-6 w-6 md:h-8 md:w-8 text-[hsl(var(--cocktail-primary))]" />
          <h2 className="text-xl md:text-2xl font-bold text-[hsl(var(--cocktail-text))]">LED-Beleuchtung</h2>
        </div>
        <div className="flex gap-2 md:gap-3">
          <Button
            onClick={saveConfig}
            disabled={saving || !hasChanges}
            size="sm"
            className="bg-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] text-black font-semibold flex-1 sm:flex-none"
          >
            <Save className="h-4 w-4 mr-1 md:mr-2" />
            <span className="text-sm md:text-base">{saving ? "Speichert..." : "Speichern"}</span>
          </Button>
          <Button
            variant="outline"
            onClick={resetToDefault}
            disabled={saving}
            size="sm"
            className="bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] flex-1 sm:flex-none"
          >
            <RotateCcw className="h-4 w-4 mr-1 md:mr-2" />
            <span className="text-sm md:text-base">Standard</span>
          </Button>
        </div>
      </div>

      {hasChanges && (
        <div className="p-3 md:p-4 rounded-xl border border-[hsl(var(--cocktail-primary))] bg-[hsl(var(--cocktail-card-bg))]">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-2 h-2 rounded-full animate-pulse bg-[hsl(var(--cocktail-primary))] flex-shrink-0" />
            <p className="text-sm md:text-base font-medium text-[hsl(var(--cocktail-primary))]">
              Sie haben ungespeicherte Änderungen. Klicken Sie auf "Speichern", um die Änderungen zu übernehmen.
            </p>
          </div>
        </div>
      )}

      <Card className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))]">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg text-[hsl(var(--cocktail-text))]">
            <Lightbulb className="h-4 w-4 md:h-5 md:w-5 text-[hsl(var(--cocktail-primary))]" />
            Globale Helligkeit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs md:text-sm font-medium text-[hsl(var(--cocktail-text))]">
                Helligkeit: {config.brightness || 255}
              </label>
              <span className="text-xs md:text-sm text-[hsl(var(--cocktail-text-muted))]">
                {Math.round(((config.brightness || 255) / 255) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="255"
              value={config.brightness || 255}
              onChange={(e) => updateConfig("brightness", Number.parseInt(e.target.value))}
              className="w-full h-2 bg-[hsl(var(--cocktail-card-border))] rounded-lg appearance-none cursor-pointer accent-[hsl(var(--cocktail-primary))]"
            />
            <div className="flex justify-between text-[10px] md:text-xs text-[hsl(var(--cocktail-text-muted))]">
              <span>Aus</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>Max</span>
            </div>
          </div>
          <p className="text-xs md:text-sm text-[hsl(var(--cocktail-text-muted))]">
            Die Helligkeit wird auf alle LED-Modi angewendet.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {/* Cocktail-Zubereitung */}
        <Card className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))]">
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg text-[hsl(var(--cocktail-text))]">
              <Zap className="h-4 w-4 md:h-5 md:w-5 text-[hsl(var(--cocktail-primary))]" />
              Zubereitung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
            <div>
              <label className="text-xs md:text-sm font-medium text-[hsl(var(--cocktail-text))] mb-2 block">
                Farbe
              </label>
              <div className="grid grid-cols-5 sm:grid-cols-4 md:grid-cols-5 gap-1.5 md:gap-2 mb-2 md:mb-3">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => updateConfig("cocktailPreparation.color", preset.value)}
                    className={`w-7 h-7 md:w-8 md:h-8 rounded-full border-2 transition-all ${
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
                className="w-full h-9 md:h-10 rounded-lg border border-[hsl(var(--cocktail-card-border))]"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs md:text-sm font-medium text-[hsl(var(--cocktail-text))]">Blinken</label>
              <Button
                variant={config.cocktailPreparation.blinking ? "default" : "outline"}
                size="sm"
                onClick={() => updateConfig("cocktailPreparation.blinking", !config.cocktailPreparation.blinking)}
                className={
                  config.cocktailPreparation.blinking
                    ? "bg-[hsl(var(--cocktail-primary))] text-black text-xs md:text-sm h-8"
                    : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] text-xs md:text-sm h-8"
                }
              >
                {config.cocktailPreparation.blinking ? "Ein" : "Aus"}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => testLighting("preparation")}
                className="bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] text-xs md:text-sm h-8 md:h-9"
              >
                Test
              </Button>
              <Button
                size="sm"
                onClick={() => applyLighting("preparation")}
                className="bg-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] text-black font-semibold text-xs md:text-sm h-8 md:h-9"
              >
                <Play className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                Anwenden
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cocktail fertig */}
        <Card className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))]">
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg text-[hsl(var(--cocktail-text))]">
              <Badge className="bg-[hsl(var(--cocktail-primary))] text-black text-xs md:text-sm h-5 md:h-6 px-1.5 md:px-2">
                ✓
              </Badge>
              Fertig
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
            <div>
              <label className="text-xs md:text-sm font-medium text-[hsl(var(--cocktail-text))] mb-2 block">
                Farbe
              </label>
              <div className="grid grid-cols-5 sm:grid-cols-4 md:grid-cols-5 gap-1.5 md:gap-2 mb-2 md:mb-3">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => updateConfig("cocktailFinished.color", preset.value)}
                    className={`w-7 h-7 md:w-8 md:h-8 rounded-full border-2 transition-all ${
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
                className="w-full h-9 md:h-10 rounded-lg border border-[hsl(var(--cocktail-card-border))]"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs md:text-sm font-medium text-[hsl(var(--cocktail-text))]">Blinken</label>
              <Button
                variant={config.cocktailFinished.blinking ? "default" : "outline"}
                size="sm"
                onClick={() => updateConfig("cocktailFinished.blinking", !config.cocktailFinished.blinking)}
                className={
                  config.cocktailFinished.blinking
                    ? "bg-[hsl(var(--cocktail-primary))] text-black text-xs md:text-sm h-8"
                    : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] text-xs md:text-sm h-8"
                }
              >
                {config.cocktailFinished.blinking ? "Ein" : "Aus"}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => testLighting("finished")}
                className="bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] text-xs md:text-sm h-8 md:h-9"
              >
                Test
              </Button>
              <Button
                size="sm"
                onClick={() => applyLighting("finished")}
                className="bg-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] text-black font-semibold text-xs md:text-sm h-8 md:h-9"
              >
                <Play className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                Anwenden
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Idle-Modus */}
        <Card className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))]">
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg text-[hsl(var(--cocktail-text))]">
              <Palette className="h-4 w-4 md:h-5 md:w-5 text-[hsl(var(--cocktail-primary))]" />
              Idle-Modus
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
            <div>
              <label className="text-xs md:text-sm font-medium text-[hsl(var(--cocktail-text))] mb-2 block">
                Farbschema
              </label>
              <div className="grid grid-cols-1 gap-1.5 md:gap-2">
                {idleSchemes.map((scheme) => (
                  <Button
                    key={scheme.value}
                    variant={config.idleMode.scheme === scheme.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateConfig("idleMode.scheme", scheme.value)}
                    className={
                      config.idleMode.scheme === scheme.value
                        ? "bg-[hsl(var(--cocktail-primary))] text-black text-xs md:text-sm h-8 md:h-9"
                        : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] text-xs md:text-sm h-8 md:h-9"
                    }
                  >
                    {scheme.name}
                  </Button>
                ))}
              </div>
            </div>
            {config.idleMode.scheme === "static" && (
              <div>
                <label className="text-xs md:text-sm font-medium text-[hsl(var(--cocktail-text))] mb-2 block">
                  Statische Farbe
                </label>
                <div className="grid grid-cols-5 sm:grid-cols-4 md:grid-cols-5 gap-1.5 md:gap-2 mb-2 md:mb-3">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => updateConfig("idleMode.colors", [preset.value])}
                      className={`w-7 h-7 md:w-8 md:h-8 rounded-full border-2 transition-all ${
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
                  className="w-full h-9 md:h-10 rounded-lg border border-[hsl(var(--cocktail-card-border))]"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => testLighting("idle")}
                className="bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] text-xs md:text-sm h-8 md:h-9"
              >
                Test
              </Button>
              <Button
                size="sm"
                onClick={() => applyLighting("idle")}
                className="bg-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] text-black font-semibold text-xs md:text-sm h-8 md:h-9"
              >
                <Play className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                Anwenden
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))]">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="text-base md:text-lg text-[hsl(var(--cocktail-text))]">Hardware-Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4 text-xs md:text-sm">
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
