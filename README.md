# One-Click Bitcoin Yield Shuttle

A hackathon-ready dApp to bridge BTC to Starknet and auto-deposit into a yield vault (Vesu/Troves).

## Monorepo
- frontend: Next.js + Tailwind + StarknetKit
- backend: Node/Express + starknet.js + Atomiq HTTP adapter (no mocks)
- contracts: Cairo (Scarb) `ShuttleContract`

## Quickstart

1) Backend
```
npm i --prefix backend
# Create a .env at repo root with:
# PORT=4000
# NEXT_PUBLIC_API_BASE=http://localhost:4000
# STARKNET_RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_7
# CONTRACT_ADDRESS=0xYOUR_TESTNET_CONTRACT_ADDRESS
# STARKNET_ACCOUNT_ADDRESS=0xYOUR_TESTNET_ACCOUNT_ADDRESS
# STARKNET_PRIVATE_KEY=0xYOUR_TESTNET_PRIVATE_KEY
# ATOMIQ_BASE_URL=https://api.testnet.atomiq.example.com
# ATOMIQ_API_KEY=your-api-key
# PROTOCOL_APY_URL=https://api.vesu.example.com/v1/apy
node backend/server.js
```

2) Frontend
```
npm run dev --prefix frontend
```

Open http://localhost:3000

## Environment

Create a `.env` at the repo root with:

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
- POST /deposit { btcAddress, starknetAddress, amount } → { bridge, onchainTx, balance }
- POST /withdraw { btcAddress, starknetAddress, amount } → { bridge, onchainTx, balance }
- GET /balance?btcAddress&starknetAddress
- GET /apy
- GET /history?btcAddress&starknetAddress

## E2E Demo Script

Run the end-to-end demo against a running backend:

```
API_BASE=http://localhost:4000 \
BTC_ADDRESS=tb1qexamplebtcaddr... \
STARKNET_ADDRESS=0xYOUR_TESTNET_STARKNET_ADDRESS \
node scripts/e2e-demo.js
```

The script performs: deposit → balance verify → withdraw → balance verify, printing responses to stdout.

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

## Deploy (Testnet)

Compile contracts, then declare and deploy using the script:

```
cd contracts/shuttle_contract && scarb build && cd ../..
STARKNET_RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_7 \
STARKNET_ACCOUNT_ADDRESS=0xYOUR_TESTNET_ACCOUNT_ADDRESS \
STARKNET_PRIVATE_KEY=0xYOUR_TESTNET_PRIVATE_KEY \
node scripts/deploy-shuttle.js
```

Copy the printed `contract_address` into your `.env` as `CONTRACT_ADDRESS` and `NEXT_PUBLIC_CONTRACT_ADDRESS`.

## Pitch
"We built the simplest way for Bitcoiners to earn DeFi yield on Starknet — one click, one button, one flow."
