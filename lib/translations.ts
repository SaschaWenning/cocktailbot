export const translations = {
  // Navigation
  Cocktails: "Cocktails",
  Virgin: "Alkoholfrei",
  "Quick Shots": "Schnell-Shots",
  "Fill Levels": "Füllstände",
  Cleaning: "Reinigung",
  Calibration: "Kalibrierung",
  Edit: "Bearbeiten",
  "New Recipe": "Neues Rezept",

  // Cocktail Card
  Alcoholic: "Alkoholisch",
  "Non-Alcoholic": "Alkoholfrei",
  "Ingredients missing": "Zutaten fehlen",

  // Shot Selector
  "Select size": "Größe wählen",
  Prepare: "Zubereiten",
  Cancel: "Abbrechen",
  "Making cocktail": "Bereite Cocktail zu",
  completed: "abgeschlossen",

  // Recipe Editor/Creator
  "Edit Recipe": "Rezept bearbeiten",
  "Create New Recipe": "Neues Rezept erstellen",
  "Cocktail Name": "Cocktail-Name",
  Description: "Beschreibung",
  Type: "Typ",
  "With Alcohol": "Mit Alkohol",
  "Image (optional)": "Bild (optional)",
  Recipe: "Rezept",
  "Add Ingredient": "Zutat hinzufügen",
  Save: "Speichern",
  "Save Changes": "Änderungen speichern",
  "Delete Recipe": "Rezept löschen",
  "Saving...": "Speichere...",

  // Pump Cleaning
  "Pump Cleaning": "Pumpenreinigung",
  "Individual Pumps": "Einzelne Pumpen",
  "All Pumps": "Alle Pumpen",
  Clean: "Reinigen",
  "Clean All Pumps": "Alle Pumpen reinigen",
  "Cleaning...": "Reinige...",
  "Cleaning completed!": "Reinigung abgeschlossen!",

  // Pump Calibration
  "Pump Calibration": "Pumpenkalibrierung",
  "Select ingredient": "Zutat auswählen",
  Calibrate: "Kalibrieren",
  "Save Configuration": "Konfiguration speichern",
  "Reload Configuration": "Konfiguration neu laden",

  // Ingredient Levels
  "Ingredient Levels": "Füllstände der Zutaten",
  Refresh: "Aktualisieren",
  Refill: "Auffüllen",
  Edit: "Bearbeiten",
  "Low fill levels": "Niedrige Füllstände",

  // Password Modal
  "Enter Password": "Passwort eingeben",
  Password: "Passwort",
  Confirm: "Bestätigen",
  "Wrong password": "Falsches Passwort",

  // Delete Confirmation
  "Delete Cocktail": "Cocktail löschen",
  "Are you sure you want to delete": "Sind Sie sicher, dass Sie löschen möchten",
  "This action cannot be undone": "Diese Aktion kann nicht rückgängig gemacht werden",
  Delete: "Löschen",

  // Quick Shot Selector
  "Quick Shots": "Schnell-Shots",
  "Select Pump": "Pumpe auswählen",
  "Select Size": "Größe wählen",
  Small: "Klein",
  Normal: "Normal",
  Large: "Groß",
  "Prepare Shot": "Shot zubereiten",
  "Shot ready!": "Shot fertig!",

  // General
  ml: "ml",
  seconds: "Sekunden",
  "Loading...": "Lade...",
  Error: "Fehler",
  Success: "Erfolg",
  Close: "Schließen",
  Back: "Zurück",
  Next: "Weiter",
  Previous: "Zurück",
  Page: "Seite",
  of: "von",
}

export function t(key: string): string {
  return translations[key as keyof typeof translations] || key
}
