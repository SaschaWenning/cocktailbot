#!/usr/bin/env python3
"""
LED Client für Kommunikation mit Raspberry Pico 2
Sendet Befehle über /dev/ttyLED an das Pico
"""
import sys
import serial
import time
