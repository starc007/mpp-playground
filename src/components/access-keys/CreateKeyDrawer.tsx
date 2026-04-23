"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  KeyRound,
  Plus,
  Trash2,
  AlertTriangle,
  Wand2,
  Eye,
  EyeOff,
  Copy,
  Check,
} from "lucide-react";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TEMPO_CURRENCIES } from "@/lib/currencies";
import {
  parseLimitAmount,
  expiryFromDays,
  formatExpiry,
  periodValueToSeconds,
  EXPIRY_PRESETS,
  PERIOD_PRESETS,
  type PeriodValue,
} from "@/lib/access-keys";
import { useCreateAccessKey } from "@/hooks/use-access-keys";

type KeyMode = "browser" | "external";

interface LimitDraft {
  id: string;
  token: `0x${string}`;
  amount: string;
  period: PeriodValue;
}

export function CreateKeyDrawer({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [mode, setMode] = useState<KeyMode>("browser");
  const [expiryDays, setExpiryDays] = useState(7);
  const [limits, setLimits] = useState<LimitDraft[]>([
    {
      id: "l1",
      token: TEMPO_CURRENCIES[0].address,
      amount: "10",
      period: "day",
    },
  ]);
  const [externalAddress, setExternalAddress] = useState("");
  const [generatedPrivateKey, setGeneratedPrivateKey] = useState<string | null>(
    null,
  );
  const [revealPrivateKey, setRevealPrivateKey] = useState(false);
  const [pkCopied, setPkCopied] = useState(false);
  const [showKeyReveal, setShowKeyReveal] = useState(false);
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
        period: "day",
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
    setRevealPrivateKey(false);
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
        ...(periodValueToSeconds(l.period) !== undefined
          ? { period: periodValueToSeconds(l.period) }
          : {}),
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

      // For external mode with a locally-generated key, show the private key
      // reveal screen so the user can copy it before closing.
      if (mode === "external" && generatedPrivateKey) {
        setShowKeyReveal(true);
      } else {
        onCreated();
      }
    } catch {
      // error displayed inline below
    }
  }

  if (showKeyReveal && generatedPrivateKey) {
    return (
      <DrawerWrapper onClose={onClose}>
        <PrivateKeyReveal
          privateKey={generatedPrivateKey}
          address={externalAddress}
          reveal={revealPrivateKey}
          onToggleReveal={() => setRevealPrivateKey((r) => !r)}
          onCopy={copyPrivateKey}
          copied={pkCopied}
          onDone={() => {
            setGeneratedPrivateKey(null);
            setShowKeyReveal(false);
            onCreated();
          }}
        />
      </DrawerWrapper>
    );
  }

  return (
    <DrawerWrapper onClose={onClose}>
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary">
            <KeyRound className="size-4" />
          </div>
          <h2 className="text-sm font-semibold">Create Access Key</h2>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {mode === "browser"
            ? "A keypair is generated and stored in this browser's wallet."
            : "Authorize a key whose private half lives outside this browser."}
        </p>
      </div>

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
                  A keypair was generated. After authorizing, you&apos;ll see
                  the private key once — copy it before closing.
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
                    v && updateLimit(limit.id, { token: v as `0x${string}` })
                  }
                >
                  <SelectTrigger className="w-24 text-xs">
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
                <Select
                  value={limit.period}
                  onValueChange={(v: string | null) =>
                    v && updateLimit(limit.id, { period: v as PeriodValue })
                  }
                >
                  <SelectTrigger className="w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIOD_PRESETS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
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
            Per-period limits reset on the rolling window. Lifetime caps are
            cumulative.
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
    </DrawerWrapper>
  );
}

// ── Private-key reveal screen ──

function PrivateKeyReveal({
  privateKey,
  address,
  reveal,
  onToggleReveal,
  onCopy,
  copied,
  onDone,
}: {
  privateKey: string;
  address: string;
  reveal: boolean;
  onToggleReveal: () => void;
  onCopy: () => void;
  copied: boolean;
  onDone: () => void;
}) {
  return (
    <>
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="flex items-center justify-center size-8 rounded-lg bg-yellow-500/10 text-yellow-600">
            <AlertTriangle className="size-4" />
          </div>
          <h2 className="text-sm font-semibold">Copy the private key now</h2>
        </div>
        <p className="text-[11px] text-muted-foreground">
          This is the only time you&apos;ll see it. The agent needs this to
          sign transactions. It will not be stored in this browser.
        </p>
      </div>

      <div className="p-5 space-y-4">
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
              {copied ? (
                <Check className="size-3.5" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copied ? "copied" : "copy"}
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-border">
        <Button size="sm" onClick={onDone} className="w-full">
          I&apos;ve saved it — close
        </Button>
      </div>
    </>
  );
}

// ── Shared drawer wrapper ──

function DrawerWrapper({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
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
        {children}
      </motion.div>
    </motion.div>
  );
}
