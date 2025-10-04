"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Bitcoin, Wallet, ArrowRight, CheckCircle2 } from "lucide-react"
import { useState } from "react"

interface WalletConnectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConnect: (walletType: "bitcoin" | "starknet") => void
}

export function WalletConnectModal({ open, onOpenChange, onConnect }: WalletConnectModalProps) {
  const [bitcoinConnected, setBitcoinConnected] = useState(false)
  const [starknetConnected, setStarknetConnected] = useState(false)

  const handleBitcoinConnect = () => {
    setBitcoinConnected(true)
    onConnect("bitcoin")
  }

  const handleStarknetConnect = () => {
    setStarknetConnected(true)
    onConnect("starknet")
  }

  const allConnected = bitcoinConnected && starknetConnected

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl">Connect Your Wallets</DialogTitle>
          <DialogDescription className="text-base">
            Connect both wallets to start your yield mission. Your Bitcoin stays secure in your wallet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Bitcoin Wallet */}
          <div
            className={`p-6 rounded-lg border-2 transition-all ${
              bitcoinConnected
                ? "border-success bg-success/5"
                : "border-border bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#FF9500]/20 flex items-center justify-center">
                  <Bitcoin className="w-7 h-7 text-[#FF9500]" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Bitcoin Wallet</h3>
                  <p className="text-sm text-muted-foreground">Xverse or Leather</p>
                </div>
              </div>
              {bitcoinConnected && <CheckCircle2 className="w-6 h-6 text-success" />}
            </div>

            {!bitcoinConnected ? (
              <Button onClick={handleBitcoinConnect} className="w-full bg-[#FF9500] hover:bg-[#FF9500]/90 text-white">
                Connect Bitcoin Wallet
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            ) : (
              <div className="text-sm text-success font-medium">Connected: bc1q...7x8k</div>
            )}
          </div>

          {/* Starknet Wallet */}
          <div
            className={`p-6 rounded-lg border-2 transition-all ${
              starknetConnected
                ? "border-success bg-success/5"
                : "border-border bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Wallet className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Starknet Wallet</h3>
                  <p className="text-sm text-muted-foreground">Argent or Braavos</p>
                </div>
              </div>
              {starknetConnected && <CheckCircle2 className="w-6 h-6 text-success" />}
            </div>

            {!starknetConnected ? (
              <Button onClick={handleStarknetConnect} className="w-full bg-primary hover:bg-primary/90">
                Connect Starknet Wallet
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            ) : (
              <div className="text-sm text-success font-medium">Connected: 0x7a3f...9b2c</div>
            )}
          </div>

          {allConnected && (
            <Button
              onClick={() => onOpenChange(false)}
              size="lg"
              className="w-full bg-success hover:bg-success/90 text-white"
            >
              Launch Mission Control
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
