import { createConfig, http } from "wagmi";
import { tempoWallet } from "accounts/wagmi";
import { tempo, tempoModerato } from "viem/chains";
import type { Network } from "./types";

export function createWagmiConfig(network: Network) {
  const isTestnet = network === "testnet";

  if (isTestnet) {
    return createConfig({
      chains: [tempoModerato],
      connectors: [tempoWallet({ testnet: true })],
      multiInjectedProviderDiscovery: false,
      transports: { [tempoModerato.id]: http() },
    });
  }

  return createConfig({
    chains: [tempo],
    connectors: [tempoWallet({ testnet: false })],
    multiInjectedProviderDiscovery: false,
    transports: { [tempo.id]: http() },
  });
}

export const config = createWagmiConfig("testnet");

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
