export interface Cocktail {
  id: string
  name: string
  description: string
  image: string
  alcoholic: boolean
  recipe: {
    ingredientId: string
    amount: number
    type: "automatic" | "manual" // 'automatic' for machine-dispensed, 'manual' for user-added
    instruction?: string // Optional instruction for manual ingredients
    delayed?: boolean // Optional flag for delayed ingredient addition
  }[]
  ingredients: string[] // Derived list for display purposes
  sizes?: number[] // Array of available sizes in ml for this specific cocktail
}
