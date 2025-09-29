'use client'
import React, { useMemo, useState } from 'react'

export default function Home() {
  const [status, setStatus] = useState('')
  const [balance, setBalance] = useState<number>(0)
  const [apy, setApy] = useState<number>(0)
  const [btcAddress, setBtcAddress] = useState<string>('')
  const [starknetAddress, setStarknetAddress] = useState<string>('')
  const [history, setHistory] = useState<any[]>([])
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

  const deposit = async () => {
    setStatus('Bridging BTC and sending on-chain deposit...')
    try {
      const resp = await fetch(`${apiBase}/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ btcAddress, starknetAddress, amount: 0.01 }),
      }).then((r) => r.json())
      const bridgeId = resp?.bridge?.txId || resp?.bridge?.id || 'submitted'
      const onchainHash = resp?.onchainTx?.transaction_hash || resp?.onchainTx?.hash || 'sent'
      setStatus(`Deposit submitted: Bridge ${bridgeId}, On-chain ${onchainHash}`)
      await refresh()
    } catch (e: any) {
      setStatus(`Error: ${e.message}`)
    }
  }

  const withdraw = async () => {
    setStatus('Submitting on-chain withdraw and reverse bridge...')
    try {
      const resp = await fetch(`${apiBase}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ btcAddress, starknetAddress, amount: 0.01 }),
      }).then((r) => r.json())
      const bridgeId = resp?.bridge?.txId || resp?.bridge?.id || 'submitted'
      const onchainHash = resp?.onchainTx?.transaction_hash || resp?.onchainTx?.hash || 'sent'
      setStatus(`Withdraw submitted: On-chain ${onchainHash}, Bridge ${bridgeId}`)
      await refresh()
    } catch (e: any) {
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
        <button onClick={deposit} className="p-3 bg-blue-600 text-white rounded-xl">Deposit BTC to Earn Yield</button>
        <button onClick={withdraw} className="p-3 bg-slate-700 text-white rounded-xl">Withdraw</button>
        <button onClick={refresh} className="p-3 bg-slate-500 text-white rounded-xl">Refresh</button>
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
