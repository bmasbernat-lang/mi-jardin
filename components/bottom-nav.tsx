"use client"

import { Home, ScanLine, Stethoscope, Calendar } from "lucide-react"
import type { Tab } from "@/components/garden-app"

const tabs: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Inicio", icon: Home },
  { id: "scanner", label: "Escáner", icon: ScanLine },
  { id: "diagnosis", label: "Diagnóstico", icon: Stethoscope },
  { id: "calendar", label: "Calendario", icon: Calendar },
]

export function BottomNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav
      aria-label="Navegación principal"
      className="sticky bottom-0 z-10 border-t border-border bg-card/95 backdrop-blur"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 py-2">
        {tabs.map((tab) => {
          const isActive = active === tab.id
          return (
            <li key={tab.id} className="flex-1">
              <button
                onClick={() => onChange(tab.id)}
                aria-current={isActive ? "page" : undefined}
                className={`flex w-full flex-col items-center gap-1 rounded-2xl py-2 text-xs font-medium transition ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <span
                  className={`flex items-center justify-center rounded-full px-4 py-1 transition ${
                    isActive ? "bg-primary/10" : ""
                  }`}
                >
                  <tab.icon className="size-5" />
                </span>
                {tab.label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
