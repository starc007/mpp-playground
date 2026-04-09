import { createConfig, http } from "wagmi";
import { tempoWallet } from "accounts/wagmi";
import { tempo, tempoModerato } from "viem/chains";
import type { Network } from "./types";
import { FEE_SPONSOR_URL } from "./chains";

export function createWagmiConfig(
  network: Network,
  options?: { disableFeePayer?: boolean },
) {
  const feePayerUrl = options?.disableFeePayer
    ? undefined
    : FEE_SPONSOR_URL[network];

  if (network === "testnet") {
    return createConfig({
      chains: [tempoModerato],
      connectors: [
        tempoWallet({
          testnet: true,
          ...(feePayerUrl && { feePayerUrl }),
        }),
      ],
      multiInjectedProviderDiscovery: false,
      transports: { [tempoModerato.id]: http() },
    });
  }

  return createConfig({
    chains: [tempo],
    connectors: [
      tempoWallet({
        testnet: false,
        ...(feePayerUrl && { feePayerUrl }),
      }),
    ],
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
