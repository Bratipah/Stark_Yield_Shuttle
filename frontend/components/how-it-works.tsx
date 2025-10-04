"use client"

import { Card } from "@/components/ui/card"
import { Wallet, ArrowRight, Repeat, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"

const steps = [
  {
    icon: Wallet,
    title: "Connect Wallet",
    description: "Link your Bitcoin wallet (Xverse) or Starknet wallet (Argent/Braavos) in seconds.",
    color: "text-purple-400",
    gradient: "from-purple-500/20 to-pink-500/20",
  },
  {
    icon: Repeat,
    title: "Auto-Bridge & Swap",
    description: "We automatically bridge your BTC to Starknet and swap to yield-bearing assets using Atomiq.",
    color: "text-cyan-400",
    gradient: "from-cyan-500/20 to-blue-500/20",
  },
  {
    icon: TrendingUp,
    title: "Deploy to Vesu",
    description: "Your assets are instantly deployed to Vesu lending vaults to start earning yield.",
    color: "text-green-400",
    gradient: "from-green-500/20 to-emerald-500/20",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="text-center space-y-4 mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">The Launch Sequence</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto text-balance">
            From idle Bitcoin to earning yield in three automated steps
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              <motion.div whileHover={{ scale: 1.05, rotateY: 5 }} className="perspective-1000">
                <Card
                  className={`p-6 space-y-4 bg-gradient-to-br ${step.gradient} border-white/10 backdrop-blur-sm h-full transform-3d`}
                >
                  <div className="flex items-center gap-4">
                    <motion.div
                      className={`w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center ${step.color}`}
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <step.icon className="w-6 h-6" />
                    </motion.div>
                    <div className="text-2xl font-bold text-gray-500">0{index + 1}</div>
                  </div>
                  <h3 className="text-xl font-bold text-white">{step.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{step.description}</p>
                </Card>
              </motion.div>
              {index < steps.length - 1 && (
                <motion.div
                  className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10"
                  animate={{ x: [0, 10, 0] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                >
                  <ArrowRight className="w-8 h-8 text-purple-400/50" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
