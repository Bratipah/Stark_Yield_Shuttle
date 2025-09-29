#!/usr/bin/env node
/*
  Deploys ShuttleContract (Cairo 2) using starknet.js
  Requires compiled artifacts and a funded account on testnet.
*/

const fs = require('fs');
const path = require('path');

async function main() {
  const STARKNET_RPC_URL = process.env.STARKNET_RPC_URL;
  const STARKNET_ACCOUNT_ADDRESS = process.env.STARKNET_ACCOUNT_ADDRESS;
  const STARKNET_PRIVATE_KEY = process.env.STARKNET_PRIVATE_KEY;
  if (!STARKNET_RPC_URL || !STARKNET_ACCOUNT_ADDRESS || !STARKNET_PRIVATE_KEY) {
    throw new Error('Set STARKNET_RPC_URL, STARKNET_ACCOUNT_ADDRESS, STARKNET_PRIVATE_KEY');
  }
  const { RpcProvider, Account, Contract, json, cairo } = await import('starknet');
  const provider = new RpcProvider({ nodeUrl: STARKNET_RPC_URL });
  const account = new Account(provider, STARKNET_ACCOUNT_ADDRESS, STARKNET_PRIVATE_KEY);

  // Load artifacts from Scarb build outputs
  const outDir = path.resolve(__dirname, '../contracts/shuttle_contract/target/dev');
  const sierraPath = path.join(outDir, 'shuttle_contract_ShuttleContract.contract_class.json');
  const casmPath = path.join(outDir, 'shuttle_contract_ShuttleContract.compiled_contract_class.json');
  if (!fs.existsSync(sierraPath) || !fs.existsSync(casmPath)) {
    throw new Error('Build artifacts not found. Run `scarb build` in contracts/shuttle_contract');
  }
  const sierra = json.parse(fs.readFileSync(sierraPath, 'utf8'));
  const casm = json.parse(fs.readFileSync(casmPath, 'utf8'));

  console.log('Declaring class...');
  const declareResp = await account.declare({ contract: sierra, casm: casm });
  console.log('Class hash:', declareResp.class_hash);
  await provider.waitForTransaction(declareResp.transaction_hash);

  console.log('Deploying contract...');
  const deployResp = await account.deployContract({ classHash: declareResp.class_hash, constructorCalldata: [] });
  console.log('Deployed address:', deployResp.contract_address);
  console.log('Txn hash:', deployResp.transaction_hash);
  await provider.waitForTransaction(deployResp.transaction_hash);

  console.log('Export:');
  console.log(JSON.stringify({ contract_address: deployResp.contract_address, class_hash: declareResp.class_hash }, null, 2));
}

main().catch((e) => {
  console.error('Deploy failed:', e?.response?.data || e.message);
  process.exit(1);
});

