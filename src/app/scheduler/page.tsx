"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { getConnectorClient } from "wagmi/actions";
import { parseUnits } from "viem";
import { RefreshCw } from "lucide-react";
import { prepareTransactionRequest, signTransaction } from "viem/actions";
import { Actions } from "viem/tempo";
import { Mppx, tempo } from "mppx/client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useNetwork } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TEMPO_CURRENCIES } from "@/lib/currencies";

const SCHEDULER_API =
  process.env.NEXT_PUBLIC_SCHEDULER_URL ?? "http://localhost:8787";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(unix: number): string {
  return new Date(unix * 1000).toLocaleString();
}

function toLocalDatetime(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${h}:${min}`;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-step-challenge/20 text-step-challenge",
  submitted: "bg-step-receipt/20 text-step-receipt",
  failed: "bg-destructive/20 text-destructive",
  expired: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SchedulerPage() {
  const { address, isConnected } = useAccount();
  const { config, rawConfig } = useNetwork();

  // Transfer details
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(TEMPO_CURRENCIES[0].address);
  const [memo, setMemo] = useState("");

  // Schedule timing
  const defaultAfter = new Date(Date.now() + 5 * 60 * 1000); // +5 min
  const [validAfterDate, setValidAfterDate] = useState(
    toLocalDatetime(defaultAfter),
  );
  const [validBeforeDate, setValidBeforeDate] = useState("");

  // Flow state
  const [step, setStep] = useState<"form" | "signing" | "paying" | "done">(
    "form",
  );
  const [signedTxBytes, setSignedTxBytes] = useState("");
  const [result, setResult] = useState<ScheduleResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Status lookup
  const [lookupId, setLookupId] = useState("");
  const [statusResult, setStatusResult] = useState<ScheduleStatus | null>(null);
  const [myTxs, setMyTxs] = useState<ScheduleStatus[]>([]);

  const isFormValid =
    isConnected &&
    /^0x[a-fA-F0-9]{40}$/.test(recipient) &&
    Number(amount) > 0 &&
    validAfterDate;

  // Step 1: Sign the transaction with the wallet (validAfter set, NOT broadcast)
  async function handleSign() {
    if (!address || !isFormValid) return;

    setError(null);
    setStep("signing");

    try {
      // Use rawConfig (no feePayerUrl) so signTransaction produces a
      // plain 0x76 sender-signed tx instead of a 0x78 fee-payer envelope.
      // The cron worker broadcasts via eth_sendRawTransaction which only
      // accepts 0x76.
      const walletClient = await getConnectorClient(rawConfig);

      const validAfter = Math.floor(new Date(validAfterDate).getTime() / 1000);
      const validBefore = validBeforeDate
        ? Math.floor(new Date(validBeforeDate).getTime() / 1000)
        : undefined;

      // Build the TIP-20 transfer call
      const transferCall = Actions.token.transfer.call({
        to: recipient as `0x${string}`,
        amount: parseUnits(amount, 6),
        token: currency as `0x${string}`,
      });

      // Prepare WITHOUT validAfter and WITHOUT fee payer.
      // - No validAfter: eth_estimateGas rejects future-dated txs
      // - nonceKey 0n: disables expiring nonces (auto validBefore = now+25s)
      const prepared = await prepareTransactionRequest(walletClient, {
        account: walletClient.account,
        ...transferCall,
        nonceKey: 0n,
      } as never);

      // Inject the scheduling timestamps AFTER gas estimation.
      const resolvedValidBefore = validBefore ?? validAfter + 3600;
      const scheduled = {
        ...prepared,
        validAfter,
        validBefore: resolvedValidBefore,
      };

      // Sign without broadcasting — returns the serialized 0x76 tx
      const signed = await signTransaction(walletClient, scheduled as never);

      setSignedTxBytes(signed);
      setStep("paying");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Signing failed";
      setError(msg.split("Request Arguments:")[0]?.trim() || msg);
      setStep("form");
    }
  }

  // Step 2: Send signed bytes to the scheduler worker and pay the 402
  async function handleSchedule() {
    if (!signedTxBytes || !address) return;

    setError(null);

    try {
      const validAfter = Math.floor(new Date(validAfterDate).getTime() / 1000);
      const validBefore = validBeforeDate
        ? Math.floor(new Date(validBeforeDate).getTime() / 1000)
        : undefined;

      // First call → 402 challenge
      const probeRes = await fetch(`${SCHEDULER_API}/schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          txBytes: signedTxBytes,
          validAfter,
          validBefore,
          owner: address,
          memo: memo || undefined,
        }),
      });

      if (probeRes.status !== 402) {
        // Either succeeded without payment (shouldn't happen) or error
        const data = await probeRes.json();
        if (probeRes.ok) {
          setResult(data as ScheduleResult);
          setStep("done");
          return;
        }
        throw new Error(
          (data as { error?: string }).error ?? "Schedule failed",
        );
      }

      // Got 402 — create mppx credential and retry
      const wwwAuth = probeRes.headers.get("www-authenticate");
      if (!wwwAuth) throw new Error("No WWW-Authenticate header in 402");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const getClient = (params: any) => getConnectorClient(config, params);

      const mppx = Mppx.create({
        methods: [tempo({ getClient })],
        polyfill: false,
      });

      const fakeResponse = new Response(null, {
        status: 402,
        headers: { "WWW-Authenticate": wwwAuth },
      });

      const credential = await mppx.createCredential(fakeResponse);

      // Retry with credential
      const payRes = await fetch(`${SCHEDULER_API}/schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: credential.startsWith("Payment ")
            ? credential
            : `Payment ${credential}`,
        },
        body: JSON.stringify({
          txBytes: signedTxBytes,
          validAfter,
          validBefore,
          owner: address,
          memo: memo || undefined,
        }),
      });

      const payData = await payRes.json();

      if (!payRes.ok) {
        throw new Error(
          (payData as { error?: string }).error ??
            "Schedule failed after payment",
        );
      }

      setResult(payData as ScheduleResult);
      setStep("done");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Schedule failed";
      setError(msg.split("Request Arguments:")[0]?.trim() || msg);
      setStep("form");
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
      await fetch(`${SCHEDULER_API}/schedule/${id}`, {
        method: "DELETE",
        headers: { "x-owner": address.toLowerCase() },
      });
      handleLoadMyTxs();
    } catch {
      // silent
    }
  }

  async function handleDelete(id: string) {
    if (!address) return;
    try {
      await fetch(`${SCHEDULER_API}/schedule/${id}?action=delete`, {
        method: "DELETE",
        headers: { "x-owner": address.toLowerCase() },
      });
      handleLoadMyTxs();
    } catch {
      // silent
    }
  }

  async function handleLookup() {
    if (!lookupId) return;
    try {
      const res = await fetch(`${SCHEDULER_API}/schedule/${lookupId}`);
      const data = await res.json();
      if (!res.ok)
        throw new Error((data as { error?: string }).error ?? "Not found");
      setStatusResult(data as ScheduleStatus);
    } catch {
      setStatusResult(null);
    }
  }

  function resetForm() {
    setStep("form");
    setSignedTxBytes("");
    setResult(null);
    setError(null);
  }

  return (
    <DashboardLayout
      title="TX Scheduler"
      description="Sign a Tempo transaction with a future validAfter timestamp. Pay $0.10 via MPP to schedule it. The worker broadcasts when the time arrives."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Schedule form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {step === "done" ? "Scheduled" : "Schedule a Transfer"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === "done" && result ? (
              <div className="space-y-3">
                <div className="px-3 py-3 rounded-lg border border-step-receipt/30 bg-step-receipt/5 text-step-receipt text-xs space-y-1.5">
                  <p className="font-medium">Transaction scheduled</p>
                  <p>
                    ID: <span className="font-mono">{result.id}</span>
                  </p>
                  <p>Broadcast at: {result.estimatedBroadcast}</p>
                </div>
                <Button onClick={resetForm} className="w-full">
                  schedule another
                </Button>
              </div>
            ) : (
              <>
                <Field label="Recipient">
                  <Input
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="0x…"
                    className="font-mono"
                    disabled={step !== "form"}
                  />
                </Field>

                <Field label="Amount">
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.10"
                    step="0.01"
                    disabled={step !== "form"}
                  />
                </Field>

                <Field label="Token">
                  <Select
                    value={currency}
                    onValueChange={(v) => v && setCurrency(v)}
                    disabled={step !== "form"}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPO_CURRENCIES.map((c) => (
                        <SelectItem key={c.address} value={c.address}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Broadcast After">
                  <Input
                    type="datetime-local"
                    value={validAfterDate}
                    onChange={(e) => setValidAfterDate(e.target.value)}
                    disabled={step !== "form"}
                  />
                </Field>

                <Field label="Expires (optional)">
                  <Input
                    type="datetime-local"
                    value={validBeforeDate}
                    onChange={(e) => setValidBeforeDate(e.target.value)}
                    disabled={step !== "form"}
                  />
                </Field>

                <Field label="Memo (optional)">
                  <Input
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="payroll batch #42"
                    disabled={step !== "form"}
                  />
                </Field>

                {step === "form" && (
                  <Button
                    onClick={handleSign}
                    disabled={!isFormValid}
                    className="w-full"
                  >
                    sign with wallet
                  </Button>
                )}

                {step === "signing" && (
                  <Button disabled className="w-full">
                    signing…
                  </Button>
                )}

                {step === "paying" && (
                  <div className="space-y-3">
                    <div className="px-3 py-2 rounded-lg border border-step-challenge/30 bg-step-challenge/5 text-step-challenge text-xs">
                      Transaction signed. Pay $0.10 to schedule.
                    </div>
                    <Button onClick={handleSchedule} className="w-full">
                      pay & schedule ($0.10)
                    </Button>
                  </div>
                )}

                {!isConnected && (
                  <p className="text-xs text-muted-foreground text-center">
                    Connect your wallet to schedule
                  </p>
                )}

                {error && (
                  <div className="px-3 py-2 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-xs break-all whitespace-pre-wrap max-h-24 overflow-auto">
                    {error}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Right: Status + My TXs */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Check Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
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
              {statusResult && (
                <TxStatusCard tx={statusResult} onCancel={handleCancel} onDelete={handleDelete} />
              )}
            </CardContent>
          </Card>

          {isConnected && (
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="text-sm w-fit">
                  My Scheduled TXs
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleLoadMyTxs}
                  title="Refresh"
                >
                  <RefreshCw className="size-3.5" />
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
                        onDelete={handleDelete}
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

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-text-dim uppercase tracking-wider">
        {label}
      </Label>
      {children}
    </div>
  );
}

function TxStatusCard({
  tx,
  onCancel,
  onDelete,
  compact,
}: {
  tx: ScheduleStatus;
  onCancel: (id: string) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}) {
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
