#!/usr/bin/env node
/*
  E2E Demo: wallet connect is simulated via provided addresses.
  Flow: deposit -> verify -> withdraw -> verify
*/

const axios = require('axios');

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  const apiBase = process.env.API_BASE || 'http://localhost:4000';
  const btcAddress = process.env.BTC_ADDRESS || 'tb1qexamplebtcaddr...';
  const starknetAddress = process.env.STARKNET_ADDRESS;
  if (!starknetAddress) throw new Error('Provide STARKNET_ADDRESS env');

  console.log('Step 1: Refresh balances');
  let resp = await axios.get(`${apiBase}/balance`, { params: { btcAddress, starknetAddress } });
  console.log('Initial balance:', resp.data);

  console.log('Step 2: Deposit');
  resp = await axios.post(`${apiBase}/deposit`, { btcAddress, starknetAddress, amount: 0.01 });
  console.log('Deposit response:', resp.data);

  console.log('Waiting 5s for on-chain confirmation...');
  await sleep(5000);

  console.log('Step 3: Verify balance');
  resp = await axios.get(`${apiBase}/balance`, { params: { btcAddress, starknetAddress } });
  console.log('Post-deposit balance:', resp.data);

  console.log('Step 4: Withdraw');
  resp = await axios.post(`${apiBase}/withdraw`, { btcAddress, starknetAddress, amount: 0.01 });
  console.log('Withdraw response:', resp.data);

  console.log('Waiting 5s for on-chain confirmation...');
  await sleep(5000);

  console.log('Step 5: Verify final balance');
  resp = await axios.get(`${apiBase}/balance`, { params: { btcAddress, starknetAddress } });
  console.log('Final balance:', resp.data);

  console.log('E2E demo complete ✅');
}

main().catch((e) => {
  console.error('E2E demo failed:', e?.response?.data || e.message);
  process.exit(1);
});

