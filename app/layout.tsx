import type React from "react"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import ClientWrapper from "./ClientWrapper"

export const metadata = {
  title: "CocktailBot - Automatische Cocktailmaschine",
  description: "Steuere deine Cocktailmaschine mit dem Raspberry Pi",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="min-h-screen bg-[hsl(var(--cocktail-bg))] flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <ClientWrapper>
            <div className="flex-1">{children}</div>
            <footer className="py-4 text-center text-sm text-[hsl(var(--cocktail-text-muted))] border-t border-[hsl(var(--cocktail-card-border))] bg-[hsl(var(--cocktail-card-bg))]/30">
              © 2025 CocktailBot v2.0 - printcore@outlook.de
            </footer>
          </ClientWrapper>
        </ThemeProvider>
      </body>
    </html>
  )
}
