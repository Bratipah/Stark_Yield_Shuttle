"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bitcoin, Coins, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { useState } from "react"

interface Asset {
  symbol: string
  name: string
  balance: number
  value: number
  icon: "bitcoin" | "eth"
  status: "idle" | "earning"
  apy?: number
}

interface AssetTableProps {
  onDeposit: (asset: Asset) => void
  onWithdraw: (asset: Asset) => void
}

export function AssetTable({ onDeposit, onWithdraw }: AssetTableProps) {
  const [assets] = useState<Asset[]>([
    {
      symbol: "BTC",
      name: "Bitcoin",
      balance: 0.5,
      value: 21000,
      icon: "bitcoin",
      status: "idle",
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      balance: 2.1,
      value: 6300,
      icon: "eth",
      status: "idle",
    },
    {
      symbol: "WBTC",
      name: "Wrapped Bitcoin",
      balance: 0.1,
      value: 4200,
      icon: "bitcoin",
      status: "earning",
      apy: 5.2,
    },
  ])

  return (
    <Card className="p-6 bg-card border-border">
      <h3 className="text-lg font-semibold mb-4">Your Assets</h3>

      <div className="space-y-3">
        {assets.map((asset) => (
          <div
            key={asset.symbol}
            className="p-4 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    asset.icon === "bitcoin" ? "bg-[#FF9500]/20" : "bg-primary/20"
                  }`}
                >
                  {asset.icon === "bitcoin" ? (
                    <Bitcoin className="w-6 h-6 text-[#FF9500]" />
                  ) : (
                    <Coins className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div>
                  <div className="font-semibold">{asset.symbol}</div>
                  <div className="text-sm text-muted-foreground">{asset.name}</div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="font-semibold">
                    {asset.balance} {asset.symbol}
                  </div>
                  <div className="text-sm text-muted-foreground">${asset.value.toLocaleString()}</div>
                </div>

                <div className="text-right min-w-[80px]">
                  {asset.status === "earning" ? (
                    <div className="text-sm">
                      <div className="text-success font-semibold">{asset.apy}% APY</div>
                      <div className="text-xs text-muted-foreground">Earning</div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Idle</div>
                  )}
                </div>

                {asset.status === "idle" ? (
                  <Button
                    onClick={() => onDeposit(asset)}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 min-w-[100px]"
                  >
                    <ArrowUpRight className="w-4 h-4 mr-1" />
                    Deposit
                  </Button>
                ) : (
                  <Button
                    onClick={() => onWithdraw(asset)}
                    size="sm"
                    variant="outline"
                    className="border-border min-w-[100px]"
                  >
                    <ArrowDownRight className="w-4 h-4 mr-1" />
                    Withdraw
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
