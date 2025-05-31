"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { SkipBackIcon as BackspaceIcon, CloudyIcon as ClearIcon, CheckIcon, BanIcon } from "lucide-react"

interface AlphaKeyboardProps {
  onKeyPress: (key: string) => void
  onBackspace: () => void
  onClear: () => void
  onConfirm: () => void
  onCancel: () => void
}

const AlphaKeyboard: React.FC<AlphaKeyboardProps> = ({ onKeyPress, onBackspace, onClear, onConfirm, onCancel }) => {
  const keys = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Z", "X", "C", "V", "B", "N", "M"],
  ]

  const specialKeys = [".", ",", "-", "_", "@", "#", "/", ":", " "]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-black border border-[hsl(var(--cocktail-card-border))] rounded-lg p-4 max-w-lg w-full">
        <div className="mb-4">
          {keys.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center mb-2">
              {row.map((key) => (
                <Button
                  key={key}
                  onClick={() => onKeyPress(key.toLowerCase())}
                  className="h-10 w-10 m-1 bg-[hsl(var(--cocktail-card-bg))] text-white border border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
                >
                  {key}
                </Button>
              ))}
            </div>
          ))}
          <div className="flex justify-center mb-2">
            {specialKeys.map((key) => (
              <Button
                key={key}
                onClick={() => onKeyPress(key)}
                className="h-10 m-1 bg-[hsl(var(--cocktail-card-bg))] text-white border border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
              >
                {key === " " ? "Space" : key}
              </Button>
            ))}
          </div>
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

export default AlphaKeyboard
