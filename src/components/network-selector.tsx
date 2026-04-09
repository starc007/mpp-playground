"use client";

import type { Network } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NetworkSelectorProps {
  network: Network;
  onChange: (network: Network) => void;
}

export function NetworkSelector({ network, onChange }: NetworkSelectorProps) {
  return (
    <Select
      value={network}
      onValueChange={(v) => v && onChange(v as Network)}
    >
      <SelectTrigger className="h-7 w-28 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="testnet">testnet</SelectItem>
        <SelectItem value="mainnet">mainnet</SelectItem>
      </SelectContent>
    </Select>
  );
}
