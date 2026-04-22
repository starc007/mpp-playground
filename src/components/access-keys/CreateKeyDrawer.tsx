"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { KeyRound, Plus, Trash2, AlertTriangle } from "lucide-react";
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
  EXPIRY_PRESETS,
} from "@/lib/access-keys";
import { useCreateAccessKey } from "@/hooks/use-access-keys";

interface LimitDraft {
  id: string;
  token: `0x${string}`;
  amount: string;
}

export function CreateKeyDrawer({
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
