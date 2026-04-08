import { NextRequest, NextResponse } from "next/server";
import { Receipt } from "mppx";

export async function POST(req: NextRequest) {
  const { url, credential } = await req.json();

  if (!url || !credential) {
    return NextResponse.json(
      { error: "URL and credential are required" },
      { status: 400 }
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
      try {
        receipt = Receipt.deserialize(receiptHeader);
      } catch {
        // Return raw if deserialization fails
        receipt = { raw: receiptHeader };
      }
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
      { status: 500 }
    );
  }
}
