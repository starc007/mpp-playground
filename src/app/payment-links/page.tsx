"use client";

import { useState, useMemo } from "react";
import { Header, Footer } from "@/components/layout";
import { useNetwork } from "@/components/providers";
import { TEMPO_CURRENCIES } from "@/lib/currencies";
import { PaymentLinkPreview } from "@/components/payment-link-preview";
import { ShareButton } from "@/components/share-button";
import { NavTabs } from "@/components/nav-tabs";

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
    form.amount &&
    form.recipient &&
    /^0x[a-fA-F0-9]{40}$/.test(form.recipient);

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
          <h2 className="text-lg font-semibold text-text mb-1">
            Payment Link Generator
          </h2>
          <p className="text-xs text-text-muted">
            Create a hosted payment link backed by mppx. Share it anywhere —
            anyone with the link can pay.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Field label="Amount (USD)">
              <input
                type="text"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.01"
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg-card text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent/50"
              />
            </Field>

            <Field label="Currency">
              <select
                value={form.currency}
                onChange={(e) =>
                  setForm({ ...form, currency: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg-card text-sm text-text focus:outline-none focus:border-accent/50"
              >
                {TEMPO_CURRENCIES.map((c) => (
                  <option key={c.address} value={c.address}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Recipient Address">
              <input
                type="text"
                value={form.recipient}
                onChange={(e) =>
                  setForm({ ...form, recipient: e.target.value })
                }
                placeholder="0x..."
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg-card text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent/50 font-mono"
              />
              {form.recipient && !isValid && (
                <p className="text-xs text-error mt-1">
                  Invalid Ethereum address
                </p>
              )}
            </Field>

            <Field label="Description (optional)">
              <input
                type="text"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Coffee for the team"
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg-card text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent/50"
              />
            </Field>

            <Field label="Network">
              <div className="flex gap-2">
                <button
                  onClick={() => setForm({ ...form, testnet: true })}
                  className={`flex-1 px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                    form.testnet
                      ? "border-accent text-accent bg-accent/10"
                      : "border-border text-text-muted hover:text-text"
                  }`}
                >
                  testnet
                </button>
                <button
                  onClick={() => setForm({ ...form, testnet: false })}
                  className={`flex-1 px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                    !form.testnet
                      ? "border-accent text-accent bg-accent/10"
                      : "border-border text-text-muted hover:text-text"
                  }`}
                >
                  mainnet
                </button>
              </div>
            </Field>

            {linkUrl && (
              <div className="space-y-2 pt-2">
                <label className="text-xs text-text-dim uppercase tracking-wider">
                  Generated Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={linkUrl}
                    className="flex-1 px-3 py-2 rounded border border-border bg-bg-surface text-xs text-accent font-mono"
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
              <div className="rounded-lg border border-border bg-bg-card p-12 text-center">
                <p className="text-xs text-text-muted">
                  Fill in the form to preview your payment link
                </p>
              </div>
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
    <div>
      <label className="block text-xs text-text-dim uppercase tracking-wider mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}
