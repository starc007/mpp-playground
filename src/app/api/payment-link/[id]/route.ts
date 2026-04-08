import { NextRequest, NextResponse } from "next/server";
import { Mppx, tempo } from "mppx/server";

interface LinkConfig {
  amount: string;
  currency: string;
  recipient: string;
  description?: string;
  testnet?: boolean;
  text?: {
    title?: string;
    pay?: string;
    paymentRequired?: string;
  };
  theme?: Record<string, string>;
}

function decodeConfig(id: string): LinkConfig | null {
  try {
    const normalized = id.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function handle(req: NextRequest, id: string) {
  const config = decodeConfig(id);
  if (!config) {
    return NextResponse.json(
      { error: "Invalid payment link" },
      { status: 400 },
    );
  }

  const mppx = Mppx.create({
    secretKey:
      process.env.MPP_SECRET_KEY ??
      "mpp-playground-default-dev-secret-key-not-for-production",
    methods: [
      tempo.charge({
        currency: config.currency as `0x${string}`,
        recipient: config.recipient as `0x${string}`,
        testnet: config.testnet ?? true,
        html:
          config.text || config.theme
            ? { text: config.text, theme: config.theme }
            : true,
      }),
    ],
  });

  const result = await mppx.charge({
    amount: config.amount,
    description: config.description,
  })(req);

  if (result.status === 402) return result.challenge;
  return result.withReceipt(
    Response.json({
      success: true,
      message: "Payment received",
      paid: { amount: config.amount, currency: config.currency },
    }),
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return handle(req, id);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return handle(req, id);
}
