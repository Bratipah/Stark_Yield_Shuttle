"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ArrowRight, Clock, TrendingUp, AlertCircle } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface TransactionPreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  amount: string
  asset: string
  apy: number
  onConfirm: () => void
}

export function TransactionPreviewModal({
  open,
  onOpenChange,
  amount,
  asset,
  apy,
  onConfirm,
}: TransactionPreviewModalProps) {
  const estimatedValue = Number.parseFloat(amount) * 42000
  const estimatedYearlyEarnings = estimatedValue * (apy / 100)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl">Launch Sequence Preview</DialogTitle>
          <DialogDescription>Review your transaction before launching</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Transaction Summary */}
          <div className="p-4 rounded-lg bg-secondary/50 border border-border space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">You're Depositing</span>
              <span className="text-lg font-bold">
                {amount} {asset}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Value</span>
              <span className="text-lg font-semibold">${estimatedValue.toLocaleString()}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Destination</span>
              <span className="text-sm font-medium">Vesu WBTC Lending Vault</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Current APY</span>
              <span className="text-lg font-bold text-success">{apy}%</span>
            </div>
          </div>

          {/* Earnings Projection */}
          <div className="p-4 rounded-lg bg-success/10 border border-success/20">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-success mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-success">Estimated Yearly Earnings</p>
                <p className="text-2xl font-bold text-success">${estimatedYearlyEarnings.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Based on current APY. Rates may vary.</p>
              </div>
            </div>
          </div>

          {/* Flight Steps */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-medium">Launch Sequence (≈10 minutes)</span>
            </div>
            <ol className="space-y-2 ml-6 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary font-medium">1.</span>
                <span>Bridge {amount} BTC to Starknet via Atomiq</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-medium">2.</span>
                <span>Swap to WBTC on Starknet</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-medium">3.</span>
                <span>Deploy to Vesu lending vault</span>
              </li>
            </ol>
          </div>

          {/* Warning */}
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              You can withdraw your assets at any time. Gas fees apply for bridging and transactions.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={onConfirm} className="flex-1 bg-primary hover:bg-primary/90 group">
              Confirm Launch
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
