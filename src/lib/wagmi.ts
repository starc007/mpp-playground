import { createConfig, http } from "wagmi";
import { tempoWallet } from "accounts/wagmi";
import { tempo, tempoModerato } from "viem/chains";
import type { Network } from "./types";
import { TEMPO_CURRENCIES } from "./currencies";

/**
 * Pin the fee token on both chains to pathUSD.
 *
 * Why: when the wallet's default fee token differs from the payment token,
 * Tempo has to make an extra contract call during execution (deduct fee
 * from the fee-token contract, then transfer the payment token) which
 * bumps gas consumption past what the node estimator budgets. The
 * result is an out-of-gas revert on the payment flow.
 *
 * Pinning the fee token to match the most-used MPP payment currency
 * avoids that extra call entirely.
 *
 * @see https://github.com/wevm/viem — search tempo/chainConfig for the
 * FIXME about gas estimation with webAuthn signatures + fee payer.
 */
const PATHUSD = TEMPO_CURRENCIES[0].address;

const tempoMainnet = { ...tempo, feeToken: PATHUSD } as typeof tempo;
const tempoTestnet = {
  ...tempoModerato,
  feeToken: PATHUSD,
} as typeof tempoModerato;

export function createWagmiConfig(network: Network) {
  const isTestnet = network === "testnet";

  if (isTestnet) {
    return createConfig({
      chains: [tempoTestnet],
      connectors: [tempoWallet({ testnet: true })],
      multiInjectedProviderDiscovery: false,
      transports: { [tempoTestnet.id]: http() },
    });
  }

  return createConfig({
    chains: [tempoMainnet],
    connectors: [tempoWallet({ testnet: false })],
    multiInjectedProviderDiscovery: false,
    transports: { [tempoMainnet.id]: http() },
  });
}

export const config = createWagmiConfig("testnet");

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
