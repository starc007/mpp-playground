"use client";

import { useAccount, useConnect, useDisconnect, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { useNetwork } from "./providers";
import { TEMPO_CURRENCIES, ERC20_BALANCE_ABI } from "@/lib/currencies";
import { Button } from "@/components/ui/button";

const PATHUSD_ADDRESS = TEMPO_CURRENCIES[0].address;

export function WalletBar() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { network } = useNetwork();

  const { data: rawBalance } = useReadContract({
    address: PATHUSD_ADDRESS,
    abi: ERC20_BALANCE_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  const tempoConnector = connectors.find((c) => c.id === "xyz.tempo");

  if (isConnected && address) {
    const balance =
      rawBalance !== undefined ? formatUnits(rawBalance, 6) : null;

    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-card">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-xs font-mono">
            {address.slice(0, 6)}…{address.slice(-4)}
          </span>
          {balance && (
            <span className="text-xs text-text-dim">
              {parseFloat(balance).toFixed(2)} pathUSD
            </span>
          )}
          <span className="text-[10px] text-text-dim">{network}</span>
        </div>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => disconnect()}
          className="text-text-dim hover:text-destructive"
        >
          disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => tempoConnector && connect({ connector: tempoConnector })}
      disabled={isPending}
    >
      {isPending ? "connecting…" : "connect wallet"}
    </Button>
  );
}
