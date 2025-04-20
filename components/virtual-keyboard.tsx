"use client"

import { Button } from "@/components/ui/button"
import { SkipBackIcon as Backspace, X, Check } from "lucide-react"

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void
  onBackspace: () => void
  onClear: () => void
  onConfirm: () => void
  allowDecimal?: boolean
}

export default function VirtualKeyboard({
  onKeyPress,
  onBackspace,
  onClear,
  onConfirm,
  allowDecimal = true,
}: VirtualKeyboardProps) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]

  return (
    <div className="bg-black border border-[hsl(var(--cocktail-card-border))] rounded-lg p-2 shadow-lg">
      <div className="grid grid-cols-3 gap-2">
        {keys.map((key) => (
          <Button
            key={key}
            className="h-14 text-xl font-medium bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))] hover:text-[hsl(var(--cocktail-primary))]"
            onClick={() => onKeyPress(key)}
          >
            {key}
          </Button>
        ))}

        {allowDecimal && (
          <Button
            className="h-14 text-xl font-medium bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))] hover:text-[hsl(var(--cocktail-primary))]"
            onClick={() => onKeyPress(".")}
          >
            .
          </Button>
        )}

        <Button
          className="h-14 text-xl font-medium text-[hsl(var(--cocktail-error))] bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-error))]/20"
          onClick={onClear}
        >
          <X className="h-6 w-6" />
        </Button>

        <Button
          className="h-14 text-xl font-medium bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
          onClick={onBackspace}
        >
          <Backspace className="h-6 w-6" />
        </Button>

        <Button
          className="h-14 text-xl font-medium col-span-3 bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
          onClick={onConfirm}
        >
          <Check className="h-6 w-6 mr-2" />
          Bestätigen
        </Button>
      </div>
    </div>
  )
}
