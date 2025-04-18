#!/usr/bin/env python3
import RPi.GPIO as GPIO
import sys
import time
import json
import os

# GPIO-Modus setzen
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)

def setup_pins():
    """Alle Pins initialisieren"""
    try:
        # Versuche, die Pump-Config zu laden
        pump_config_path = os.path.join(os.getcwd(), "data", "pump-config.json")
        
        if os.path.exists(pump_config_path):
            with open(pump_config_path, "r") as pump_config_file:
                pump_config = json.load(pump_config_file)
            
            # Initialisiere alle Pins aus der Konfiguration
            for pump in pump_config:
                pin = pump["pin"]
                setup_pin(pin)
                # Stelle sicher, dass der Pin ausgeschaltet ist
                GPIO.output(pin, GPIO.LOW)
                print(f"Pin {pin} initialisiert und auf LOW gesetzt")
        else:
            print("Pump-Config-Datei nicht gefunden, verwende Standard-Pins")
            # Initialisiere Standard-Pins (1-28)
            for pin in range(1, 28):
                try:
                    setup_pin(pin)
                    GPIO.output(pin, GPIO.LOW)
                    print(f"Pin {pin} initialisiert und auf LOW gesetzt")
                except:
                    # Ignoriere Pins, die nicht existieren oder nicht konfiguriert werden können
                    pass
        
        return {"success": True}
    except Exception as e:
        print(f"Fehler beim Initialisieren der Pins: {str(e)}")
        return {"success": False, "error": str(e)}

def setup_pin(pin):
    """Pin als Ausgang konfigurieren"""
    GPIO.setup(pin, GPIO.OUT)
    GPIO.output(pin, GPIO.LOW)

def activate_pump(pin, duration_ms):
    """Pumpe für die angegebene Zeit aktivieren"""
    try:
        # Pin als Ausgang konfigurieren
        setup_pin(pin)
        
        # Stelle sicher, dass der Pin ausgeschaltet ist, bevor er eingeschaltet wird
        GPIO.output(pin, GPIO.LOW)
        time.sleep(0.05)  # Kurze Verzögerung
        
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
    
    if command == "setup":
        result = setup_pins()
        print(json.dumps(result))
    
    elif command == "activate":
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
        print(json.dumps({"success": False, "error": f"Unbekannter Befehl: {command}"}))
        sys.exit(1)
