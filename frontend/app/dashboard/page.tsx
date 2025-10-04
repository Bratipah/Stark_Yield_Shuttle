"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { MagicDepositCard } from "@/components/magic-deposit-card"
import { EarningsChart } from "@/components/earnings-chart"
import { AssetTable } from "@/components/asset-table"
import { TransactionPreviewModal } from "@/components/transaction-preview-modal"
import { AnimatedBackground } from "@/components/animated-background"
import { Card } from "@/components/ui/card"
import { TrendingUp, Wallet, Rocket, Activity } from "lucide-react"
import { useState } from "react"
import { motion } from "framer-motion"

export default function DashboardPage() {
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState({ amount: "0.5", symbol: "BTC", apy: 5.2 })

  const handleDeposit = (asset: any) => {
    setSelectedAsset({
      amount: asset.balance.toString(),
      symbol: asset.symbol,
      apy: 5.2,
    })
    setPreviewModalOpen(true)
  }

  const handleWithdraw = (asset: any) => {
    console.log("[v0] Withdrawing asset:", asset)
  }

  const handleMagicDeposit = () => {
    setSelectedAsset({
      amount: "0.5",
      symbol: "BTC",
      apy: 5.2,
    })
    setPreviewModalOpen(true)
  }

  const handleConfirmTransaction = () => {
    console.log("[v0] Transaction confirmed")
    setPreviewModalOpen(false)
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      <AnimatedBackground />
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8 space-y-8 relative z-10">
        <motion.div
          className="grid md:grid-cols-4 gap-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          {[
            {
              title: "Total Balance",
              value: "$31,500",
              subtitle: "0.5 BTC + 2.1 ETH + 0.1 WBTC",
              icon: Wallet,
              gradient: "from-purple-500/20 to-pink-500/20",
              iconColor: "text-purple-400",
            },
            {
              title: "Currently Earning",
              value: "$4,200",
              subtitle: "+$124.32 total earned",
              icon: Rocket,
              gradient: "from-green-500/20 to-emerald-500/20",
              iconColor: "text-green-400",
            },
            {
              title: "Current APY",
              value: "5.2%",
              subtitle: "Vesu WBTC Vault",
              icon: TrendingUp,
              gradient: "from-cyan-500/20 to-blue-500/20",
              iconColor: "text-cyan-400",
            },
            {
              title: "Idle Assets",
              value: "$27,300",
              subtitle: "Ready to deploy",
              icon: Activity,
              gradient: "from-orange-500/20 to-yellow-500/20",
              iconColor: "text-orange-400",
            },
          ].map((card, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              whileHover={{ scale: 1.05, rotateY: 5 }}
              className="perspective-1000"
            >
              <Card
                className={`p-6 space-y-4 bg-gradient-to-br ${card.gradient} border-white/10 backdrop-blur-sm transform-3d`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-300">{card.title}</div>
                  <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold">{card.value}</div>
                  <div className="text-sm text-gray-400">{card.subtitle}</div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <MagicDepositCard onDeposit={handleMagicDeposit} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <EarningsChart />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <AssetTable onDeposit={handleDeposit} onWithdraw={handleWithdraw} />
        </motion.div>
      </main>

      <TransactionPreviewModal
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        amount={selectedAsset.amount}
        asset={selectedAsset.symbol}
        apy={selectedAsset.apy}
        onConfirm={handleConfirmTransaction}
      />
    </div>
  )
}
