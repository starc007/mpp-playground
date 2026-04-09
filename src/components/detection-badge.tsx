"use client";

import type { DetectionInfo } from "@/lib/types";
import { TIP20_DECIMALS } from "@/lib/currencies";
import { Badge } from "@/components/ui/badge";

interface DetectionBadgeProps {
  info: DetectionInfo;
}

/** Format a raw TIP-20 amount (6 decimals) as a USD price string. */
function formatAmount(raw: string): string {
  const num = Number(raw);
  if (Number.isNaN(num)) return raw;
  const usd = num / 10 ** TIP20_DECIMALS;
  if (usd === 0) return "$0.00";
  if (usd < 0.01) return `$${usd.toFixed(6)}`;
  return `$${usd.toFixed(2)}`;
}

export function DetectionBadge({ info }: DetectionBadgeProps) {
  if (!info.mppEnabled) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card">
        <div className="w-2 h-2 rounded-full bg-destructive" />
        <span className="text-xs text-muted-foreground">Not MPP-enabled</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-lg border border-step-receipt/30 bg-step-receipt/5">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-step-receipt" />
        <span className="text-xs font-medium text-step-receipt">
          MPP-enabled
        </span>
      </div>

      {info.method && <Field label="method" value={info.method} />}
      {info.intent && <Field label="intent" value={info.intent} />}
      {info.amount && (
        <Field label="amount" value={formatAmount(info.amount)} />
      )}
      {info.recipient && (
        <a
          href={`https://explorer.tempo.xyz/address/${info.recipient}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline font-mono"
        >
          {info.recipient.slice(0, 6)}…{info.recipient.slice(-4)}
        </a>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-text-dim">{label}:</span>
      <Badge variant="secondary" className="text-xs font-mono">
        {value}
      </Badge>
    </div>
  );
}
