import { Card } from "@/components/ui/card"
import { TrendingUp, Users, Zap, Shield } from "lucide-react"

const stats = [
  {
    icon: TrendingUp,
    value: "5.2%",
    label: "Average APY",
    description: "Competitive yields on your Bitcoin",
    color: "text-success",
  },
  {
    icon: Users,
    value: "1,247",
    label: "Active Users",
    description: "Growing community of Bitcoin earners",
    color: "text-primary",
  },
  {
    icon: Zap,
    value: "< 10 min",
    label: "Launch Time",
    description: "From BTC to earning in minutes",
    color: "text-accent",
  },
  {
    icon: Shield,
    value: "100%",
    label: "Self-Custody",
    description: "Your keys, your coins, always",
    color: "text-foreground",
  },
]

export function StatsSection() {
  return (
    <section id="stats" className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">Mission Statistics</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
            Real-time data from the Stark Yield Shuttle fleet
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="p-6 space-y-4 bg-card border-border hover:border-primary/30 transition-all hover:scale-105"
            >
              <div className={`w-12 h-12 rounded-lg bg-secondary flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="text-sm font-medium text-foreground">{stat.label}</div>
                <div className="text-sm text-muted-foreground">{stat.description}</div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
