const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// In-memory transaction history
const history = [];

// Atomiq HTTP adapter
const ATOMIQ_BASE_URL = process.env.ATOMIQ_BASE_URL;
const ATOMIQ_API_KEY = process.env.ATOMIQ_API_KEY;
const BRIDGE_SIMULATE = String(process.env.BRIDGE_SIMULATE || '').toLowerCase() === 'true';
const atomiqClient = axios.create({
  baseURL: ATOMIQ_BASE_URL,
  timeout: 15000,
  headers: ATOMIQ_API_KEY ? { Authorization: `Bearer ${ATOMIQ_API_KEY}` } : {},
});

const Atomiq = {
  async bridgeBTC({ btcAddress, amount }) {
    if (BRIDGE_SIMULATE || !ATOMIQ_BASE_URL) {
      return { txId: `sim-bridge-${Date.now()}`, btcAddress, amount };
    }
    const { data } = await atomiqClient.post('/bridge', { btcAddress, amount });
    return data; // expected: { txId, ... }
  },
  async reverseBridgeBTC({ btcAddress, amount }) {
    if (BRIDGE_SIMULATE || !ATOMIQ_BASE_URL) {
      return { txId: `sim-redeem-${Date.now()}`, btcAddress, amount };
    }
    const { data } = await atomiqClient.post('/redeem', { btcAddress, amount });
    return data; // expected: { txId, ... }
  },
};

// Pricing and compliance env
const OWNER_MODE = String(process.env.OWNER_MODE || '').toLowerCase() === 'true';
const MARGIN_BPS = Number(process.env.MARGIN_BPS || 50); // 0.50%
const MIN_DEPOSIT = Number(process.env.MIN_DEPOSIT || 0.001); // in BTC units for UI quoting
const BATCH_DISCOUNT_BPS = Number(process.env.BATCH_DISCOUNT_BPS || 10); // 0.10%
const ALLOWED_COUNTRIES = String(process.env.ALLOWED_COUNTRIES || '').split(',').map((s) => s.trim()).filter(Boolean);
const COINGECKO_API_BASE = process.env.COINGECKO_API_BASE || 'https://api.coingecko.com/api/v3';
const KYC_ALLOWLIST = String(process.env.KYC_ALLOWLIST || '').split(',').map((s) => s.trim()).filter(Boolean);
const KYC_DENYLIST = String(process.env.KYC_DENYLIST || '').split(',').map((s) => s.trim()).filter(Boolean);
const QUOTE_LOG_FILE = process.env.QUOTE_LOG_FILE || '';

function countryAllowed(req) {
  const country = req.headers['x-country'] || req.headers['cf-ipcountry'] || '';
  if (ALLOWED_COUNTRIES.length === 0) return true;
  return ALLOWED_COUNTRIES.includes(String(country).toUpperCase());
}

let cachedPrices = { ts: 0, ethUsd: 0, btcUsd: 0 };
async function getPricesUSD() {
  const now = Date.now();
  if (cachedPrices.ts && now - cachedPrices.ts < 30000 && cachedPrices.ethUsd && cachedPrices.btcUsd) {
    return { ethUsd: cachedPrices.ethUsd, btcUsd: cachedPrices.btcUsd };
  }
  try {
    const { data } = await axios.get(`${COINGECKO_API_BASE}/simple/price`, {
      params: { ids: 'ethereum,bitcoin,wrapped-bitcoin', vs_currencies: 'usd' },
      timeout: 8000,
    });
    const ethUsd = Number(data?.ethereum?.usd || 0);
    const btcUsd = Number(data?.bitcoin?.usd || 0);
    const wbtcUsd = Number(data?.['wrapped-bitcoin']?.usd || btcUsd || 0);
    if (ethUsd > 0 && btcUsd > 0) cachedPrices = { ts: now, ethUsd, btcUsd };
    return { ethUsd: ethUsd || cachedPrices.ethUsd || 3000, btcUsd: btcUsd || cachedPrices.btcUsd || 60000, wbtcUsd: wbtcUsd || btcUsd || 60000 };
  } catch (_e) {
    return { ethUsd: cachedPrices.ethUsd || 3000, btcUsd: cachedPrices.btcUsd || 60000, wbtcUsd: cachedPrices.btcUsd || 60000 };
  }
}

app.post('/preflight', async (req, res) => {
  try {
    const { tosAccepted, btcAddress, starknetAddress } = req.body || {};
    if (!tosAccepted) return res.status(400).json({ allowed: false, reason: 'TOS_NOT_ACCEPTED' });
    if (!countryAllowed(req)) return res.status(403).json({ allowed: false, reason: 'GEOFENCE' });
    if (!btcAddress || !starknetAddress) return res.status(400).json({ allowed: false, reason: 'MISSING_ADDRESSES' });
    // Mock KYC: explicit denylist first, then allowlist if set
    if (KYC_DENYLIST.includes(String(btcAddress)) || KYC_DENYLIST.includes(String(starknetAddress))) {
      return res.status(403).json({ allowed: false, reason: 'KYC_DENYLIST' });
    }
    if (KYC_ALLOWLIST.length > 0) {
      if (!(KYC_ALLOWLIST.includes(String(btcAddress)) || KYC_ALLOWLIST.includes(String(starknetAddress)))) {
        return res.status(403).json({ allowed: false, reason: 'KYC_NOT_ALLOWLISTED' });
      }
    }
    // Partner KYC stub: assume allowed beyond allow/deny logic
    return res.json({ allowed: true });
  } catch (e) {
    return res.status(500).json({ allowed: false, reason: 'SERVER_ERROR' });
  }
});

app.post('/quote', async (req, res) => {
  try {
    const { amount, action = 'deposit', batch = false, token = 'BTC' } = req.body || {};
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ error: 'positive amount required' });
    // BTC L1 fee (stub or partner estimate)
    let btcL1Fee = 0.0001; // BTC, stub
    try {
      if (!BRIDGE_SIMULATE && ATOMIQ_BASE_URL) {
        const { data } = await atomiqClient.get('/fee', { params: { amount: amt, action, token } });
        if (data?.fee) btcL1Fee = Number(data.fee);
      }
    } catch (_e) {}

    // Starknet fee estimation (rough): require CONTRACT_ADDRESS
    let starknetFee = 0.00002; // BTC equivalent stub
    try {
      const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
      const STARKNET_RPC_URL = process.env.STARKNET_RPC_URL;
      if (CONTRACT_ADDRESS && STARKNET_RPC_URL) {
        const { RpcProvider, Contract } = await import('starknet');
        const provider = new RpcProvider({ nodeUrl: STARKNET_RPC_URL });
        const abi = [
          { name: 'deposit_btc', type: 'function', state_mutability: 'external', inputs: [{ name: 'amount', type: 'core::integer::u128' }], outputs: [] },
        ];
        const contract = new Contract(abi, CONTRACT_ADDRESS, provider);
        if (typeof contract.estimateInvokeFee === 'function') {
          const feeRes = await contract.estimateInvokeFee('deposit_btc', [amt]);
          if (feeRes?.overall_fee) {
            const { ethUsd, btcUsd, wbtcUsd } = await getPricesUSD();
            const feeEth = Number(feeRes.overall_fee) / 1e18;
            const feeUsd = feeEth * ethUsd;
            // For WBTC we use its USD price (tracks BTC closely)
            const denom = token === 'WBTC' ? (wbtcUsd || btcUsd) : btcUsd;
            starknetFee = feeUsd / denom; // convert to BTC/WBTC
          }
        }
      }
    } catch (_e) {}

    const marginFee = (amt * (MARGIN_BPS / 10000));
    const batchDiscount = batch ? (amt * (BATCH_DISCOUNT_BPS / 10000)) : 0;
    const minEnforced = Math.max(amt, MIN_DEPOSIT);
    const totalFee = btcL1Fee + starknetFee + marginFee - batchDiscount;
    const etaSecs = batch ? 900 : 120; // batch window 15m vs 2m
    const quote = { token, btcL1Fee, starknetFee, marginFee, batchDiscount, totalFee, minEnforced, etaSecs, batchEligible: true };
    history.push({ type: 'quote', t: Date.now(), amount: amt, action, token, quote });
    try {
      if (QUOTE_LOG_FILE) {
        const fs = require('fs');
        const line = JSON.stringify({ t: Date.now(), amount: amt, action, token, quote }) + '\n';
        fs.appendFile(QUOTE_LOG_FILE, line, () => {});
      }
    } catch (_e) {}
    return res.json(quote);
  } catch (e) {
    return res.status(500).json({ error: 'quote_failed' });
  }
});

async function readOnchainBalance(starknetAddress) {
  try {
    const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
    const STARKNET_RPC_URL = process.env.STARKNET_RPC_URL || 'https://starknet-mainnet.public.blastapi.io/rpc/v0_7';
    if (!CONTRACT_ADDRESS || !starknetAddress) return null;
    const { RpcProvider, Contract } = await import('starknet');
    const provider = new RpcProvider({ nodeUrl: STARKNET_RPC_URL });
    const abi = [
      {
        name: 'get_balance',
        type: 'function',
        state_mutability: 'view',
        inputs: [{ name: 'user', type: 'core::starknet::contract_address::ContractAddress' }],
        outputs: [{ name: 'res', type: 'core::integer::u128' }],
      },
    ];
    const contract = new Contract(abi, CONTRACT_ADDRESS, provider);
    const res = await contract.get_balance(starknetAddress);
    const value = typeof res === 'object' && res?.res != null ? res.res : res;
    return Number(value);
  } catch (err) {
    console.warn('Onchain balance read failed:', err?.message);
    return null;
  }
}

async function waitForBalance({ starknetAddress, expectedDelta, maxMs = 120000, intervalMs = 3000 }) {
  const start = Date.now();
  const base = (await readOnchainBalance(starknetAddress)) ?? 0;
  while (Date.now() - start < maxMs) {
    const current = await readOnchainBalance(starknetAddress);
    if (current != null && current >= base + expectedDelta) return current;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return (await readOnchainBalance(starknetAddress)) ?? base;
}

async function getContractForInvoke() {
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
  const STARKNET_RPC_URL = process.env.STARKNET_RPC_URL || 'https://starknet-mainnet.public.blastapi.io/rpc/v0_7';
  const STARKNET_ACCOUNT_ADDRESS = process.env.STARKNET_ACCOUNT_ADDRESS;
  const STARKNET_PRIVATE_KEY = process.env.STARKNET_PRIVATE_KEY;
  if (!CONTRACT_ADDRESS || !STARKNET_ACCOUNT_ADDRESS || !STARKNET_PRIVATE_KEY) {
    throw new Error('Starknet account or contract env not configured');
  }
  const { RpcProvider, Account, Contract } = await import('starknet');
  const provider = new RpcProvider({ nodeUrl: STARKNET_RPC_URL });
  const account = new Account(provider, STARKNET_ACCOUNT_ADDRESS, STARKNET_PRIVATE_KEY);
  const abi = [
    {
      name: 'deposit_for',
      type: 'function',
      state_mutability: 'external',
      inputs: [
        { name: 'user', type: 'core::starknet::contract_address::ContractAddress' },
        { name: 'amount', type: 'core::integer::u128' },
      ],
      outputs: [],
    },
    {
      name: 'withdraw_for',
      type: 'function',
      state_mutability: 'external',
      inputs: [
        { name: 'user', type: 'core::starknet::contract_address::ContractAddress' },
        { name: 'amount', type: 'core::integer::u128' },
      ],
      outputs: [],
    },
  ];
  const contract = new Contract(abi, CONTRACT_ADDRESS, account);
  return { contract, provider };
}

app.post('/deposit', async (req, res) => {
  const { btcAddress, starknetAddress, amount, batch, token = 'BTC' } = req.body || {};
  const amt = Number(amount);
  if (!btcAddress || !starknetAddress || !Number.isFinite(amt) || amt <= 0) {
    return res.status(400).json({ error: 'btcAddress, starknetAddress and positive amount required' });
  }
  try {
    if (OWNER_MODE) {
      const bridge = await Atomiq.bridgeBTC({ btcAddress, amount: amt });
      const { contract } = await getContractForInvoke();
      const invoke = await contract.deposit_for(starknetAddress, amt);
      const onchainBalance = await waitForBalance({ starknetAddress, expectedDelta: amt });
      history.push({ type: 'deposit', t: Date.now(), btcAddress, starknetAddress, amount: amt, atomiq: bridge, onchain: invoke });
      return res.json({ bridge, onchainTx: invoke, balance: onchainBalance, mode: 'owner' });
    }
    // Non-custodial path: only initiate bridge; frontend must call the correct entrypoint
    const bridge = await Atomiq.bridgeBTC({ btcAddress, amount: amt, token });
    const instruction = token === 'WBTC' ? 'Call deposit_wbtc(amount) from your Starknet wallet' : 'Call deposit_btc(amount) from your Starknet wallet';
    history.push({ type: 'deposit_intent', t: Date.now(), btcAddress, starknetAddress, amount: amt, token, atomiq: bridge, batch: !!batch });
    return res.json({ bridge, instruction, mode: 'non_custodial' });
  } catch (err) {
    res.status(500).json({ error: err?.message || 'Deposit failed' });
  }
});

app.post('/withdraw', async (req, res) => {
  const { btcAddress, starknetAddress, amount, onchainTxHash, token = 'BTC' } = req.body || {};
  const amt = Number(amount);
  if (!btcAddress || !starknetAddress || !Number.isFinite(amt) || amt <= 0) {
    return res.status(400).json({ error: 'btcAddress, starknetAddress and positive amount required' });
  }
  try {
    if (OWNER_MODE) {
      const { contract } = await getContractForInvoke();
      const invoke = await contract.withdraw_for(starknetAddress, amt);
      const onchainBalance = await waitForBalance({ starknetAddress, expectedDelta: 0, maxMs: 120000, intervalMs: 3000 });
      const bridge = await Atomiq.reverseBridgeBTC({ btcAddress, amount: amt });
      history.push({ type: 'withdraw', t: Date.now(), btcAddress, starknetAddress, amount: amt, atomiq: bridge, onchain: invoke });
      return res.json({ bridge, onchainTx: invoke, balance: onchainBalance, mode: 'owner' });
    }
    // Non-custodial path: require user-signed withdraw then bridge back
    // For MVP, accept provided onchainTxHash as proof placeholder
    if (!onchainTxHash) return res.status(400).json({ error: 'onchainTxHash required in non-custodial mode' });
    // Verify withdraw event from our contract address (basic check)
    try {
      const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
      const STARKNET_RPC_URL = process.env.STARKNET_RPC_URL;
      const { RpcProvider } = await import('starknet');
      const provider = new RpcProvider({ nodeUrl: STARKNET_RPC_URL });
      const receipt = await provider.getTransactionReceipt(onchainTxHash);
      const ok = Array.isArray(receipt?.events) && receipt.events.some((ev) => {
        const from = (ev.from_address || ev.fromAddress || '').toLowerCase();
        return CONTRACT_ADDRESS && from === CONTRACT_ADDRESS.toLowerCase();
      });
      if (!ok) return res.status(400).json({ error: 'withdraw_event_not_found' });
    } catch (_e) {
      return res.status(400).json({ error: 'withdraw_verification_failed' });
    }
    const bridge = await Atomiq.reverseBridgeBTC({ btcAddress, amount: amt, token });
    history.push({ type: 'withdraw_intent', t: Date.now(), btcAddress, starknetAddress, amount: amt, token, atomiq: bridge, onchainTxHash });
    return res.json({ bridge, mode: 'non_custodial' });
  } catch (err) {
    res.status(500).json({ error: err?.message || 'Withdraw failed' });
  }
});

app.get('/balance', async (req, res) => {
  const { btcAddress, starknetAddress } = req.query || {};
  if (!btcAddress && !starknetAddress) {
    return res.status(400).json({ error: 'btcAddress or starknetAddress required' });
  }
  const onchain = await readOnchainBalance(starknetAddress);
  if (onchain != null) return res.json({ balance: onchain });
  return res.json({ balance: 0 });
});

app.get('/apy', async (_req, res) => {
  try {
    const url = process.env.PROTOCOL_APY_URL;
    if (!url) return res.json({ apy: 8.5 });
    const { data } = await axios.get(url, { timeout: 10000 });
    const apy = typeof data === 'number' ? data : (data?.wbtc?.apy ?? data?.apy ?? 8.5);
    return res.json({ apy });
  } catch (_e) {
    return res.json({ apy: 8.5 });
  }
});

app.get('/history', async (req, res) => {
  const { btcAddress, starknetAddress } = req.query || {};
  const filtered = history.filter((h) => {
    if (btcAddress && h.btcAddress !== btcAddress) return false;
    if (starknetAddress && h.starknetAddress !== starknetAddress) return false;
    return true;
  });
  res.json({ history: filtered });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
