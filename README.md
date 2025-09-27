# One-Click Bitcoin Yield Shuttle

A hackathon-ready dApp to bridge BTC to Starknet and auto-deposit into a yield vault (Vesu/Troves).

## Monorepo
- frontend: Next.js + Tailwind + StarknetKit
- backend: Node/Express + starknet.js (+ Atomiq mock)
- contracts: Cairo (Scarb) `ShuttleContract`

## Quickstart

1) Backend
```
cp .env.example .env # set CONTRACT_ADDRESS, STARKNET_RPC_URL
node backend/server.js
```

2) Frontend
```
npm run dev --prefix frontend
```

Open http://localhost:3000

## Demo Flow
- Connect Xverse and Starknet wallets
- Click "Deposit BTC" (mock bridge)
- See Deposited BTC and APY, and Withdraw

## API
- POST /deposit { btcAddress, starknetAddress, amount }
- POST /withdraw { btcAddress, starknetAddress, amount }
- GET /balance?btcAddress&starknetAddress
- GET /apy

## Contract
- deposit_btc(amount)
- withdraw_btc(amount)
- get_balance(address)

Build/Test:
```
cd contracts/shuttle_contract
scarb build
scarb test
```

## Pitch
"We built the simplest way for Bitcoiners to earn DeFi yield on Starknet — one click, one button, one flow."
