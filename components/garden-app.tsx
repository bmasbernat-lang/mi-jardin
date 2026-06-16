"use client"

import { useEffect, useState } from "react"
import { HomeScreen }      from "@/components/home-screen"
import { ScannerScreen }   from "@/components/scanner-screen"
import { DiagnosisScreen } from "@/components/diagnosis-screen"
import { CalendarScreen }  from "@/components/calendar-screen"
import { BottomNav }       from "@/components/bottom-nav"
import { AuthScreen }      from "@/components/auth-screen"
import { supabase }        from "@/lib/supabase"
import { signOut }         from "@/lib/auth"
import type { User }       from "@supabase/supabase-js"

export type Tab = "home" | "scanner" | "diagnosis" | "calendar"

export function GardenApp() {
  const [user, setUser]     = useState<User | null | undefined>(undefined)
  const [tab, setTab]       = useState<Tab>("home")
  const [diagData, setDiagData] = useState<{ image: string; result: string } | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (user === undefined) return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )

  if (!user) return <AuthScreen onAuth={() => {}} />

  function handleScanResult(image: string, result: string) {
    setDiagData({ image, result })
    setTab("diagnosis")
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-background">
      <main className="flex-1 overflow-y-auto">
        {tab === "home"      && <HomeScreen user={user} onSignOut={signOut} />}
        {tab === "scanner"   && <ScannerScreen onResult={handleScanResult} />}
        {tab === "diagnosis" && <DiagnosisScreen data={diagData} />}
        {tab === "calendar"  && <CalendarScreen />}
      </main>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}
