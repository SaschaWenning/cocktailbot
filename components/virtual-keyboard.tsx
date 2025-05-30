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
  // Die Tastatur selbst sollte keine Klicks nach außen propagieren,
  // das wird durch das onClick={(e) => e.stopPropagation()} auf dem Wrapper in RecipeEditor gehandhabt.

  const numericKeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]
  const textKeys = [
    ["q", "w", "e", "r", "t", "z", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["y", "x", "c", "v", "b", "n", "m"],
  ]
  const specialKeys = [" ", ".", ",", "!", "?", "-", "_", "@", "#", ":", "/"]

  const handleKeyPress = (key: string) => {
    onKeyPress(key)
  }

  if (numericOnly) {
    return (
      <div className="bg-black border border-[hsl(var(--cocktail-card-border))] rounded-lg p-2 sm:p-4">
        {/* <div className="text-white text-sm mb-2">Zahlentastatur</div> */}
        <div className="grid grid-cols-3 gap-1 sm:gap-2 mb-2 sm:mb-4">
          {numericKeys.map((key) => (
            <Button
              key={key}
              onClick={() => handleKeyPress(key)}
              className="h-10 sm:h-12 text-base sm:text-lg bg-[hsl(var(--cocktail-card-bg))] text-white border border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
            >
              {key}
            </Button>
          ))}
          {allowDecimal && (
            <Button
              onClick={() => handleKeyPress(".")}
              className="h-10 sm:h-12 text-base sm:text-lg bg-[hsl(var(--cocktail-card-bg))] text-white border border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
            >
              .
            </Button>
          )}
          {/* Leere Zelle oder zusätzliche Taste, um das Layout zu vervollständigen, falls allowDecimal false ist */}
          {!allowDecimal && <div />}
          <Button // Zusätzliche Taste für 00, falls gewünscht, oder eine andere Funktion
            onClick={() => handleKeyPress("00")} // Beispiel: 00
            className="h-10 sm:h-12 text-base sm:text-lg bg-[hsl(var(--cocktail-card-bg))] text-white border border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
          >
            00
          </Button>
        </div>
        <div className="flex gap-1 sm:gap-2">
          <Button onClick={onBackspace} className="flex-1 h-10 sm:h-12 bg-orange-600 text-white hover:bg-orange-700">
            <BackspaceIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <Button onClick={onClear} className="flex-1 h-10 sm:h-12 bg-red-600 text-white hover:bg-red-700">
            <ClearIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <Button
            onClick={onCancel}
            className="flex-1 h-10 sm:h-12 bg-gray-600 text-white hover:bg-gray-700 text-xs sm:text-sm px-1"
          >
            <BanIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1" /> Abbr.
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 h-10 sm:h-12 bg-green-500 text-black hover:bg-green-600 text-xs sm:text-sm px-1"
          >
            <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1" /> OK
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-black border border-[hsl(var(--cocktail-card-border))] rounded-lg p-2 sm:p-4">
      {/* <div className="text-white text-sm mb-2">Texttastatur</div> */}
      {textKeys.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1 mb-1 sm:mb-2 justify-center">
          {row.map((key) => (
            <Button
              key={key}
              onClick={() => handleKeyPress(key)}
              className="h-9 sm:h-10 min-w-[2rem] sm:min-w-[2.5rem] text-xs sm:text-sm bg-[hsl(var(--cocktail-card-bg))] text-white border border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
            >
              {key.toUpperCase()}
            </Button>
          ))}
        </div>
      ))}

      <div className="flex gap-1 mb-2 sm:mb-4 justify-center flex-wrap">
        {specialKeys.map((key) => (
          <Button
            key={key}
            onClick={() => handleKeyPress(key)}
            className="h-9 sm:h-10 min-w-[2rem] sm:min-w-[2.5rem] text-xs sm:text-sm bg-[hsl(var(--cocktail-card-bg))] text-white border border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
          >
            {key === " " ? "SPACE" : key}
          </Button>
        ))}
      </div>

      <div className="flex gap-1 sm:gap-2">
        <Button onClick={onBackspace} className="flex-1 h-10 sm:h-12 bg-orange-600 text-white hover:bg-orange-700">
          <BackspaceIcon className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        <Button onClick={onClear} className="flex-1 h-10 sm:h-12 bg-red-600 text-white hover:bg-red-700">
          <ClearIcon className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        <Button
          onClick={onCancel}
          className="flex-1 h-10 sm:h-12 bg-gray-600 text-white hover:bg-gray-700 text-xs sm:text-sm px-1"
        >
          <BanIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1" /> Abbr.
        </Button>
        <Button
          onClick={onConfirm}
          className="flex-1 h-10 sm:h-12 bg-green-500 text-black hover:bg-green-600 text-xs sm:text-sm px-1"
        >
          <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1" /> OK
        </Button>
      </div>
    </div>
  )
}
