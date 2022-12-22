import { createContext, useContext } from "react";
import { makeAutoObservable } from "mobx";
import { ethers } from "ethers";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";

export class WalletStore {
  address: string | null = null;
  balance: string | null = null;
  status: WalletStatusEnums = WalletStatusEnums.DISCONNECTED;
  provider: any | null = null;
  private web3Modal: Web3Modal | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  connectWallet = async (): Promise<void> => {
    console.log("Connecting wallet");
    this.status = WalletStatusEnums.LOADING;

    try {
      const web3Modal = new Web3Modal({
        theme: "dark",
        cacheProvider: true,
        providerOptions: {
          walletconnect: {
            package: WalletConnectProvider,
            options: {
              rpc: {
                44787: "https://alfajores-forno.celo-testnet.org",
                42220: "https://forno.celo.org",
              },
            },
          },
        },
        disableInjectedProvider: false,
      });

      const provider = await web3Modal.connect();
      const web3Provider = new ethers.providers.Web3Provider(provider);
      const signer = web3Provider.getSigner();
      const address = await signer.getAddress();
      const balance = await web3Provider.getBalance(address);

      // Subscribe to accounts change
      if (process.env.NODE_ENV !== "production") {
        provider.on("accountsChanged", (accounts: string[]) => {
          console.log(accounts);
        });

        // Subscribe to chainId change
        provider.on("chainChanged", (chainId: number) => {
          console.log("Web3 chainChanged:");
          console.log(chainId);
          // dispatch(fetchAcctAndThenLoadNFTs());
        });

        provider.on("block", (blockNumber: number) => {
          console.log(blockNumber);
          // dispatch(fetchLastBlock());
        });

        // Subscribe to session disconnection
        provider.on("disconnect", (code: number, reason: string) => {
          console.log("Web3 disconnect:");
          console.log(code, reason);
        });
      }

      this.address = address;
      this.balance = ethers.utils.formatEther(balance);
      this.provider = provider;
      this.web3Modal = web3Modal;
      this.status = WalletStatusEnums.CONNECTED;

      console.log("Connected to wallet");
    } catch (error) {
      console.log("Error initializing web3", error);
      this.status = WalletStatusEnums.DISCONNECTED;
      throw error;
    }
  };

  disconnectWallet = async (): Promise<void> => {
    console.log("Disconnecting wallet");
    this.status = WalletStatusEnums.LOADING;

    if (this.web3Modal) {
      await this.web3Modal.clearCachedProvider();
      this.address = null;
      this.balance = null;
      this.provider = null;
      this.web3Modal = null;
      this.status = WalletStatusEnums.DISCONNECTED;
    }
  };
}

export enum WalletStatusEnums {
  DISCONNECTED,
  LOADING,
  CONNECTED,
  WRONG_NETWORK,
}

export const WalletStoreContext = createContext<WalletStore | null>(null);
export const useWalletStore = (): WalletStore => {
  const store = useContext(WalletStoreContext);
  if (!store) {
    throw new Error("Wallet store must be used within a WalletStoreProvider");
  }
  return store;
};
