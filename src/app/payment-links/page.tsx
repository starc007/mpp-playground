"use client";

import { useMemo, useState } from "react";
import { Header, Footer } from "@/components/layout";
import { useNetwork } from "@/components/providers";
import { TEMPO_CURRENCIES } from "@/lib/currencies";
import { PaymentLinkPreview } from "@/components/payment-link-preview";
import { ShareButton } from "@/components/share-button";
import { NavTabs } from "@/components/nav-tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FormState {
  amount: string;
  currency: string;
  recipient: string;
  description: string;
  testnet: boolean;
}

function encodeConfig(config: FormState): string {
  const json = JSON.stringify({
    amount: config.amount,
    currency: config.currency,
    recipient: config.recipient,
    description: config.description || undefined,
    testnet: config.testnet,
  });
  return btoa(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export default function PaymentLinksPage() {
  const { network, setNetwork } = useNetwork();
  const [form, setForm] = useState<FormState>({
    amount: "0.01",
    currency: TEMPO_CURRENCIES[0].address,
    recipient: "",
    description: "",
    testnet: true,
  });

  const isValid =
    Boolean(form.amount) && ADDRESS_REGEX.test(form.recipient);

  const linkUrl = useMemo(() => {
    if (!isValid || typeof window === "undefined") return null;
    const id = encodeConfig(form);
    return `${window.location.origin}/api/payment-link/${id}`;
  }, [form, isValid]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header network={network} onNetworkChange={setNetwork} />

      <main className="flex-1 px-8 py-8 pt-24 max-w-6xl mx-auto w-full space-y-8">
        <NavTabs />

        <div>
          <h2 className="text-lg font-semibold mb-1">
            Payment Link Generator
          </h2>
          <p className="text-xs text-muted-foreground">
            Create a hosted payment link backed by mppx. Share it anywhere —
            anyone with the link can pay.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Field label="Amount (USD)">
              <Input
                type="text"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.01"
              />
            </Field>

            <Field label="Currency">
              <Select
                value={form.currency}
                onValueChange={(v) =>
                  v && setForm({ ...form, currency: v })
                }
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

            <Field label="Recipient Address">
              <Input
                type="text"
                value={form.recipient}
                onChange={(e) =>
                  setForm({ ...form, recipient: e.target.value })
                }
                placeholder="0x…"
                className="font-mono"
              />
              {form.recipient && !ADDRESS_REGEX.test(form.recipient) && (
                <p className="text-xs text-destructive mt-1">
                  Invalid Ethereum address
                </p>
              )}
            </Field>

            <Field label="Description (optional)">
              <Input
                type="text"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Coffee for the team"
              />
            </Field>

            <Field label="Network">
              <div className="flex gap-2">
                <Button
                  variant={form.testnet ? "default" : "outline"}
                  onClick={() => setForm({ ...form, testnet: true })}
                  className="flex-1"
                >
                  testnet
                </Button>
                <Button
                  variant={!form.testnet ? "default" : "outline"}
                  onClick={() => setForm({ ...form, testnet: false })}
                  className="flex-1"
                >
                  mainnet
                </Button>
              </div>
            </Field>

            {linkUrl && (
              <div className="space-y-2 pt-2">
                <Label className="text-xs text-text-dim uppercase tracking-wider">
                  Generated Link
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    readOnly
                    value={linkUrl}
                    className="flex-1 h-9 text-xs font-mono text-primary"
                  />
                  <ShareButton url={linkUrl} />
                </div>
              </div>
            )}
          </div>

          <div>
            {linkUrl ? (
              <PaymentLinkPreview url={linkUrl} method="GET" />
            ) : (
              <Card className="p-12 text-center">
                <p className="text-xs text-muted-foreground">
                  Fill in the form to preview your payment link
                </p>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
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
