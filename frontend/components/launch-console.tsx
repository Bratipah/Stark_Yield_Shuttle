"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Rocket, ArrowRight, Info } from "lucide-react"
import { useState } from "react"

export function LaunchConsole() {
  const [amount, setAmount] = useState("0.5")
  const estimatedAPY = 5.2
  const estimatedValue = Number.parseFloat(amount) * 42000 // Mock BTC price

  return (
    <Card className="p-8 bg-gradient-to-br from-card to-primary/5 border-primary/20">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Rocket className="w-6 h-6 text-primary" />
              Launch Console
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Initiate your yield mission</p>
          </div>
          <div className="px-4 py-2 rounded-lg bg-success/10 border border-success/20">
            <div className="text-sm text-muted-foreground">Est. APY</div>
            <div className="text-xl font-bold text-success">{estimatedAPY}%</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-foreground">
              Amount to Launch
            </Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pr-20 text-lg h-14 bg-background border-border"
                placeholder="0.0"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">BTC</span>
                <Button size="sm" variant="ghost" className="h-8 text-xs">
                  MAX
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">≈ ${estimatedValue.toLocaleString()} USD</div>
          </div>

          <div className="p-4 rounded-lg bg-secondary/50 border border-border space-y-2">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-primary mt-0.5" />
              <div className="text-sm space-y-1">
                <p className="text-foreground font-medium">Launch Sequence Preview:</p>
                <ol className="text-muted-foreground space-y-1 ml-4 list-decimal">
                  <li>Bridge {amount} BTC to Starknet via Atomiq</li>
                  <li>Swap to WBTC on Starknet</li>
                  <li>Deploy to Vesu lending vault</li>
                </ol>
                <p className="text-muted-foreground">Estimated flight time: ~10 minutes</p>
              </div>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-lg py-6 group"
          >
            Launch to Yield
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
