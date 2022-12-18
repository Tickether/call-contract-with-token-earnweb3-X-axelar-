import { Contract, ethers, getDefaultProvider, providers } from "ethers";
import {
  AxelarQueryAPI,
  Environment,
  EvmChain,
  GasToken,
} from "@axelar-network/axelarjs-sdk";

import AxelarGatewayContract from "../artifacts/@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol/IAxelarGateway.json";
import DistributionExecutableContract from "../artifacts/contracts/DistributionExecutable.sol/DistributionExecutable.json";
import IERC20 from "../artifacts/@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol/IERC20.json";
import { isTestnet, wallet } from "../config/constants";

let chains = isTestnet
  ? require("../config/testnet.json")
  : require("../config/local.json");

const moonbeamChain = chains.find(
  (chain: any) => chain.name === "Moonbeam",
) as any;
const etherChain = chains.find(
  (chain: any) => chain.name === "Ethereum",
) as any;

if (!moonbeamChain || !etherChain) process.exit(0);

const useMetamask = false; // typeof window === 'object';

const moonbeamProvider = useMetamask
  ? new providers.Web3Provider((window as any).ethereum)
  : getDefaultProvider(moonbeamChain.rpc);
const moonbeamConnectedWallet = useMetamask
  ? (moonbeamProvider as providers.Web3Provider).getSigner()
  : wallet.connect(moonbeamProvider);
const etherProvider = getDefaultProvider(etherChain.rpc);
const etherConnectedWallet = wallet.connect(etherProvider);

const srcGatewayContract = new Contract(
  etherChain.gateway,
  AxelarGatewayContract.abi,
  etherConnectedWallet,
);

const destGatewayContract = new Contract(
  moonbeamChain.gateway,
  AxelarGatewayContract.abi,
  moonbeamConnectedWallet,
);

const sourceContract = new Contract(
  etherChain.distributionExecutable as string,
  DistributionExecutableContract.abi,
  etherConnectedWallet,
);

const destContract = new Contract(
  moonbeamChain.distributionExecutable as string,
  DistributionExecutableContract.abi,
  moonbeamConnectedWallet,
);

export function generateRecipientAddress(): string {
  return ethers.Wallet.createRandom().address;
}

export async function sendTokenToDestChain(
  amount: string,
  recipientAddresses: string[],
  onSent: (txhash: string) => void,
) {
  // Get token address from the gateway contract
  const tokenAddress = await srcGatewayContract.tokenAddresses("aUSDC");

  const erc20 = new Contract(
    tokenAddress,
    IERC20.abi,
    etherConnectedWallet,
  );

  // Approve the token for the amount to be sent
  await erc20
    .approve(sourceContract.address, ethers.utils.parseUnits(amount, 6))
    .then((tx: any) => tx.wait());

  const api = new AxelarQueryAPI({ environment: Environment.TESTNET });

  // Calculate how much gas to pay to Axelar to execute the transaction at the destination chain
  const gasFee = await api.estimateGasFee(
    EvmChain.ETHEREUM,
    EvmChain.MOONBEAM,
    GasToken.ETH,
    700000,
    2
  );

  // Send the token
  const receipt = await sourceContract
    .sendTokenWithMsg(
      "Moonbeam",
      destContract.address,
      recipientAddresses,
      "aUSDC",
      ethers.utils.parseUnits(amount, 6),
      {
        value: BigInt(isTestnet ? gasFee : 3000000),
      },
    )
    .then((tx: any) => tx.wait());

  console.log({
    txHash: receipt.transactionHash,
  });
  onSent(receipt.transactionHash);

  // Wait destination contract to execute the transaction.
  
  return new Promise((resolve, reject) => {
    destContract.on("Executed", () => {
      destContract.removeAllListeners("Executed");
      resolve(null);
    });
  });
  
}

export function truncatedAddress(address: string): string {
  return (
    address.substring(0, 6) + "..." + address.substring(address.length - 4)
  );
}

export async function getBalance(addresses: string[], isSource: boolean) {
  const contract = isSource ? srcGatewayContract : destGatewayContract;
  const connectedWallet = isSource
    ? etherConnectedWallet
    : moonbeamConnectedWallet;
  const tokenAddress = await contract.tokenAddresses("aUSDC");
  const erc20 = new Contract(tokenAddress, IERC20.abi, connectedWallet);
  const balances = await Promise.all(
    addresses.map(async (address) => {
      const balance = await erc20.balanceOf(address);
      return ethers.utils.formatUnits(balance, 6);
    }),
  );
  return balances;
}
