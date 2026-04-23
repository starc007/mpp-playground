"use client";

import {
  getTokenLabel,
  formatLimitAmount,
  formatPeriod,
} from "@/lib/access-keys";
import { useRemainingLimit } from "@/hooks/use-access-keys";

export function LimitUsage({
  accessKey,
  token,
  total,
  period,
}: {
  accessKey: `0x${string}`;
  token: `0x${string}`;
  total: bigint;
  period?: number;
}) {
  const remaining = useRemainingLimit(accessKey, token);

  const label = getTokenLabel(token);
  const totalStr = formatLimitAmount(total);

  // remaining === undefined → loading
  // remaining === null → read failed (new key not indexed yet, unsupported contract, etc.)
  // remaining === bigint → live data
  const loading = remaining === undefined;
  const failed = remaining === null;

  const used =
    typeof remaining === "bigint"
      ? remaining > total
        ? 0n
        : total - remaining
      : 0n;

  const usedStr = formatLimitAmount(used);
  const pct =
    total > 0n && typeof remaining === "bigint"
      ? Number((used * 10000n) / total) / 100
      : 0;

  const barColor =
    pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-yellow-500" : "bg-primary";

  const periodLabel = formatPeriod(period);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-medium text-foreground flex items-center gap-1.5">
          {label}
          <span className="text-[10px] text-muted-foreground/80 font-normal">
            {periodLabel}
          </span>
        </span>
        <span className="text-muted-foreground tabular-nums">
          {loading ? (
            <span className="text-muted-foreground/60">loading…</span>
          ) : failed ? (
            <span className="text-muted-foreground/60">
              {totalStr} (usage unavailable)
            </span>
          ) : (
            <>
              <span className="text-foreground">{usedStr}</span>
              <span className="text-muted-foreground/60"> / {totalStr}</span>
            </>
          )}
        </span>
      </div>
      {!loading && !failed && (
        <div className="h-1 rounded-full bg-muted/50 overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all duration-300`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
