"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SkipBackIcon as BackspaceIcon, CloudyIcon as ClearIcon, CheckIcon, BanIcon } from "lucide-react"

interface VirtualKeyboardProps {
  targetInput: HTMLInputElement | null
  initialValue: string
  onClose: () => void
  onConfirm: (value: string) => void
  allowDecimal?: boolean
  maxLength?: number
}

export default function VirtualKeyboard({
  targetInput,
  initialValue,
  onClose,
  onConfirm,
  allowDecimal = false,
  maxLength = 4,
}: VirtualKeyboardProps) {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const numericKeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]

  const handleKeyPress = (key: string) => {
    if (value.length < maxLength) {
      if (key === "." && (!allowDecimal || value.includes("."))) return
      setValue((prev) => prev + key)
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
      <DialogContent className="bg-black border-[hsl(var(--cocktail-card-border))] text-white sm:max-w-md">
        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              value={value}
              readOnly
              className="bg-[hsl(var(--cocktail-bg))] border-[hsl(var(--cocktail-card-border))] text-white text-center text-lg"
              placeholder="0"
            />
            <div className="text-xs text-center text-gray-400">
              {value.length}/{maxLength} Zeichen
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {numericKeys.map((key) => (
              <Button
                key={key}
                onClick={() => handleKeyPress(key)}
                className="h-12 text-lg bg-[hsl(var(--cocktail-card-bg))] text-white border border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
              >
                {key}
              </Button>
            ))}
            {allowDecimal && (
              <Button
                onClick={() => handleKeyPress(".")}
                className="h-12 text-lg bg-[hsl(var(--cocktail-card-bg))] text-white border border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
              >
                .
              </Button>
            )}
            <Button
              onClick={() => handleKeyPress("00")}
              className="h-12 text-lg bg-[hsl(var(--cocktail-card-bg))] text-white border border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
            >
              00
            </Button>
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
