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
  X,
  Globe,
  UserRound,
} from "lucide-react";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
      const parms: Parameters<typeof createKey>[0] = {
        expiry,
        limits: validLimits,
        ...(mode === "external" && externalAddress
          ? {
              externalAddress: externalAddress as `0x${string}`,
              keyType: "secp256k1" as const,
            }
          : {}),
      };
      console.log("Creating key with params", parms);
      await createKey(parms);

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
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center size-8 rounded-xl bg-foreground/5 text-foreground ring-1 ring-foreground/10">
            <KeyRound className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight">
              Create Access Key
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Authorize a scoped key on-chain
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-foreground/5 text-muted-foreground transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Body */}
      <div className="px-5 py-5 space-y-6 max-h-[65vh] overflow-y-auto">
        {/* Mode tabs — force column layout (Tabs primitive's
            data-horizontal:flex-col selector doesn't match the
            data-orientation attribute it actually sets). */}
        <Tabs
          value={mode}
          onValueChange={(v) => v && setMode(v as KeyMode)}
          className="flex-col"
        >
          <TabsList className="w-full grid grid-cols-2 h-9">
            <TabsTrigger value="browser" className="gap-1.5 text-xs">
              <Globe className="size-3.5" />
              In browser
            </TabsTrigger>
            <TabsTrigger value="external" className="gap-1.5 text-xs">
              <UserRound className="size-3.5" />
              External agent
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browser" className="mt-3">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              A P256 keypair is generated and stored in this browser&apos;s
              wallet. Best for silent in-app signing.
            </p>
          </TabsContent>

          <TabsContent value="external" className="mt-3 space-y-3">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Authorize a secp256k1 key whose private half lives outside this
              browser — for an agent, a backend, or another device.
            </p>

            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                Agent address
              </Label>
              <div className="flex items-center gap-1.5">
                <Input
                  value={externalAddress}
                  onChange={(e) => {
                    setExternalAddress(e.target.value);
                    if (generatedPrivateKey) setGeneratedPrivateKey(null);
                  }}
                  placeholder="0x…"
                  className="flex-1 text-xs font-mono"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateKeypair}
                  type="button"
                >
                  <Wand2 className="size-3" />
                  Generate
                </Button>
              </div>
              {generatedPrivateKey ? (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-foreground/3 border border-foreground/10">
                  <AlertTriangle className="size-3 text-foreground/70 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Keypair generated. After authorizing, you&apos;ll see the
                    private key once — copy it before closing.
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Paste an existing address, or generate a fresh keypair here.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Divider />

        {/* Expiry */}
        <Section label="Expiry" description="When the key stops working">
          <div className="grid grid-cols-4 gap-1.5">
            {EXPIRY_PRESETS.map((preset) => (
              <button
                key={preset.days}
                onClick={() => setExpiryDays(preset.days)}
                className={`text-xs py-2 rounded-lg border transition-colors ${
                  expiryDays === preset.days
                    ? "border-foreground/30 bg-foreground/10 text-foreground"
                    : "border-border hover:border-foreground/20 hover:bg-foreground/3"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Expires{" "}
            <span className="text-foreground/80">
              {formatExpiry(expiryFromDays(expiryDays))}
            </span>
          </p>
        </Section>

        <Divider />

        {/* Limits */}
        <Section
          label="Spending Limits"
          description="Chain-enforced cap per token"
          action={
            <button
              onClick={addLimit}
              className="text-[11px] text-foreground/80 hover:text-foreground hover:underline flex items-center gap-1"
            >
              <Plus className="size-3" />
              Add token
            </button>
          }
        >
          <div className="space-y-2">
            {limits.map((limit) => (
              <div
                key={limit.id}
                className="grid grid-cols-[1fr_auto_auto_auto] gap-1.5 items-center"
              >
                <Input
                  value={limit.amount}
                  onChange={(e) =>
                    updateLimit(limit.id, { amount: e.target.value })
                  }
                  placeholder="10"
                  type="number"
                  min="0"
                  step="0.01"
                  className="text-xs"
                />
                <Select
                  value={limit.token}
                  onValueChange={(v: string | null) =>
                    v && updateLimit(limit.id, { token: v as `0x${string}` })
                  }
                >
                  <SelectTrigger className="w-[104px] text-xs">
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
                  <SelectTrigger className="w-[112px] text-xs">
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
                <button
                  onClick={() => removeLimit(limit.id)}
                  disabled={limits.length === 1}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30 disabled:pointer-events-none"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Per-period limits reset on a rolling window. Lifetime caps are
            cumulative.
          </p>
        </Section>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-xs border border-destructive/20">
            <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border flex items-center justify-between gap-2 bg-muted/20">
        <p className="text-[11px] text-muted-foreground">
          Signs with your root account
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleCreate} disabled={isPending}>
            {isPending ? "Signing…" : "Authorize key"}
          </Button>
        </div>
      </div>
    </DrawerWrapper>
  );
}

// ── Section wrapper ──

function Section({
  label,
  description,
  action,
  children,
}: {
  label: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <div className="space-y-0.5">
          <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
            {label}
          </Label>
          {description && (
            <p className="text-[11px] text-muted-foreground/70">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-border/60" />;
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
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="flex items-center justify-center size-8 rounded-xl bg-foreground/5 text-foreground ring-1 ring-foreground/10">
            <AlertTriangle className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight">
              Copy the private key
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Shown once — not stored in this browser
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
            Address
          </Label>
          <div className="text-xs font-mono px-3 py-2.5 rounded-xl border border-border bg-muted/30">
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
              className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
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
            <div className="flex-1 text-xs font-mono px-3 py-2.5 rounded-xl border border-border bg-muted/30 truncate">
              {reveal ? privateKey : "•".repeat(64)}
            </div>
            <Button variant="outline" size="sm" onClick={onCopy}>
              {copied ? (
                <Check className="size-3.5" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copied ? "copied" : "copy"}
            </Button>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-xl bg-foreground/3 border border-foreground/10">
          <AlertTriangle className="size-3.5 text-foreground/70 shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            The agent holding this key can spend up to the authorized limits.
            Store it securely — it can&apos;t be recovered.
          </p>
        </div>
      </div>

      <div className="px-5 py-4 border-t border-border bg-muted/20">
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
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
