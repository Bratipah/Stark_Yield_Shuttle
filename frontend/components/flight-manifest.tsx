import { Card } from "@/components/ui/card"
import { TrendingUp, Wallet, Rocket } from "lucide-react"

export function FlightManifest() {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Card className="p-6 space-y-4 bg-card border-border">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Total Cargo Value</div>
          <Wallet className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <div className="text-3xl font-bold">$12,458.32</div>
          <div className="text-sm text-muted-foreground">0.5 BTC + 2.1 ETH</div>
        </div>
      </Card>

      <Card className="p-6 space-y-4 bg-card border-border">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Assets in Orbit</div>
          <Rocket className="w-5 h-5 text-primary" />
        </div>
        <div className="space-y-1">
          <div className="text-3xl font-bold text-primary">$8,234.12</div>
          <div className="text-sm text-success">+$124.32 earned</div>
        </div>
      </Card>

      <Card className="p-6 space-y-4 bg-card border-border">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Current APY</div>
          <TrendingUp className="w-5 h-5 text-success" />
        </div>
        <div className="space-y-1">
          <div className="text-3xl font-bold text-success">5.2%</div>
          <div className="text-sm text-muted-foreground">Vesu WBTC Vault</div>
        </div>
      </Card>
    </div>
  )
}
