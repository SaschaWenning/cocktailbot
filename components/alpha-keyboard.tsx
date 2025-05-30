"use client"

import type React from "react"
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

  const Button = ({
    children,
    onClick,
    className,
  }: { children: React.ReactNode; onClick: () => void; className?: string }) => (
    <button
      onClick={onClick}
      className={`rounded-md px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 ${className}`}
    >
      {children}
    </button>
  )

  return (
    <div className="flex flex-col items-center">
      {keys.map((row, rowIndex) => (
        <div key={rowIndex} className="flex space-x-1 mb-1">
          {row.map((key) => (
            <Button
              key={key}
              onClick={() => onKeyPress(key.toLowerCase())}
              className="h-10 bg-gray-200 text-gray-800 hover:bg-gray-300 px-3"
            >
              {key}
            </Button>
          ))}
        </div>
      ))}
      <div className="flex space-x-2">
        <Button onClick={onBackspace} className="h-10 bg-orange-500 text-white hover:bg-orange-600 px-3">
          <BackspaceIcon className="h-5 w-5" />
        </Button>
        <Button onClick={onClear} className="h-10 bg-red-500 text-white hover:bg-red-600 px-3">
          <ClearIcon className="h-5 w-5" />
        </Button>
        <Button onClick={onCancel} className="h-10 bg-gray-500 text-white hover:bg-gray-600 px-3">
          <BanIcon className="h-5 w-5 mr-1" /> Abbrechen
        </Button>
        <Button onClick={onConfirm} className="h-10 bg-green-500 text-black hover:bg-green-600 px-3">
          <CheckIcon className="h-5 w-5 mr-1" /> OK
        </Button>
      </div>
    </div>
  )
}

export default AlphaKeyboard
