"use client";

import { useAccount, useConnect, useDisconnect, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { TEMPO_CURRENCIES, ERC20_BALANCE_ABI } from "@/lib/currencies";
import { Button } from "@/components/ui/button";

const PATHUSD_ADDRESS = TEMPO_CURRENCIES[0].address;

export function WalletBar() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

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
      <div className="space-y-2">
        <div className="space-y-1.5 px-3 py-2.5 rounded-md border border-border bg-card">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            <span className="text-xs font-mono truncate">
              {address.slice(0, 6)}…{address.slice(-4)}
            </span>
          </div>
          {balance && (
            <div className="text-xs text-muted-foreground pl-3.5">
              {parseFloat(balance).toFixed(2)} pathUSD
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => disconnect()}
          className="w-full justify-start text-text-dim hover:text-destructive"
        >
          disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={() => tempoConnector && connect({ connector: tempoConnector })}
      disabled={isPending}
      className="w-full h-10"
    >
      {isPending ? "connecting…" : "connect wallet"}
    </Button>
  );
}
