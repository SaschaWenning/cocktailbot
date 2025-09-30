export interface PumpConfig {
  id: number
  pin: number
  ingredient: string
  flowRate: number // ml pro Sekunde
  enabled: boolean // Hinzugefügt für Aktivierung/Deaktivierung
}

export interface Ingredient {
  id: string
  name: string
  alcoholic: boolean
}
