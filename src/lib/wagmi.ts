import { createConfig, http } from "wagmi";
import { tempoWallet } from "accounts/wagmi";
import { tempo, tempoModerato } from "viem/chains";
import type { Network } from "./types";

/**
 * Create a wagmi config for the given network.
 *
 * Note: we intentionally do NOT pass `feePayerUrl` to `tempoWallet()`.
 * The Tempo Wallet has built-in fee sponsorship, and adding an external
 * feePayerUrl causes two problems:
 *   1. signTransaction produces a 0x78 fee-payer envelope instead of a
 *      plain 0x76 sender-signed tx (breaks the scheduler's raw broadcast)
 *   2. The fee payer server adds latency to the wallet_sendCalls →
 *      postMessage chain, causing createCredential to hang on production
 *      domains where timing is less forgiving
 */
export function createWagmiConfig(network: Network) {
  if (network === "testnet") {
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
