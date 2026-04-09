"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, STATUS_COLORS, type ScheduleStatus } from "@/lib/scheduler-types";

interface TxStatusCardProps {
  tx: ScheduleStatus;
  onCancel: (id: string) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

export function TxStatusCard({
  tx,
  onCancel,
  onDelete,
  compact,
}: TxStatusCardProps) {
  return (
    <div className="px-3 py-2.5 rounded-lg border border-border bg-accent text-xs space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-muted-foreground max-w-48">
          {tx.id}
        </span>
        <Badge className={STATUS_COLORS[tx.status] ?? ""} variant="secondary">
          {tx.status}
        </Badge>
      </div>

      {!compact && (
        <>
          <div className="text-muted-foreground">
            Broadcast after: {formatDate(tx.validAfter)}
          </div>
          {tx.validBefore && (
            <div className="text-muted-foreground">
              Expires: {formatDate(tx.validBefore)}
            </div>
          )}
          {tx.txHash && (
            <div>
              <a
                href={`https://explore.testnet.tempo.xyz/tx/${tx.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-mono"
              >
                {tx.txHash.slice(0, 10)}…{tx.txHash.slice(-8)}
              </a>
            </div>
          )}
          {tx.error && (
            <div className="text-destructive break-all">{tx.error}</div>
          )}
          {tx.memo && <div className="text-muted-foreground">{tx.memo}</div>}
        </>
      )}

      <div className="flex items-center gap-2">
        {tx.status === "pending" && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onCancel(tx.id)}
            className="text-destructive hover:text-destructive"
          >
            cancel
          </Button>
        )}
        {onDelete && tx.status !== "pending" && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onDelete(tx.id)}
            className="text-muted-foreground hover:text-destructive"
          >
            delete
          </Button>
        )}
      </div>
    </div>
  );
}
