"use client"

import { Button } from "@/components/ui/button"
import { SkipBackIcon as BackspaceIcon, CloudyIcon as ClearIcon, CheckIcon, BanIcon } from "lucide-react"

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void
  onBackspace: () => void
  onClear: () => void
  onConfirm: () => void
  onCancel: () => void
  allowDecimal?: boolean
  numericOnly?: boolean
}

export default function VirtualKeyboard({
  onKeyPress,
  onBackspace,
  onClear,
  onConfirm,
  onCancel,
  allowDecimal = false,
  numericOnly = false,
}: VirtualKeyboardProps) {
  const numericKeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-black border border-[hsl(var(--cocktail-card-border))] rounded-lg p-4 max-w-md w-full">
        <div className="grid grid-cols-3 gap-2 mb-4">
          {numericKeys.map((key) => (
            <Button
              key={key}
              onClick={() => onKeyPress(key)}
              className="h-12 text-lg bg-[hsl(var(--cocktail-card-bg))] text-white border border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
            >
              {key}
            </Button>
          ))}
          {allowDecimal && (
            <Button
              onClick={() => onKeyPress(".")}
              className="h-12 text-lg bg-[hsl(var(--cocktail-card-bg))] text-white border border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
            >
              .
            </Button>
          )}
          <Button
            onClick={() => onKeyPress("00")}
            className="h-12 text-lg bg-[hsl(var(--cocktail-card-bg))] text-white border border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
          >
            00
          </Button>
        </div>
        <div className="flex justify-between">
          <Button onClick={onBackspace} className="flex-1 mr-2 bg-orange-600 text-white hover:bg-orange-700">
            <BackspaceIcon className="h-5 w-5 mr-1" /> Löschen
          </Button>
          <Button onClick={onClear} className="flex-1 mr-2 bg-red-600 text-white hover:bg-red-700">
            <ClearIcon className="h-5 w-5 mr-1" /> Alles löschen
          </Button>
          <Button onClick={onCancel} className="flex-1 mr-2 bg-gray-600 text-white hover:bg-gray-700">
            <BanIcon className="h-5 w-5 mr-1" /> Abbrechen
          </Button>
          <Button onClick={onConfirm} className="flex-1 bg-green-500 text-black hover:bg-green-600">
            <CheckIcon className="h-5 w-5 mr-1" /> OK
          </Button>
        </div>
      </div>
    </div>
  )
}
