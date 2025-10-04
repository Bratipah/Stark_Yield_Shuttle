"use client"

import { Button } from "@/components/ui/button"
import { Rocket, Settings, LogOut } from "lucide-react"
import { useState } from "react"

export function DashboardHeader() {
  const [isConnected] = useState(true)

  return (
    <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Rocket className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Mission Control</h1>
            <p className="text-xs text-muted-foreground">Stark Yield Shuttle</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isConnected && (
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-success/10 border border-success/20">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
              <span className="text-sm text-success font-medium">Xverse Connected</span>
            </div>
          )}
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
