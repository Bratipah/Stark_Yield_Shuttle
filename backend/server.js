const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// NOTE: Placeholder; verify actual SDK name and methods.
let Atomiq;
try {
  Atomiq = require('atomiq-sdk');
} catch (e) {
  console.warn('atomiq-sdk not installed; using mock bridge.');
  Atomiq = {
    async bridgeBTC({ btcAddress, amount }) {
      return { txId: 'mock-btc-bridge', btcAddress, amount };
    },
  };
}

const app = express();
app.use(cors());
app.use(bodyParser.json());

let balances = {};

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

app.post('/deposit', async (req, res) => {
  const { btcAddress, starknetAddress, amount } = req.body || {};
  if (!btcAddress || !amount) {
    return res.status(400).json({ error: 'btcAddress and amount required' });
  }
  try {
    const tx = await Atomiq.bridgeBTC({ btcAddress, amount });
    const key = starknetAddress || btcAddress;
    const prev = balances[key] || 0;
    balances[key] = prev + Number(amount);
    res.json({ tx, balance: balances[key] });
  } catch (err) {
    res.status(500).json({ error: err?.message || 'Bridge failed' });
  }
});

app.post('/withdraw', async (req, res) => {
  const { btcAddress, starknetAddress, amount } = req.body || {};
  if (!btcAddress || !amount) {
    return res.status(400).json({ error: 'btcAddress and amount required' });
  }
  const key = starknetAddress || btcAddress;
  const current = balances[key] || 0;
  if (Number(amount) > current) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  // TODO: Call yield protocol withdraw + Atomiq reverse bridge to btcAddress
  balances[key] = current - Number(amount);
  res.json({ tx: { txId: 'mock-withdraw' }, balance: balances[key] });
});

app.get('/balance', async (req, res) => {
  const { btcAddress, starknetAddress } = req.query || {};
  if (!btcAddress && !starknetAddress) {
    return res.status(400).json({ error: 'btcAddress or starknetAddress required' });
  }
  const onchain = await readOnchainBalance(starknetAddress);
  if (onchain != null) return res.json({ balance: onchain });
  const key = starknetAddress || btcAddress;
  return res.json({ balance: balances[key] || 0 });
});

app.get('/apy', async (_req, res) => {
  try {
    // TODO: Replace with actual Vesu/Troves API when available
    // Example placeholder fetch
    // const r = await fetch('https://api.vesu.fi/v1/apy');
    // const j = await r.json();
    // return res.json({ apy: j?.wbtc?.apy ?? 8.5 });
    return res.json({ apy: 8.5 });
  } catch (_e) {
    return res.json({ apy: 8.5 });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
