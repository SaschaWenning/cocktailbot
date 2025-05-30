export interface Cocktail {
  id: string
  name: string
  description: string
  image: string
  alcoholic: boolean
  ingredients: string[]
  recipe: RecipeIngredient[]
  isActive: boolean
}

export interface RecipeIngredient {
  ingredientId: string
  amount: number
}

export const cocktails: Cocktail[] = [
  {
    id: "mai-tai",
    name: "Mai Tai",
    description: "Ein starker, fruchtiger Rum-Cocktail, der oft mit Tiki-Kultur assoziiert wird.",
    image: "/images/cocktails/mai_tai.jpg", // Stelle sicher, dass dieser Pfad korrekt ist
    alcoholic: true,
    ingredients: [
      "30ml Weißer Rum",
      "30ml Brauner Rum",
      "15ml Orange Curacao", // oder Triple Sec
      "15ml Limettensaft",
      "10ml Mandelsirup (Orgeat)",
      "Optional: Ein Schuss Grenadine für Farbe",
    ],
    recipe: [
      { ingredientId: "white-rum", amount: 30 },
      { ingredientId: "dark-rum", amount: 30 },
      { ingredientId: "triple-sec", amount: 15 }, // Annahme: Orange Curacao wird durch triple-sec abgedeckt
      { ingredientId: "lime-juice", amount: 15 },
      { ingredientId: "orgeat-syrup", amount: 10 },
      // Grenadine ist optional und wird hier nicht automatisch hinzugefügt
    ],
    isActive: true,
  },
  {
    id: "margarita",
    name: "Margarita",
    description: "Ein erfrischender Cocktail mit Tequila, Limettensaft und Orangenlikör.",
    image: "/images/cocktails/margarita.jpg",
    alcoholic: true,
    ingredients: [
      "50ml Tequila",
      "20ml Limettensaft",
      "20ml Orangenlikör (Cointreau oder Triple Sec)",
      "Salz für den Glasrand",
    ],
    recipe: [
      { ingredientId: "tequila", amount: 50 },
      { ingredientId: "lime-juice", amount: 20 },
      { ingredientId: "triple-sec", amount: 20 },
    ],
    isActive: true,
  },
  {
    id: "old-fashioned",
    name: "Old Fashioned",
    description: "Ein klassischer Whiskey-Cocktail mit Zucker, Bitter und einer Orangenzeste.",
    image: "/images/cocktails/old_fashioned.jpg",
    alcoholic: true,
    ingredients: [
      "45ml Bourbon oder Rye Whiskey",
      "1 Zuckerwürfel",
      "2-3 Spritzer Angostura Bitter",
      "Ein Schuss Wasser",
      "Orangenzeste",
    ],
    recipe: [
      { ingredientId: "bourbon", amount: 45 },
      { ingredientId: "sugar", amount: 1 },
      { ingredientId: "angostura-bitters", amount: 2 },
    ],
    isActive: true,
  },
  {
    id: "cosmopolitan",
    name: "Cosmopolitan",
    description: "Ein eleganter und fruchtiger Cocktail mit Wodka, Cranberrysaft, Limettensaft und Orangenlikör.",
    image: "/images/cocktails/cosmopolitan.jpg",
    alcoholic: true,
    ingredients: ["40ml Wodka", "15ml Cointreau", "30ml Cranberrysaft", "15ml Limettensaft", "Orangenzeste"],
    recipe: [
      { ingredientId: "vodka", amount: 40 },
      { ingredientId: "cointreau", amount: 15 },
      { ingredientId: "cranberry-juice", amount: 30 },
      { ingredientId: "lime-juice", amount: 15 },
    ],
    isActive: true,
  },
  {
    id: "mojito",
    name: "Mojito",
    description: "Ein erfrischender Cocktail mit weißem Rum, Minze, Limettensaft, Zucker und Sodawasser.",
    image: "/images/cocktails/mojito.jpg",
    alcoholic: true,
    ingredients: ["50ml Weißer Rum", "12 Minzblätter", "20ml Limettensaft", "2 Teelöffel Zucker", "Sodawasser"],
    recipe: [
      { ingredientId: "white-rum", amount: 50 },
      { ingredientId: "mint", amount: 12 },
      { ingredientId: "lime-juice", amount: 20 },
      { ingredientId: "sugar", amount: 2 },
    ],
    isActive: true,
  },
  {
    id: "pina-colada",
    name: "Pina Colada",
    description: "Ein süßer und cremiger Cocktail mit weißem Rum, Kokosnusscreme und Ananassaft.",
    image: "/images/cocktails/pina_colada.jpg",
    alcoholic: true,
    ingredients: ["50ml Weißer Rum", "100ml Ananassaft", "50ml Kokosnusscreme"],
    recipe: [
      { ingredientId: "white-rum", amount: 50 },
      { ingredientId: "pineapple-juice", amount: 100 },
      { ingredientId: "coconut-cream", amount: 50 },
    ],
    isActive: true,
  },
  {
    id: "daiquiri",
    name: "Daiquiri",
    description: "Ein einfacher, aber köstlicher Cocktail mit weißem Rum, Limettensaft und Zuckersirup.",
    image: "/images/cocktails/daiquiri.jpg",
    alcoholic: true,
    ingredients: ["45ml Weißer Rum", "25ml Limettensaft", "20ml Zuckersirup"],
    recipe: [
      { ingredientId: "white-rum", amount: 45 },
      { ingredientId: "lime-juice", amount: 25 },
      { ingredientId: "simple-syrup", amount: 20 },
    ],
    isActive: true,
  },
  {
    id: "negroni",
    name: "Negroni",
    description: "Ein klassischer italienischer Cocktail mit Gin, Campari und süßem Wermut.",
    image: "/images/cocktails/negroni.jpg",
    alcoholic: true,
    ingredients: ["30ml Gin", "30ml Campari", "30ml Süßer Wermut"],
    recipe: [
      { ingredientId: "gin", amount: 30 },
      { ingredientId: "campari", amount: 30 },
      { ingredientId: "sweet-vermouth", amount: 30 },
    ],
    isActive: true,
  },
  {
    id: "espresso-martini",
    name: "Espresso Martini",
    description: "Ein anregender Cocktail mit Wodka, Kaffeelikör und Espresso.",
    image: "/images/cocktails/espresso_martini.jpg",
    alcoholic: true,
    ingredients: [
      "50ml Wodka",
      "30ml Kaffeelikör (z.B. Kahlúa)",
      "1 Schuss Espresso",
      "Optional: Zuckersirup nach Geschmack",
    ],
    recipe: [
      { ingredientId: "vodka", amount: 50 },
      { ingredientId: "coffee-liqueur", amount: 30 },
      { ingredientId: "espresso", amount: 1 },
    ],
    isActive: true,
  },
  {
    id: "manhattan",
    name: "Manhattan",
    description: "Ein starker und aromatischer Cocktail mit Whiskey, süßem Wermut und Angostura Bitter.",
    image: "/images/cocktails/manhattan.jpg",
    alcoholic: true,
    ingredients: ["50ml Rye Whiskey", "20ml Süßer Wermut", "2-3 Spritzer Angostura Bitter", "Maraschinokirsche"],
    recipe: [
      { ingredientId: "rye-whiskey", amount: 50 },
      { ingredientId: "sweet-vermouth", amount: 20 },
      { ingredientId: "angostura-bitters", amount: 2 },
    ],
    isActive: true,
  },
]
