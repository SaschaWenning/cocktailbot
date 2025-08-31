import type { Ingredient } from "@/types/pump"

export const ingredients: Ingredient[] = [
  // Alkoholische Getränke - Spirituosen
  { id: "white-rum", name: "Weißer Rum", alcoholic: true },
  { id: "dark-rum", name: "Brauner Rum", alcoholic: true },
  { id: "spiced-rum", name: "Gewürzrum", alcoholic: true },
  { id: "gin", name: "Gin", alcoholic: true },
  { id: "vodka", name: "Vodka", alcoholic: true },
  { id: "tequila", name: "Tequila", alcoholic: true },
  { id: "whiskey", name: "Whiskey", alcoholic: true },
  { id: "bourbon", name: "Bourbon", alcoholic: true },
  { id: "scotch", name: "Scotch Whisky", alcoholic: true },
  { id: "brandy", name: "Brandy", alcoholic: true },
  { id: "cognac", name: "Cognac", alcoholic: true },
  { id: "apricot-brandy", name: "Aprikosen Brandy", alcoholic: true },
  { id: "melon-liqueur", name: "Melonenlikör", alcoholic: true },

  // Alkoholische Getränke - Liköre
  { id: "malibu", name: "Malibu", alcoholic: true },
  { id: "peach-liqueur", name: "Pfirsich Likör", alcoholic: true },
  { id: "blue-curacao", name: "Blue Curacao", alcoholic: true },
  { id: "triple-sec", name: "Triple Sec", alcoholic: true },
  { id: "cointreau", name: "Cointreau", alcoholic: true },
  { id: "grand-marnier", name: "Grand Marnier", alcoholic: true },
  { id: "amaretto", name: "Amaretto", alcoholic: true },
  { id: "kahlua", name: "Kahlúa", alcoholic: true },
  { id: "baileys", name: "Baileys", alcoholic: true },
  { id: "sambuca", name: "Sambuca", alcoholic: true },
  { id: "jagermeister", name: "Jägermeister", alcoholic: true },
  { id: "midori", name: "Midori", alcoholic: true },
  { id: "chambord", name: "Chambord", alcoholic: true },
  { id: "frangelico", name: "Frangelico", alcoholic: true },
  { id: "pitu", name: "Pitu", alcoholic: true },

  // Alkoholische Getränke - Wein
  { id: "white-wine", name: "Weißwein", alcoholic: true },
  { id: "red-wine", name: "Rotwein", alcoholic: true },
  { id: "rose-wine", name: "Rosé", alcoholic: true },
  { id: "port-wine", name: "Portwein", alcoholic: true },
  { id: "sherry", name: "Sherry", alcoholic: true },

  // Alkoholische Getränke - Vermouth & Aperitifs
  { id: "dry-vermouth", name: "Trockener Vermouth", alcoholic: true },
  { id: "sweet-vermouth", name: "Süßer Vermouth", alcoholic: true },
  { id: "campari", name: "Campari", alcoholic: true },
  { id: "aperol", name: "Aperol", alcoholic: true },

  // Nicht-alkoholische Getränke - Fruchtsäfte
  { id: "orange-juice", name: "Orangensaft", alcoholic: false },
  { id: "apple-juice", name: "Apfelsaft", alcoholic: false },
  { id: "pineapple-juice", name: "Ananassaft", alcoholic: false },
  { id: "cranberry-juice", name: "Cranberrysaft", alcoholic: false },
  { id: "grapefruit-juice", name: "Grapefruitsaft", alcoholic: false },
  { id: "tomato-juice", name: "Tomatensaft", alcoholic: false },
  { id: "grape-juice", name: "Traubensaft", alcoholic: false },
  { id: "passion-fruit-juice", name: "Maracujasaft", alcoholic: false },
  { id: "mango-juice", name: "Mangosaft", alcoholic: false },
  { id: "peach-juice", name: "Pfirsichsaft", alcoholic: false },
  { id: "cherry-juice", name: "Kirschsaft", alcoholic: false },
  { id: "pomegranate-juice", name: "Granatapfelsaft", alcoholic: false },
  { id: "banana-juice", name: "Bananensaft", alcoholic: false },

  // Nicht-alkoholische Getränke - Zitrusfrüchte
  { id: "lime-juice", name: "Limettensaft", alcoholic: false },
  { id: "lemon-juice", name: "Zitronensaft", alcoholic: false },

  // Nicht-alkoholische Getränke - Kohlensäurehaltige Getränke
  { id: "cola", name: "Cola", alcoholic: false },
  { id: "fanta", name: "Fanta", alcoholic: false },
  { id: "soda-water", name: "Sprudelwasser", alcoholic: false },
  { id: "ginger-ale", name: "Ginger Ale", alcoholic: false },
  { id: "tonic-water", name: "Tonic Water", alcoholic: false },
  { id: "water", name: "Wasser", alcoholic: false },

  // Nicht-alkoholische Getränke - Milchprodukte
  { id: "cream", name: "Sahne", alcoholic: false },
  { id: "coconut-cream", name: "Kokossahne", alcoholic: false },
  { id: "coconut-milk", name: "Kokosmilch", alcoholic: false },
  { id: "creme-of-coconut", name: "Creme of Coconut", alcoholic: false },
  { id: "milk", name: "Milch", alcoholic: false },

  // Sirupe
  { id: "sugar-syrup", name: "Zuckersirup", alcoholic: false },
  { id: "vanilla-syrup", name: "Vanillesirup", alcoholic: false },
  { id: "almond-syrup", name: "Mandelsirup", alcoholic: false },
  { id: "grenadine", name: "Grenadine", alcoholic: false },
  { id: "honey-syrup", name: "Honigsirup", alcoholic: false },
  { id: "maple-syrup", name: "Ahornsirup", alcoholic: false },
  { id: "caramel-syrup", name: "Karamellsirup", alcoholic: false },
  { id: "chocolate-syrup", name: "Schokoladensirup", alcoholic: false },
  { id: "banana-syrup", name: "Bananensirup", alcoholic: false },
  { id: "melon-syrup", name: "Melonensirup", alcoholic: false },
  { id: "mango-syrup", name: "Mangosirup", alcoholic: false },
]
