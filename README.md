# CocktailBot

Eine automatische Cocktailmaschine, gesteuert über einen Raspberry Pi.

## Installation

1. Stelle sicher, dass Python 3 installiert ist:
   \`\`\`
   sudo apt update
   sudo apt install python3 python3-pip
   \`\`\`

2. Installiere die erforderlichen Python-Bibliotheken:
   \`\`\`
   sudo pip3 install RPi.GPIO
   \`\`\`

3. Installiere die Node.js-Abhängigkeiten:
   \`\`\`
   npm install
   \`\`\`

4. Mache das Python-Skript ausführbar:
   \`\`\`
   chmod +x scripts/gpio_controller.py
   \`\`\`

## Starten der Anwendung

\`\`\`
npm run dev
\`\`\`

## Hardware-Verbindungen

Die Relais sollten an die GPIO-Pins des Raspberry Pi angeschlossen sein, wie in der Datei `data/pump-config.ts` konfiguriert. Stelle sicher, dass die Pin-Nummern korrekt sind und dem BCM-Modus entsprechen.

## Fehlerbehebung

Wenn die Relais nicht geschaltet werden:

1. Überprüfe, ob das Python-Skript ausführbar ist:
   \`\`\`
   chmod +x scripts/gpio_controller.py
   \`\`\`

2. Teste das Python-Skript direkt:
   \`\`\`
   python3 scripts/gpio_controller.py activate 17 1000
   \`\`\`
   Dies sollte den Pin 17 für 1 Sekunde aktivieren.

3. Stelle sicher, dass der Benutzer, der die Node.js-Anwendung ausführt, Berechtigungen für die GPIO-Pins hat:
   \`\`\`
   sudo usermod -a -G gpio <username>
   \`\`\`
   Danach ist ein Neustart erforderlich.
