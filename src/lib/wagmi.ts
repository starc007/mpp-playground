import { createConfig, http } from "wagmi";
import { tempoWallet } from "accounts/wagmi";
import { tempoModerato } from "viem/chains";

export const config = createConfig({
  chains: [tempoModerato],
  connectors: [
    tempoWallet({
      testnet: true,
      mpp: true,
    }),
  ],
  multiInjectedProviderDiscovery: false,
  transports: {
    [tempoModerato.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
