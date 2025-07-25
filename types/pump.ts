export interface PumpConfig {
  id: number
  pin: number
  ingredient: string
  flowRate: number // ml pro Sekunde
}

export interface Ingredient {
  id: string
  name: string
  alcoholic: boolean
}
