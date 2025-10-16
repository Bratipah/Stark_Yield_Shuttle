#!/usr/bin/env node
// Minimal deploy script for ShuttleContract (requires compiled artifacts and RPC 0.8)
// Env: STARKNET_RPC_URL, STARKNET_ACCOUNT_ADDRESS, STARKNET_PRIVATE_KEY

const fs = require('fs');
const path = require('path');

async function main() {
  const STARKNET_RPC_URL = process.env.STARKNET_RPC_URL;
  const STARKNET_ACCOUNT_ADDRESS = process.env.STARKNET_ACCOUNT_ADDRESS;
  const STARKNET_PRIVATE_KEY = process.env.STARKNET_PRIVATE_KEY;
  if (!STARKNET_RPC_URL || !STARKNET_ACCOUNT_ADDRESS || !STARKNET_PRIVATE_KEY) {
    throw new Error('Missing env: STARKNET_RPC_URL, STARKNET_ACCOUNT_ADDRESS, STARKNET_PRIVATE_KEY');
  }
  const { RpcProvider, Account, json, Contract, hash, ec } = await import('starknet');
  const provider = new RpcProvider({ nodeUrl: STARKNET_RPC_URL });
  const account = new Account(provider, STARKNET_ACCOUNT_ADDRESS, STARKNET_PRIVATE_KEY);

  const artifactsDir = path.resolve(__dirname, '../contracts/shuttle_contract/target/dev');
  const sierraPath = path.join(artifactsDir, 'shuttle_contract_ShuttleContract.contract_class.json');
  const casmPath = path.join(artifactsDir, 'shuttle_contract_ShuttleContract.compiled_contract_class.json');
  const sierra = json.parse(fs.readFileSync(sierraPath, 'utf8'));
  const casm = json.parse(fs.readFileSync(casmPath, 'utf8'));

  console.log('Declaring class...');
  const declare = await account.declare({ contract: sierra, casm });
  await provider.waitForTransaction(declare.transaction_hash);
  const classHash = declare.class_hash;
  console.log('Declared class_hash:', classHash);

  console.log('Deploying...');
  const constructorCalldata = [STARKNET_ACCOUNT_ADDRESS];
  const deployTx = await account.deployContract({ classHash, constructorCalldata });
  await provider.waitForTransaction(deployTx.transaction_hash);
  console.log('Deployed at address:', deployTx.contract_address);
  console.log('transaction_hash:', deployTx.transaction_hash);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
