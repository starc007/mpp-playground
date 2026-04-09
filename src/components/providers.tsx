"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { createWagmiConfig } from "@/lib/wagmi";
import type { Network } from "@/lib/types";

interface NetworkContextValue {
  network: Network;
  setNetwork: (network: Network) => void;
  config: ReturnType<typeof createWagmiConfig>;
}

const NetworkContext = createContext<NetworkContextValue>({
  network: "testnet",
  setNetwork: () => {},
  config: createWagmiConfig("testnet"),
});

export function useNetwork() {
  return useContext(NetworkContext);
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [network, setNetworkState] = useState<Network>("testnet");
  const config = useMemo(() => createWagmiConfig(network), [network]);

  const setNetwork = useCallback((n: Network) => {
    setNetworkState(n);
  }, []);

  return (
    <NetworkContext value={{ network, setNetwork, config }}>
      <WagmiProvider config={config} key={network}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </NetworkContext>
  );
}
