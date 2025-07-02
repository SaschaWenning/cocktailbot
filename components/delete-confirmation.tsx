"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface DeleteConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  cocktailName: string
}

export default function DeleteConfirmation({ isOpen, onClose, onConfirm, cocktailName }: DeleteConfirmationProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Cocktail löschen
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-white">
            Sind Sie sicher, dass Sie den Cocktail <strong>"{cocktailName}"</strong> löschen möchten?
          </p>
          <p className="text-gray-300 text-sm mt-2">Diese Aktion kann nicht rückgängig gemacht werden.</p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))]"
          >
            Abbrechen
          </Button>
          <Button variant="destructive" onClick={handleConfirm} className="bg-red-600 hover:bg-red-700">
            Löschen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
