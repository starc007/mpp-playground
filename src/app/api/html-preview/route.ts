import { NextRequest, NextResponse } from "next/server";
import { Mppx, tempo } from "mppx/server";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  const amount = params.get("amount") ?? "0.10";
  const description = params.get("description") ?? "Preview payment";
  const recipient =
    (params.get("recipient") as `0x${string}`) ??
    "0x0000000000000000000000000000000000000000";
  const currency =
    (params.get("currency") as `0x${string}`) ??
    "0x20c0000000000000000000000000000000000000";

  // Parse theme from query params
  const theme: Record<string, unknown> = {};
  const themeParam = params.get("theme");
  if (themeParam) {
    try {
      Object.assign(theme, JSON.parse(themeParam));
    } catch {
      // ignore invalid JSON
    }
  }

  // Parse text from query params
  const text: Record<string, string> = {};
  const textParam = params.get("text");
  if (textParam) {
    try {
      Object.assign(text, JSON.parse(textParam));
    } catch {
      // ignore invalid JSON
    }
  }

  const hasTheme = Object.keys(theme).length > 0;
  const hasText = Object.keys(text).length > 0;

  const mppx = Mppx.create({
    secretKey:
      process.env.MPP_SECRET_KEY ??
      "mpp-playground-html-preview-dev-key",
    methods: [
      tempo.charge({
        currency,
        recipient,
        testnet: true,
        html:
          hasTheme || hasText
            ? {
                ...(hasTheme && { theme }),
                ...(hasText && { text }),
              }
            : true,
      }),
    ],
  });

  const result = await mppx.charge({
    amount,
    description,
  })(req);

  if (result.status === 402) return result.challenge;
  return result.withReceipt(
    NextResponse.json({ success: true, message: "Preview payment" }),
  );
}
