export interface Ingredient {
  id: string
  name: string
  alcoholic: boolean
  category: "spirit" | "liqueur" | "juice" | "syrup" | "mixer" | "garnish"
}

export const ingredients: Ingredient[] = [
  // Spirituosen
  { id: "vodka", name: "Wodka", alcoholic: true, category: "spirit" },
  { id: "dark-rum", name: "Dunkler Rum", alcoholic: true, category: "spirit" },
  { id: "white-rum", name: "Weißer Rum", alcoholic: true, category: "spirit" },
  { id: "gin", name: "Gin", alcoholic: true, category: "spirit" },
  { id: "tequila", name: "Tequila", alcoholic: true, category: "spirit" },
  { id: "whiskey", name: "Whiskey", alcoholic: true, category: "spirit" },
  { id: "bourbon", name: "Bourbon", alcoholic: true, category: "spirit" },
  { id: "scotch", name: "Scotch", alcoholic: true, category: "spirit" },
  { id: "brandy", name: "Weinbrand", alcoholic: true, category: "spirit" },
  { id: "cognac", name: "Cognac", alcoholic: true, category: "spirit" },

  // Liköre
  { id: "malibu", name: "Malibu", alcoholic: true, category: "liqueur" },
  { id: "triple-sec", name: "Triple Sec", alcoholic: true, category: "liqueur" },
  { id: "blue-curacao", name: "Blauer Curacao", alcoholic: true, category: "liqueur" },
  { id: "peach-liqueur", name: "Pfirsichlikör", alcoholic: true, category: "liqueur" },
  { id: "amaretto", name: "Amaretto", alcoholic: true, category: "liqueur" },
  { id: "kahlua", name: "Kahlua", alcoholic: true, category: "liqueur" },
  { id: "baileys", name: "Baileys", alcoholic: true, category: "liqueur" },
  { id: "sambuca", name: "Sambuca", alcoholic: true, category: "liqueur" },
  { id: "jagermeister", name: "Jägermeister", alcoholic: true, category: "liqueur" },
  { id: "midori", name: "Midori", alcoholic: true, category: "liqueur" },
  { id: "chambord", name: "Chambord", alcoholic: true, category: "liqueur" },
  { id: "frangelico", name: "Frangelico", alcoholic: true, category: "liqueur" },
  { id: "cointreau", name: "Cointreau", alcoholic: true, category: "liqueur" },
  { id: "grand-marnier", name: "Grand Marnier", alcoholic: true, category: "liqueur" },
  { id: "apricot-brandy", name: "Aprikosenbrand", alcoholic: true, category: "liqueur" },

  // Säfte
  { id: "orange-juice", name: "Orangensaft", alcoholic: false, category: "juice" },
  { id: "pineapple-juice", name: "Ananassaft", alcoholic: false, category: "juice" },
  { id: "cranberry-juice", name: "Cranberrysaft", alcoholic: false, category: "juice" },
  { id: "lime-juice", name: "Limettensaft", alcoholic: false, category: "juice" },
  { id: "lemon-juice", name: "Zitronensaft", alcoholic: false, category: "juice" },
  { id: "grapefruit-juice", name: "Grapefruitsaft", alcoholic: false, category: "juice" },
  { id: "passion-fruit-juice", name: "Maracujasaft", alcoholic: false, category: "juice" },
  { id: "mango-juice", name: "Mangosaft", alcoholic: false, category: "juice" },
  { id: "apple-juice", name: "Apfelsaft", alcoholic: false, category: "juice" },
  { id: "grape-juice", name: "Traubensaft", alcoholic: false, category: "juice" },
  { id: "tomato-juice", name: "Tomatensaft", alcoholic: false, category: "juice" },

  // Sirupe
  { id: "grenadine", name: "Grenadine", alcoholic: false, category: "syrup" },
  { id: "sugar-syrup", name: "Zuckersirup", alcoholic: false, category: "syrup" },
  { id: "vanilla-syrup", name: "Vanillesirup", alcoholic: false, category: "syrup" },
  { id: "almond-syrup", name: "Mandelsirup", alcoholic: false, category: "syrup" },
  { id: "coconut-syrup", name: "Kokossirup", alcoholic: false, category: "syrup" },
  { id: "strawberry-syrup", name: "Erdbeersirup", alcoholic: false, category: "syrup" },
  { id: "raspberry-syrup", name: "Himbeersirup", alcoholic: false, category: "syrup" },

  // Mixer
  { id: "soda-water", name: "Sodawasser", alcoholic: false, category: "mixer" },
  { id: "tonic-water", name: "Tonic Water", alcoholic: false, category: "mixer" },
  { id: "ginger-beer", name: "Ginger Beer", alcoholic: false, category: "mixer" },
  { id: "cola", name: "Cola", alcoholic: false, category: "mixer" },
  { id: "sprite", name: "Sprite", alcoholic: false, category: "mixer" },
  { id: "ginger-ale", name: "Ginger Ale", alcoholic: false, category: "mixer" },
  { id: "coconut-milk", name: "Kokosmilch", alcoholic: false, category: "mixer" },
  { id: "coconut-cream", name: "Kokoscreme", alcoholic: false, category: "mixer" },

  // Wein & Wermut
  { id: "red-wine", name: "Rotwein", alcoholic: true, category: "spirit" },
  { id: "white-wine", name: "Weißwein", alcoholic: true, category: "spirit" },
  { id: "champagne", name: "Champagner", alcoholic: true, category: "spirit" },
  { id: "prosecco", name: "Prosecco", alcoholic: true, category: "spirit" },
  { id: "dry-vermouth", name: "Trockener Wermut", alcoholic: true, category: "liqueur" },
  { id: "sweet-vermouth", name: "Süßer Wermut", alcoholic: true, category: "liqueur" },

  // Bitter & Andere
  { id: "angostura-bitters", name: "Angostura Bitter", alcoholic: true, category: "liqueur" },
  { id: "campari", name: "Campari", alcoholic: true, category: "liqueur" },
  { id: "aperol", name: "Aperol", alcoholic: true, category: "liqueur" },
]
