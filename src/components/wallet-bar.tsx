"use client";

import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { tempoModerato } from "viem/chains";

export function WalletBar() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({
    address,
    chainId: tempoModerato.id,
  });

  const tempoConnector = connectors.find((c) => c.id === "xyz.tempo");

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-bg-card">
          <div className="w-2 h-2 rounded-full bg-step-receipt" />
          <span className="text-xs text-text-muted">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          {balance && (
            <span className="text-xs text-text-dim">
              {(Number(balance.value) / 10 ** balance.decimals).toFixed(2)} {balance.symbol}
            </span>
          )}
        </div>
        <button
          onClick={() => disconnect()}
          className="text-xs text-text-muted hover:text-error transition-colors"
        >
          disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => tempoConnector && connect({ connector: tempoConnector })}
      disabled={isPending}
      className="px-4 py-1.5 rounded-lg border border-border text-xs text-text-muted hover:text-text hover:border-border-active transition-colors disabled:opacity-50"
    >
      {isPending ? "connecting..." : "connect wallet"}
    </button>
  );
}
