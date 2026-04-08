import { NextRequest, NextResponse } from "next/server";
import { Challenge } from "mppx";

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const targetUrl = url.startsWith("http") ? url : `https://${url}`;

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "User-Agent": "mpp-playground/1.0",
        Accept: "application/json",
      },
      redirect: "follow",
    });

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const requestHeaders: Record<string, string> = {
      "User-Agent": "mpp-playground/1.0",
      Accept: "application/json",
    };

    if (response.status === 402) {
      const wwwAuth = response.headers.get("www-authenticate");
      let challenge = null;

      if (wwwAuth) {
        try {
          const match = wwwAuth.match(/Payment\s+(.+)/i);
          if (match?.[1]) {
            const decoded = Buffer.from(match[1], "base64").toString("utf-8");
            challenge = JSON.parse(decoded);

            if (challenge.request && typeof challenge.request === "string") {
              const reqDecoded = Buffer.from(challenge.request, "base64").toString("utf-8");
              challenge.request = JSON.parse(reqDecoded);
            }
          }
        } catch {
          // Try parsing as structured header params
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
        mppEnabled: true,
        statusCode: 402,
        challenge,
        requestHeaders,
        responseHeaders,
        body,
        rawWwwAuthenticate: wwwAuth,
      });
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
      mppEnabled: false,
      statusCode: response.status,
      challenge: null,
      requestHeaders,
      responseHeaders,
      body,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to probe: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
