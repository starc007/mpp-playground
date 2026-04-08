"use client";

import { useState } from "react";
import { CodeBlock } from "./code-block";
import type { ChallengeData } from "@/lib/types";

interface CodeGeneratorProps {
  url: string;
  challenge?: ChallengeData;
}

type Framework = "hono" | "nextjs" | "express";
type PaymentMethod = "tempo" | "stripe" | "solana";

const FRAMEWORKS: { id: Framework; label: string }[] = [
  { id: "hono", label: "Hono" },
  { id: "nextjs", label: "Next.js" },
  { id: "express", label: "Express" },
];

const METHODS: { id: PaymentMethod; label: string }[] = [
  { id: "tempo", label: "Tempo" },
  { id: "stripe", label: "Stripe" },
  { id: "solana", label: "Solana" },
];

function generateCode(
  framework: Framework,
  method: PaymentMethod,
  amount: string,
  currency: string,
  recipient: string
): string {
  const methodImport =
    method === "tempo"
      ? `import { Mppx, tempo } from 'mppx/server'\n`
      : method === "stripe"
        ? `import { Mppx, stripe } from 'mppx/server'\n`
        : `import { Mppx, solana } from 'mppx/server'\n`;

  const methodConfig =
    method === "tempo"
      ? `tempo({\n      currency: '${currency}',\n      recipient: '${recipient}',\n    })`
      : method === "stripe"
        ? `stripe({\n      secretKey: process.env.STRIPE_SECRET_KEY,\n    })`
        : `solana({\n      recipient: '${recipient}',\n    })`;

  const mppxSetup = `${methodImport}
const mppx = Mppx.create({
  methods: [
    ${methodConfig}
  ],
})`;

  if (framework === "hono") {
    return `import { Hono } from 'hono'
${mppxSetup}

const app = new Hono()

app.get('/resource',
  mppx.charge({ amount: '${amount}', html: true }),
  (c) => c.json({ data: 'your content here' })
)

export default app`;
  }

  if (framework === "nextjs") {
    return `${mppxSetup}

export const GET = mppx.charge({
  amount: '${amount}',
  html: true,
})(async () => {
  return Response.json({ data: 'your content here' })
})`;
  }

  return `import express from 'express'
${mppxSetup}

const app = express()

app.get('/resource',
  mppx.charge({ amount: '${amount}', html: true }),
  (req, res) => res.json({ data: 'your content here' })
)

app.listen(3000)`;
}

export function CodeGenerator({ url, challenge }: CodeGeneratorProps) {
  const detectedMethod = (challenge?.method as PaymentMethod) || "tempo";
  const [framework, setFramework] = useState<Framework>("hono");
  const [method, setMethod] = useState<PaymentMethod>(detectedMethod);

  const amount = (challenge?.request?.amount as string) || "0.01";
  const currency =
    (challenge?.request?.currency as string) ||
    "0x20c0000000000000000000000000000000000000";
  const recipient =
    (challenge?.request?.recipient as string) ||
    "0x0000000000000000000000000000000000000000";

  const code = generateCode(framework, method, amount, currency, recipient);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text">Code Generator</h3>
        <span className="text-xs text-text-dim truncate ml-4 max-w-xs">{url}</span>
      </div>

      <div className="flex gap-2">
        <ToggleGroup
          options={FRAMEWORKS}
          value={framework}
          onChange={(v) => setFramework(v as Framework)}
        />
        <div className="w-px bg-border" />
        <ToggleGroup
          options={METHODS}
          value={method}
          onChange={(v) => setMethod(v as PaymentMethod)}
        />
      </div>

      <CodeBlock code={code} language="typescript" title="server.ts" />
    </div>
  );
}

function ToggleGroup({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-1">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`px-2.5 py-1 rounded text-xs transition-colors ${
            value === opt.id
              ? "bg-accent/20 text-accent"
              : "text-text-muted hover:text-text"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
