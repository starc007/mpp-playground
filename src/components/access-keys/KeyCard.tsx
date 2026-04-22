"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { KeyRound, Trash2, Clock, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type AccessKeyEntry,
  getKeyStatus,
  formatExpiry,
  shortAddress,
} from "@/lib/access-keys";
import { useRevokeAccessKey } from "@/hooks/use-access-keys";
import { LimitUsage } from "./LimitUsage";

export function KeyCard({
  entry,
  onRevoked,
}: {
  entry: AccessKeyEntry;
  onRevoked: () => void;
}) {
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [copied, setCopied] = useState(false);
  const { revokeKey, isPending } = useRevokeAccessKey();
  const status = getKeyStatus(entry.expiry);

  async function handleCopy() {
    await navigator.clipboard.writeText(entry.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleRevoke() {
    try {
      await revokeKey(entry.address);
      onRevoked();
    } catch {
      // error surfaced via hook state; noop here
    }
  }

  const statusStyle =
    status === "active"
      ? "bg-emerald-500/10 text-emerald-500"
      : status === "expiring"
        ? "bg-yellow-500/10 text-yellow-500"
        : "bg-red-500/10 text-red-500";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="group flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:border-foreground/20 transition-colors"
    >
      <div className="flex items-center justify-center size-8 rounded-lg bg-muted/50 shrink-0">
        <KeyRound className="size-3.5 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs font-mono hover:text-foreground transition-colors"
          >
            {shortAddress(entry.address)}
            {copied ? (
              <Check className="size-3 text-emerald-500" />
            ) : (
              <Copy className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>
          <span
            className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-medium ${statusStyle}`}
          >
            {status}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            expires {formatExpiry(entry.expiry)}
          </span>
          {entry.keyType && (
            <span className="px-1.5 py-0.5 rounded bg-muted/50 text-[10px] uppercase tracking-wider">
              {entry.keyType}
            </span>
          )}
        </div>

        {entry.limits && entry.limits.length > 0 && (
          <div className="flex flex-col gap-1.5 pt-1">
            {entry.limits.map((limit, i) => (
              <LimitUsage
                key={i}
                accessKey={entry.address}
                token={limit.token}
                total={limit.limit}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {confirmRevoke ? (
          <>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setConfirmRevoke(false)}
              disabled={isPending}
            >
              cancel
            </Button>
            <Button
              variant="destructive"
              size="xs"
              onClick={handleRevoke}
              disabled={isPending}
            >
              {isPending ? "revoking…" : "confirm"}
            </Button>
          </>
        ) : (
          <button
            onClick={() => setConfirmRevoke(true)}
            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
