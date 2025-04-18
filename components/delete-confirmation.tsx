"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DeleteConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  cocktailName: string
}

export default function DeleteConfirmation({ isOpen, onClose, onConfirm, cocktailName }: DeleteConfirmationProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password === "cocktail") {
      setError(false)
      setIsDeleting(true)

      try {
        await onConfirm()
        setPassword("")
        onClose()
      } catch (error) {
        console.error("Fehler beim Löschen:", error)
      } finally {
        setIsDeleting(false)
      }
    } else {
      setError(true)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border-[hsl(var(--cocktail-card-border))] text-[hsl(var(--cocktail-text))] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[hsl(var(--cocktail-error))]" />
            Cocktail löschen
          </DialogTitle>
        </DialogHeader>

        <Alert className="bg-[hsl(var(--cocktail-error))]/10 border-[hsl(var(--cocktail-error))]/30">
          <AlertDescription className="text-[hsl(var(--cocktail-text))]">
            Möchtest du den Cocktail <strong>{cocktailName}</strong> wirklich löschen? Diese Aktion kann nicht
            rückgängig gemacht werden.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Bitte gib das Passwort ein, um das Löschen zu bestätigen:</Label>
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
            <Button type="submit" variant="destructive" disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird gelöscht...
                </>
              ) : (
                "Löschen bestätigen"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
