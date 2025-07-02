export interface Ingredient {
  id: string
  name: string
  category: string
  alcoholic: boolean
  color?: string
}

export const ingredients: Ingredient[] = [
  // Spirituosen
  { id: "vodka", name: "Wodka", category: "Spirituosen", alcoholic: true, color: "#ffffff" },
  { id: "rum_dark", name: "Dunkler Rum", category: "Spirituosen", alcoholic: true, color: "#8B4513" },
  { id: "rum_white", name: "Weißer Rum", category: "Spirituosen", alcoholic: true, color: "#ffffff" },
  { id: "tequila", name: "Tequila", category: "Spirituosen", alcoholic: true, color: "#ffffff" },
  { id: "gin", name: "Gin", category: "Spirituosen", alcoholic: true, color: "#ffffff" },
  { id: "whiskey", name: "Whiskey", category: "Spirituosen", alcoholic: true, color: "#D2691E" },
  { id: "brandy", name: "Weinbrand", category: "Spirituosen", alcoholic: true, color: "#CD853F" },

  // Liköre
  { id: "malibu", name: "Malibu Kokoslikör", category: "Liköre", alcoholic: true, color: "#ffffff" },
  { id: "peach_schnapps", name: "Pfirsichschnaps", category: "Liköre", alcoholic: true, color: "#FFCCCB" },
  { id: "blue_curacao", name: "Blauer Curaçao", category: "Liköre", alcoholic: true, color: "#0000FF" },
  { id: "triple_sec", name: "Triple Sec", category: "Liköre", alcoholic: true, color: "#ffffff" },
  { id: "amaretto", name: "Amaretto", category: "Liköre", alcoholic: true, color: "#8B4513" },
  { id: "kahlua", name: "Kahlúa", category: "Liköre", alcoholic: true, color: "#2F1B14" },
  { id: "sambuca", name: "Sambuca", category: "Liköre", alcoholic: true, color: "#ffffff" },

  // Säfte
  { id: "orange_juice", name: "Orangensaft", category: "Säfte", alcoholic: false, color: "#FFA500" },
  { id: "pineapple_juice", name: "Ananassaft", category: "Säfte", alcoholic: false, color: "#FFFF99" },
  { id: "cranberry_juice", name: "Cranberrysaft", category: "Säfte", alcoholic: false, color: "#DC143C" },
  { id: "lime_juice", name: "Limettensaft", category: "Säfte", alcoholic: false, color: "#32CD32" },
  { id: "lemon_juice", name: "Zitronensaft", category: "Säfte", alcoholic: false, color: "#FFFF00" },
  { id: "grapefruit_juice", name: "Grapefruitsaft", category: "Säfte", alcoholic: false, color: "#FF69B4" },
  { id: "apple_juice", name: "Apfelsaft", category: "Säfte", alcoholic: false, color: "#FFFF99" },
  { id: "tomato_juice", name: "Tomatensaft", category: "Säfte", alcoholic: false, color: "#FF6347" },

  // Erfrischungsgetränke
  { id: "cola", name: "Cola", category: "Erfrischungsgetränke", alcoholic: false, color: "#2F1B14" },
  { id: "sprite", name: "Sprite", category: "Erfrischungsgetränke", alcoholic: false, color: "#ffffff" },
  { id: "tonic_water", name: "Tonic Water", category: "Erfrischungsgetränke", alcoholic: false, color: "#ffffff" },
  { id: "soda_water", name: "Sodawasser", category: "Erfrischungsgetränke", alcoholic: false, color: "#ffffff" },
  { id: "ginger_beer", name: "Ginger Beer", category: "Erfrischungsgetränke", alcoholic: false, color: "#F5DEB3" },
  { id: "energy_drink", name: "Energy Drink", category: "Erfrischungsgetränke", alcoholic: false, color: "#FFFF00" },

  // Milchprodukte & Sahne
  { id: "milk", name: "Milch", category: "Milchprodukte", alcoholic: false, color: "#ffffff" },
  { id: "cream", name: "Sahne", category: "Milchprodukte", alcoholic: false, color: "#FFFACD" },
  { id: "coconut_cream", name: "Kokosmilch", category: "Milchprodukte", alcoholic: false, color: "#ffffff" },
  { id: "irish_cream", name: "Irish Cream", category: "Liköre", alcoholic: true, color: "#F5DEB3" },

  // Sirupe & Süßstoffe
  { id: "grenadine", name: "Grenadine", category: "Sirupe", alcoholic: false, color: "#DC143C" },
  { id: "simple_syrup", name: "Zuckersirup", category: "Sirupe", alcoholic: false, color: "#ffffff" },
  { id: "honey", name: "Honig", category: "Sirupe", alcoholic: false, color: "#FFD700" },
  { id: "agave_syrup", name: "Agavensirup", category: "Sirupe", alcoholic: false, color: "#DAA520" },

  // Bitters & Würzmittel
  { id: "angostura_bitters", name: "Angostura Bitter", category: "Bitters", alcoholic: true, color: "#8B0000" },
  { id: "worcestershire", name: "Worcestershire Sauce", category: "Würzmittel", alcoholic: false, color: "#8B4513" },
  { id: "tabasco", name: "Tabasco", category: "Würzmittel", alcoholic: false, color: "#FF0000" },
  { id: "salt", name: "Salz", category: "Würzmittel", alcoholic: false, color: "#ffffff" },
  { id: "pepper", name: "Pfeffer", category: "Würzmittel", alcoholic: false, color: "#000000" },

  // Wein & Sekt
  { id: "white_wine", name: "Weißwein", category: "Wein", alcoholic: true, color: "#FFFF99" },
  { id: "red_wine", name: "Rotwein", category: "Wein", alcoholic: true, color: "#722F37" },
  { id: "champagne", name: "Champagner", category: "Sekt", alcoholic: true, color: "#FFFF99" },
  { id: "prosecco", name: "Prosecco", category: "Sekt", alcoholic: true, color: "#FFFF99" },

  // Bier
  { id: "beer", name: "Bier", category: "Bier", alcoholic: true, color: "#FFD700" },
  { id: "wheat_beer", name: "Weißbier", category: "Bier", alcoholic: true, color: "#F5DEB3" },

  // Spezielle Zutaten
  { id: "ice", name: "Eis", category: "Sonstiges", alcoholic: false, color: "#ffffff" },
  { id: "mint", name: "Minze", category: "Kräuter", alcoholic: false, color: "#00FF00" },
  { id: "basil", name: "Basilikum", category: "Kräuter", alcoholic: false, color: "#00FF00" },
  { id: "cucumber", name: "Gurke", category: "Gemüse", alcoholic: false, color: "#00FF00" },

  // Deutsche Spezialitäten
  { id: "jaegermeister", name: "Jägermeister", category: "Kräuterlikör", alcoholic: true, color: "#2F1B14" },
  { id: "schnapps", name: "Schnaps", category: "Spirituosen", alcoholic: true, color: "#ffffff" },
  {
    id: "feuerzangenbowle",
    name: "Feuerzangenbowle-Mix",
    category: "Spezialitäten",
    alcoholic: true,
    color: "#722F37",
  },
  { id: "apfelkorn", name: "Apfelkorn", category: "Liköre", alcoholic: true, color: "#FFFF99" },
]
