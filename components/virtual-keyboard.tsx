"use client"

import { Button } from "@/components/ui/button"
import { X, Check, ArrowLeft } from "lucide-react"

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void
  onBackspace: () => void
  onClear: () => void
  onConfirm: () => void
  onCancel: () => void
  layout: "alphanumeric" | "numeric" // 'alphanumeric' oder 'numeric'
}

export default function VirtualKeyboard({
  onKeyPress,
  onBackspace,
  onClear,
  onConfirm,
  onCancel,
  layout,
}: VirtualKeyboardProps) {
  const alphanumericKeys = [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    ["Q", "W", "E", "R", "T", "Z", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Y", "X", "C", "V", "B", "N", "M"],
    [" ", "-", "_", ".", "@", "#", "&"],
  ]

  const numericKeys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [".", "0", "00"], // Hinzugefügt für Dezimalzahlen und schnelle Eingabe
  ]

  const currentKeys = layout === "numeric" ? numericKeys : alphanumericKeys

  return (
    <div className="bg-black border border-[hsl(var(--cocktail-card-border))] rounded-lg p-4 shadow-lg">
      <div className="space-y-2">
        {currentKeys.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1">
            {row.map((key) => (
              <Button
                key={key}
                onClick={() => onKeyPress(key)}
                className="flex-1 h-12 text-lg bg-[hsl(var(--cocktail-card-bg))] text-white hover:bg-[hsl(var(--cocktail-card-border))]"
              >
                {key}
              </Button>
            ))}
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-1 mt-4">
        <Button onClick={onBackspace} className="flex-1 h-12 text-lg bg-red-600 text-white hover:bg-red-700">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <Button onClick={onClear} className="flex-1 h-12 text-lg bg-yellow-600 text-white hover:bg-yellow-700">
          <X className="h-6 w-6" />
        </Button>
        <Button onClick={onCancel} className="flex-1 h-12 text-lg bg-gray-600 text-white hover:bg-gray-700">
          Abbrechen
        </Button>
        <Button onClick={onConfirm} className="flex-1 h-12 text-lg bg-green-600 text-white hover:bg-green-700">
          <Check className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}
