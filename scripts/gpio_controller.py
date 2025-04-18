#!/usr/bin/env python3
import RPi.GPIO as GPIO
import sys
import time
import json

# GPIO-Modus setzen
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)

def setup_pin(pin):
    """Pin als Ausgang konfigurieren"""
    GPIO.setup(pin, GPIO.OUT)
    GPIO.output(pin, GPIO.LOW)

def activate_pump(pin, duration_ms):
    """Pumpe für die angegebene Zeit aktivieren"""
    try:
        # Pin als Ausgang konfigurieren
        setup_pin(pin)
        
        # Pumpe einschalten
        print(f"Setze Pin {pin} auf HIGH")
        GPIO.output(pin, GPIO.HIGH)
        
        # Warte für die angegebene Zeit
        time.sleep(duration_ms / 1000.0)
        
        # Pumpe ausschalten
        print(f"Setze Pin {pin} auf LOW")
        GPIO.output(pin, GPIO.LOW)
        
        return {"success": True}
    except Exception as e:
        print(f"Fehler beim Aktivieren der Pumpe an Pin {pin}: {str(e)}")
        return {"success": False, "error": str(e)}

def cleanup():
    """Alle Pins zurücksetzen"""
    GPIO.cleanup()
    return {"success": True}

if __name__ == "__main__":
    # Kommandozeilenargumente verarbeiten
    if len(sys.argv) < 2:
        print("Verwendung: python gpio_controller.py <command> [args...]")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "activate":
        if len(sys.argv) != 4:
            print("Verwendung: python gpio_controller.py activate <pin> <duration_ms>")
            sys.exit(1)
        
        pin = int(sys.argv[2])
        duration_ms = int(sys.argv[3])
        result = activate_pump(pin, duration_ms)
        print(json.dumps(result))
    
    elif command == "cleanup":
        result = cleanup()
        print(json.dumps(result))
    
    else:
        print(f"Unbekannter Befehl: {command}")
        sys.exit(1)
