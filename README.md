# General Message Passing Tutorial

## What I did

-clone main git
-Imported the call contract with token code with minor edits in a demo next js env and replaced message sender and receiver 
-Modify env file with Pk for testnet deploy 
-modify deploy scripts to match new contract and selected tested
-modify testnet json in config for desired chains
-Build contract and deploy to testnet 
-Edit index file in utils to match new chain info and minor changes from a double to single contract 
-Request faucet for source chain connected wallet


## How it Works

Axelar GMP  transfers tokens across EVM chains with the help of certain key contracts deployed on both the source and destination chains. 
The gateway -deployed by axelar to manage crosschain communications
gas receiver - deployed by axelar to manage gas 
Custom contract - to run GMP script to send tokens with message

The custom contract interfaces with the gateway. it has a function to call contract with tokens and execute with token function that accepts token info from source contract to update the results on the destination chain


The execute with token function is triggered automatically after contract call with tokens but can be manually run from the destination chain

After this process you should have successfully transferred tokens from chain a to b account 

Contracts:
-----------
"name": "Moonbeam",
"distributionExecutable": "0xa809D91A7d5Ac475df087d5CBA3C0db331531D4f"


"name": "Ethereum",
"distributionExecutable": "0x3a40bc39ab901b84c0B7f40590a3D0841a0E9EDa"
  
Txn Hash Axelar Testnet:
-----------

https://testnet.axelarscan.io/gmp/0x0927a14a2e04ae251a62a6cc85ef208a98fe6bf023ee981381da6b390a9b3f76


## Instructions

```sh
# copy .env
cp .env.example .env

# install dependencies
yarn

# 1st terminal: launch local cross-chain development
yarn local-dev:start

# compile contracts with hardhat
yarn contracts:build

# 2nd terminal: deploy contracts
yarn contracts:deploy

# start the ui
yarn dev
```