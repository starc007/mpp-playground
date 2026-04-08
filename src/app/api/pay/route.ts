import { NextRequest, NextResponse } from "next/server";

function decodeReceipt(encoded: string) {
  try {
    const json = Buffer.from(encoded, "base64").toString("utf-8");
    return JSON.parse(json);
  } catch {
    return { raw: encoded };
  }
}

export async function POST(req: NextRequest) {
  const { url, credential } = await req.json();

  if (!url || !credential) {
    return NextResponse.json(
      { error: "URL and credential are required" },
      { status: 400 },
    );
  }

  try {
    const targetUrl = url.startsWith("http") ? url : `https://${url}`;

    const requestHeaders: Record<string, string> = {
      "User-Agent": "mpp-playground/1.0",
      Accept: "application/json",
      Authorization: `Payment ${credential}`,
    };

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: requestHeaders,
      redirect: "follow",
    });

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    let receipt = null;
    const receiptHeader = response.headers.get("payment-receipt");
    if (receiptHeader) {
      receipt = decodeReceipt(receiptHeader);
    }

    let body = null;
    try {
      body = await response.json();
    } catch {
      try {
        body = await response.text();
      } catch {
        // no body
      }
    }

    return NextResponse.json({
      statusCode: response.status,
      requestHeaders,
      responseHeaders,
      body,
      receipt,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: `Failed to pay: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    );
  }
}
