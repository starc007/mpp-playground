"use client";

import type { Network } from "@/lib/types";

interface NetworkSelectorProps {
  network: Network;
  onChange: (network: Network) => void;
}

export function NetworkSelector({ network, onChange }: NetworkSelectorProps) {
  return (
    <div className="relative">
      <select
        value={network}
        onChange={(e) => onChange(e.target.value as Network)}
        className="appearance-none pl-3 pr-7 py-1.5 rounded border border-border bg-bg-surface text-xs text-text-muted cursor-pointer focus:outline-none focus:border-accent/50 transition-colors"
      >
        <option value="testnet">testnet</option>
        <option value="mainnet">mainnet</option>
      </select>
      <svg
        className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-text-dim pointer-events-none"
        viewBox="0 0 12 12"
        fill="none"
      >
        <path
          d="M3 5L6 8L9 5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
