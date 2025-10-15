"use client"

import { Button } from "@/components/ui/button"
import { Rocket } from "lucide-react"
import { useState } from "react"
import { WalletConnectModal } from "./wallet-connect-modal"
import Link from "next/link"

export function Header() {
  const [walletModalOpen, setWalletModalOpen] = useState(false)

  const handleWalletConnect = (walletType: "bitcoin" | "starknet") => {
    console.log("[v0] Connected wallet:", walletType)
  }

  return (
    <>
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
              <Rocket className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Stark Yield Shuttle</h1>
              <p className="text-xs text-muted-foreground">Bitcoin → Starknet Yield</p>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </a>
            <a href="#stats" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Stats
            </a>
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <a
              href="https://docs.starknet.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Docs
            </a>
          </nav>
          <Button
            onClick={() => setWalletModalOpen(true)}
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Connect Wallet
          </Button>
        </div>
      </header>

      <WalletConnectModal open={walletModalOpen} onOpenChange={setWalletModalOpen} onConnect={handleWalletConnect} />
    </>
  )
}
