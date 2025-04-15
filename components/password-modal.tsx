"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Lock } from "lucide-react"

interface PasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function PasswordModal({ isOpen, onClose, onSuccess }: PasswordModalProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (password === "cocktail") {
      setError(false)
      setPassword("")
      onSuccess()
    } else {
      setError(true)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border-[hsl(var(--cocktail-card-border))] text-[hsl(var(--cocktail-text))] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Passwort erforderlich
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Bitte gib das Passwort ein, um Rezepte zu bearbeiten:</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`bg-[hsl(var(--cocktail-bg))] border-[hsl(var(--cocktail-card-border))] ${error ? "border-[hsl(var(--cocktail-error))]" : ""}`}
              placeholder="Passwort eingeben"
              autoComplete="off"
            />
            {error && (
              <p className="text-[hsl(var(--cocktail-error))] text-sm">Falsches Passwort. Bitte versuche es erneut.</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit">Bestätigen</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
