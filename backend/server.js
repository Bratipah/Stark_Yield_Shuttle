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
        inputs: [{ name: 'user', type: 'ContractAddress' }],
        outputs: [{ name: 'res', type: 'felt252' }],
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
        { name: 'user', type: 'ContractAddress' },
        { name: 'amount', type: 'felt252' },
      ],
      outputs: [],
    },
    {
      name: 'withdraw_for',
      type: 'function',
      state_mutability: 'external',
      inputs: [
        { name: 'user', type: 'ContractAddress' },
        { name: 'amount', type: 'felt252' },
      ],
      outputs: [],
    },
  ];
  const contract = new Contract(abi, CONTRACT_ADDRESS, account);
  return contract;
}

app.post('/deposit', async (req, res) => {
  const { btcAddress, starknetAddress, amount } = req.body || {};
  const amt = Number(amount);
  if (!btcAddress || !starknetAddress || !Number.isFinite(amt) || amt <= 0) {
    return res.status(400).json({ error: 'btcAddress, starknetAddress and positive amount required' });
  }
  try {
    const bridge = await Atomiq.bridgeBTC({ btcAddress, amount: amt });
    const contract = await getContractForInvoke();
    const invoke = await contract.deposit_for(starknetAddress, amt);
    history.push({
      type: 'deposit',
      t: Date.now(),
      btcAddress,
      starknetAddress,
      amount: amt,
      atomiq: bridge,
      onchain: invoke,
    });
    const onchainBalance = await readOnchainBalance(starknetAddress);
    res.json({ bridge, onchainTx: invoke, balance: onchainBalance });
  } catch (err) {
    res.status(500).json({ error: err?.message || 'Deposit failed' });
  }
});

app.post('/withdraw', async (req, res) => {
  const { btcAddress, starknetAddress, amount } = req.body || {};
  const amt = Number(amount);
  if (!btcAddress || !starknetAddress || !Number.isFinite(amt) || amt <= 0) {
    return res.status(400).json({ error: 'btcAddress, starknetAddress and positive amount required' });
  }
  try {
    const contract = await getContractForInvoke();
    const invoke = await contract.withdraw_for(starknetAddress, amt);
    const bridge = await Atomiq.reverseBridgeBTC({ btcAddress, amount: amt });
    history.push({
      type: 'withdraw',
      t: Date.now(),
      btcAddress,
      starknetAddress,
      amount: amt,
      atomiq: bridge,
      onchain: invoke,
    });
    const onchainBalance = await readOnchainBalance(starknetAddress);
    res.json({ bridge, onchainTx: invoke, balance: onchainBalance });
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
