import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, ArrowDownToLine } from "lucide-react"

const positions = [
  {
    vault: "Vesu WBTC Vault",
    apy: "5.2%",
    deployed: "0.1 WBTC",
    usdValue: "$4,200",
    earned: "$124.32",
    earnedPercent: "+2.96%",
  },
  {
    vault: "Vesu ETH Vault",
    apy: "4.8%",
    deployed: "1.5 ETH",
    usdValue: "$3,000",
    earned: "$48.12",
    earnedPercent: "+1.60%",
  },
]

export function ActiveOrbits() {
  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Active Orbits</h2>
            <p className="text-sm text-muted-foreground mt-1">Your deployed assets earning yield</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Total Earnings</div>
            <div className="text-2xl font-bold text-success">$172.44</div>
          </div>
        </div>

        <div className="space-y-4">
          {positions.map((position, index) => (
            <Card key={index} className="p-6 bg-secondary/30 border-border space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-bold text-lg">{position.vault}</h3>
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-1 rounded bg-success/10 border border-success/20 text-xs text-success font-medium">
                      APY {position.apy}
                    </div>
                    <div className="text-sm text-muted-foreground">In Orbit</div>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="border-border hover:bg-secondary bg-transparent">
                  <ArrowDownToLine className="w-4 h-4 mr-2" />
                  Return to Base
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                <div>
                  <div className="text-sm text-muted-foreground">Deployed</div>
                  <div className="font-medium mt-1">{position.deployed}</div>
                  <div className="text-xs text-muted-foreground">{position.usdValue}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Earned</div>
                  <div className="font-medium mt-1 text-success">{position.earned}</div>
                  <div className="text-xs text-success">{position.earnedPercent}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="flex items-center gap-2 mt-1">
                    <TrendingUp className="w-4 h-4 text-success" />
                    <span className="text-sm font-medium text-success">Earning</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Card>
  )
}
