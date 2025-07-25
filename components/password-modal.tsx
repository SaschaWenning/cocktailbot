"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  title?: string
  description?: string
}

export default function PasswordModal({
  isOpen,
  onClose,
  onSuccess,
  title = "Passwort erforderlich",
  description = "Bitte gib das Passwort ein, um fortzufahren:",
}: PasswordModalProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (password === "cocktail") {
      setPassword("")
      setError("")
      onSuccess()
    } else {
      setError("Falsches Passwort")
    }
  }

  const handleClose = () => {
    setPassword("")
    setError("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="bg-black border-[hsl(var(--cocktail-card-border))] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white">{description}</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white border-[hsl(var(--cocktail-card-border))] text-black"
              placeholder="Passwort eingeben..."
              autoFocus
            />
          </div>

          {error && (
            <Alert className="bg-[hsl(var(--cocktail-error))]/10 border-[hsl(var(--cocktail-error))]/30">
              <AlertCircle className="h-4 w-4 text-[hsl(var(--cocktail-error))]" />
              <AlertDescription className="text-[hsl(var(--cocktail-error))]">{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              className="bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
            >
              Bestätigen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
