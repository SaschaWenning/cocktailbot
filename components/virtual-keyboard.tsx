"use client"

import { Button } from "@/components/ui/button"
import { X, Check, ArrowLeft } from "lucide-react"

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void
  onBackspace: () => void
  onClear: () => void
  onConfirm: () => void
  onCancel: () => void
  layout: "alphanumeric" | "numeric"
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
    [".", "0", "00"],
  ]

  const currentKeys = layout === "numeric" ? numericKeys : alphanumericKeys

  return (
    <div className="bg-black border border-[hsl(var(--cocktail-card-border))] rounded-lg p-2 shadow-lg w-full">
      <div className="space-y-1">
        {" "}
        {/* Reduced gap */}
        {currentKeys.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1">
            {row.map((key) => (
              <Button
                key={key}
                onClick={() => onKeyPress(key)}
                className="flex-1 h-10 text-base bg-[hsl(var(--cocktail-card-bg))] text-white hover:bg-[hsl(var(--cocktail-card-border))]" // Smaller height and font
              >
                {key}
              </Button>
            ))}
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-1 mt-2">
        {" "}
        {/* Reduced margin-top */}
        <Button onClick={onBackspace} className="flex-1 h-10 text-base bg-red-600 text-white hover:bg-red-700">
          <ArrowLeft className="h-5 w-5" /> {/* Smaller icon */}
        </Button>
        <Button onClick={onClear} className="flex-1 h-10 text-base bg-yellow-600 text-white hover:bg-yellow-700">
          <X className="h-5 w-5" />
        </Button>
        <Button onClick={onCancel} className="flex-1 h-10 text-base bg-gray-600 text-white hover:bg-gray-700">
          Abbrechen
        </Button>
        <Button onClick={onConfirm} className="flex-1 h-10 text-base bg-green-600 text-white hover:bg-green-700">
          <Check className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
