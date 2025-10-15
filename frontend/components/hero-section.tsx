"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Rocket, Play } from "lucide-react"
import { useState } from "react"
import { WalletConnectModal } from "./wallet-connect-modal"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Bitcoin3D } from "./bitcoin-3d"

export function HeroSection() {
  const [walletModalOpen, setWalletModalOpen] = useState(false)
  const router = useRouter()

  const handleWalletConnect = (walletType: "bitcoin" | "starknet") => {
    console.log("[v0] Connected wallet:", walletType)
  }

  const handleBoardShuttle = () => {
    setWalletModalOpen(true)
  }

  const handleViewDashboard = () => {
    router.push("/dashboard")
  }

  return (
    <>
      <section className="relative overflow-hidden min-h-screen flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/40 via-slate-950/50 to-teal-950/40" />

        <div className="absolute inset-0 overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                background: ["#fff", "#4fd1c5", "#ff8c42", "#60a5fa", "#34d399"][Math.floor(Math.random() * 5)],
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 1, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Number.POSITIVE_INFINITY,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-teal-500/20 border border-blue-500/30 text-sm text-white backdrop-blur-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Rocket className="w-4 h-4" />
                <span>Powered by Starknet, Atomiq & Vesu</span>
              </motion.div>

              <motion.h1
                className="text-5xl md:text-7xl font-bold tracking-tight text-balance leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                Your Bitcoin is Sleeping.
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-teal-400 to-orange-400 bg-clip-text text-transparent">
                  Let's Wake It Up.
                </span>
              </motion.h1>

              <motion.p
                className="text-xl md:text-2xl text-muted-foreground max-w-2xl text-balance leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                Earn compounding yield on your BTC with the security of Starknet. No complexity, just results.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row items-start gap-4 pt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={handleBoardShuttle}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 via-teal-600 to-cyan-600 text-white hover:from-blue-700 hover:via-teal-700 hover:to-cyan-700 text-lg px-8 py-6 group shadow-lg shadow-blue-500/30"
                  >
                    Board the Shuttle Now
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={handleViewDashboard}
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 py-6 border-white/20 hover:bg-white/10 bg-transparent group backdrop-blur-sm"
                  >
                    <Play className="mr-2 w-5 h-5" />
                    View Your Dashboard
                  </Button>
                </motion.div>
              </motion.div>

              <motion.div
                className="grid grid-cols-3 gap-8 pt-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
              >
                {[
                  { value: "5.2%", label: "Current APY", color: "from-teal-400 to-emerald-400" },
                  { value: "$2.4M", label: "Total Launched", color: "from-blue-400 to-cyan-400" },
                  { value: "1,247", label: "Active Missions", color: "from-orange-400 to-amber-400" },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    className="space-y-2 group cursor-pointer"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div
                      className={`text-3xl md:text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}
                    >
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 1 }}
              className="hidden lg:block"
            >
              <Bitcoin3D />
            </motion.div>
          </div>
        </div>
      </section>

      <WalletConnectModal open={walletModalOpen} onOpenChange={setWalletModalOpen} onConnect={handleWalletConnect} />
    </>
  )
}
