"use client";

import { RefreshCw } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { TxStatusCard } from "@/components/tx-status-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TEMPO_CURRENCIES } from "@/lib/currencies";
import { useScheduler } from "@/hooks/use-scheduler";

export default function SchedulerPage() {
  const s = useScheduler();

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
              {s.step === "done" ? "Scheduled" : "Schedule a Transfer"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {s.step === "done" && s.result ? (
              <div className="space-y-3">
                <div className="px-3 py-3 rounded-lg border border-step-receipt/30 bg-step-receipt/5 text-step-receipt text-xs space-y-1.5">
                  <p className="font-medium">Transaction scheduled</p>
                  <p>
                    ID: <span className="font-mono">{s.result.id}</span>
                  </p>
                  <p>Broadcast at: {s.result.estimatedBroadcast}</p>
                </div>
                <Button onClick={s.resetForm} className="w-full">
                  schedule another
                </Button>
              </div>
            ) : (
              <>
                <Field label="Recipient">
                  <Input
                    value={s.recipient}
                    onChange={(e) => s.setRecipient(e.target.value)}
                    placeholder="0x…"
                    className="font-mono"
                    disabled={s.step !== "form"}
                  />
                </Field>

                <Field label="Amount">
                  <Input
                    type="number"
                    value={s.amount}
                    onChange={(e) => s.setAmount(e.target.value)}
                    placeholder="0.10"
                    step="0.01"
                    disabled={s.step !== "form"}
                  />
                </Field>

                <Field label="Token">
                  <Select
                    value={s.currency}
                    onValueChange={(v) => v && s.setCurrency(v)}
                    disabled={s.step !== "form"}
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
                    value={s.validAfterDate}
                    onChange={(e) => s.setValidAfterDate(e.target.value)}
                    disabled={s.step !== "form"}
                  />
                </Field>

                <Field label="Expires (optional)">
                  <Input
                    type="datetime-local"
                    value={s.validBeforeDate}
                    onChange={(e) => s.setValidBeforeDate(e.target.value)}
                    disabled={s.step !== "form"}
                  />
                </Field>

                <Field label="Memo (optional)">
                  <Input
                    value={s.memo}
                    onChange={(e) => s.setMemo(e.target.value)}
                    placeholder="payroll batch #42"
                    disabled={s.step !== "form"}
                  />
                </Field>

                {s.step === "form" && (
                  <Button
                    onClick={s.handleSign}
                    disabled={!s.isFormValid}
                    className="w-full"
                  >
                    sign with wallet
                  </Button>
                )}

                {s.step === "signing" && (
                  <Button disabled className="w-full">
                    signing…
                  </Button>
                )}

                {s.step === "paying" && (
                  <div className="space-y-3">
                    <div className="px-3 py-2 rounded-lg border border-step-challenge/30 bg-step-challenge/5 text-step-challenge text-xs">
                      Transaction signed. Pay $0.10 to schedule.
                    </div>
                    <Button onClick={s.handleSchedule} className="w-full">
                      pay & schedule ($0.10)
                    </Button>
                  </div>
                )}

                {!s.isConnected && (
                  <p className="text-xs text-muted-foreground text-center">
                    Connect your wallet to schedule
                  </p>
                )}

                {s.error && (
                  <div
                    className={`px-3 py-2 rounded-lg border text-xs break-all whitespace-pre-wrap max-h-24 overflow-auto ${
                      s.error.endsWith("…")
                        ? "border-step-challenge/30 bg-step-challenge/5 text-step-challenge"
                        : "border-destructive/30 bg-destructive/5 text-destructive"
                    }`}
                  >
                    {s.error}
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
                  value={s.lookupId}
                  onChange={(e) => s.setLookupId(e.target.value)}
                  placeholder="schedule ID"
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  onClick={s.handleLookup}
                  disabled={!s.lookupId}
                >
                  check
                </Button>
              </div>
              {s.statusResult && (
                <TxStatusCard
                  tx={s.statusResult}
                  onCancel={s.handleCancel}
                  onDelete={s.handleDelete}
                />
              )}
            </CardContent>
          </Card>

          {s.isConnected && (
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="text-sm w-fit">
                  My Scheduled TXs
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={s.handleLoadMyTxs}
                  title="Refresh"
                >
                  <RefreshCw className="size-3.5" />
                </Button>
              </CardHeader>
              <CardContent>
                {s.myTxs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No scheduled transactions yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {s.myTxs.map((tx) => (
                      <TxStatusCard
                        key={tx.id}
                        tx={tx}
                        onCancel={s.handleCancel}
                        onDelete={s.handleDelete}
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
