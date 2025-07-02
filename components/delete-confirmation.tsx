"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Loader2 } from "lucide-react"

interface DeleteConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  cocktailName: string
}

export default function DeleteConfirmation({ isOpen, onClose, onConfirm, cocktailName }: DeleteConfirmationProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState("")

  const handleConfirm = async () => {
    setIsDeleting(true)
    setError("")

    try {
      await onConfirm()
      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unbekannter Fehler")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    if (!isDeleting) {
      setError("")
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-black border-[hsl(var(--cocktail-card-border))] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Cocktail löschen
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-white mb-4">
            Sind Sie sicher, dass Sie den Cocktail <strong>"{cocktailName}"</strong> löschen möchten?
          </p>

          <Alert className="bg-red-600/10 border-red-600/30">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-400">
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert className="mt-4 bg-red-600/10 border-red-600/30">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-400">{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
            className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
          >
            Abbrechen
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Lösche...
              </>
            ) : (
              "Löschen"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
