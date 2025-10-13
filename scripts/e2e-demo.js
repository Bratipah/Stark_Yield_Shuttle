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
  const ownerMode = String(process.env.OWNER_MODE || '').toLowerCase() === 'true';

  console.log('Step 1: Refresh balances');
  let resp = await axios.get(`${apiBase}/balance`, { params: { btcAddress, starknetAddress } });
  console.log('Initial balance:', resp.data);

  const amount = 1; // integer demo units

  console.log('Step 2: Deposit');
  resp = await axios.post(`${apiBase}/deposit`, { btcAddress, starknetAddress, amount });
  console.log('Deposit response:', resp.data);
  if (!ownerMode) {
    console.log('Non-custodial mode: on-chain deposit must be signed in UI wallet. Skipping wait.');
  }

  console.log('Waiting 5s for on-chain confirmation...');
  await sleep(5000);

  console.log('Step 3: Verify balance');
  resp = await axios.get(`${apiBase}/balance`, { params: { btcAddress, starknetAddress } });
  console.log('Post-deposit balance:', resp.data);

  console.log('Step 4: Withdraw');
  if (ownerMode) {
    resp = await axios.post(`${apiBase}/withdraw`, { btcAddress, starknetAddress, amount });
    console.log('Withdraw response:', resp.data);
  } else {
    console.log('Non-custodial mode: user must sign withdraw on-chain in UI; skipping backend withdraw.');
  }

  console.log('Waiting 5s for on-chain confirmation...');
  await sleep(5000);

  console.log('Step 5: Verify final balance');
  resp = await axios.get(`${apiBase}/balance`, { params: { btcAddress, starknetAddress } });
  console.log('Final balance:', resp.data);

  console.log('E2E demo complete ✅');
}

main().catch((e) => {
  const data = e?.response?.data;
  console.error('E2E demo failed:', data || e.message);
  process.exit(1);
});




