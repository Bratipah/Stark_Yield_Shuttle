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
# STARKNET_RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_8
# CONTRACT_ADDRESS=0xYOUR_TESTNET_CONTRACT_ADDRESS
# STARKNET_ACCOUNT_ADDRESS=0xYOUR_TESTNET_ACCOUNT_ADDRESS
# STARKNET_PRIVATE_KEY=0xYOUR_TESTNET_PRIVATE_KEY
# ATOMIQ_BASE_URL=https://api.testnet.atomiq.example.com
# ATOMIQ_API_KEY=your-api-key
# PROTOCOL_APY_URL=https://api.vesu.example.com/v1/apy
# BRIDGE_SIMULATE=true
# OWNER_MODE=false
# MARGIN_BPS=50
# MIN_DEPOSIT=0.001
# BATCH_DISCOUNT_BPS=10
# ALLOWED_COUNTRIES=US,GB,DE
# COINGECKO_API_BASE=https://api.coingecko.com/api/v3
# KYC_ALLOWLIST=
# KYC_DENYLIST=
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
- BRIDGE_SIMULATE: Set to `true` to simulate bridge when Atomiq creds are absent

## Demo Flow (Non-custodial)
- Connect Xverse and Starknet wallets
- Click "Get Deposit Quote" → accept ToS → proceed
- Backend initiates bridge intent; wallet signs `deposit_btc(amount)`
- Balance updates on-chain; APY fetched from provider
- Withdraw: wallet signs `withdraw_btc(amount)` → backend initiates reverse bridge

## Success Criteria Coverage

- One-click deposit/withdraw: Bridge via Atomiq + on-chain `deposit_for`/`withdraw_for` executed by owner
- Accurate on-chain accounting: Backend and UI read `get_balance(user)` directly
- Yield capture: Contract emits events; backend exposes `/apy` from protocol source
- Integrations: Xverse via `sats-connect`, Starknet via `starknetkit`, Atomiq via HTTP API
- Security: Basic input validation and rate limiting in backend; secrets in `.env`
- Reliability: Testnet deployment documented via `CONTRACT_ADDRESS`
- Observability: `/history` endpoint exposes bridge and on-chain txs for UI

- POST /preflight { tosAccepted, btcAddress, starknetAddress } → { allowed }
- POST /quote { amount, action, batch?, token? } → { token, btcL1Fee, starknetFee, marginFee, batchDiscount, totalFee, minEnforced, etaSecs, batchEligible }
- POST /deposit { btcAddress, starknetAddress, amount, batch?, token? } → { bridge, instruction, mode }
- POST /withdraw { btcAddress, starknetAddress, amount, onchainTxHash?, token? } → { bridge, mode }
- GET /balance?btcAddress&starknetAddress
- GET /apy
- GET /history?btcAddress&starknetAddress

Notes:
- In non-custodial withdraw, backend verifies a `Withdrawn` event for the tx hash before reverse bridging.
- `/quote` converts Starknet fee from ETH→USD→BTC using CoinGecko; cached fallback is used on rate-limit or outages.
- If `token=WBTC`, quotes denom in WBTC USD (tracks BTC closely) and backend instructs the UI to use WBTC entrypoints.

## E2E Demo Script

Run the end-to-end demo against a running backend:

```
API_BASE=http://localhost:4000 \
BTC_ADDRESS=tb1qexamplebtcaddr... \
STARKNET_ADDRESS=0xYOUR_TESTNET_STARKNET_ADDRESS \
node scripts/e2e-demo.js
```

The script performs: deposit → balance verify → withdraw → balance verify, printing responses to stdout.

## Demo Results

Successful E2E run (simulated bridge, Sepolia RPC v0_8):

```
Step 1: Refresh balances
Initial balance: { balance: 1 }

Step 2: Deposit
Deposit response: {
  bridge: { txId: 'sim-bridge-...', btcAddress: 'tb1q...xset', amount: 1 },
  onchainTx: { transaction_hash: '0x490a8c...c7cdf' },
  balance: 2
}

Step 3: Verify balance
Post-deposit balance: { balance: 2 }

Step 4: Withdraw
Withdraw response: {
  bridge: { txId: 'sim-redeem-...', btcAddress: 'tb1q...xset', amount: 1 },
  onchainTx: { transaction_hash: '0x3a280e...1d46' },
  balance: 2
}

Step 5: Verify final balance
Final balance: { balance: 1 }
E2E demo complete ✅
```

## Contract
- deposit_btc(amount)
- withdraw_btc(amount)
- deposit_wbtc(amount)
- withdraw_wbtc(amount)
- deposit_for(user, amount) [owner]
- withdraw_for(user, amount) [owner]
- deposit_for_wbtc(user, amount) [owner]
- withdraw_for_wbtc(user, amount) [owner]
- get_balance(address)
 - set_fee(bps, recipient) [owner]
 - get_fees() -> u128 (accounted protocol fees)
 - sweep_fees(amount) [owner] (accounting-only, emits FeesSwept)
  - get_balance_wbtc(address)

Events:
- Deposited { user, amount, fee_paid, asset } where asset: 0=BTC, 1=WBTC
- Withdrawn { user, amount, asset } where asset: 0=BTC, 1=WBTC

Build/Test:
```
cd contracts/shuttle_contract
scarb build
scarb test
```

## Deploy (Testnet)

Compile contracts, then declare and deploy using the script (RPC 0.8 required). The constructor sets the contract owner; the deploy script passes your account address as owner.

```
cd contracts/shuttle_contract && scarb build && cd ../..
STARKNET_RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_8 \
STARKNET_ACCOUNT_ADDRESS=0xYOUR_TESTNET_ACCOUNT_ADDRESS \
STARKNET_PRIVATE_KEY=0xYOUR_TESTNET_PRIVATE_KEY \
node scripts/deploy-shuttle.js
```

Copy the printed `contract_address` into your `.env` as `CONTRACT_ADDRESS` and `NEXT_PUBLIC_CONTRACT_ADDRESS`.

### Current testnet deployment (Sepolia)

- Contract address: `0x707381bebfca862abd9c289bdc226a63658660beffdfb6a98067642e9ca7cda`
- RPC: `https://starknet-sepolia.public.blastapi.io/rpc/v0_8`

Notes:
- Amount units are integers (`u128`) in demo units, not decimals.
- In non-custodial mode, users sign `deposit_btc`/`withdraw_btc` from their Starknet wallet.
- `OWNER_MODE=true` re-enables owner-executed flows for the demo script.

## Regulatory & Risk Disclosures (MVP)
- Uses partner bridge APIs; wrapped BTC entails counterparty risk.
- Quotes include estimated BTC L1 and Starknet fees plus margin; actual fees may vary.
- Service geofences by IP header and requires ToS acceptance; partner KYC handled separately.

## Rollout & Ops

- Deploy (Testnet):
```
cd contracts/shuttle_contract && scarb build && cd ../..
STARKNET_RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_8 \
STARKNET_ACCOUNT_ADDRESS=0xYOUR_TESTNET_ACCOUNT_ADDRESS \
STARKNET_PRIVATE_KEY=0xYOUR_TESTNET_PRIVATE_KEY \
node scripts/deploy-shuttle.js
```
- Update env (backend + frontend):
  - `CONTRACT_ADDRESS=0xDEPLOYED`
  - `NEXT_PUBLIC_CONTRACT_ADDRESS=0xDEPLOYED`
  - `OWNER_MODE=false`
  - `QUOTE_LOG_FILE=./quotes.log`
- Start services:
```
node backend/server.js
npm run dev --prefix frontend
```
- OWNER_MODE policy:
  - UI demos: keep `OWNER_MODE=false` (non-custodial).
  - Scripted E2E: set `OWNER_MODE=true`.
- Quote metrics:
  - Backend logs quotes to memory and appends JSON lines to `QUOTE_LOG_FILE` if set.
  - Tail: `tail -f quotes.log`

## Pitch
"We built the simplest way for Bitcoiners to earn DeFi yield on Starknet — one click, one button, one flow."
