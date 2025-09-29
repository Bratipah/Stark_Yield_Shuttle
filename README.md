# One-Click Bitcoin Yield Shuttle

A hackathon-ready dApp to bridge BTC to Starknet and auto-deposit into a yield vault (Vesu/Troves).

## Monorepo
- frontend: Next.js + Tailwind + StarknetKit
- backend: Node/Express + starknet.js + Atomiq HTTP adapter (no mocks)
- contracts: Cairo (Scarb) `ShuttleContract`

## Quickstart

1) Backend
```
cp .env.example .env
# set CONTRACT_ADDRESS, STARKNET_RPC_URL, ATOMIQ_BASE_URL, ATOMIQ_API_KEY
# optionally set STARKNET_ACCOUNT_ADDRESS, STARKNET_PRIVATE_KEY if backend signs owner calls
node backend/server.js
```

2) Frontend
```
npm run dev --prefix frontend
```

Open http://localhost:3000

## Environment

Create a `.env` at the repo root (see `.env.example`):

- PORT: Backend port (default 4000)
- NEXT_PUBLIC_API_BASE: Frontend → Backend base URL
- STARKNET_RPC_URL: Starknet testnet RPC endpoint
- CONTRACT_ADDRESS: Deployed `ShuttleContract` address on testnet
- STARKNET_ACCOUNT_ADDRESS / STARKNET_PRIVATE_KEY: Owner account used for `deposit_for`/`withdraw_for`
- ATOMIQ_BASE_URL / ATOMIQ_API_KEY: Atomiq testnet API
- PROTOCOL_APY_URL: Yield APY source (e.g., Vesu)

## Demo Flow
- Connect Xverse and Starknet wallets
- Click "Deposit BTC" (bridges via Atomiq, calls on-chain `deposit_for`)
- See on-chain Deposited BTC and APY, and Withdraw (calls `withdraw_for` + reverse bridge)

## Success Criteria Coverage

- One-click deposit/withdraw: Bridge via Atomiq + on-chain `deposit_for`/`withdraw_for` executed by owner
- Accurate on-chain accounting: Backend and UI read `get_balance(user)` directly
- Yield capture: Contract emits events; backend exposes `/apy` from protocol source
- Integrations: Xverse via `sats-connect`, Starknet via `starknetkit`, Atomiq via HTTP API
- Security: Basic input validation and rate limiting in backend; secrets in `.env`
- Reliability: Testnet deployment documented via `CONTRACT_ADDRESS`
- Observability: `/history` endpoint exposes bridge and on-chain txs for UI

## API
- POST /deposit { btcAddress, starknetAddress, amount }
- POST /withdraw { btcAddress, starknetAddress, amount }
- GET /balance?btcAddress&starknetAddress
- GET /apy
- GET /history?btcAddress&starknetAddress

## Contract
- deposit_btc(amount)
- withdraw_btc(amount)
- deposit_for(user, amount) [owner]
- withdraw_for(user, amount) [owner]
- get_balance(address)

Build/Test:
```
cd contracts/shuttle_contract
scarb build
scarb test
```

## Pitch
"We built the simplest way for Bitcoiners to earn DeFi yield on Starknet — one click, one button, one flow."
