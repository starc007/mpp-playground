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
  Wand2,
  Eye,
  EyeOff,
} from "lucide-react";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
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
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {entry.limits.map((limit, i) => (
              <span
                key={i}
                className="text-[11px] px-2 py-0.5 rounded-md bg-primary/8 text-primary font-medium"
              >
                {formatLimitAmount(limit.limit)} {getTokenLabel(limit.token)}
              </span>
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

// ── Create Drawer ──

type KeyMode = "browser" | "external";

function CreateKeyDrawer({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [mode, setMode] = useState<KeyMode>("browser");
  const [expiryDays, setExpiryDays] = useState(7);
  const [limits, setLimits] = useState<LimitDraft[]>([
    { id: "l1", token: TEMPO_CURRENCIES[0].address, amount: "10" },
  ]);
  const [externalAddress, setExternalAddress] = useState("");
  const [generatedPrivateKey, setGeneratedPrivateKey] = useState<string | null>(
    null,
  );
  const [revealPrivateKey, setRevealPrivateKey] = useState(false);
  const [pkCopied, setPkCopied] = useState(false);
  const [success, setSuccess] = useState(false);
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

  function generateKeypair() {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    setGeneratedPrivateKey(privateKey);
    setExternalAddress(account.address);
    setRevealPrivateKey(true);
  }

  async function copyPrivateKey() {
    if (!generatedPrivateKey) return;
    await navigator.clipboard.writeText(generatedPrivateKey);
    setPkCopied(true);
    setTimeout(() => setPkCopied(false), 1500);
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
      await createKey({
        expiry,
        limits: validLimits,
        ...(mode === "external" && externalAddress
          ? {
              externalAddress: externalAddress as `0x${string}`,
              keyType: "secp256k1" as const,
            }
          : {}),
      });
      if (mode === "external" && generatedPrivateKey) {
        // Keep drawer open to show private key warning; user closes manually
        setSuccess(true);
      } else {
        onCreated();
      }
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
            {mode === "browser"
              ? "Keypair generated and stored in this browser's wallet."
              : "Authorize a key whose private half lives outside this browser."}
          </p>
        </div>

        {success && mode === "external" && generatedPrivateKey ? (
          <SuccessPrivateKey
            privateKey={generatedPrivateKey}
            address={externalAddress}
            onDone={() => {
              setGeneratedPrivateKey(null);
              setSuccess(false);
              onCreated();
            }}
            onCopy={copyPrivateKey}
            copied={pkCopied}
            reveal={revealPrivateKey}
            onToggleReveal={() => setRevealPrivateKey((r) => !r)}
          />
        ) : (
        <>
        <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Mode tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-muted/50">
            <button
              onClick={() => setMode("browser")}
              className={`text-xs py-1.5 rounded-lg transition-colors ${
                mode === "browser"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              In browser
            </button>
            <button
              onClick={() => setMode("external")}
              className={`text-xs py-1.5 rounded-lg transition-colors ${
                mode === "external"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              External agent
            </button>
          </div>

          {/* External key input */}
          {mode === "external" && (
            <div className="space-y-2">
              <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                Agent address (secp256k1)
              </Label>
              <div className="flex items-center gap-1.5">
                <Input
                  value={externalAddress}
                  onChange={(e) => {
                    setExternalAddress(e.target.value);
                    if (generatedPrivateKey) {
                      setGeneratedPrivateKey(null);
                      setRevealPrivateKey(false);
                    }
                  }}
                  placeholder="0x…"
                  className="flex-1 text-xs font-mono"
                />
                <Button
                  variant="outline"
                  size="xs"
                  onClick={generateKeypair}
                  type="button"
                >
                  <Wand2 className="size-3" />
                  Generate
                </Button>
              </div>
              {generatedPrivateKey && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                  <AlertTriangle className="size-3 text-yellow-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    A keypair was generated. After authorizing, you&apos;ll see the
                    private key once — copy it before closing.
                  </p>
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">
                Paste an address you already control, or generate one here for
                the agent.
              </p>
            </div>
          )}

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
                      v &&
                      updateLimit(limit.id, { token: v as `0x${string}` })
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
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isPending}>
            cancel
          </Button>
          <Button size="sm" onClick={handleCreate} disabled={isPending}>
            {isPending ? "signing…" : "authorize key"}
          </Button>
        </div>
        </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Success / Private Key reveal ──

function SuccessPrivateKey({
  privateKey,
  address,
  onDone,
  onCopy,
  copied,
  reveal,
  onToggleReveal,
}: {
  privateKey: string;
  address: string;
  onDone: () => void;
  onCopy: () => void;
  copied: boolean;
  reveal: boolean;
  onToggleReveal: () => void;
}) {
  return (
    <div className="p-5 space-y-4">
      <div className="flex items-start gap-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
        <AlertTriangle className="size-4 text-yellow-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-medium text-foreground">
            Copy the private key now
          </p>
          <p className="text-muted-foreground leading-relaxed">
            This is the only time you&apos;ll see it. The agent needs this to
            sign transactions. It will not be stored in this browser.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
          Address
        </Label>
        <div className="text-xs font-mono px-3 py-2 rounded-lg border border-border bg-muted/30">
          {address}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
            Private key
          </Label>
          <button
            onClick={onToggleReveal}
            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            {reveal ? (
              <>
                <EyeOff className="size-3" />
                hide
              </>
            ) : (
              <>
                <Eye className="size-3" />
                reveal
              </>
            )}
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex-1 text-xs font-mono px-3 py-2 rounded-lg border border-border bg-muted/30 truncate">
            {reveal ? privateKey : "•".repeat(64)}
          </div>
          <Button variant="outline" size="xs" onClick={onCopy}>
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "copied" : "copy"}
          </Button>
        </div>
      </div>

      <div className="pt-2 border-t border-border">
        <Button size="sm" onClick={onDone} className="w-full">
          I&apos;ve saved it — close
        </Button>
      </div>
    </div>
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
        <p className="font-medium text-foreground">
          What are access keys?
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Access keys let you authorize an AI agent with a separate keypair
          and strict spending limits. Enforced at the chain level via TIP-1011
          — even a compromised agent can&apos;t exceed its limits.
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
