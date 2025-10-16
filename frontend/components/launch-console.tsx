"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Rocket, ArrowRight, Info } from "lucide-react"
import { useMemo, useState } from "react"

export function LaunchConsole() {
  const [amount, setAmount] = useState("0.5")
  const [token, setToken] = useState<'BTC' | 'WBTC'>('BTC')
  const [status, setStatus] = useState<string>("")
  const estimatedAPY = 5.2
  const estimatedValue = Number.parseFloat(amount) * 42000 // Mock BTC price
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000', [])

  const handleLaunch = async () => {
    try {
      setStatus('Preflight...')
      const pre = await fetch(`${apiBase}/preflight`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tosAccepted: true, btcAddress: 'tb1q-placeholder', starknetAddress: '0xplaceholder' })
      }).then(r=>r.json())
      if (!pre?.allowed) { setStatus(`Blocked: ${pre?.reason || 'preflight_failed'}`); return }

      setStatus('Quoting...')
      await fetch(`${apiBase}/quote`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number.parseFloat(amount) || 0.01, action: 'deposit', token })
      }).then(r=>r.json()).catch(()=>null)

      setStatus('Initiating bridge intent...')
      const dep = await fetch(`${apiBase}/deposit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ btcAddress: 'tb1q-placeholder', starknetAddress: '0xplaceholder', amount: Number.parseFloat(amount) || 0.01, token })
      }).then(r=>r.json())
      const instruction = dep?.instruction || 'Sign on-chain'
      setStatus(instruction)

      const { connect } = await import('starknetkit')
      const res: any = await connect()
      if (!res?.account) { setStatus('Wallet not connected'); return }
      const account = res.account
      const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string | undefined
      if (!CONTRACT_ADDRESS) { setStatus('Contract not configured'); return }
      const amtInt = BigInt(Math.max(1, Math.floor(Number.parseFloat(amount) || 1)))
      const entrypoint = token === 'WBTC' ? 'deposit_wbtc' : 'deposit_btc'
      const invoke = await account.execute({ contractAddress: CONTRACT_ADDRESS, entrypoint, calldata: [amtInt] })
      setStatus(`On-chain sent: ${invoke?.transaction_hash || 'sent'}`)
    } catch (e: any) {
      setStatus(`Error: ${e?.message || 'unknown'}`)
    }
  }

  return (
    <Card className="p-8 bg-gradient-to-br from-card to-primary/5 border-primary/20">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Rocket className="w-6 h-6 text-primary" />
              Launch Console
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Initiate your yield mission</p>
          </div>
          <div className="px-4 py-2 rounded-lg bg-success/10 border border-success/20">
            <div className="text-sm text-muted-foreground">Est. APY</div>
            <div className="text-xl font-bold text-success">{estimatedAPY}%</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-foreground">
              Amount to Launch
            </Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pr-20 text-lg h-14 bg-background border-border"
                placeholder="0.0"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <select value={token} onChange={(e)=>setToken(e.target.value as 'BTC'|'WBTC')} className="text-sm font-medium bg-transparent">
                  <option value="BTC">BTC</option>
                  <option value="WBTC">WBTC</option>
                </select>
                <Button size="sm" variant="ghost" className="h-8 text-xs">
                  MAX
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">≈ ${estimatedValue.toLocaleString()} USD</div>
          </div>

          <div className="p-4 rounded-lg bg-secondary/50 border border-border space-y-2">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-primary mt-0.5" />
              <div className="text-sm space-y-1">
                <p className="text-foreground font-medium">Launch Sequence Preview:</p>
                <ol className="text-muted-foreground space-y-1 ml-4 list-decimal">
                  <li>Bridge {amount} BTC to Starknet via Atomiq</li>
                  <li>Swap to WBTC on Starknet</li>
                  <li>Deploy to Vesu lending vault</li>
                </ol>
                <p className="text-muted-foreground">Estimated flight time: ~10 minutes</p>
              </div>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-lg py-6 group"
            onClick={handleLaunch}
          >
            Launch to Yield
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          {status && <div className="text-xs text-muted-foreground mt-2">{status}</div>}
        </div>
      </div>
    </Card>
  )
}
