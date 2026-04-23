import { createConfig, http } from "wagmi";
import { tempoWallet } from "wagmi/tempo";
import { tempo, tempoModerato } from "viem/chains";
import type { Network } from "./types";
import { TEMPO_CURRENCIES } from "./currencies";

/**
 * Pin the fee token to pathUSD on both chains.
 *
 * Without this, the wallet pays fees in whatever the user's default
 * token is (e.g. BetaUSD). When the fee token differs from the payment
 * token, Tempo needs an extra contract call to deduct the fee, which
 * pushes gas past the estimator's budget → OOG on push mode payments.
 *
 * No feePayerUrl: the Tempo Wallet handles fee sponsorship internally.
 * Adding feePayerUrl wraps signTransaction with a 0x78 fee-payer
 * envelope and breaks both the scheduler (can't broadcast 0x78 raw)
 * and createCredential (postMessage hang on production domains).
 */
const PATHUSD = TEMPO_CURRENCIES[0].address;
const tempoMainnet = { ...tempo, feeToken: PATHUSD } as typeof tempo;
const tempoTestnet = {
  ...tempoModerato,
  feeToken: PATHUSD,
} as typeof tempoModerato;

/**
 * Pin the wallet dialog host.
 *
 * accounts@0.8 flipped the default from `https://wallet.tempo.xyz/embed`
 * to `https://wallet-next.tempo.xyz/remote`. The payment pages mppx
 * renders still bundle the old host (html.gen.js), so keys authorized
 * here can't silently sign over there — the user gets a transaction
 * approval dialog on every payment instead of the access key kicking in.
 *
 * Match mppx's host until upstream ships a rebuilt HTML bundle.
 */
const WALLET_HOST = "https://wallet.tempo.xyz/embed";

export function createWagmiConfig(network: Network) {
  if (network === "testnet") {
    return createConfig({
      chains: [tempoTestnet],
      connectors: [tempoWallet({ testnet: true, host: WALLET_HOST })],
      multiInjectedProviderDiscovery: false,
      transports: { [tempoTestnet.id]: http() },
    });
  }

  return createConfig({
    chains: [tempoMainnet],
    connectors: [tempoWallet({ testnet: false, host: WALLET_HOST })],
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
