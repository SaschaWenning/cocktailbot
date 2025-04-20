"use client"

import { Button } from "@/components/ui/button"
import { SkipBackIcon as Backspace, X, Check } from "lucide-react"

interface AlphaKeyboardProps {
  onKeyPress: (key: string) => void
  onBackspace: () => void
  onClear: () => void
  onConfirm: () => void
}

export default function AlphaKeyboard({ onKeyPress, onBackspace, onClear, onConfirm }: AlphaKeyboardProps) {
  // Erste Reihe: q bis p
  const row1 = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"]
  // Zweite Reihe: a bis l
  const row2 = ["a", "s", "d", "f", "g", "h", "j", "k", "l"]
  // Dritte Reihe: z bis m
  const row3 = ["z", "x", "c", "v", "b", "n", "m"]

  return (
    <div className="bg-black border border-[hsl(var(--cocktail-card-border))] rounded-lg p-2 shadow-lg">
      {/* Erste Reihe */}
      <div className="grid grid-cols-10 gap-1 mb-1">
        {row1.map((key) => (
          <Button
            key={key}
            className="h-12 text-lg font-medium bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))] hover:text-[hsl(var(--cocktail-primary))]"
            onClick={() => onKeyPress(key)}
          >
            {key}
          </Button>
        ))}
      </div>

      {/* Zweite Reihe - zentriert */}
      <div className="flex justify-center mb-1">
        <div className="grid grid-cols-9 gap-1">
          {row2.map((key) => (
            <Button
              key={key}
              className="h-12 text-lg font-medium bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))] hover:text-[hsl(var(--cocktail-primary))]"
              onClick={() => onKeyPress(key)}
            >
              {key}
            </Button>
          ))}
        </div>
      </div>

      {/* Dritte Reihe - zentriert */}
      <div className="flex justify-center mb-2">
        <div className="grid grid-cols-7 gap-1">
          {row3.map((key) => (
            <Button
              key={key}
              className="h-12 text-lg font-medium bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))] hover:text-[hsl(var(--cocktail-primary))]"
              onClick={() => onKeyPress(key)}
            >
              {key}
            </Button>
          ))}
        </div>
      </div>

      {/* Aktionstasten */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          className="h-12 text-lg font-medium text-[hsl(var(--cocktail-error))] bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-error))]/20"
          onClick={onClear}
        >
          <X className="h-6 w-6" />
        </Button>

        <Button
          className="h-12 text-lg font-medium bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
          onClick={onBackspace}
        >
          <Backspace className="h-6 w-6" />
        </Button>

        <Button
          className="h-12 text-lg font-medium bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
          onClick={onConfirm}
        >
          <Check className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}
