"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SkipBackIcon as BackspaceIcon, CloudyIcon as ClearIcon, CheckIcon, BanIcon } from "lucide-react"

interface AlphaKeyboardProps {
  targetInput: HTMLInputElement | HTMLTextAreaElement | null
  initialValue: string
  onClose: () => void
  onConfirm: (value: string) => void
  maxLength?: number
}

export default function AlphaKeyboard({
  targetInput,
  initialValue,
  onClose,
  onConfirm,
  maxLength = 100,
}: AlphaKeyboardProps) {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const keys = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Z", "X", "C", "V", "B", "N", "M"],
  ]

  const specialKeys = [".", ",", "-", "_", "@", "#", "/", ":", " "]

  const handleKeyPress = (key: string) => {
    if (value.length < maxLength) {
      setValue((prev) => prev + key.toLowerCase())
    }
  }

  const handleBackspace = () => {
    setValue((prev) => prev.slice(0, -1))
  }

  const handleClear = () => {
    setValue("")
  }

  const handleConfirm = () => {
    onConfirm(value)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-black border-[hsl(var(--cocktail-card-border))] text-white sm:max-w-lg">
        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              value={value}
              readOnly
              className="bg-[hsl(var(--cocktail-bg))] border-[hsl(var(--cocktail-card-border))] text-white text-center"
              placeholder="Eingabe..."
            />
            <div className="text-xs text-center text-gray-400">
              {value.length}/{maxLength} Zeichen
            </div>
          </div>

          <div className="space-y-2">
            {keys.map((row, rowIndex) => (
              <div key={rowIndex} className="flex justify-center gap-1">
                {row.map((key) => (
                  <Button
                    key={key}
                    onClick={() => handleKeyPress(key)}
                    className="h-10 w-10 bg-[hsl(var(--cocktail-card-bg))] text-white border border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
                  >
                    {key}
                  </Button>
                ))}
              </div>
            ))}
            <div className="flex justify-center gap-1 flex-wrap">
              {specialKeys.map((key) => (
                <Button
                  key={key}
                  onClick={() => handleKeyPress(key)}
                  className="h-10 min-w-[2.5rem] bg-[hsl(var(--cocktail-card-bg))] text-white border border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
                >
                  {key === " " ? "Space" : key}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleBackspace} className="flex-1 bg-orange-600 text-white hover:bg-orange-700">
              <BackspaceIcon className="h-4 w-4 mr-1" /> Löschen
            </Button>
            <Button onClick={handleClear} className="flex-1 bg-red-600 text-white hover:bg-red-700">
              <ClearIcon className="h-4 w-4 mr-1" /> Alles
            </Button>
            <Button onClick={onClose} className="flex-1 bg-gray-600 text-white hover:bg-gray-700">
              <BanIcon className="h-4 w-4 mr-1" /> Abbrechen
            </Button>
            <Button onClick={handleConfirm} className="flex-1 bg-green-500 text-black hover:bg-green-600">
              <CheckIcon className="h-4 w-4 mr-1" /> OK
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
