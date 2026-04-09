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

/** Reverse lookup: chain id → network. Returns `undefined` for unknown chains. */
export function networkForChainId(chainId: number): Network | undefined {
  if (chainId === CHAIN_IDS.mainnet) return "mainnet";
  if (chainId === CHAIN_IDS.testnet) return "testnet";
  return undefined;
}
