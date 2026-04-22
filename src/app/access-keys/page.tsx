"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { motion, AnimatePresence } from "motion/react";
import {
  KeyRound,
  Plus,
  Trash2,
  Clock,
  Shield,
  Copy,
  Check,
  Info,
  AlertTriangle,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
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
import {
  type AccessKeyEntry,
  getKeyStatus,
  formatExpiry,
  getTokenLabel,
  formatLimitAmount,
  parseLimitAmount,
  expiryFromDays,
  shortAddress,
  EXPIRY_PRESETS,
} from "@/lib/access-keys";
import {
  useAccessKeys,
  useCreateAccessKey,
  useRevokeAccessKey,
  useRemainingLimit,
} from "@/hooks/use-access-keys";

interface LimitDraft {
  id: string;
  token: `0x${string}`;
  amount: string;
}

export default function AccessKeysPage() {
  const { isConnected } = useAccount();
  const { keys, loading, refresh } = useAccessKeys();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <DashboardLayout
      title="Access Keys"
      description="Scoped spending keys for AI agents. Chain-enforced spending limits and expiry via TIP-1011."
    >
      {!isConnected ? (
        <EmptyState
          icon={<Shield className="size-5 text-muted-foreground" />}
          title="Connect your wallet"
          description="Connect a Tempo wallet to manage access keys."
        />
      ) : (
        <div className="space-y-6">
          <ExplainerPanel />

          <Card>
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">
                  Your Access Keys
                </CardTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {keys.length === 0
                    ? "no keys yet"
                    : `${keys.length} key${keys.length === 1 ? "" : "s"}`}
                </p>
              </div>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setShowCreate(true)}
              >
                <Plus className="size-3" />
                Create key
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-xs text-muted-foreground py-6 text-center">
                  Loading…
                </p>
              ) : keys.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <div className="rounded-xl bg-muted/50 p-3">
                    <KeyRound className="size-5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    No access keys yet. Create one to give an agent scoped
                    spending power.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence>
                    {keys.map((key) => (
                      <KeyCard
                        key={key.address}
                        entry={key}
                        onRevoked={refresh}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <AnimatePresence>
        {showCreate && (
          <CreateKeyDrawer
            onClose={() => setShowCreate(false)}
            onCreated={() => {
              setShowCreate(false);
              refresh();
            }}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

// ── Key Card ──

function KeyCard({
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

// ── Limit Usage bar ──

function LimitUsage({
  accessKey,
  token,
  total,
}: {
  accessKey: `0x${string}`;
  token: `0x${string}`;
  total: bigint;
}) {
  const remaining = useRemainingLimit(accessKey, token);

  const label = getTokenLabel(token);
  const totalStr = formatLimitAmount(total);

  // remaining === undefined → loading
  // remaining === null → read failed (e.g. contract doesn't know this key yet)
  // remaining === bigint → we have data
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
    pct >= 90
      ? "bg-red-500"
      : pct >= 70
        ? "bg-yellow-500"
        : "bg-primary";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-medium text-foreground">{label}</span>
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

// ── Create Drawer ──

function CreateKeyDrawer({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [expiryDays, setExpiryDays] = useState(7);
  const [limits, setLimits] = useState<LimitDraft[]>([
    { id: "l1", token: TEMPO_CURRENCIES[0].address, amount: "10" },
  ]);
  const { createKey, isPending, error } = useCreateAccessKey();

  function updateLimit(id: string, patch: Partial<LimitDraft>) {
    setLimits((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    );
  }

  function addLimit() {
    setLimits((prev) => [
      ...prev,
      {
        id: `l${Date.now()}`,
        token: TEMPO_CURRENCIES[0].address,
        amount: "",
      },
    ]);
  }

  function removeLimit(id: string) {
    setLimits((prev) => prev.filter((l) => l.id !== id));
  }

  async function handleCreate() {
    const expiry = expiryFromDays(expiryDays);
    const validLimits = limits
      .filter((l) => l.amount && parseFloat(l.amount) > 0)
      .map((l) => ({
        token: l.token,
        limit: parseLimitAmount(l.amount),
      }));

    try {
      await createKey({ expiry, limits: validLimits });
      onCreated();
    } catch {
      // error displayed inline below
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary">
              <KeyRound className="size-4" />
            </div>
            <h2 className="text-sm font-semibold">Create Access Key</h2>
          </div>
          <p className="text-[11px] text-muted-foreground">
            A new keypair will be generated and authorized on-chain.
          </p>
        </div>

        <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Expiry */}
          <div className="space-y-2">
            <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
              Expiry
            </Label>
            <div className="grid grid-cols-4 gap-1.5">
              {EXPIRY_PRESETS.map((preset) => (
                <button
                  key={preset.days}
                  onClick={() => setExpiryDays(preset.days)}
                  className={`text-xs py-2 rounded-lg border transition-colors ${
                    expiryDays === preset.days
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border hover:border-foreground/20"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Expires {formatExpiry(expiryFromDays(expiryDays))}
            </p>
          </div>

          {/* Limits */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                Spending Limits
              </Label>
              <button
                onClick={addLimit}
                className="text-[11px] text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="size-3" />
                Add token
              </button>
            </div>
            <div className="space-y-2">
              {limits.map((limit) => (
                <div key={limit.id} className="flex items-center gap-1.5">
                  <Input
                    value={limit.amount}
                    onChange={(e) =>
                      updateLimit(limit.id, { amount: e.target.value })
                    }
                    placeholder="10"
                    type="number"
                    min="0"
                    step="0.01"
                    className="flex-1 text-xs"
                  />
                  <Select
                    value={limit.token}
                    onValueChange={(v: string | null) =>
                      v && updateLimit(limit.id, { token: v as `0x${string}` })
                    }
                  >
                    <SelectTrigger className="w-32 text-xs">
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
                  {limits.length > 1 && (
                    <button
                      onClick={() => removeLimit(limit.id)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Lifetime limit enforced at chain level. Leave empty for no limit.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-xs">
              <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isPending}
          >
            cancel
          </Button>
          <Button size="sm" onClick={handleCreate} disabled={isPending}>
            {isPending ? "signing…" : "authorize key"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Explainer Panel ──

function ExplainerPanel() {
  return (
    <div className="flex gap-3 p-4 rounded-xl border border-dashed border-border/60 bg-muted/20">
      <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary shrink-0">
        <Info className="size-4" />
      </div>
      <div className="space-y-1.5 text-xs">
        <p className="font-medium text-foreground">What are access keys?</p>
        <p className="text-muted-foreground leading-relaxed">
          Access keys let you authorize an AI agent with a separate keypair and
          strict spending limits. Enforced at the chain level via TIP-1011 —
          even a compromised agent can&apos;t exceed its limits.
        </p>
      </div>
    </div>
  );
}

// ── Shared ──

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent>
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="rounded-xl bg-muted/50 p-3">{icon}</div>
          <div className="space-y-1">
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
