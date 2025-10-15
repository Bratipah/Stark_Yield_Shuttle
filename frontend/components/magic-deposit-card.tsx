"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, ArrowRight, TrendingUp } from "lucide-react"

interface MagicDepositCardProps {
  onDeposit: () => void
}

export function MagicDepositCard({ onDeposit }: MagicDepositCardProps) {
  return (
    <Card className="p-8 bg-gradient-to-br from-primary/10 via-card to-success/10 border-primary/30 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-success/5 rounded-full blur-3xl animate-pulse-glow" />

      <div className="relative z-10 space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <h3 className="text-2xl font-bold">Ready to Launch</h3>
            </div>
            <p className="text-muted-foreground">You have idle assets that could be earning yield</p>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-background/50 backdrop-blur-sm border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Suggested Deposit</p>
              <p className="text-3xl font-bold">0.5 BTC</p>
              <p className="text-sm text-muted-foreground mt-1">≈ $21,000 USD</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Estimated APY</p>
              <p className="text-3xl font-bold text-success">5.2%</p>
              <div className="flex items-center gap-1 text-xs text-success mt-1">
                <TrendingUp className="w-3 h-3" />
                <span>Vesu WBTC Vault</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Estimated Yearly Earnings</span>
              <span className="font-bold text-success text-lg">$1,092</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Estimated Monthly Earnings</span>
              <span className="font-semibold text-success">$91</span>
            </div>
          </div>
        </div>

        <Button onClick={onDeposit} size="lg" className="w-full bg-primary hover:bg-primary/90 text-lg py-6 group">
          <Sparkles className="w-5 h-5 mr-2" />
          Deposit & Start Earning
          <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          One-click automation: Bridge → Swap → Deploy to Vesu. Takes ~10 minutes.
        </p>
      </div>
    </Card>
  )
}
