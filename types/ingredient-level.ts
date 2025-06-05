export interface IngredientLevel {
  ingredientId: string
  currentAmount: number // in ml
  capacity: number // in ml
  lastRefill: Date
}
