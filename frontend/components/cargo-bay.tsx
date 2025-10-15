import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bitcoin, Rocket, CircleDot } from "lucide-react"

const assets = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    balance: "0.5",
    usdValue: "$21,000",
    status: "ready",
    icon: Bitcoin,
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    balance: "2.1",
    usdValue: "$4,200",
    status: "ready",
    icon: CircleDot,
  },
]

export function CargoBay() {
  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold">Cargo Bay</h2>
          <p className="text-sm text-muted-foreground mt-1">Assets ready for launch</p>
        </div>

        <div className="space-y-3">
          {assets.map((asset) => (
            <div
              key={asset.symbol}
              className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <asset.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium">{asset.symbol}</div>
                  <div className="text-sm text-muted-foreground">{asset.name}</div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="font-medium">
                    {asset.balance} {asset.symbol}
                  </div>
                  <div className="text-sm text-muted-foreground">{asset.usdValue}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 rounded-full bg-success/10 border border-success/20 text-xs text-success font-medium">
                    On Pad
                  </div>
                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Rocket className="w-4 h-4 mr-1" />
                    Launch
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
