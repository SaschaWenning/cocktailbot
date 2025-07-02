"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Lock } from "lucide-react"
import VirtualKeyboard from "./virtual-keyboard"

interface PasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function PasswordModal({ isOpen, onClose, onSuccess }: PasswordModalProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showKeyboard, setShowKeyboard] = useState(false)

  const correctPassword = "1234" // In einer echten Anwendung sollte dies sicher gespeichert werden

  const handleSubmit = () => {
    if (password === correctPassword) {
      setPassword("")
      setError("")
      setShowKeyboard(false)
      onSuccess()
    } else {
      setError("Falsches Passwort")
      setPassword("")
    }
  }

  const handleClose = () => {
    setPassword("")
    setError("")
    setShowKeyboard(false)
    onClose()
  }

  const handleKeyPress = (key: string) => {
    setPassword((prev) => prev + key)
    setError("")
  }

  const handleBackspace = () => {
    setPassword((prev) => prev.slice(0, -1))
  }

  const handleClear = () => {
    setPassword("")
    setError("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-black border-[hsl(var(--cocktail-card-border))] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-[hsl(var(--cocktail-primary))]" />
            Passwort eingeben
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">
              Passwort
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              readOnly
              placeholder="Passwort eingeben"
              className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] text-center text-xl"
              onFocus={() => setShowKeyboard(true)}
            />
          </div>

          {error && (
            <Alert className="bg-red-600/10 border-red-600/30">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-400">{error}</AlertDescription>
            </Alert>
          )}

          {showKeyboard && (
            <VirtualKeyboard
              onKeyPress={handleKeyPress}
              onBackspace={handleBackspace}
              onClear={handleClear}
              onConfirm={handleSubmit}
              allowDecimal={false}
              isPassword={true}
            />
          )}

          {!showKeyboard && (
            <div className="flex gap-2">
              <Button
                onClick={() => setShowKeyboard(true)}
                className="flex-1 bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
              >
                Tastatur öffnen
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
              >
                Abbrechen
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
