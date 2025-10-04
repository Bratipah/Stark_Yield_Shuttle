"use client"

import { Card } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  { date: "Jan 1", earnings: 0 },
  { date: "Jan 8", earnings: 12.5 },
  { date: "Jan 15", earnings: 28.3 },
  { date: "Jan 22", earnings: 45.8 },
  { date: "Jan 29", earnings: 67.2 },
  { date: "Feb 5", earnings: 89.4 },
  { date: "Feb 12", earnings: 124.32 },
]

export function EarningsChart() {
  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Total Earnings</h3>
          <p className="text-3xl font-bold text-success mt-1">$124.32</p>
          <p className="text-sm text-muted-foreground mt-1">+$15.21 this week</p>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-success/10 border border-success/20 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-success" />
          <span className="text-sm font-medium text-success">+18.2%</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Area
            type="monotone"
            dataKey="earnings"
            stroke="hsl(var(--success))"
            strokeWidth={2}
            fill="url(#earningsGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}
