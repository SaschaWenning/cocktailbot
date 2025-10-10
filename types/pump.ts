export interface PumpConfig {
  id: number
  pin: number
  ingredient: string
  flowRate: number // ml pro Sekunde
  enabled: boolean // Hinzugefügt für Aktivierung/Deaktivierung
  ventDuration?: number // Entlüftungszeit in Millisekunden (Standard: 2000ms)
}

export interface Ingredient {
  id: string
  name: string
  alcoholic: boolean
}
