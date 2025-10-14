'use client'
import React, { useMemo, useState } from 'react'

export default function Home() {
  const [status, setStatus] = useState('')
  const [balance, setBalance] = useState<number>(0)
  const [apy, setApy] = useState<number>(0)
  const [btcAddress, setBtcAddress] = useState<string>('')
  const [starknetAddress, setStarknetAddress] = useState<string>('')
  const [history, setHistory] = useState<any[]>([])
  const [showQuote, setShowQuote] = useState(false)
  const [tosAccepted, setTosAccepted] = useState(false)
  const [quote, setQuote] = useState<any | null>(null)
  const [minerMode, setMinerMode] = useState(false)
  const [minerBatches, setMinerBatches] = useState<string>('0.01, 0.02')
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000', [])

  const refresh = async () => {
    try {
      const query = new URLSearchParams({ btcAddress, starknetAddress }).toString()
      const [b, a, h] = await Promise.all([
        fetch(`${apiBase}/balance?${query}`).then((r) => r.json()),
        fetch(`${apiBase}/apy`).then((r) => r.json()),
        fetch(`${apiBase}/history?${query}`).then((r) => r.json()),
      ])
      setBalance(b.balance)
      setApy(a.apy)
      setHistory(h.history || [])
    } catch (e: any) {
      console.error(e)
    }
  }

  const openQuote = async (action: 'deposit'|'withdraw' = 'deposit') => {
    setStatus('Fetching quote...')
    try {
      const pre = await fetch(`${apiBase}/preflight`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tosAccepted, btcAddress, starknetAddress })
      }).then(r=>r.json())
      if (!pre?.allowed) { setStatus(`Blocked: ${pre?.reason || 'Preflight failed'}`); return }
      const q = await fetch(`${apiBase}/quote`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 0.01, action })
      }).then(r=>r.json())
      setQuote(q)
      setShowQuote(true)
      setStatus('')
    } catch (e:any) {
      setStatus(`Quote error: ${e.message}`)
    }
  }

  const deposit = async () => {
    setStatus('Initiating bridge...')
    try {
      const resp = await fetch(`${apiBase}/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ btcAddress, starknetAddress, amount: 0.01 })
      }).then(r=>r.json())
      const bridgeId = resp?.bridge?.txId || resp?.bridge?.id || 'submitted'
      setStatus(`Bridge submitted: ${bridgeId}. Now sign Starknet transaction...`)
      const { connect } = await import('starknetkit')
      const res: any = await connect()
      if (!res?.account) throw new Error('Wallet not connected')
      const account = res.account
      const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string | undefined
      if (!CONTRACT_ADDRESS) throw new Error('Contract not configured')
      const calldata = [BigInt(Math.floor(0.01 * 1))] // demo units
      const invoke = await account.execute({ contractAddress: CONTRACT_ADDRESS, entrypoint: 'deposit_btc', calldata })
      setStatus(`On-chain sent: ${invoke?.transaction_hash || 'sent'}`)
      await refresh()
    } catch (e:any) {
      setStatus(`Error: ${e.message}`)
    }
  }

  const withdraw = async () => {
    setStatus('Sending on-chain withdraw...')
    try {
      const { connect } = await import('starknetkit')
      const res: any = await connect()
      if (!res?.account) throw new Error('Wallet not connected')
      const account = res.account
      const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string | undefined
      if (!CONTRACT_ADDRESS) throw new Error('Contract not configured')
      const calldata = [BigInt(Math.floor(0.01 * 1))]
      const invoke = await account.execute({ contractAddress: CONTRACT_ADDRESS, entrypoint: 'withdraw_btc', calldata })
      const txHash = invoke?.transaction_hash
      setStatus(`On-chain withdraw sent: ${txHash || 'sent'}`)
      const resp = await fetch(`${apiBase}/withdraw`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ btcAddress, starknetAddress, amount: 0.01, onchainTxHash: txHash })
      }).then(r=>r.json())
      const bridgeId = resp?.bridge?.txId || resp?.bridge?.id || 'submitted'
      setStatus(`Reverse bridge submitted: ${bridgeId}`)
      await refresh()
    } catch (e:any) {
      setStatus(`Error: ${e.message}`)
    }
  }

  const connectBtc = async () => {
    setStatus('Connecting Xverse...')
    try {
      const mod = await import('sats-connect')
      const getAddress = (mod as any)?.getAddress
      if (typeof getAddress !== 'function') throw new Error('Xverse not available')
      await getAddress({
        payload: {
          purposes: ['payment'],
          message: 'Connect BTC address to Yield Shuttle',
          network: { type: 'Mainnet' },
        },
        onFinish: (response: any) => {
          const addr = response?.addresses?.[0]?.address
          if (addr) setBtcAddress(addr)
          setStatus('Xverse connected ✅')
        },
        onCancel: () => setStatus('Xverse connect cancelled'),
      })
    } catch (e: any) {
      setStatus('Xverse not detected, enter BTC address manually')
    }
  }

  const connectStarknet = async () => {
    setStatus('Connecting Starknet wallet...')
    try {
      const { connect } = await import('starknetkit')
      const res: any = await connect()
      if (res?.account?.address) {
        setStarknetAddress(res.account.address)
        setStatus('Starknet connected ✅')
      } else {
        setStatus('Starknet connect failed')
      }
    } catch (e: any) {
      setStatus(`Starknet connect error: ${e.message}`)
    }
  }

  React.useEffect(() => { if (btcAddress || starknetAddress) { refresh() } }, [btcAddress, starknetAddress])

  return (
    <main className="flex min-h-screen flex-col items-center p-8 gap-6 bg-gradient-to-b from-white to-slate-50">
      <h1 className="text-3xl font-bold">One-Click Bitcoin Yield Shuttle</h1>
      <p className="text-slate-600">Deposit your Bitcoin → Earn Yield in One Click.</p>
      <div className="flex gap-3">
        <button onClick={connectBtc} className="p-3 bg-black text-white rounded-xl">Connect Xverse</button>
        <button onClick={connectStarknet} className="p-3 bg-emerald-600 text-white rounded-xl">Connect Starknet</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
        <div className="p-4 rounded-xl border bg-white shadow-sm">
          <div className="text-slate-500">BTC Address</div>
          <div className="text-sm break-all">{btcAddress || 'Not connected'}</div>
        </div>
        <div className="p-4 rounded-xl border bg-white shadow-sm">
          <div className="text-slate-500">Starknet Address</div>
          <div className="text-sm break-all">{starknetAddress || 'Not connected'}</div>
        </div>
        <div className="p-4 rounded-xl border bg-white shadow-sm">
          <div className="text-slate-500">Current APY (Vesu)</div>
          <div className="text-xl font-semibold">{apy}%</div>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={() => openQuote('deposit')} className="p-3 bg-blue-600 text-white rounded-xl">Get Deposit Quote</button>
        <button onClick={() => openQuote('withdraw')} className="p-3 bg-slate-700 text-white rounded-xl">Get Withdraw Quote</button>
        <button onClick={refresh} className="p-3 bg-slate-500 text-white rounded-xl">Refresh</button>
      </div>
      {showQuote && quote && (
        <div className="p-4 mt-2 rounded-xl border bg-white shadow-sm w-full max-w-2xl">
          <div className="font-semibold mb-2">Quote</div>
          <div className="text-sm text-slate-700">BTC L1 fee: {quote.btcL1Fee} | Starknet fee: {quote.starknetFee} | Margin: {quote.marginFee} | Total: {quote.totalFee} | ETA: {quote.etaSecs}s</div>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={tosAccepted} onChange={(e)=>setTosAccepted(e.target.checked)} />
            I accept Terms and Risk disclosures
          </label>
          <div className="mt-3 flex gap-2">
            <button onClick={() => { setShowQuote(false); deposit() }} disabled={!tosAccepted} className="p-2 bg-blue-600 text-white rounded-lg">Proceed</button>
            <button onClick={() => setShowQuote(false)} className="p-2 bg-slate-300 rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      <div className="w-full max-w-3xl mt-6 p-4 rounded-xl border bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Miner Mode</div>
          <label className="text-sm flex items-center gap-2">
            <input type="checkbox" checked={minerMode} onChange={(e)=>setMinerMode(e.target.checked)} /> Enable
          </label>
        </div>
        {minerMode && (
          <div className="mt-3">
            <div className="text-sm text-slate-600 mb-2">Enter comma-separated deposit amounts (BTC demo units). We will request batch quotes and submit bridge intents.</div>
            <textarea value={minerBatches} onChange={(e)=>setMinerBatches(e.target.value)} className="w-full p-2 border rounded" rows={3} />
            <div className="mt-2 flex gap-2">
              <button
                onClick={async () => {
                  setStatus('Submitting batch bridge intents...')
                  try {
                    const amounts = minerBatches.split(',').map((s)=>Number(s.trim())).filter((n)=>Number.isFinite(n) && n>0)
                    for (const a of amounts) {
                      await fetch(`${apiBase}/deposit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ btcAddress, starknetAddress, amount: a, batch: true }) })
                    }
                    setStatus('Batch intents submitted. Execute on-chain deposits as desired.')
                    await refresh()
                  } catch (e:any) {
                    setStatus(`Batch error: ${e.message}`)
                  }
                }}
                className="p-2 bg-emerald-600 text-white rounded-lg"
              >Submit Batch Intents</button>
            </div>
          </div>
        )}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-6">
        <div className="p-4 rounded-xl border bg-white shadow-sm">
          <div className="text-slate-500">Deposited BTC</div>
          <div className="text-xl font-semibold">{balance}</div>
        </div>
        <div className="p-4 rounded-xl border bg-white shadow-sm">
          <div className="text-slate-500">Recent Activity</div>
          <div className="text-sm max-h-40 overflow-auto space-y-1">
            {history.length === 0 && <div className="text-slate-400">No transactions</div>}
            {history.map((h: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between">
                <div>
                  <span className="font-medium capitalize">{h.type}</span> · {h.amount}
                </div>
                <div className="text-slate-400 text-xs">{new Date(h.t).toLocaleTimeString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-2 text-sm text-slate-700">{status}</p>
    </main>
  )
}
