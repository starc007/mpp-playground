"use client";

import { useAccount, useConnect, useDisconnect, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { useNetwork } from "./providers";

// pathUSD token address on Tempo
const PATHUSD_ADDRESS = "0x20c0000000000000000000000000000000000000" as const;

// Minimal ERC20 ABI for balanceOf
const erc20BalanceAbi = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export function WalletBar() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { network } = useNetwork();

  const { data: rawBalance } = useReadContract({
    address: PATHUSD_ADDRESS,
    abi: erc20BalanceAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const tempoConnector = connectors.find((c) => c.id === "xyz.tempo");

  if (isConnected && address) {
    const balance =
      rawBalance !== undefined ? formatUnits(rawBalance, 6) : null;

    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded border border-border bg-bg-surface">
          <div className="w-1.5 h-1.5 rounded-full bg-accent" />
          <span className="text-xs text-text">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          {balance && (
            <span className="text-xs text-text-dim">
              {parseFloat(balance).toFixed(2)} pathUSD
            </span>
          )}
          <span className="text-[10px] text-text-dim">
            {network}
          </span>
        </div>
        <button
          onClick={() => disconnect()}
          className="text-xs text-text-dim hover:text-error transition-colors"
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
      className="px-4 py-2 rounded border border-border text-xs text-text-muted hover:text-accent hover:border-accent/30 transition-colors disabled:opacity-50"
    >
      {isPending ? "connecting..." : "connect wallet"}
    </button>
  );
}
