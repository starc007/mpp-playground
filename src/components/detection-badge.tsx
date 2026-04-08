"use client";

import type { DetectionInfo } from "@/lib/types";

interface DetectionBadgeProps {
  info: DetectionInfo;
}

export function DetectionBadge({ info }: DetectionBadgeProps) {
  if (!info.mppEnabled) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-bg-card">
        <div className="w-2 h-2 rounded-full bg-error" />
        <span className="text-xs text-text-muted">Not MPP-enabled</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-lg border border-step-receipt/30 bg-step-receipt/5">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-step-receipt" />
        <span className="text-xs font-medium text-step-receipt">MPP-enabled</span>
      </div>

      {info.method && (
        <Badge label="method" value={info.method} />
      )}
      {info.intent && (
        <Badge label="intent" value={info.intent} />
      )}
      {info.amount && (
        <Badge label="amount" value={formatAmount(info.amount)} />
      )}
      {info.recipient && (
        <a
          href={`https://explorer.tempo.xyz/address/${info.recipient}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-accent hover:underline"
        >
          {info.recipient.slice(0, 6)}...{info.recipient.slice(-4)}
        </a>
      )}
    </div>
  );
}

function formatAmount(raw: string): string {
  const num = Number(raw);
  if (isNaN(num)) return raw;
  // TIP-20 stablecoins use 6 decimals
  const usd = num / 1e6;
  if (usd === 0) return "$0.00";
  if (usd < 0.01) return `$${usd.toFixed(6)}`;
  return `$${usd.toFixed(2)}`;
}

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-text-dim">{label}:</span>
      <span className="text-xs text-text">{value}</span>
    </div>
  );
}
