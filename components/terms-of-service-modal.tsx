"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TermsOfServiceModalProps {
  isOpen: boolean
  onAccept: () => void
}

export default function TermsOfServiceModal({ isOpen, onAccept }: TermsOfServiceModalProps) {
  const [hasAccepted, setHasAccepted] = useState(false)

  const handleAccept = () => {
    if (hasAccepted) {
      onAccept()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[80vh]" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Nutzungsbedingungen</DialogTitle>
          <DialogDescription>
            Bitte lesen Sie die folgenden Bedingungen sorgfältig durch und akzeptieren Sie diese, um fortzufahren.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
          <div className="space-y-4 text-sm leading-relaxed">
            <p className="font-medium text-foreground">
              Diese Software und die dazugehörige Bauanleitung sind ausschließlich für den privaten Gebrauch bestimmt.
            </p>

            <p>
              Jegliche gewerbliche Nutzung - insbesondere der Bau und Verkauf von Maschinen, die Nutzung in Gastronomie
              oder auf Events sowie die kommerzielle Verwendung der Software - ist ohne vorherige schriftliche
              Lizenzvereinbarung mit dem Urheber nicht gestattet.
            </p>

            <p>
              Mit dem Fortfahren bestätigen Sie, dass Sie diese Bedingungen gelesen, verstanden und akzeptiert haben.
            </p>

            <p className="font-medium">
              Kontakt für Lizenzanfragen: <span className="text-blue-600">printcore@outlook.de</span>
            </p>
          </div>
        </ScrollArea>

        <div className="flex items-center space-x-2 py-4">
          <Checkbox
            id="accept-terms"
            checked={hasAccepted}
            onCheckedChange={(checked) => setHasAccepted(checked as boolean)}
          />
          <label
            htmlFor="accept-terms"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Ich akzeptiere die Nutzungsbedingungen
          </label>
        </div>

        <DialogFooter>
          <Button onClick={handleAccept} disabled={!hasAccepted} className="w-full">
            Fortfahren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
