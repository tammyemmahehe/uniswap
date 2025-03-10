// config.js
import { Mainnet } from "@usedapp/core";

export const ROUTER_ADDRESS = process.env.REACT_APP_ROUTER_ADDRESS;

export const DAPP_CONFIG = {
  readOnlyChainId: Mainnet.chainId,
  readOnlyUrls: {
    [Mainnet.chainId]: process.env.REACT_APP_MAINNET_RPC_URL,
  },
};
