import { createConfig, http } from "wagmi";
import { tempoWallet } from "wagmi/tempo";
import { Storage } from "accounts";
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
 * Share the accounts SDK's IndexedDB store with mppx's payment UI.
 *
 * By default, wagmi's tempoWallet connector wraps the accounts store in
 * wagmi's own storage (localStorage, prefixed `accounts.xyz.tempo.*`).
 * The payment pages mppx renders create their own `Provider.create()`
 * and use the accounts SDK default — `Storage.idb({ key: 'tempo' })` →
 * IndexedDB `tempo.store`. The two stores never share data.
 *
 * Result: access keys authorized here land in localStorage, never in
 * IDB, so the payment-link page sees `accessKeys: []` and falls back
 * to the transaction-approval dialog instead of silent signing.
 *
 * Force both sides to the same IDB path.
 */
const sharedStorage = () =>
  typeof window !== "undefined"
    ? Storage.idb({ key: "tempo" })
    : Storage.memory({ key: "tempo" });

export function createWagmiConfig(network: Network) {
  if (network === "testnet") {
    return createConfig({
      chains: [tempoTestnet],
      connectors: [
        tempoWallet({ testnet: true, storage: sharedStorage() }),
      ],
      multiInjectedProviderDiscovery: false,
      transports: { [tempoTestnet.id]: http() },
    });
  }

  return createConfig({
    chains: [tempoMainnet],
    connectors: [
      tempoWallet({ testnet: false, storage: sharedStorage() }),
    ],
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
