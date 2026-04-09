/**
 * TIP-20 stablecoin addresses on Tempo.
 * All use 6 decimals.
 *
 * @see https://docs.tempo.xyz/quickstart/tokenlist
 */
export const TEMPO_CURRENCIES = [
  {
    label: "pathUSD",
    address: "0x20c0000000000000000000000000000000000000",
  },
  {
    label: "AlphaUSD",
    address: "0x20c0000000000000000000000000000000000001",
  },
  {
    label: "BetaUSD",
    address: "0x20c0000000000000000000000000000000000002",
  },
  {
    label: "ThetaUSD",
    address: "0x20c0000000000000000000000000000000000003",
  },
] as const satisfies readonly { label: string; address: `0x${string}` }[];

export const TIP20_DECIMALS = 6 as const;

/** Minimal ERC-20 ABI for reading balances. */
export const ERC20_BALANCE_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
