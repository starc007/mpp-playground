"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SCHEDULER_API =
  process.env.NEXT_PUBLIC_SCHEDULER_URL ?? "http://localhost:8787";

interface ScheduleResult {
  id: string;
  status: string;
  validAfter: number;
  validBefore: number | null;
  estimatedBroadcast: string;
}

interface ScheduleStatus {
  id: string;
  owner: string;
  status: string;
  validAfter: number;
  validBefore: number | null;
  txHash: string | null;
  error: string | null;
  createdAt: number;
  memo: string | null;
}

function formatDate(unix: number): string {
  return new Date(unix * 1000).toLocaleString();
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-step-challenge/20 text-step-challenge",
  submitted: "bg-step-receipt/20 text-step-receipt",
  failed: "bg-destructive/20 text-destructive",
  expired: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground",
};

export default function SchedulerPage() {
  const { address, isConnected } = useAccount();

  // Schedule form
  const [txBytes, setTxBytes] = useState("");
  const [validAfterDate, setValidAfterDate] = useState("");
  const [validBeforeDate, setValidBeforeDate] = useState("");
  const [memo, setMemo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ScheduleResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Status lookup
  const [lookupId, setLookupId] = useState("");
  const [statusResult, setStatusResult] = useState<ScheduleStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  // My txs
  const [myTxs, setMyTxs] = useState<ScheduleStatus[]>([]);

  async function handleSchedule() {
    if (!txBytes || !validAfterDate || !address) return;

    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const validAfter = Math.floor(
        new Date(validAfterDate).getTime() / 1000,
      );
      const validBefore = validBeforeDate
        ? Math.floor(new Date(validBeforeDate).getTime() / 1000)
        : undefined;

      const res = await fetch(`${SCHEDULER_API}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txBytes,
          validAfter,
          validBefore,
          owner: address,
          memo: memo || undefined,
        }),
      });

      if (res.status === 402) {
        setError(
          "Payment required — this endpoint charges $0.10 per schedule via MPP. Open the URL directly in a browser to pay.",
        );
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error ?? "Schedule failed",
        );
      }
      setResult(data as ScheduleResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Schedule failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLookup() {
    if (!lookupId) return;
    setStatusError(null);
    setStatusResult(null);

    try {
      const res = await fetch(`${SCHEDULER_API}/schedule/${lookupId}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error ?? "Lookup failed",
        );
      }
      setStatusResult(data as ScheduleStatus);
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Lookup failed");
    }
  }

  async function handleLoadMyTxs() {
    if (!address) return;
    try {
      const res = await fetch(
        `${SCHEDULER_API}/schedule?owner=${address.toLowerCase()}`,
      );
      const data = await res.json();
      setMyTxs(data as ScheduleStatus[]);
    } catch {
      // silent
    }
  }

  async function handleCancel(id: string) {
    if (!address) return;
    try {
      const res = await fetch(`${SCHEDULER_API}/schedule/${id}`, {
        method: "DELETE",
        headers: { "x-owner": address.toLowerCase() },
      });
      if (res.ok) {
        handleLoadMyTxs();
      }
    } catch {
      // silent
    }
  }

  return (
    <DashboardLayout
      title="TX Scheduler"
      description="Schedule pre-signed Tempo transactions for timed broadcast. $0.10 per schedule via MPP."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Schedule form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Schedule a Transaction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-text-dim uppercase tracking-wider">
                Signed TX Bytes
              </Label>
              <Textarea
                value={txBytes}
                onChange={(e) => setTxBytes(e.target.value)}
                placeholder="0x..."
                rows={4}
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-text-dim uppercase tracking-wider">
                Broadcast After (validAfter)
              </Label>
              <Input
                type="datetime-local"
                value={validAfterDate}
                onChange={(e) => setValidAfterDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-text-dim uppercase tracking-wider">
                Expires (validBefore, optional)
              </Label>
              <Input
                type="datetime-local"
                value={validBeforeDate}
                onChange={(e) => setValidBeforeDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-text-dim uppercase tracking-wider">
                Memo (optional)
              </Label>
              <Input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="payroll batch #42"
              />
            </div>

            <Button
              onClick={handleSchedule}
              disabled={!txBytes || !validAfterDate || !isConnected || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "scheduling…" : "schedule ($0.10)"}
            </Button>

            {!isConnected && (
              <p className="text-xs text-muted-foreground text-center">
                Connect your wallet to schedule
              </p>
            )}

            {error && (
              <div className="px-3 py-2 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-xs break-all">
                {error}
              </div>
            )}

            {result && (
              <div className="px-3 py-2 rounded-lg border border-step-receipt/30 bg-step-receipt/5 text-step-receipt text-xs space-y-1">
                <p>
                  Scheduled: <span className="font-mono">{result.id}</span>
                </p>
                <p>Broadcast at: {result.estimatedBroadcast}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status lookup + my txs */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Check Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={lookupId}
                  onChange={(e) => setLookupId(e.target.value)}
                  placeholder="schedule ID"
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  onClick={handleLookup}
                  disabled={!lookupId}
                >
                  check
                </Button>
              </div>

              {statusError && (
                <p className="text-xs text-destructive">{statusError}</p>
              )}

              {statusResult && (
                <TxStatusCard tx={statusResult} onCancel={handleCancel} />
              )}
            </CardContent>
          </Card>

          {isConnected && (
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-sm">My Scheduled TXs</CardTitle>
                <Button variant="outline" size="xs" onClick={handleLoadMyTxs}>
                  refresh
                </Button>
              </CardHeader>
              <CardContent>
                {myTxs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No scheduled transactions yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {myTxs.map((tx) => (
                      <TxStatusCard
                        key={tx.id}
                        tx={tx}
                        onCancel={handleCancel}
                        compact
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function TxStatusCard({
  tx,
  onCancel,
  compact,
}: {
  tx: ScheduleStatus;
  onCancel: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <div className="px-3 py-2.5 rounded-lg border border-border bg-card text-xs space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-muted-foreground truncate max-w-48">
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
          {tx.memo && (
            <div className="text-muted-foreground">{tx.memo}</div>
          )}
        </>
      )}
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
    </div>
  );
}
