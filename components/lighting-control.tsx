"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, Zap, Palette, Save, RotateCcw, Play, Sparkles } from "lucide-react"
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
  { name: "Regenbogen", value: "rainbow", icon: "🌈" },
  { name: "Sanft", value: "soft", icon: "✨" },
  { name: "Pulsieren", value: "pulse", icon: "💫" },
  { name: "Statisch", value: "static", icon: "⚪" },
  { name: "Aus", value: "off", icon: "⚫" },
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
    <div className="space-y-6 bg-[hsl(var(--cocktail-bg))] min-h-screen p-4 lg:p-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[hsl(var(--cocktail-primary))]/10 border border-[hsl(var(--cocktail-primary))]/20">
              <Lightbulb className="h-7 w-7 text-[hsl(var(--cocktail-primary))]" />
            </div>
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-[hsl(var(--cocktail-text))]">LED-Beleuchtung</h2>
              <p className="text-sm text-[hsl(var(--cocktail-text-muted))]">Steuern Sie die RGB-Beleuchtung</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={saveConfig}
            disabled={saving || !hasChanges}
            className="bg-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] text-black font-semibold flex-1 lg:flex-none h-12 px-6"
          >
            <Save className="h-5 w-5 mr-2" />
            {saving ? "Speichert..." : "Speichern"}
          </Button>
          <Button
            variant="outline"
            onClick={resetToDefault}
            disabled={saving}
            className="bg-[hsl(var(--cocktail-button-bg))] hover:bg-[hsl(var(--cocktail-button-hover))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] flex-1 lg:flex-none h-12 px-6"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Standard
          </Button>
        </div>
      </div>

      {hasChanges && (
        <div className="relative overflow-hidden rounded-2xl border border-[hsl(var(--cocktail-primary))]/30 bg-gradient-to-r from-[hsl(var(--cocktail-card-bg))] to-[hsl(var(--cocktail-primary))]/5 p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-3 h-3 rounded-full bg-[hsl(var(--cocktail-primary))] animate-pulse" />
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-[hsl(var(--cocktail-primary))] animate-ping" />
            </div>
            <p className="text-base font-medium text-[hsl(var(--cocktail-text))]">
              Ungespeicherte Änderungen vorhanden
            </p>
          </div>
        </div>
      )}

      <Card className="bg-gradient-to-br from-[hsl(var(--cocktail-card-bg))] to-[hsl(var(--cocktail-card-bg))]/80 border-[hsl(var(--cocktail-card-border))]/50 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl text-[hsl(var(--cocktail-text))]">
            <Sparkles className="h-6 w-6 text-[hsl(var(--cocktail-primary))]" />
            Globale Helligkeit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-base font-semibold text-[hsl(var(--cocktail-text))]">Helligkeit</label>
              <Badge className="bg-[hsl(var(--cocktail-primary))] text-black font-bold text-lg px-4 py-1">
                {Math.round(((config.brightness || 255) / 255) * 100)}%
              </Badge>
            </div>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="255"
                value={config.brightness || 255}
                onChange={(e) => updateConfig("brightness", Number.parseInt(e.target.value))}
                className="w-full h-3 bg-gradient-to-r from-[hsl(var(--cocktail-card-border))] to-[hsl(var(--cocktail-primary))]/30 rounded-full appearance-none cursor-pointer accent-[hsl(var(--cocktail-primary))]"
                style={{
                  background: `linear-gradient(to right, hsl(var(--cocktail-primary)) 0%, hsl(var(--cocktail-primary)) ${((config.brightness || 255) / 255) * 100}%, hsl(var(--cocktail-card-border)) ${((config.brightness || 255) / 255) * 100}%, hsl(var(--cocktail-card-border)) 100%)`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-[hsl(var(--cocktail-text-muted))] px-1">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
          <p className="text-sm text-[hsl(var(--cocktail-text-muted))] bg-[hsl(var(--cocktail-card-bg))]/50 p-3 rounded-lg border border-[hsl(var(--cocktail-card-border))]/30">
            💡 Die Helligkeit wird auf alle LED-Modi angewendet
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Cocktail-Zubereitung */}
        <Card className="bg-gradient-to-br from-[hsl(var(--cocktail-card-bg))] to-[hsl(var(--cocktail-card-bg))]/80 border-[hsl(var(--cocktail-card-border))]/50 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg text-[hsl(var(--cocktail-text))]">
              <div className="p-2 rounded-lg bg-[hsl(var(--cocktail-primary))]/10">
                <Zap className="h-5 w-5 text-[hsl(var(--cocktail-primary))]" />
              </div>
              Zubereitung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-[hsl(var(--cocktail-text))]">Farbe wählen</label>
              <div className="grid grid-cols-5 gap-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => updateConfig("cocktailPreparation.color", preset.value)}
                    className={`w-full aspect-square rounded-xl border-2 transition-all hover:scale-110 ${
                      config.cocktailPreparation.color === preset.value
                        ? "border-[hsl(var(--cocktail-primary))] scale-110 shadow-lg"
                        : "border-[hsl(var(--cocktail-card-border))]"
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
                className="w-full h-12 rounded-xl border-2 border-[hsl(var(--cocktail-card-border))] cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[hsl(var(--cocktail-card-bg))]/50 border border-[hsl(var(--cocktail-card-border))]/30">
              <label className="text-sm font-semibold text-[hsl(var(--cocktail-text))]">Blinken</label>
              <Button
                variant={config.cocktailPreparation.blinking ? "default" : "outline"}
                size="sm"
                onClick={() => updateConfig("cocktailPreparation.blinking", !config.cocktailPreparation.blinking)}
                className={
                  config.cocktailPreparation.blinking
                    ? "bg-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] text-black font-semibold h-10 px-6"
                    : "bg-[hsl(var(--cocktail-button-bg))] hover:bg-[hsl(var(--cocktail-button-hover))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] h-10 px-6"
                }
              >
                {config.cocktailPreparation.blinking ? "Ein" : "Aus"}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => testLighting("preparation")}
                className="bg-[hsl(var(--cocktail-button-bg))] hover:bg-[hsl(var(--cocktail-button-hover))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] h-11 text-sm"
              >
                Test
              </Button>
              <Button
                onClick={() => applyLighting("preparation")}
                className="bg-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] text-black font-semibold h-14 text-base px-4"
              >
                <Play className="h-5 w-5 mr-2" />
                Anwenden
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cocktail fertig */}
        <Card className="bg-gradient-to-br from-[hsl(var(--cocktail-card-bg))] to-[hsl(var(--cocktail-card-bg))]/80 border-[hsl(var(--cocktail-card-border))]/50 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg text-[hsl(var(--cocktail-text))]">
              <Badge className="bg-[hsl(var(--cocktail-primary))] text-black font-bold text-base px-3 py-1">✓</Badge>
              Fertig
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-[hsl(var(--cocktail-text))]">Farbe wählen</label>
              <div className="grid grid-cols-5 gap-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => updateConfig("cocktailFinished.color", preset.value)}
                    className={`w-full aspect-square rounded-xl border-2 transition-all hover:scale-110 ${
                      config.cocktailFinished.color === preset.value
                        ? "border-[hsl(var(--cocktail-primary))] scale-110 shadow-lg"
                        : "border-[hsl(var(--cocktail-card-border))]"
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
                className="w-full h-12 rounded-xl border-2 border-[hsl(var(--cocktail-card-border))] cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[hsl(var(--cocktail-card-bg))]/50 border border-[hsl(var(--cocktail-card-border))]/30">
              <label className="text-sm font-semibold text-[hsl(var(--cocktail-text))]">Blinken</label>
              <Button
                variant={config.cocktailFinished.blinking ? "default" : "outline"}
                size="sm"
                onClick={() => updateConfig("cocktailFinished.blinking", !config.cocktailFinished.blinking)}
                className={
                  config.cocktailFinished.blinking
                    ? "bg-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] text-black font-semibold h-10 px-6"
                    : "bg-[hsl(var(--cocktail-button-bg))] hover:bg-[hsl(var(--cocktail-button-hover))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] h-10 px-6"
                }
              >
                {config.cocktailFinished.blinking ? "Ein" : "Aus"}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => testLighting("finished")}
                className="bg-[hsl(var(--cocktail-button-bg))] hover:bg-[hsl(var(--cocktail-button-hover))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] h-11 text-sm"
              >
                Test
              </Button>
              <Button
                onClick={() => applyLighting("finished")}
                className="bg-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] text-black font-semibold h-14 text-base px-4"
              >
                <Play className="h-5 w-5 mr-2" />
                Anwenden
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Idle-Modus */}
        <Card className="bg-gradient-to-br from-[hsl(var(--cocktail-card-bg))] to-[hsl(var(--cocktail-card-bg))]/80 border-[hsl(var(--cocktail-card-border))]/50 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg text-[hsl(var(--cocktail-text))]">
              <div className="p-2 rounded-lg bg-[hsl(var(--cocktail-primary))]/10">
                <Palette className="h-5 w-5 text-[hsl(var(--cocktail-primary))]" />
              </div>
              Idle-Modus
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-[hsl(var(--cocktail-text))]">Farbschema</label>
              <div className="grid grid-cols-1 gap-2">
                {idleSchemes.map((scheme) => (
                  <Button
                    key={scheme.value}
                    variant={config.idleMode.scheme === scheme.value ? "default" : "outline"}
                    onClick={() => updateConfig("idleMode.scheme", scheme.value)}
                    className={
                      config.idleMode.scheme === scheme.value
                        ? "bg-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] text-black font-semibold h-12 justify-start"
                        : "bg-[hsl(var(--cocktail-button-bg))] hover:bg-[hsl(var(--cocktail-button-hover))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] h-12 justify-start"
                    }
                  >
                    <span className="text-xl mr-3">{scheme.icon}</span>
                    {scheme.name}
                  </Button>
                ))}
              </div>
            </div>
            {config.idleMode.scheme === "static" && (
              <div className="space-y-3">
                <label className="text-sm font-semibold text-[hsl(var(--cocktail-text))]">Statische Farbe</label>
                <div className="grid grid-cols-5 gap-2">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => updateConfig("idleMode.colors", [preset.value])}
                      className={`w-full aspect-square rounded-xl border-2 transition-all hover:scale-110 ${
                        config.idleMode.colors[0] === preset.value
                          ? "border-[hsl(var(--cocktail-primary))] scale-110 shadow-lg"
                          : "border-[hsl(var(--cocktail-card-border))]"
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
                  className="w-full h-12 rounded-xl border-2 border-[hsl(var(--cocktail-card-border))] cursor-pointer"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => testLighting("idle")}
                className="bg-[hsl(var(--cocktail-button-bg))] hover:bg-[hsl(var(--cocktail-button-hover))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] h-11 text-sm"
              >
                Test
              </Button>
              <Button
                onClick={() => applyLighting("idle")}
                className="bg-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] text-black font-semibold h-14 text-base px-4"
              >
                <Play className="h-5 w-5 mr-2" />
                Anwenden
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-[hsl(var(--cocktail-card-bg))] to-[hsl(var(--cocktail-card-bg))]/80 border-[hsl(var(--cocktail-card-border))]/50 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-[hsl(var(--cocktail-text))]">Hardware-Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Controller", value: "Raspberry Pico 2", icon: "🎛️" },
              { label: "Verbindung", value: "Raspberry Pi 5", icon: "🔌" },
              { label: "Protokoll", value: "Serial/USB", icon: "📡" },
              { label: "LED-Typ", value: "WS2812B/NeoPixel", icon: "💡" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(var(--cocktail-card-bg))]/50 border border-[hsl(var(--cocktail-card-border))]/30"
              >
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <div className="text-xs text-[hsl(var(--cocktail-text-muted))]">{item.label}</div>
                  <div className="text-sm font-semibold text-[hsl(var(--cocktail-text))]">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
