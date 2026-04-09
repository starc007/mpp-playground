import type { Network } from "./types";

/**
 * Chain ID lookup for Tempo networks.
 *
 * - Mainnet: `tempo` (4217)
 * - Testnet: `tempoModerato` (42431)
 *
 * @see https://docs.tempo.xyz/quickstart/connection-details
 */
export const CHAIN_IDS = {
  mainnet: 4217,
  testnet: 42431,
} as const satisfies Record<Network, number>;

/**
 * Public fee sponsor URLs provided by Tempo for each network.
 * The sponsor co-signs transactions so users don't pay gas directly.
 *
 * @see https://docs.tempo.xyz/guide/payments/sponsor-user-fees
 */
export const FEE_SPONSOR_URL: Record<Network, string | undefined> = {
  testnet: "https://sponsor.moderato.tempo.xyz",
  mainnet: undefined,
};

/**
 * Extra gas added to estimates for WebAuthn wallets.
 * P256 signature verification + fee-payer dual-signing costs ~25k more
 * gas than the node estimator budgets.
 */
export const WEBAUTHN_GAS_BUFFER = 30_000n;

/** Reverse lookup: chain id → network. Returns `undefined` for unknown chains. */
export function networkForChainId(chainId: number): Network | undefined {
  if (chainId === CHAIN_IDS.mainnet) return "mainnet";
  if (chainId === CHAIN_IDS.testnet) return "testnet";
  return undefined;
}
